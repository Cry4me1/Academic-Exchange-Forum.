-- 🧬 Scholarly 知识网络数据库 1024维 重构迁移脚本
-- 适配 Doubao-embedding-large 向量模型

-- 1. 安全地删除受维度影响的旧索引与函数
DROP INDEX IF EXISTS public.idx_posts_embedding_hnsw;
DROP FUNCTION IF EXISTS public.match_posts(vector, float, int, uuid);

-- 2. 修改 posts 表的 embedding 列维度为 1024 (对应 Doubao-embedding-large)
ALTER TABLE public.posts ALTER COLUMN embedding TYPE vector(1024);

-- 3. 重建高性能 HNSW 索引
CREATE INDEX IF NOT EXISTS idx_posts_embedding_hnsw 
ON public.posts USING hnsw (embedding vector_cosine_ops);

-- 4. 重新构建 1024维 相似匹配 RPC 存储过程
CREATE OR REPLACE FUNCTION public.match_posts (
  query_embedding vector(1024),
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
