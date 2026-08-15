-- ============================================
-- Admin Action Authorization Hardening
-- 管理员操作鉴权加固：数据库层 RLS 防线
-- Created: 2026-08-15
-- ============================================
-- 背景:
--   src/lib/admin/actions.ts 中的管理员 server actions 此前只使用普通用户会话
--   (createClient)，不校验 admin_roles，任意登录用户均可直接调用封禁、删除评论、
--   调整积分等管理动作。应用层已为每个 action 增加 await requireAdmin("admin")，
--   本迁移补充数据库层防线：
--     1. is_admin() 辅助函数（SECURITY DEFINER，读取 admin_roles）
--     2. user_credits 的 UPDATE 策略 —— 修复 adjustCredits 因缺少 UPDATE 策略
--        而对所有用户（含管理员）必然失败的问题
--     3. credit_transactions 的 INSERT 策略 —— adjustCredits 需要写入
--        admin_adjustment 流水记录
--     4. profiles/posts/comments 的管理员写策略 —— 保证 RLS 开启时上述管理操作
--        对管理员可用，同时对普通用户形成数据库层的第二道防线
--     5. reports/admin_action_logs 的管理员策略（这两张表不在迁移历史中，
--        用 to_regclass 防御其不存在的情况）
-- ============================================

-- ============================================
-- 1. 管理员判定辅助函数
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- admin_roles 表不存在（全新环境）时一律拒绝，避免函数运行时报错
  IF to_regclass('public.admin_roles') IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- ============================================
-- 2. user_credits: 管理员可 UPDATE
--    （service_role 自带 BYPASSRLS，无需策略）
--    修复 adjustCredits 对所有人失败的问题
-- ============================================
DROP POLICY IF EXISTS "admins_update_credits" ON public.user_credits;
CREATE POLICY "admins_update_credits" ON public.user_credits
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 3. credit_transactions: 管理员可 INSERT
--    adjustCredits 需要写入 admin_adjustment 流水
-- ============================================
DROP POLICY IF EXISTS "admins_insert_credit_transactions" ON public.credit_transactions;
CREATE POLICY "admins_insert_credit_transactions" ON public.credit_transactions
  FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================
-- 4. profiles: 管理员可 UPDATE
--    （封禁/解封/禁言/VIP 等级/勋章称号）
-- ============================================
DROP POLICY IF EXISTS "admins_update_profiles" ON public.profiles;
CREATE POLICY "admins_update_profiles" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 5. posts: 管理员可 UPDATE（隐藏/恢复/置顶/锁定）
-- ============================================
DROP POLICY IF EXISTS "admins_update_posts" ON public.posts;
CREATE POLICY "admins_update_posts" ON public.posts
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 6. comments: 管理员可 UPDATE（隐藏评论）与 DELETE（删除评论）
-- ============================================
DROP POLICY IF EXISTS "admins_update_comments" ON public.comments;
CREATE POLICY "admins_update_comments" ON public.comments
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admins_delete_comments" ON public.comments;
CREATE POLICY "admins_delete_comments" ON public.comments
  FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 7. reports: 管理员可 UPDATE（处理举报）
--    reports 表未包含在迁移历史中（见 docs/admin_system_plan.md），
--    用 to_regclass 防御其不存在的情况
-- ============================================
DO $$
BEGIN
  IF to_regclass('public.reports') IS NOT NULL THEN
    DROP POLICY IF EXISTS "admins_update_reports" ON public.reports;
    CREATE POLICY "admins_update_reports" ON public.reports
      FOR UPDATE
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END
$$;

-- ============================================
-- 8. admin_action_logs: 管理员可 INSERT
--    （logAdminAction 写入操作审计日志）
-- ============================================
DO $$
BEGIN
  IF to_regclass('public.admin_action_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "admins_insert_admin_action_logs" ON public.admin_action_logs;
    CREATE POLICY "admins_insert_admin_action_logs" ON public.admin_action_logs
      FOR INSERT
      WITH CHECK (public.is_admin());
  END IF;
END
$$;
