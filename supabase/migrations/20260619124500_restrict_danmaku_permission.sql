-- ============================================
-- 决斗弹幕发送权限限制：仅限第三方观众（Spectator）可以发送弹幕
-- ============================================

-- 1. 删除旧的允许所有登录用户插入弹幕的策略
DROP POLICY IF EXISTS "Authenticated users can create live comments" ON public.duel_live_comments;

-- 2. 创建限制策略，只允许 user_id 与 auth.uid() 一致，且当前用户既不是挑战者，也不是对手
CREATE POLICY "Authenticated users can create live comments" ON public.duel_live_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.duels
      WHERE id = duel_id 
      AND challenger_id != auth.uid()
      AND (opponent_id IS NULL OR opponent_id != auth.uid())
    )
  );
