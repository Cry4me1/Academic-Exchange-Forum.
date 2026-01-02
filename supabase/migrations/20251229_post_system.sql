-- ============================================
-- 帖子系统完整迁移
-- 创建时间: 2025-12-29
-- 功能: 帖子、评论、点赞、收藏、转发
-- ============================================

-- ============================================
-- 0. 处理依赖关系，删除旧表
-- ============================================

-- 删除 messages 表对 posts 的外键约束
ALTER TABLE IF EXISTS public.messages DROP CONSTRAINT IF EXISTS messages_referenced_post_id_fkey;

-- 删除旧表
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;

-- ============================================
-- 1. POSTS 表：帖子
-- ============================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_published ON public.posts(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_posts_tags ON public.posts USING GIN(tags);

-- RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已发布的帖子
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;
CREATE POLICY "Anyone can view published posts" ON public.posts
  FOR SELECT USING (is_published = TRUE);

-- 作者可以查看自己所有帖子（包括未发布）
DROP POLICY IF EXISTS "Authors can view own posts" ON public.posts;
CREATE POLICY "Authors can view own posts" ON public.posts
  FOR SELECT USING (auth.uid() = author_id);

-- 登录用户可以创建帖子
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 作者可以更新自己的帖子
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

-- 作者可以删除自己的帖子
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
CREATE POLICY "Authors can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================
-- 2. COMMENTS 表：评论（支持嵌套）
-- ============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_comments_post ON public.comments(post_id);
CREATE INDEX idx_comments_author ON public.comments(author_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看评论
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (TRUE);

-- 登录用户可以创建评论
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 作者可以删除自己的评论
DROP POLICY IF EXISTS "Authors can delete own comments" ON public.comments;
CREATE POLICY "Authors can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================
-- 3. LIKES 表：点赞（帖子或评论）
-- ============================================
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- 确保只能点赞帖子或评论之一
  CONSTRAINT like_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 唯一约束：每用户每帖子/评论只能点赞一次
CREATE UNIQUE INDEX idx_likes_user_post ON public.likes(user_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX idx_likes_user_comment ON public.likes(user_id, comment_id) WHERE comment_id IS NOT NULL;

-- RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看点赞
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (TRUE);

-- 登录用户可以点赞
DROP POLICY IF EXISTS "Users can like" ON public.likes;
CREATE POLICY "Users can like" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以取消自己的点赞
DROP POLICY IF EXISTS "Users can unlike" ON public.likes;
CREATE POLICY "Users can unlike" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. BOOKMARKS 表：收藏
-- ============================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 索引
CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_post ON public.bookmarks(post_id);

-- RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的收藏
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- 登录用户可以收藏
DROP POLICY IF EXISTS "Users can bookmark" ON public.bookmarks;
CREATE POLICY "Users can bookmark" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以取消自己的收藏
DROP POLICY IF EXISTS "Users can unbookmark" ON public.bookmarks;
CREATE POLICY "Users can unbookmark" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. SHARES 表：转发记录
-- ============================================
CREATE TABLE public.shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  share_type TEXT CHECK (share_type IN ('copy_link', 'repost')) DEFAULT 'copy_link',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_shares_user ON public.shares(user_id);
CREATE INDEX idx_shares_post ON public.shares(post_id);

-- RLS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看转发记录
DROP POLICY IF EXISTS "Anyone can view shares" ON public.shares;
CREATE POLICY "Anyone can view shares" ON public.shares
  FOR SELECT USING (TRUE);

-- 登录用户可以创建转发记录
DROP POLICY IF EXISTS "Users can share" ON public.shares;
CREATE POLICY "Users can share" ON public.shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. 触发器：自动维护计数
-- ============================================

-- 6.1 帖子点赞计数触发器
CREATE OR REPLACE FUNCTION public.handle_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_like_change ON public.likes;
CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_like_count();

-- 6.2 评论点赞计数触发器
CREATE OR REPLACE FUNCTION public.handle_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comment_id IS NOT NULL THEN
    UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.comment_id IS NOT NULL THEN
    UPDATE public.comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_like_change ON public.likes;
CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_like_count();

-- 6.3 评论计数触发器
CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_count();

-- 6.4 收藏计数触发器
CREATE OR REPLACE FUNCTION public.handle_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_bookmark_change ON public.bookmarks;
CREATE TRIGGER on_bookmark_change
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bookmark_count();

-- 6.5 转发计数触发器
CREATE OR REPLACE FUNCTION public.handle_share_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_share_insert ON public.shares;
CREATE TRIGGER on_share_insert
  AFTER INSERT ON public.shares
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_share_count();

-- 6.6 帖子更新时间触发器
CREATE OR REPLACE FUNCTION public.handle_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_post_updated ON public.posts;
CREATE TRIGGER on_post_updated
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_updated_at();

-- ============================================
-- 7. RPC 函数
-- ============================================

-- 增加浏览量
CREATE OR REPLACE FUNCTION public.increment_view_count(target_post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 恢复 messages 表对 posts 的外键约束
ALTER TABLE public.messages 
  ADD CONSTRAINT messages_referenced_post_id_fkey 
  FOREIGN KEY (referenced_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;

-- 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
