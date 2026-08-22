-- 20260822_academic_meta_and_export.sql
-- 为 posts 表增加学术元数据存储与定理快速检索字段

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS academic_meta JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS theorem_count INT DEFAULT 0;

-- 为 academic_meta 创建 GIN 索引，优化包含定理/定义的学术帖查询效率
CREATE INDEX IF NOT EXISTS idx_posts_academic_meta ON posts USING gin (academic_meta);

-- 增加 theorem_count 索引，方便按"包含学术定理数量"进行排序和筛选
CREATE INDEX IF NOT EXISTS idx_posts_theorem_count ON posts (theorem_count);

COMMENT ON COLUMN posts.academic_meta IS '结构化存储帖子包含的学术定理、引理、定义、证明与边注等元数据';
COMMENT ON COLUMN posts.theorem_count IS '当前帖子包含的学术环境块（定理/引理/定义等）总数';
