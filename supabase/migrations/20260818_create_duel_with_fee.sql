-- ============================================
-- P0-3 决斗发起收费 RPC（一次性预付裁判 AI 成本）
-- Duel Creation Fee RPC
-- Created: 2026-08-18
-- ============================================
-- 背景:
--   决斗裁判 AI（duel/analyze）成本归属为「挑战者发起决斗时一次性预付」，
--   覆盖整场裁判开销；选手提交论点时不再扣积分。
--
-- 方案 C 实现:
--   1. create_duel_with_fee RPC：SECURITY DEFINER，原子完成
--      「校验余额 → 扣积分 → 建决斗 → 建邀请」，杜绝「先建后扣」导致
--      欠费决斗或先扣费后建失败的不一致。
--   2. 移除 duels 的用户 INSERT 策略（禁止绕过 RPC 免费建决斗）。
--   3. 保留 SELECT/UPDATE 策略：观赛者查看、参与者更新不受影响。
--   4. duel_invitations 的 INSERT 改为由 RPC（definer）写入，因 RLS
--      'Challengers can create invitations' 需要 auth.uid()=challenger，
--      definer 下 auth.uid() 为空会导致失败，故一并移除该策略。
--   5. 扣费目标为用户积分余额 user_credits.balance（扣积分，非信誉分）。
-- ============================================

-- 决斗发起费用（积分）：一次性预付，覆盖整场裁判 AI 开销
-- 可按需调整：如 100 积分 / 场
CREATE OR REPLACE FUNCTION public.create_duel_with_fee(
  p_topic TEXT,
  p_description TEXT,
  p_position TEXT,
  p_max_rounds INTEGER,
  p_opponent_id UUID,
  p_post_id UUID,
  p_fee INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_duel_id UUID;
  v_invitation_id UUID;
  v_deducted BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'permission_denied: 未登录' USING ERRCODE = '42501';
  END IF;

  -- 参数校验
  IF p_topic IS NULL OR btrim(p_topic) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOPIC');
  END IF;

  IF p_opponent_id IS NULL OR p_opponent_id = v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OPPONENT');
  END IF;

  IF p_max_rounds IS NULL OR p_max_rounds NOT IN (3, 5, 7) THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_MAX_ROUNDS');
  END IF;

  IF p_position NOT IN ('正方', '反方') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_POSITION');
  END IF;

  IF p_fee IS NULL THEN
    p_fee := 0;
  END IF;
  IF p_fee < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_FEE');
  END IF;

  -- 对手必须存在（profiles 与 auth.users 关联）
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_opponent_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'OPPONENT_NOT_FOUND');
  END IF;

  -- 原子扣积分（行锁防并发双花）
  IF p_fee > 0 THEN
    UPDATE public.user_credits
    SET balance = balance - p_fee
    WHERE user_id = v_uid
      AND balance >= p_fee;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS');
    END IF;
    v_deducted := true;
  END IF;

  BEGIN
    -- 建决斗 + 建邀请（definer 身份，跳过 RLS）
    INSERT INTO public.duels (
      topic, description, challenger_id, challenger_position,
      opponent_id, opponent_position, max_rounds,
      current_turn_user_id, post_id
    ) VALUES (
      btrim(p_topic), p_description, v_uid, p_position,
      p_opponent_id,
      CASE WHEN p_position = '正方' THEN '反方' ELSE '正方' END,
      p_max_rounds, v_uid, p_post_id
    )
    RETURNING id INTO v_duel_id;

    INSERT INTO public.duel_invitations (duel_id, invitee_id)
    VALUES (v_duel_id, p_opponent_id)
    RETURNING id INTO v_invitation_id;

  EXCEPTION WHEN OTHERS THEN
    -- 建表失败时退回已扣积分（保证一致性）
    IF v_deducted THEN
      UPDATE public.user_credits
      SET balance = balance + p_fee
      WHERE user_id = v_uid;
    END IF;
    RAISE;
  END;

  -- 记录发起费流水（负数 = 消费）
  IF p_fee > 0 THEN
    INSERT INTO public.credit_transactions
      (user_id, amount, type, description, metadata)
    VALUES (
      v_uid, -p_fee, 'ask_ai_usage',
      '学术决斗发起费（覆盖裁判 AI 成本）',
      jsonb_build_object('duel_id', v_duel_id)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'duel_id', v_duel_id,
    'invitation_id', v_invitation_id,
    'fee', p_fee
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.create_duel_with_fee(text, text, text, integer, uuid, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_duel_with_fee(text, text, text, integer, uuid, uuid, integer)
  TO authenticated;

-- ============================================
-- 移除 duels 用户 INSERT 策略（禁止绕过 RPC 免费建决斗）
-- ============================================
DROP POLICY IF EXISTS "Users can create duels" ON public.duels;

-- ============================================
-- 移除 duel_invitations 用户 INSERT 策略（由 RPC definer 写入）
-- ============================================
DROP POLICY IF EXISTS "Challengers can create invitations" ON public.duel_invitations;
