-- ============================================
-- P0-5 决斗下注安全加固
-- Duel Bet Security Hardening
-- Created: 2026-08-17
-- ============================================
-- 背景:
--   duel_bets 的 RLS 只校验 auth.uid() = spectator_id，不校验金额、
--   是否选手、余额；结算触发器 handle_duel_bets_settlement 无条件给
--   profiles.reputation_score + amount*2。authenticated 客户端可直接
--   INSERT「押赢家」单（未扣款），结算时凭空铸造信誉分。
--
-- 修复:
--   1. 新增 funded 列标记「已扣款」，触发器仅结算 funded = true 的单。
--   2. 移除 duel_bets 的用户 INSERT 策略（禁止绕过 RPC 直接插单）。
--   3. 新增 place_duel_bet RPC：原子「校验余额→扣分→插单」，校验
--      选手不能自押、押注对象必须是本场选手、金额范围、决斗状态。
-- ============================================

-- ============================================
-- 1. duel_bets 增加 funded 标记（未扣款不结算）
-- ============================================
ALTER TABLE public.duel_bets ADD COLUMN IF NOT EXISTS funded BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.duel_bets.funded IS '是否已扣除信誉分（仅 funded=true 的单结算时才会赔付/退款）';

-- 历史数据回填：假定旧单均已扣款（修复前 API 路径为「先扣后插」）。
-- 真正的防线是下方移除 INSERT 策略 + place_duel_bet RPC。
UPDATE public.duel_bets SET funded = true;

-- ============================================
-- 2. 移除用户直接 INSERT 策略（禁止绕过 RPC 插单）
-- ============================================
DROP POLICY IF EXISTS "Users can insert own bets" ON public.duel_bets;

-- ============================================
-- 3. 结算触发器：仅结算 funded = true 的单
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_duel_bets_settlement()
RETURNS TRIGGER AS $$
BEGIN
  -- 当决斗状态变为 completed 时
  IF NEW.status = 'completed' AND OLD.status = 'active' THEN

    -- 情况 1：有赢家
    IF NEW.winner_id IS NOT NULL THEN
      -- 押中的（won）
      UPDATE public.duel_bets
      SET status = 'won', settled_at = NOW()
      WHERE duel_id = NEW.id AND target_id = NEW.winner_id
        AND status = 'pending' AND funded = true;

      -- 给押中的观众发放奖励（本金 + 1倍奖励，即总共返还 2倍金额）
      UPDATE public.profiles p
      SET reputation_score = p.reputation_score + (b.amount * 2)
      FROM public.duel_bets b
      WHERE b.duel_id = NEW.id
        AND b.target_id = NEW.winner_id
        AND b.spectator_id = p.id
        AND b.status = 'won'
        AND b.settled_at = NOW();

      -- 押错的（lost），本金已被扣除，无需返还
      UPDATE public.duel_bets
      SET status = 'lost', settled_at = NOW()
      WHERE duel_id = NEW.id AND target_id != NEW.winner_id
        AND status = 'pending' AND funded = true;

    -- 情况 2：平局 或 被取消 (Refund)
    ELSE
      UPDATE public.duel_bets
      SET status = 'refunded', settled_at = NOW()
      WHERE duel_id = NEW.id AND status = 'pending' AND funded = true;

      -- 退还本金
      UPDATE public.profiles p
      SET reputation_score = p.reputation_score + b.amount
      FROM public.duel_bets b
      WHERE b.duel_id = NEW.id
        AND b.spectator_id = p.id
        AND b.status = 'refunded'
        AND b.settled_at = NOW();
    END IF;

  -- 当决斗被取消时
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.duel_bets
    SET status = 'refunded', settled_at = NOW()
    WHERE duel_id = NEW.id AND status = 'pending' AND funded = true;

    -- 退还本金
    UPDATE public.profiles p
    SET reputation_score = p.reputation_score + b.amount
    FROM public.duel_bets b
    WHERE b.duel_id = NEW.id
      AND b.spectator_id = p.id
      AND b.status = 'refunded'
      AND b.settled_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. place_duel_bet RPC：原子下注（校验→扣分→插单）
-- ============================================
CREATE OR REPLACE FUNCTION public.place_duel_bet(
  p_duel_id UUID,
  p_target_id UUID,
  p_amount INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_duel public.duels%ROWTYPE;
  v_bet_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'permission_denied: 未登录' USING ERRCODE = '42501';
  END IF;

  -- 金额范围校验
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 10000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  END IF;

  -- 决斗必须存在
  SELECT * INTO v_duel FROM public.duels WHERE id = p_duel_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_FOUND');
  END IF;

  -- 必须是进行中的决斗
  IF v_duel.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUEL_NOT_ACTIVE');
  END IF;

  -- 选手不能自押
  IF v_uid = v_duel.challenger_id OR v_uid = v_duel.opponent_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'PARTICIPANT_CANNOT_BET');
  END IF;

  -- 押注对象必须是本场选手
  IF p_target_id <> v_duel.challenger_id AND p_target_id <> v_duel.opponent_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TARGET');
  END IF;

  -- 每人每场只能下注一次（原子 UPDATE 才是余额双花的真正防线）
  IF EXISTS (
    SELECT 1 FROM public.duel_bets
    WHERE duel_id = p_duel_id AND spectator_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_BET');
  END IF;

  -- 原子扣分：余额不足则失败（行锁防并发双花）
  UPDATE public.profiles
  SET reputation_score = reputation_score - p_amount
  WHERE id = v_uid
    AND reputation_score >= p_amount;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_REPUTATION');
  END IF;

  -- 插入已扣款下注单
  INSERT INTO public.duel_bets (duel_id, spectator_id, target_id, amount, status, funded)
  VALUES (p_duel_id, v_uid, p_target_id, p_amount, 'pending', true)
  RETURNING id INTO v_bet_id;

  RETURN jsonb_build_object('success', true, 'bet_id', v_bet_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.place_duel_bet(uuid, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_duel_bet(uuid, uuid, integer)
  TO authenticated;
