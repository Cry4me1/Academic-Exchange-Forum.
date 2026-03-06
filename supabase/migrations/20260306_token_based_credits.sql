-- ============================================
-- AskAI Token-Based Credit Migration
-- 升级 deduct_user_credits 函数支持 metadata 参数
-- ============================================

-- 更新原子扣费 RPC：新增 p_metadata 参数
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
