-- Migration: User Onboarding and Community Guidelines Agreement System
-- Date: 2026-08-22
-- Description: 新用户强制阅读社区公约、学者快速建档及沉浸式主题配置系统

-- 1. 扩展 profiles 表字段
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_step int DEFAULT 1;

-- 2. 存量用户无条件兼容：将执行迁移前所有已存在的用户状态一律标记为已完成
UPDATE profiles 
SET onboarding_completed = true,
    terms_accepted_at = COALESCE(terms_accepted_at, created_at, NOW()),
    onboarding_step = 3
WHERE onboarding_completed IS NULL OR onboarding_completed IS FALSE;

-- 3. 索引优化
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(id, onboarding_completed);
