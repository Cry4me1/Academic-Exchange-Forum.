-- ============================================
-- 学术决斗强化与同行评审持久化迁移
-- 创建时间: 2026-05-24 12:05:00
-- 功能: 关联决斗与帖子、弹幕表、同行评审表、RLS 及触发器
-- ============================================

-- 1. 关联决斗与帖子，及帖子锁定状态
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_duels_post_id ON public.duels(post_id);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- 2. 创建实时弹幕表 duel_live_comments
CREATE TABLE IF NOT EXISTS public.duel_live_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID REFERENCES public.duels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_duel_live_comments_duel ON public.duel_live_comments(duel_id);

-- 3. 创建同行评审持久化表 peer_reviews
CREATE TABLE IF NOT EXISTS public.peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reasoning_content TEXT,                     -- AI 推理过程
  review_content TEXT NOT NULL,               -- AI 评审报告
  is_public BOOLEAN DEFAULT FALSE,            -- 是否公开展示
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_post ON public.peer_reviews(post_id);

-- 4. 开启 RLS
ALTER TABLE public.duel_live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;

-- 5. 弹幕表 RLS 策略
DROP POLICY IF EXISTS "Anyone can view live comments" ON public.duel_live_comments;
CREATE POLICY "Anyone can view live comments" ON public.duel_live_comments
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can create live comments" ON public.duel_live_comments;
CREATE POLICY "Authenticated users can create live comments" ON public.duel_live_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. 同行评审表 RLS 策略
DROP POLICY IF EXISTS "Read peer reviews" ON public.peer_reviews;
CREATE POLICY "Read peer reviews" ON public.peer_reviews
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

DROP POLICY IF EXISTS "Insert peer reviews" ON public.peer_reviews;
CREATE POLICY "Insert peer reviews" ON public.peer_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update peer reviews" ON public.peer_reviews;
CREATE POLICY "Update peer reviews" ON public.peer_reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete peer reviews" ON public.peer_reviews;
CREATE POLICY "Delete peer reviews" ON public.peer_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- 7. 触发器：决斗状态变更时自动同步帖子锁定状态
CREATE OR REPLACE FUNCTION public.handle_post_lock_on_duel_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 决斗状态变为 active 时，锁定关联帖子
  IF NEW.status = 'active' AND NEW.post_id IS NOT NULL THEN
    UPDATE public.posts SET is_locked = TRUE WHERE id = NEW.post_id;
  -- 决斗状态变为 completed 或 cancelled 时，解锁帖子
  ELSIF (NEW.status = 'completed' OR NEW.status = 'cancelled') AND NEW.post_id IS NOT NULL THEN
    UPDATE public.posts SET is_locked = FALSE WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_duel_status_change_lock_post ON public.duels;
CREATE TRIGGER on_duel_status_change_lock_post
  AFTER UPDATE ON public.duels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_lock_on_duel_status_change();

-- 8. 触发器：拦截锁定帖子的新评论写入
CREATE OR REPLACE FUNCTION public.check_post_locked_before_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.posts WHERE id = NEW.post_id AND is_locked = TRUE) THEN
    RAISE EXCEPTION '该帖子正在进行学术决斗，已被锁定，无法发表新评论。';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_post_locked_before_comment_trigger ON public.comments;
CREATE TRIGGER check_post_locked_before_comment_trigger
  BEFORE INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_post_locked_before_comment();

-- 9. 将新表加入 Realtime 频道
-- 使用 DO 块和异常捕捉，防止因表已在 publication 中而报错
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'duel_live_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_live_comments;
  END IF;
END $$;
