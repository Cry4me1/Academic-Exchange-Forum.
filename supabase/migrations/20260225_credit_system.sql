-- ============================================
-- Scholarly Credit System - Full Migration
-- 积分系统完整数据库迁移
-- ============================================

-- ============================================
-- 1. user_credits: 用户积分余额表
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_recharged INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_credits IS '用户积分余额表';
COMMENT ON COLUMN public.user_credits.balance IS '当前可用积分余额';
COMMENT ON COLUMN public.user_credits.total_spent IS '累计消费积分（用于VIP等级计算）';
COMMENT ON COLUMN public.user_credits.total_recharged IS '累计充值积分';

-- ============================================
-- 2. credit_transactions: 积分流水表
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'signup_bonus', 'monthly_bonus', 'purchase', 'ask_ai_usage', 'admin_adjustment'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id 
  ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at 
  ON public.credit_transactions(created_at DESC);

COMMENT ON TABLE public.credit_transactions IS '积分流水记录表';
COMMENT ON COLUMN public.credit_transactions.amount IS '正数=充值/奖励, 负数=消费';
COMMENT ON COLUMN public.credit_transactions.type IS '类型: signup_bonus/monthly_bonus/purchase/ask_ai_usage/admin_adjustment';

-- ============================================
-- 3. profiles 扩展: VIP 后缀字段
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS vip_title TEXT DEFAULT NULL;

COMMENT ON COLUMN public.profiles.vip_title IS 'VIP 等级称号后缀，由系统根据消费自动更新';

-- ============================================
-- 4. RLS 策略
-- ============================================
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- user_credits: 所有登录用户可查看（VIP 等级是公开信息）
DROP POLICY IF EXISTS "users_read_own_credits" ON public.user_credits;
DROP POLICY IF EXISTS "authenticated_read_credits" ON public.user_credits;
CREATE POLICY "authenticated_read_credits" ON public.user_credits
  FOR SELECT USING (auth.role() = 'authenticated');

-- credit_transactions: 用户只能读取自己的流水
DROP POLICY IF EXISTS "users_read_own_transactions" ON public.credit_transactions;
CREATE POLICY "users_read_own_transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 5. VIP 后缀同步函数 (被其他函数调用)
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_vip_title(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_title TEXT;
BEGIN
  SELECT total_spent INTO v_total 
  FROM public.user_credits 
  WHERE user_id = p_user_id;

  IF v_total IS NULL THEN
    v_total := 0;
  END IF;

  v_title := CASE
    WHEN v_total >= 50000 THEN '学术至尊'
    WHEN v_total >= 15000 THEN '学术泰斗'
    WHEN v_total >= 5000  THEN '学术大师'
    WHEN v_total >= 2000  THEN '学术精英'
    WHEN v_total >= 500   THEN '学术探索者'
    ELSE '学术新星'
  END;

  UPDATE public.profiles 
  SET vip_title = v_title 
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 原子扣费 RPC (防并发竞态)
-- ============================================
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'AI 调用'
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

  -- 记录流水
  INSERT INTO public.credit_transactions
    (user_id, amount, type, description)
  VALUES 
    (p_user_id, -p_amount, 'ask_ai_usage', p_description)
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

-- ============================================
-- 7. 充值 RPC (积分增加)
-- ============================================
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT '积分充值'
) RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- UPSERT: 不存在则创建，存在则更新
  INSERT INTO public.user_credits (user_id, balance, total_recharged)
  VALUES (
    p_user_id, 
    p_amount, 
    CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_credits.balance + p_amount,
    total_recharged = user_credits.total_recharged 
      + CASE WHEN p_type = 'purchase' THEN p_amount ELSE 0 END,
    updated_at = now()
  RETURNING balance INTO v_new_balance;

  -- 记录流水
  INSERT INTO public.credit_transactions
    (user_id, amount, type, description)
  VALUES 
    (p_user_id, p_amount, p_type, p_description);

  -- 同步 VIP 后缀 (充值也可能让 total_spent 改变等级? 不会，但后续消费会)
  PERFORM public.sync_vip_title(p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. 新用户注册自动赠送 100 积分
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.add_user_credits(
    NEW.id, 
    100, 
    'signup_bonus', 
    '新用户注册奖励'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_credits();
