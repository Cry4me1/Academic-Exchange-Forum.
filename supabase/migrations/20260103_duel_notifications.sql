-- ============================================
-- 决斗系统通知 trigger
-- 创建时间: 2026-01-03
-- ============================================

-- 1. 更新 notifications 表的 type 约束，增加 duel_invite, duel_accepted, duel_rejected
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'comment', 'friend_request', 'friend_accepted', 'message', 'mention', 'duel_invite', 'duel_accepted', 'duel_rejected'));

-- 2. 触发器函数：处理决斗邀请通知
CREATE OR REPLACE FUNCTION public.handle_duel_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  challenger_name TEXT;
  duel_topic TEXT;
BEGIN
  -- 获取挑战者名字和辩题
  SELECT 
    COALESCE(p.full_name, p.username),
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
      challenger_name || ' 向你发起了学术决斗：' || duel_topic,
      NEW.duel_id, -- 关联到 duel_id (或者 invitation id? 通常关联到详情页链接所需的ID，这里是 duel_id)
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

-- 3. 创建触发器
DROP TRIGGER IF EXISTS on_duel_invitation_notification ON public.duel_invitations;
CREATE TRIGGER on_duel_invitation_notification
  AFTER INSERT OR UPDATE ON public.duel_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_duel_invitation_notification();
