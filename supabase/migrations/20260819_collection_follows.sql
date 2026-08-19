-- ============================================
-- 专栏关注系统 (Collection Follows)
-- 创建时间: 2026-08-19
-- 功能: 关注专栏、浏览量统计(去重)、新文章通知推送(合并)
-- ============================================

-- ============================================
-- 1. COLLECTION_FOLLOWS 表：用户关注专栏
-- ============================================
CREATE TABLE IF NOT EXISTS public.collection_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, collection_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_collection_follows_user ON public.collection_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_follows_collection ON public.collection_follows(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_follows_created ON public.collection_follows(created_at DESC);

-- RLS
ALTER TABLE public.collection_follows ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的关注列表
DROP POLICY IF EXISTS "Users can view own follows" ON public.collection_follows;
CREATE POLICY "Users can view own follows" ON public.collection_follows
  FOR SELECT USING (auth.uid() = user_id);

-- 任何人可以查看公开专栏的关注数（用于统计显示）
DROP POLICY IF EXISTS "Anyone can view public collection follows" ON public.collection_follows;
CREATE POLICY "Anyone can view public collection follows" ON public.collection_follows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.is_public = TRUE
    )
  );

-- 登录用户可以关注专栏
DROP POLICY IF EXISTS "Users can follow collections" ON public.collection_follows;
CREATE POLICY "Users can follow collections" ON public.collection_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以取消关注
DROP POLICY IF EXISTS "Users can unfollow collections" ON public.collection_follows;
CREATE POLICY "Users can unfollow collections" ON public.collection_follows
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. COLLECTION_VIEWS 表：浏览量去重（每用户每专栏仅计 1 次）
-- ============================================
CREATE TABLE IF NOT EXISTS public.collection_views (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, collection_id)
);

-- RLS
ALTER TABLE public.collection_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can upsert own views" ON public.collection_views;
CREATE POLICY "Users can upsert own views" ON public.collection_views
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. COLLECTIONS 表新增 follower_count 和 view_count
-- ============================================
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- ============================================
-- 4. 触发器：自动维护 follower_count
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_collection_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections
    SET follower_count = follower_count + 1
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections
    SET follower_count = GREATEST(follower_count - 1, 0)
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collection_follow_change ON public.collection_follows;
CREATE TRIGGER on_collection_follow_change
  AFTER INSERT OR DELETE ON public.collection_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_collection_follower_count();

-- ============================================
-- 5. 扩展通知类型 CHECK 约束
-- ============================================
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'like', 'comment', 'friend_request', 'friend_accepted',
    'message', 'mention', 'duel_invite', 'duel_accepted',
    'duel_rejected', 'system', 'collection_update'
  ));

-- ============================================
-- 6. 触发器：专栏新增文章时向关注者推送通知（合并机制）
--    如果 1 小时内已有同专栏的未读通知，则更新内容而非新建
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_collection_post_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_collection_name TEXT;
  v_collection_author_id UUID;
  v_post_title TEXT;
  v_follower RECORD;
  v_existing_notification_id UUID;
  v_existing_content TEXT;
BEGIN
  -- 获取专栏信息
  SELECT name, author_id INTO v_collection_name, v_collection_author_id
  FROM public.collections
  WHERE id = NEW.collection_id;

  -- 获取帖子标题
  SELECT title INTO v_post_title
  FROM public.posts
  WHERE id = NEW.post_id;

  -- 如果找不到专栏或帖子，静默退出
  IF v_collection_name IS NULL OR v_post_title IS NULL THEN
    RETURN NEW;
  END IF;

  -- 向所有关注者（排除作者自己）推送通知
  FOR v_follower IN
    SELECT user_id FROM public.collection_follows
    WHERE collection_id = NEW.collection_id
      AND user_id != v_collection_author_id
  LOOP
    -- 检查 1 小时内是否已有同专栏的未读通知（合并通知）
    SELECT id, content INTO v_existing_notification_id, v_existing_content
    FROM public.notifications
    WHERE user_id = v_follower.user_id
      AND type = 'collection_update'
      AND related_id = NEW.collection_id
      AND is_read = FALSE
      AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_existing_notification_id IS NOT NULL THEN
      -- 合并：更新已有通知的内容和时间
      UPDATE public.notifications
      SET content = '新文章：' || v_post_title || '（及更多更新）',
          title = '专栏「' || v_collection_name || '」有多篇新文章',
          created_at = NOW()
      WHERE id = v_existing_notification_id;
    ELSE
      -- 新建通知
      INSERT INTO public.notifications (user_id, type, title, content, related_id, from_user_id)
      VALUES (
        v_follower.user_id,
        'collection_update',
        '专栏「' || v_collection_name || '」更新了',
        '新文章：' || v_post_title,
        NEW.collection_id,
        v_collection_author_id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collection_post_added_notify ON public.collection_posts;
CREATE TRIGGER on_collection_post_added_notify
  AFTER INSERT ON public.collection_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_collection_post_notification();

-- ============================================
-- 7. 浏览量去重自增 RPC 函数
--    仅在用户首次访问时 +1 view_count，重复访问仅更新时间戳
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_collection_view_count(target_collection_id UUID, viewer_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- 检查是否已有该用户的浏览记录
  SELECT EXISTS(
    SELECT 1 FROM public.collection_views
    WHERE user_id = viewer_user_id AND collection_id = target_collection_id
  ) INTO v_exists;

  IF v_exists THEN
    -- 已浏览过，仅更新时间戳
    UPDATE public.collection_views
    SET last_viewed_at = NOW()
    WHERE user_id = viewer_user_id AND collection_id = target_collection_id;
  ELSE
    -- 首次浏览，插入记录并增加计数
    INSERT INTO public.collection_views (user_id, collection_id)
    VALUES (viewer_user_id, target_collection_id);

    UPDATE public.collections
    SET view_count = view_count + 1
    WHERE id = target_collection_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
