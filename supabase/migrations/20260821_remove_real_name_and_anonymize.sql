-- ================================================================
-- Scholarly Academic Forum - Anonymization & Remove Real Name Migration
-- 彻底删除真实姓名（full_name）字段与数据，全站改为用户名匿名制
-- Created: 2026-08-21
-- ================================================================

-- 1. 从 profiles 表中彻底删除 full_name 列与相关索引
DROP INDEX IF EXISTS public.idx_profiles_full_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name CASCADE;

-- 2. 更新用户搜索函数 search_users (移除 full_name 字段与匹配)
DROP FUNCTION IF EXISTS public.search_users(text);

CREATE OR REPLACE FUNCTION public.search_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar_url TEXT,
  bio TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.avatar_url, p.bio
  FROM public.profiles p
  WHERE p.username ILIKE '%' || search_term || '%'
  LIMIT 20;
END;
$$;

-- 3. 更新新用户注册触发器 handle_new_user (不再写入或更新 full_name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(NULLIF(public.profiles.username, ''), EXCLUDED.username);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重新挂载触发器（确保生效）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 更新决斗邀请通知触发器函数 handle_duel_invitation_notification (仅使用 username)
CREATE OR REPLACE FUNCTION public.handle_duel_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  challenger_name TEXT;
  duel_topic TEXT;
BEGIN
  -- 获取挑战者用户名和辩题
  SELECT 
    p.username,
    d.topic
  INTO challenger_name, duel_topic
  FROM public.duels d
  JOIN public.profiles p ON p.id = d.challenger_id
  WHERE d.id = NEW.duel_id;

  -- 1. 当创建新的邀请时 (status = 'pending')
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    INSERT INTO public.notifications (user_id, type, title, content, related_id, from_user_id)
    VALUES (
      NEW.invitee_id,
      'duel_invite',
      '收到决斗挑战',
      COALESCE(challenger_name, '学者') || ' 向你发起了学术决斗：' || duel_topic,
      NEW.duel_id,
      (SELECT challenger_id FROM public.duels WHERE id = NEW.duel_id)
    );
  END IF;

  -- 2. 当邀请被接受时 (status = 'accepted')
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted') THEN
    INSERT INTO public.notifications (user_id, type, title, content, related_id, from_user_id)
    VALUES (
      (SELECT challenger_id FROM public.duels WHERE id = NEW.duel_id),
      'duel_accepted',
      '决斗挑战被接受',
      '你的对手接受了关于 "' || duel_topic || '" 的决斗，比赛开始！',
      NEW.duel_id,
      NEW.invitee_id
    );
  END IF;
  
  -- 3. 当邀请被拒绝时 (status = 'declined')
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'declined') THEN
    INSERT INTO public.notifications (user_id, type, title, content, related_id, from_user_id)
    VALUES (
      (SELECT challenger_id FROM public.duels WHERE id = NEW.duel_id),
      'duel_rejected',
      '决斗挑战被拒绝',
      '你的对手拒绝了关于 "' || duel_topic || '" 的决斗。',
      NEW.duel_id,
      NEW.invitee_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 更新邀请码校验函数 validate_invite_code (引荐人展示仅使用用户名)
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

    SELECT c.*, p.username as inviter_username
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
        'inviter_name', COALESCE(v_record.inviter_username, 'Hansszh 超级管理员'),
        'note', v_record.note
    );
END;
$$;

-- 6. 清理 auth.users 表元数据中的 full_name 和 name，彻底保护历史注册学者的真实姓名隐私
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data - 'full_name' - 'name'
WHERE raw_user_meta_data ? 'full_name' OR raw_user_meta_data ? 'name';
