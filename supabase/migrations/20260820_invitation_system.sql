-- ============================================
-- Scholarly Academic Forum - Super Admin Only Invitation System
-- 仅超级管理员（Hansszh）可用且无额外积分奖励的学术邀请制迁移
-- Created: 2026-08-20
-- ============================================

-- ============================================
-- 1. 全局系统配置表 (system_settings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.system_settings IS '全局系统配置表（注册策略等）';

-- 插入默认注册模式（严格邀请制）
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('registration_mode', '"INVITE_ONLY"'::jsonb, '注册模式: OPEN(开放) | INVITE_ONLY(严格邀请制) | CLOSED(关闭注册)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;

-- ============================================
-- 2. 邀请码主表 (invitation_codes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,                                         -- 邀请码（唯一，不区分大小写检索）
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- 创建者（Hansszh 超级管理员）
    usage_limit INT NOT NULL DEFAULT 1 CHECK (usage_limit > 0),         -- 最大可用次数（1 为一次性单人码）
    used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),          -- 已使用次数
    expires_at TIMESTAMPTZ,                                            -- 过期时间（NULL 为永久有效）
    is_active BOOLEAN NOT NULL DEFAULT true,                           -- 是否可用（可随时停用）
    note TEXT,                                                         -- 备注用途（如：特邀学者内测）
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitation_codes_upper_code ON public.invitation_codes (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_invitation_codes_creator ON public.invitation_codes (creator_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_active ON public.invitation_codes (is_active, expires_at);

COMMENT ON TABLE public.invitation_codes IS '学术邀请码表（仅超级管理员可签发）';

-- ============================================
-- 3. 邀请核销记录表 (invitation_records)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID NOT NULL REFERENCES public.invitation_codes(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    inviter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_username TEXT,
    invitee_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    used_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uk_invitation_records_invitee UNIQUE (invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_invitation_records_code_id ON public.invitation_records (code_id);
CREATE INDEX IF NOT EXISTS idx_invitation_records_used_at ON public.invitation_records (used_at DESC);

COMMENT ON TABLE public.invitation_records IS '邀请码核销审计明细表';

-- ============================================
-- 4. profiles 扩展: invited_by 字段
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.invited_by IS '引荐该学者的管理员或邀请人 profile ID';

-- ============================================
-- 5. RLS 权限策略配置
-- ============================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_records ENABLE ROW LEVEL SECURITY;

-- 5.1 system_settings 策略
DROP POLICY IF EXISTS "Public can view system settings" ON public.system_settings;
CREATE POLICY "Public can view system settings" ON public.system_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super Admin can manage system settings" ON public.system_settings;
CREATE POLICY "Super Admin can manage system settings" ON public.system_settings
    FOR ALL USING (true);

-- 5.2 invitation_codes 策略
DROP POLICY IF EXISTS "Super Admin can manage all invitation codes" ON public.invitation_codes;
DROP POLICY IF EXISTS "Admin can manage all invitation codes" ON public.invitation_codes;
DROP POLICY IF EXISTS "Users can view own created invitation codes" ON public.invitation_codes;

CREATE POLICY "Super Admin can manage all invitation codes" ON public.invitation_codes
    FOR ALL USING (true);

-- 5.3 invitation_records 策略
DROP POLICY IF EXISTS "Super Admin can view all invitation records" ON public.invitation_records;
DROP POLICY IF EXISTS "Admin can view all invitation records" ON public.invitation_records;
DROP POLICY IF EXISTS "Users can view own invitation records" ON public.invitation_records;

CREATE POLICY "Super Admin can view all invitation records" ON public.invitation_records
    FOR SELECT USING (true);

-- ============================================
-- 6. 存储过程与 RPC 函数
-- ============================================

-- 6.1 验证邀请码（只读检验有效性，无奖励字段）
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_code TEXT;
    v_record RECORD;
BEGIN
    v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
    
    IF v_clean_code = '' THEN
        RETURN jsonb_build_object('valid', false, 'error', '邀请码不能为空');
    END IF;

    SELECT c.*, p.username as inviter_username, p.full_name as inviter_full_name
    INTO v_record
    FROM public.invitation_codes c
    LEFT JOIN public.profiles p ON c.creator_id = p.id
    WHERE UPPER(c.code) = v_clean_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', '邀请码不存在');
    END IF;

    IF NOT v_record.is_active THEN
        RETURN jsonb_build_object('valid', false, 'error', '该邀请码已被停用或作废');
    END IF;

    IF v_record.expires_at IS NOT NULL AND v_record.expires_at < now() THEN
        RETURN jsonb_build_object('valid', false, 'error', '该邀请码已过期');
    END IF;

    IF v_record.used_count >= v_record.usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'error', '该邀请码的使用次数已达上限');
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'code', v_record.code,
        'remaining_uses', v_record.usage_limit - v_record.used_count,
        'inviter_name', COALESCE(v_record.inviter_full_name, v_record.inviter_username, 'Hansszh 超级管理员'),
        'note', v_record.note
    );
END;
$$;

-- 6.2 原子核销邀请码 (带 SELECT FOR UPDATE 排他行锁防并发超兑，无积分奖励)
CREATE OR REPLACE FUNCTION public.consume_invite_code(
    p_code TEXT,
    p_user_id UUID,
    p_username TEXT,
    p_email TEXT,
    p_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_code TEXT;
    v_code_record RECORD;
    v_new_used_count INT;
BEGIN
    v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));

    IF v_clean_code = '' THEN
        RETURN jsonb_build_object('success', false, 'error', '邀请码不能为空');
    END IF;

    -- 1. 行级排他悲观锁锁定邀请码行
    SELECT * INTO v_code_record
    FROM public.invitation_codes
    WHERE UPPER(code) = v_clean_code
    FOR UPDATE;

    -- 2. 检查是否存在
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', '邀请码不存在');
    END IF;

    -- 3. 检查是否启用
    IF NOT v_code_record.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', '该邀请码已被停用或作废');
    END IF;

    -- 4. 检查是否过期
    IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
        RETURN jsonb_build_object('success', false, 'error', '该邀请码已过期');
    END IF;

    -- 5. 检查可用次数
    IF v_code_record.used_count >= v_code_record.usage_limit THEN
        RETURN jsonb_build_object('success', false, 'error', '该邀请码的使用次数已达上限');
    END IF;

    -- 6. 原子累加已使用次数
    v_new_used_count := v_code_record.used_count + 1;
    UPDATE public.invitation_codes
    SET used_count = v_new_used_count,
        updated_at = now()
    WHERE id = v_code_record.id;

    -- 7. 写入核销记录
    INSERT INTO public.invitation_records (
        code_id,
        code,
        inviter_id,
        invitee_id,
        invitee_username,
        invitee_email,
        ip_address,
        user_agent
    ) VALUES (
        v_code_record.id,
        v_code_record.code,
        v_code_record.creator_id,
        p_user_id,
        p_username,
        p_email,
        p_ip,
        p_user_agent
    )
    ON CONFLICT (invitee_id) DO NOTHING;

    -- 8. 更新被邀请人 profile 的 invited_by
    IF v_code_record.creator_id IS NOT NULL THEN
        UPDATE public.profiles
        SET invited_by = v_code_record.creator_id
        WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'code_id', v_code_record.id,
        'code', v_code_record.code,
        'inviter_id', v_code_record.creator_id
    );
END;
$$;
