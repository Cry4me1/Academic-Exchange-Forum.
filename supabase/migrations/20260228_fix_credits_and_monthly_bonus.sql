-- ============================================
-- 积分系统修复 & 月度积分发放 (免费计划方案：Lazy 懒加载更新)
-- Created: 2026-02-28
-- ============================================

-- ============================================
-- 1. 为缺失积分记录的老用户补发 100 注册奖励
-- ============================================
-- 为 auth.users 中存在但 user_credits 中不存在的用户创建记录
INSERT INTO public.user_credits (user_id, balance, total_recharged)
SELECT 
  id,
  100,   -- 注册奖励 100 积分
  0      -- 非充值
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- 为这些用户补录流水记录（通过检查流水中是否已有 signup_bonus）
INSERT INTO public.credit_transactions (user_id, amount, type, description)
SELECT 
  id,
  100,
  'signup_bonus',
  '新用户注册奖励（系统补发）'
FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM public.credit_transactions WHERE type = 'signup_bonus'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. 免费版：创建用户触发式（Lazy）月度积分申领 RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.claim_monthly_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_month TEXT;
  v_exists BOOLEAN;
  v_new_balance INTEGER;
BEGIN
  -- 获取当前年月 (UTC)
  v_month := to_char(now(), 'YYYY-MM');
  
  -- 检查该用户本月是否已经领过 monthly_bonus
  SELECT EXISTS (
    SELECT 1 FROM public.credit_transactions 
    WHERE user_id = p_user_id 
      AND type = 'monthly_bonus' 
      AND to_char(created_at, 'YYYY-MM') = v_month
  ) INTO v_exists;

  -- 如果已经领过，直接返回
  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  -- 发放 100 月度积分（复用 add_user_credits）
  PERFORM public.add_user_credits(
    p_user_id,
    100,
    'monthly_bonus',
    v_month || ' 月度积分奖励'
  );

  -- 获取最新余额返回
  SELECT balance INTO v_new_balance
  FROM public.user_credits
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
