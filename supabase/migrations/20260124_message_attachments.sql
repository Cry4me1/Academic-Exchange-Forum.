-- ============================================
-- 私信功能增强：文件互传 + 消息撤回
-- 创建时间: 2026-01-24
-- 功能: 
--   1. 消息附件系统（支持文件过期）
--   2. 消息撤回功能
-- ============================================

-- 1. 扩展 messages 表：增加撤回相关字段
-- ============================================
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- 创建索引以优化撤回消息查询
CREATE INDEX IF NOT EXISTS idx_messages_revoked 
  ON public.messages(sender_id, is_revoked) 
  WHERE is_revoked = TRUE;

-- 2. message_attachments 表：私信文件附件
-- ============================================
DROP TABLE IF EXISTS public.message_attachments CASCADE;
CREATE TABLE public.message_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- MIME type
  file_size BIGINT NOT NULL,  -- 文件大小（字节）
  storage_path TEXT NOT NULL,  -- Storage 中的路径
  public_url TEXT NOT NULL,    -- 公开访问 URL
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  is_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_attachments_message 
  ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_expires 
  ON public.message_attachments(expires_at) 
  WHERE is_expired = FALSE;

-- 3. message_attachments 表 RLS
-- ============================================
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己发送或接收的消息的附件
DROP POLICY IF EXISTS "Users can view attachments of own messages" ON public.message_attachments;
CREATE POLICY "Users can view attachments of own messages" ON public.message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_attachments.message_id
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  );

-- 用户可以为自己发送的消息添加附件
DROP POLICY IF EXISTS "Users can insert attachments for own messages" ON public.message_attachments;
CREATE POLICY "Users can insert attachments for own messages" ON public.message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_attachments.message_id
      AND m.sender_id = auth.uid()
    )
  );

-- 4. 更新 messages 表 RLS：允许发送者更新消息（用于撤回）
-- ============================================
DROP POLICY IF EXISTS "Senders can revoke own messages" ON public.messages;
CREATE POLICY "Senders can revoke own messages" ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id
  )
  WITH CHECK (
    auth.uid() = sender_id
  );

-- 5. 创建 message-files Storage Bucket
-- ============================================
-- 注意：Bucket 创建需要通过 Supabase Dashboard 或 API
-- 这里提供 SQL 备忘：
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('message-files', 'message-files', true, 10485760);

-- 6. 文件过期清理函数
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_attachments()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 将过期的附件标记为已过期
  UPDATE public.message_attachments
  SET is_expired = TRUE
  WHERE expires_at < NOW() AND is_expired = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 消息撤回验证函数（检查是否在两分钟内）
-- ============================================
CREATE OR REPLACE FUNCTION public.can_revoke_message(message_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  message_created_at TIMESTAMPTZ;
  message_sender_id UUID;
BEGIN
  SELECT created_at, sender_id INTO message_created_at, message_sender_id
  FROM public.messages
  WHERE id = message_id;
  
  -- 检查是否是消息发送者
  IF message_sender_id != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  -- 检查是否在两分钟内
  IF NOW() - message_created_at > INTERVAL '2 minutes' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 为 message_attachments 表启用 Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;

-- 9. 触发器：消息撤回时也删除相关附件的 is_expired 状态
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_message_revoke()
RETURNS TRIGGER AS $$
BEGIN
  -- 当消息被撤回时，将附件标记为过期
  IF NEW.is_revoked = TRUE AND OLD.is_revoked = FALSE THEN
    UPDATE public.message_attachments
    SET is_expired = TRUE
    WHERE message_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_revoke ON public.messages;
CREATE TRIGGER on_message_revoke
  AFTER UPDATE OF is_revoked ON public.messages
  FOR EACH ROW
  WHEN (NEW.is_revoked = TRUE)
  EXECUTE FUNCTION public.handle_message_revoke();
