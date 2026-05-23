-- 激活扩展
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. 文献元数据缓存表
CREATE TABLE IF NOT EXISTS public.literature_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(20) NOT NULL,
    source_id VARCHAR(100) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    published_at TIMESTAMP WITH TIME ZONE,
    summary TEXT,
    pdf_url TEXT,
    journal TEXT,
    extra_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 帖子与文献的关联表
CREATE TABLE IF NOT EXISTS public.post_literature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    literature_id UUID REFERENCES public.literature_metadata(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, literature_id)
);

-- 3. 双向引用关联表
CREATE TABLE IF NOT EXISTS public.post_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    target_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(source_post_id, target_post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_links_source ON public.post_links(source_post_id);
CREATE INDEX IF NOT EXISTS idx_post_links_target ON public.post_links(target_post_id);

-- 4. 语义相似推荐向量列
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_posts_embedding_hnsw 
ON public.posts USING hnsw (embedding vector_cosine_ops);

-- 5. 余弦相似度匹配 RPC
CREATE OR REPLACE FUNCTION public.match_posts (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  current_post_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  view_count int,
  like_count int,
  comment_count int,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    posts.id,
    posts.title,
    posts.view_count,
    posts.like_count,
    posts.comment_count,
    1 - (posts.embedding <=> query_embedding) AS similarity
  FROM posts
  WHERE posts.is_published = true 
    AND posts.is_hidden = false 
    AND posts.id <> current_post_id
    AND posts.embedding IS NOT NULL
    AND 1 - (posts.embedding <=> query_embedding) > match_threshold
  ORDER BY posts.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. RLS
ALTER TABLE public.literature_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_literature ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for literature_metadata" ON public.literature_metadata FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert for literature_metadata" ON public.literature_metadata FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow public read for post_literature" ON public.post_literature FOR SELECT USING (true);
CREATE POLICY "Allow authenticated modify for post_literature" ON public.post_literature FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read for post_links" ON public.post_links FOR SELECT USING (true);
CREATE POLICY "Allow authenticated modify for post_links" ON public.post_links FOR ALL USING (auth.role() = 'authenticated');
