-- ============================================
-- 最终修复: 确保决斗可见性策略正确存在
-- 创建时间: 2026-01-03
-- ============================================

-- 1. 先删除可能存在的问题策略
DROP POLICY IF EXISTS "Participants can view own pending duels" ON public.duels;
DROP POLICY IF EXISTS "Invitees can view duels" ON public.duels; -- 再次确保删除这个递归策略

-- 2. 重新创建正确的可见性策略
-- 允许 挑战者 或 对手 查看非 active/completed (即 pending/cancelled) 的决斗
CREATE POLICY "Participants can view own pending duels" ON public.duels
  FOR SELECT USING (
    auth.uid() = challenger_id 
    OR 
    auth.uid() = opponent_id
  );

-- 3. 确保邀请表的策略也正确 (以防作为被邀请者看不到)
DROP POLICY IF EXISTS "Invitees can view invitations" ON public.duel_invitations;
CREATE POLICY "Invitees can view invitations" ON public.duel_invitations
  FOR SELECT USING (auth.uid() = invitee_id);
