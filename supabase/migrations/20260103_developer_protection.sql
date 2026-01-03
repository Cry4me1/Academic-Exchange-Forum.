-- ============================================
-- 开发者保护系统
-- 创建时间: 2026-01-03
-- 功能: 标识开发者账户，提供特殊权限和展示
-- ============================================

-- 1. 添加开发者标识字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_developer BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS developer_title TEXT;  -- 开发者自定义头衔

-- 2. 创建开发者保护触发器（开发者信用分不会被扣减）
CREATE OR REPLACE FUNCTION public.protect_developer_reputation()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果是开发者账户，保持信用分不变
  IF (SELECT is_developer FROM public.profiles WHERE id = NEW.id) = TRUE THEN
    NEW.reputation_score := OLD.reputation_score;
    NEW.duel_losses := OLD.duel_losses;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_developer_reputation ON public.profiles;
CREATE TRIGGER protect_developer_reputation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_developer_reputation();

-- 3. 设置 hansszh 为开发者账户
UPDATE public.profiles 
SET 
  is_developer = TRUE,
  developer_title = '系统架构师',
  reputation_score = 99999  -- 设置一个很高的分数作为标识
WHERE username = 'hansszh';

-- 4. 创建函数检查是否为开发者
CREATE OR REPLACE FUNCTION public.is_developer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT is_developer FROM public.profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
