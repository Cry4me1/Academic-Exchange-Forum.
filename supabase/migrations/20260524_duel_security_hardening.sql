-- ============================================
-- 决斗系统安全加固 Migration
-- 创建时间: 2026-05-24
-- 功能: 
--   1. 修改 RLS 策略：强制回合插入时检查 current_turn_user_id
--   2. 新增 content_hash 列用于内容去重
--   3. 新增触发器：防止完全重复的内容提交
-- ============================================

-- ============================================
-- 1. 加固 duel_rounds 的 RLS 策略
-- 确保只有当前回合该出手的用户才能插入
-- ============================================
DROP POLICY IF EXISTS "Participants can create rounds" ON public.duel_rounds;
CREATE POLICY "Participants can create rounds" ON public.duel_rounds
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.duels 
      WHERE id = duel_id 
      AND status = 'active'
      AND current_turn_user_id = auth.uid()  -- 强制：必须是当前回合该出手的人
      AND (challenger_id = auth.uid() OR opponent_id = auth.uid())
    )
  );

-- ============================================
-- 2. 添加 content_hash 列
-- ============================================
ALTER TABLE public.duel_rounds ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- 为已有数据回填 content_hash
UPDATE public.duel_rounds 
SET content_hash = md5(COALESCE(content_text, ''))
WHERE content_hash IS NULL;

-- ============================================
-- 3. 创建触发器：插入前检测重复内容
-- ============================================
CREATE OR REPLACE FUNCTION public.check_duel_round_duplicate()
RETURNS TRIGGER AS $$
BEGIN
  -- 计算内容的 MD5 哈希
  NEW.content_hash := md5(COALESCE(NEW.content_text, ''));
  
  -- 检查同一决斗中同一作者是否已存在完全相同的内容
  IF EXISTS (
    SELECT 1 FROM public.duel_rounds 
    WHERE duel_id = NEW.duel_id 
    AND author_id = NEW.author_id
    AND content_hash = NEW.content_hash
  ) THEN
    RAISE EXCEPTION 'duplicate_content: 不允许提交与之前完全相同的内容'
      USING HINT = '请修改你的论点内容后重新提交';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_round_duplicate ON public.duel_rounds;
CREATE TRIGGER check_round_duplicate
  BEFORE INSERT ON public.duel_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duel_round_duplicate();
