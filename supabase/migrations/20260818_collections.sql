-- ============================================
-- 作者专栏系统 (Collections)
-- 创建时间: 2026-08-18
-- 功能: 作者个人专栏、帖子分组归类
-- ============================================

-- ============================================
-- 0. 创建 collection-covers Storage Bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('collection-covers', 'collection-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for collection-covers
DROP POLICY IF EXISTS "Collection covers are publicly accessible." ON storage.objects;
CREATE POLICY "Collection covers are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'collection-covers' );

DROP POLICY IF EXISTS "Authenticated users can upload collection covers." ON storage.objects;
CREATE POLICY "Authenticated users can upload collection covers."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'collection-covers' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update their own collection covers." ON storage.objects;
CREATE POLICY "Users can update their own collection covers."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'collection-covers' AND auth.uid() = owner )
  WITH CHECK ( bucket_id = 'collection-covers' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own collection covers." ON storage.objects;
CREATE POLICY "Users can delete their own collection covers."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'collection-covers' AND auth.uid() = owner );

-- ============================================
-- 1. COLLECTIONS 表：作者专栏
-- ============================================
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,                              -- 自定义封面图片 URL
  cover_style TEXT DEFAULT 'preset-academic',  -- 预设封面样式（当 cover_url 为空时使用）
  is_public BOOLEAN DEFAULT TRUE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_collections_author ON public.collections(author_id);
CREATE INDEX idx_collections_created_at ON public.collections(created_at DESC);
CREATE INDEX idx_collections_public ON public.collections(is_public) WHERE is_public = TRUE;

-- RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看公开专栏
DROP POLICY IF EXISTS "Anyone can view public collections" ON public.collections;
CREATE POLICY "Anyone can view public collections" ON public.collections
  FOR SELECT USING (is_public = TRUE);

-- 作者可以查看自己所有专栏（包括私有）
DROP POLICY IF EXISTS "Authors can view own collections" ON public.collections;
CREATE POLICY "Authors can view own collections" ON public.collections
  FOR SELECT USING (auth.uid() = author_id);

-- 登录用户可以创建专栏
DROP POLICY IF EXISTS "Users can create collections" ON public.collections;
CREATE POLICY "Users can create collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 作者可以更新自己的专栏
DROP POLICY IF EXISTS "Authors can update own collections" ON public.collections;
CREATE POLICY "Authors can update own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = author_id);

-- 作者可以删除自己的专栏
DROP POLICY IF EXISTS "Authors can delete own collections" ON public.collections;
CREATE POLICY "Authors can delete own collections" ON public.collections
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================
-- 2. COLLECTION_POSTS 表：专栏与帖子关联
-- ============================================
CREATE TABLE public.collection_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, post_id)
);

-- 索引
CREATE INDEX idx_collection_posts_collection ON public.collection_posts(collection_id);
CREATE INDEX idx_collection_posts_post ON public.collection_posts(post_id);
CREATE INDEX idx_collection_posts_position ON public.collection_posts(collection_id, position);

-- RLS
ALTER TABLE public.collection_posts ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看公开专栏的帖子关联
DROP POLICY IF EXISTS "Anyone can view public collection posts" ON public.collection_posts;
CREATE POLICY "Anyone can view public collection posts" ON public.collection_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND (c.is_public = TRUE OR c.author_id = auth.uid())
    )
  );

-- 作者可以添加帖子到自己的专栏（只能添加自己的帖子）
DROP POLICY IF EXISTS "Authors can add posts to own collections" ON public.collection_posts;
CREATE POLICY "Authors can add posts to own collections" ON public.collection_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.author_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND p.author_id = auth.uid()
    )
  );

-- 作者可以更新自己专栏中帖子的排序
DROP POLICY IF EXISTS "Authors can update own collection posts" ON public.collection_posts;
CREATE POLICY "Authors can update own collection posts" ON public.collection_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.author_id = auth.uid()
    )
  );

-- 作者可以从自己的专栏中移除帖子
DROP POLICY IF EXISTS "Authors can remove posts from own collections" ON public.collection_posts;
CREATE POLICY "Authors can remove posts from own collections" ON public.collection_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id AND c.author_id = auth.uid()
    )
  );

-- ============================================
-- 3. 触发器：自动维护计数
-- ============================================

-- 3.1 专栏帖子计数触发器
CREATE OR REPLACE FUNCTION public.handle_collection_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections SET post_count = post_count + 1 WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collection_post_change ON public.collection_posts;
CREATE TRIGGER on_collection_post_change
  AFTER INSERT OR DELETE ON public.collection_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_collection_post_count();

-- 3.2 专栏更新时间触发器
CREATE OR REPLACE FUNCTION public.handle_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_collection_updated ON public.collections;
CREATE TRIGGER on_collection_updated
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_collection_updated_at();

-- ============================================
-- 4. RPC 函数：批量重排序专栏帖子
-- ============================================
CREATE OR REPLACE FUNCTION public.reorder_collection_posts(
  target_collection_id UUID,
  ordered_post_ids UUID[]
)
RETURNS void AS $$
DECLARE
  i INTEGER;
  v_author_id UUID;
BEGIN
  -- 验证当前用户是专栏作者
  SELECT author_id INTO v_author_id
  FROM public.collections
  WHERE id = target_collection_id;

  IF v_author_id IS NULL OR v_author_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: not the collection author';
  END IF;

  -- 批量更新排序
  FOR i IN 1..array_length(ordered_post_ids, 1)
  LOOP
    UPDATE public.collection_posts
    SET position = i
    WHERE collection_id = target_collection_id
      AND post_id = ordered_post_ids[i];
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
