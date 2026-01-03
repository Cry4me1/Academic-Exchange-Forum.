-- ============================================
-- 移除冗余的 RLS 策略以彻底修复递归问题
-- 创建时间: 2026-01-03
-- 原因: 
-- 1. 我们现在在创建决斗时直接设置了 opponent_id。
-- 2. 因此 "Participants can view own pending duels" 策略已经覆盖了被邀请者。
-- 3. "Invitees can view duels" 策略实际上是冗余的，而且是导致无限递归的根源。
-- ============================================

-- 删除这个导致递归的 JOIN 策略
DROP POLICY IF EXISTS "Invitees can view duels" ON public.duels;

-- 确保参与者策略存在 (base system migration 中已定义，这里只是确认)
-- CREATE POLICY "Participants can view own pending duels" ON public.duels
--   FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
