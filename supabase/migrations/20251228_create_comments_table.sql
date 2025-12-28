-- ============================================
-- Comments 表创建
-- 创建时间: 2025-12-28
-- 功能: 评论系统
-- ============================================

-- 1. Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content JSONB NOT NULL, -- 支持富文本评论
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

-- 3. RLS Policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 所有人可见
DROP POLICY IF EXISTS "Public can view comments" ON public.comments;
CREATE POLICY "Public can view comments" ON public.comments
    FOR SELECT USING (true);

-- 登录用户可评论
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 用户可修改自己的评论
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = author_id);

-- 用户可删除自己的评论
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS on_comments_updated ON public.comments;
CREATE TRIGGER on_comments_updated
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Trigger to increment comment_count in posts table
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comment_count = comment_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_comment();

-- 7. Trigger to decrement comment_count in posts table (if deleted)
CREATE OR REPLACE FUNCTION public.handle_deleted_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET comment_count = comment_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_deleted ON public.comments;
CREATE TRIGGER on_comment_deleted
  AFTER DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deleted_comment();
