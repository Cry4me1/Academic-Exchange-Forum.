-- ============================================
-- 修复 RLS: 允许被邀请者查看决斗详情
-- 创建时间: 2026-01-03
-- ============================================

-- 允许被邀请者查看关联的决斗
DROP POLICY IF EXISTS "Invitees can view duels" ON public.duels;
CREATE POLICY "Invitees can view duels" ON public.duels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.duel_invitations 
      WHERE duel_id = id AND invitee_id = auth.uid()
    )
  );
