-- ============================================
-- 修复专栏与帖子关联 RLS 权限 (Fix Collection & Collection Posts RLS)
-- 创建时间: 2026-08-20
-- 功能: 确保非作者和游客能够正常读取公开专栏及其包含的帖子关联
-- ============================================

-- 1. 修复 collections 表中可能的 NULL 值
UPDATE public.collections SET is_public = TRUE WHERE is_public IS NULL;

-- 2. 优化 collections 表的 SELECT 策略（公开专栏所有人可见，私密专栏仅作者可见）
DROP POLICY IF EXISTS "Anyone can view public collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can view own collections" ON public.collections;

CREATE POLICY "Anyone can view public collections" ON public.collections
  FOR SELECT USING (is_public = TRUE OR is_public IS NULL OR auth.uid() = author_id);

-- 3. 优化 collection_posts 表的 SELECT 策略（允许公开读取中间关联）
DROP POLICY IF EXISTS "Anyone can view public collection posts" ON public.collection_posts;
CREATE POLICY "Anyone can view public collection posts" ON public.collection_posts
  FOR SELECT USING (true);
