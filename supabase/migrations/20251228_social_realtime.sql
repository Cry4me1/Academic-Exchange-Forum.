-- ============================================
-- 社交与实时功能数据库迁移
-- 创建时间: 2025-12-28
-- 功能: 好友系统、私信消息、通知系统
-- ============================================

-- 1. friendships 表：好友关系
-- ============================================
DROP TABLE IF EXISTS public.friendships CASCADE;
CREATE TABLE public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- friendships 表 RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己相关的好友关系
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
  );

-- 用户可以发送好友请求
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id AND auth.uid() != addressee_id
  );

-- 用户可以更新自己收到的请求（接受/拒绝）或自己发出的请求（取消）
DROP POLICY IF EXISTS "Users can update related friendships" ON public.friendships;
CREATE POLICY "Users can update related friendships" ON public.friendships
  FOR UPDATE USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
  );

-- 用户可以删除自己的好友关系
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;
CREATE POLICY "Users can delete own friendships" ON public.friendships
  FOR DELETE USING (
    auth.uid() = requester_id OR auth.uid() = addressee_id
  );

-- 2. messages 表：私信消息
-- ============================================
DROP TABLE IF EXISTS public.messages CASCADE;
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('text', 'rich_text', 'post_reference')) DEFAULT 'text',
  referenced_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);

-- messages 表 RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己发送或接收的消息
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 用户只能发送消息给好友（已接受的好友关系）
DROP POLICY IF EXISTS "Users can send messages to friends" ON public.messages;
CREATE POLICY "Users can send messages to friends" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = receiver_id)
        OR (addressee_id = auth.uid() AND requester_id = receiver_id)
      )
    )
  );

-- 接收者可以更新消息的已读状态
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON public.messages;
CREATE POLICY "Receivers can mark messages as read" ON public.messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  );

-- 3. notifications 表：通知
-- ============================================
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('like', 'comment', 'friend_request', 'friend_accepted', 'message', 'mention')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID, -- 关联的帖子/评论/好友请求 ID
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- notifications 表 RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的通知
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- 允许系统（通过触发器或服务端）创建通知
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 用户可以更新自己的通知（标记已读）
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- 用户可以删除自己的通知
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- 4. 启用 Realtime
-- ============================================
-- 为 messages 表启用 Realtime（实时私信）
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 为 notifications 表启用 Realtime（实时通知）
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 为 friendships 表启用 Realtime（好友请求实时通知）
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- 5. 触发器：好友请求时自动创建通知
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- 当有新的好友请求时，给被请求者创建通知
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, content, related_id, from_user_id)
    VALUES (
      NEW.addressee_id,
      'friend_request',
      '新的好友请求',
      (SELECT COALESCE(username, email) FROM public.profiles WHERE id = NEW.requester_id) || ' 想要添加您为好友',
      NEW.id,
      NEW.requester_id
    );
  END IF;
  
  -- 当好友请求被接受时，给请求者创建通知
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, type, title, content, related_id, from_user_id)
    VALUES (
      NEW.requester_id,
      'friend_accepted',
      '好友请求已接受',
      (SELECT COALESCE(username, email) FROM public.profiles WHERE id = NEW.addressee_id) || ' 已接受您的好友请求',
      NEW.id,
      NEW.addressee_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friendship_change ON public.friendships;
CREATE TRIGGER on_friendship_change
  AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_friend_request_notification();

-- 6. 触发器：新消息时自动创建通知
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, content, related_id, from_user_id)
  VALUES (
    NEW.receiver_id,
    'message',
    '新私信',
    (SELECT COALESCE(username, email) FROM public.profiles WHERE id = NEW.sender_id) || ' 给您发送了一条消息',
    NEW.id,
    NEW.sender_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_notification();

-- 7. 更新时间戳触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_friendships_updated ON public.friendships;
CREATE TRIGGER on_friendships_updated
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
