-- ============================================
-- 修复无限递归 (Infinite Recursion) 问题
-- 创建时间: 2026-01-03
-- 原因: duels 表策略引用了 duel_invitations，而 duel_invitations 策略又引用了 duels
-- 解决: 使用 SECURITY DEFINER 函数来检查 duels 表，绕过 RLS 递归检查
-- ============================================

-- 1. 创建 helper 函数
CREATE OR REPLACE FUNCTION public.check_is_duel_challenger(_duel_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM duels 
    WHERE id = _duel_id 
    AND challenger_id = auth.uid()
  );
$$;

-- 2. 更新 duel_invitations 的策略

-- 删除旧策略
DROP POLICY IF EXISTS "Challengers can view sent invitations" ON public.duel_invitations;
DROP POLICY IF EXISTS "Challengers can create invitations" ON public.duel_invitations;

-- 创建新策略 (使用函数)
CREATE POLICY "Challengers can view sent invitations" ON public.duel_invitations
  FOR SELECT USING (
    check_is_duel_challenger(duel_id)
  );

CREATE POLICY "Challengers can create invitations" ON public.duel_invitations
  FOR INSERT WITH CHECK (
    check_is_duel_challenger(duel_id)
  );
