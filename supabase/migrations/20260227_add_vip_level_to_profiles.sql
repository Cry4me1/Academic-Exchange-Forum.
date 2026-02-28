-- ============================================
-- 给 profiles 表添加 vip_level 整数字段
-- 用于直接判断 VIP 等级，而非通过消费量计算
-- ============================================

-- 1. 添加 vip_level 字段（默认值 1，范围 1-6）
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS vip_level INTEGER NOT NULL DEFAULT 1 
  CHECK (vip_level >= 1 AND vip_level <= 6);

COMMENT ON COLUMN public.profiles.vip_level IS 'VIP 等级 (1-6)，由系统根据消费自动更新或管理员手动设置';

-- 2. 根据 user_credits 表中的 total_spent 同步现有用户的 vip_level
UPDATE public.profiles p
SET vip_level = CASE
  WHEN uc.total_spent >= 50000 THEN 6
  WHEN uc.total_spent >= 15000 THEN 5
  WHEN uc.total_spent >= 5000  THEN 4
  WHEN uc.total_spent >= 2000  THEN 3
  WHEN uc.total_spent >= 500   THEN 2
  ELSE 1
END
FROM public.user_credits uc
WHERE p.id = uc.user_id;

-- 3. 更新 sync_vip_title 函数，同时同步 vip_level 和 vip_title
CREATE OR REPLACE FUNCTION public.sync_vip_title(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_title TEXT;
  v_level INTEGER;
BEGIN
  SELECT total_spent INTO v_total 
  FROM public.user_credits 
  WHERE user_id = p_user_id;

  IF v_total IS NULL THEN
    v_total := 0;
  END IF;

  -- 同时计算等级和称号
  IF v_total >= 50000 THEN
    v_level := 6; v_title := '学术至尊';
  ELSIF v_total >= 15000 THEN
    v_level := 5; v_title := '学术泰斗';
  ELSIF v_total >= 5000 THEN
    v_level := 4; v_title := '学术大师';
  ELSIF v_total >= 2000 THEN
    v_level := 3; v_title := '学术精英';
  ELSIF v_total >= 500 THEN
    v_level := 2; v_title := '学术探索者';
  ELSE
    v_level := 1; v_title := '学术新星';
  END IF;

  UPDATE public.profiles 
  SET vip_title = v_title,
      vip_level = v_level
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
