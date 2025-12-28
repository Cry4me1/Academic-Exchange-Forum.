-- ============================================
-- Posts 增强功能迁移
-- 创建时间: 2025-12-28
-- 功能: 阅读量增加 RPC 函数
-- ============================================

-- 1. 创建增加阅读量的 RPC 函数
CREATE OR REPLACE FUNCTION public.increment_view_count(post_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.posts 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = post_id;
$$;

-- 2. 授予执行权限
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon;
