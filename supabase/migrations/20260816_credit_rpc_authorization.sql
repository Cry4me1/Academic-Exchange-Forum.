-- ============================================
-- P0-2 积分 RPC 鉴权加固
-- Credit RPC Authorization Hardening
-- Created: 2026-08-16
-- ============================================
-- 背景:
--   add_user_credits / deduct_user_credits / sync_vip_title /
--   claim_monthly_bonus 均为 SECURITY DEFINER，但函数体未校验
--   auth.uid() = p_user_id，且未 REVOKE EXECUTE。authenticated 客户端
--   可直接 rpc('add_user_credits', { p_user_id, p_amount }) 凭空充值。
--
-- 修复:
--   1. add_user_credits / sync_vip_title 收口为纯内部函数，仅 service_role
--      可调用。触发器 handle_new_user_credits 与 SECURITY DEFINER 函数
--      内部调用（claim_monthly_bonus -> add_user_credits）均以 owner
--      身份运行，不受 REVOKE 影响。
--   2. deduct_user_credits 增加 auth.uid() = p_user_id 校验，仅本人可扣费。
--   3. claim_monthly_bonus 移除 p_user_id 入参，直接使用 auth.uid()。
-- ============================================

-- ============================================
-- 1. deduct_user_credits: 仅本人可扣费
--    （保持 20260306 的签名，含 p_metadata 参数）
-- ============================================
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'AI 调用',
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  v_balance INTEGER;
  v_tx_id UUID;
BEGIN
  -- 身份校验: 仅允许扣减本人积分
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'permission_denied: 只能扣减本人积分'
      USING ERRCODE = '42501';
  END IF;

  -- 行级锁: FOR UPDATE 防止并发扣费
  SELECT balance INTO v_balance 
  FROM public.user_credits
  WHERE user_id = p_user_id 
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_CREDIT_RECORD');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'INSUFFICIENT_CREDITS',
      'balance', v_balance
    );
  END IF;

  -- 扣减余额 + 累加消费
  UPDATE public.user_credits SET
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 记录流水（含 metadata）
  INSERT INTO public.credit_transactions
    (user_id, amount, type, description, metadata)
  VALUES 
    (p_user_id, -p_amount, 'ask_ai_usage', p_description, p_metadata)
  RETURNING id INTO v_tx_id;

  -- 同步 VIP 后缀
  PERFORM public.sync_vip_title(p_user_id);

  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', v_balance - p_amount,
    'tx_id', v_tx_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.deduct_user_credits(uuid, integer, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_user_credits(uuid, integer, text, jsonb)
  TO authenticated;

-- ============================================
-- 2. claim_monthly_bonus: 移除 p_user_id 入参，直接使用 auth.uid()
-- ============================================
-- 先删除旧的带入参版本，否则仍可通过 rpc 传入任意 p_user_id
DROP FUNCTION IF EXISTS public.claim_monthly_bonus(uuid);

CREATE OR REPLACE FUNCTION public.claim_monthly_bonus()
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_month TEXT;
  v_exists BOOLEAN;
  v_new_balance INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'permission_denied: 未登录'
      USING ERRCODE = '42501';
  END IF;

  -- 获取当前年月 (UTC)
  v_month := to_char(now(), 'YYYY-MM');

  -- 检查该用户本月是否已经领过 monthly_bonus
  SELECT EXISTS (
    SELECT 1 FROM public.credit_transactions 
    WHERE user_id = v_uid 
      AND type = 'monthly_bonus' 
      AND to_char(created_at, 'YYYY-MM') = v_month
  ) INTO v_exists;

  -- 如果已经领过，直接返回
  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  -- 发放 100 月度积分（复用 add_user_credits，SECURITY DEFINER 内部以 owner 身份调用）
  PERFORM public.add_user_credits(
    v_uid,
    100,
    'monthly_bonus',
    v_month || ' 月度积分奖励'
  );

  -- 获取最新余额返回
  SELECT balance INTO v_new_balance
  FROM public.user_credits
  WHERE user_id = v_uid;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.claim_monthly_bonus()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_monthly_bonus()
  TO authenticated;

-- ============================================
-- 3. add_user_credits / sync_vip_title: 纯内部函数，仅 service_role 可调用
--    （充值发放只允许 service_role / 触发器 / SECURITY DEFINER 内部调用）
-- ============================================
REVOKE ALL ON FUNCTION public.add_user_credits(uuid, integer, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer, text, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.sync_vip_title(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_vip_title(uuid)
  TO service_role;

-- ============================================
-- 4. sync_all_vip_titles: 全量重算所有用户 VIP 称号/等级
--    （修复 src/lib/admin/credits.ts:499 引用未定义函数的问题）
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_all_vip_titles()
RETURNS VOID AS $$
BEGIN
  PERFORM public.sync_vip_title(id)
  FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.sync_all_vip_titles()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_vip_titles()
  TO service_role;
