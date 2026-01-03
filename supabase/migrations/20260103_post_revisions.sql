-- ============================================
-- 帖子版本历史系统
-- 创建时间: 2026-01-03
-- 功能: 存储帖子修订历史，支持 Diff 视图
-- ============================================

-- ============================================
-- 1. POST_REVISIONS 表：帖子历史版本
-- ============================================
CREATE TABLE public.post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  revision_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  editor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  edit_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_post_revisions_post ON public.post_revisions(post_id, revision_number DESC);
CREATE INDEX idx_post_revisions_created ON public.post_revisions(created_at DESC);

-- 唯一约束：每个帖子的版本号唯一
CREATE UNIQUE INDEX idx_post_revisions_unique ON public.post_revisions(post_id, revision_number);

-- ============================================
-- 2. RLS 策略
-- ============================================
ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已发布帖子的历史版本
DROP POLICY IF EXISTS "Anyone can view revisions of published posts" ON public.post_revisions;
CREATE POLICY "Anyone can view revisions of published posts" ON public.post_revisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_revisions.post_id 
      AND posts.is_published = TRUE
    )
  );

-- 帖子作者可以创建新版本（通过触发器自动创建）
DROP POLICY IF EXISTS "System can create revisions" ON public.post_revisions;
CREATE POLICY "System can create revisions" ON public.post_revisions
  FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- 3. 触发器：在更新帖子前自动保存旧版本
-- ============================================
CREATE OR REPLACE FUNCTION public.save_post_revision()
RETURNS TRIGGER AS $$
DECLARE
  next_revision INTEGER;
  max_revisions CONSTANT INTEGER := 5;
BEGIN
  -- 只在 title 或 content 或 tags 变化时保存
  IF OLD.title IS DISTINCT FROM NEW.title 
     OR OLD.content IS DISTINCT FROM NEW.content 
     OR OLD.tags IS DISTINCT FROM NEW.tags THEN
    
    -- 获取下一个版本号
    SELECT COALESCE(MAX(revision_number), 0) + 1 INTO next_revision
    FROM public.post_revisions
    WHERE post_id = OLD.id;
    
    -- 保存旧版本
    INSERT INTO public.post_revisions (
      post_id, revision_number, title, content, tags, editor_id
    ) VALUES (
      OLD.id, next_revision, OLD.title, OLD.content, OLD.tags, auth.uid()
    );
    
    -- 清理超出限制的旧版本（保留最新的5个）
    DELETE FROM public.post_revisions
    WHERE post_id = OLD.id
      AND id NOT IN (
        SELECT id FROM public.post_revisions
        WHERE post_id = OLD.id
        ORDER BY revision_number DESC
        LIMIT max_revisions
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS before_post_update_save_revision ON public.posts;
CREATE TRIGGER before_post_update_save_revision
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.save_post_revision();

-- ============================================
-- 4. RPC 函数：获取版本统计
-- ============================================
CREATE OR REPLACE FUNCTION public.get_post_revision_count(target_post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.post_revisions 
    WHERE post_id = target_post_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
