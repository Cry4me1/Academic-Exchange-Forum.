-- ==========================================================
-- 迁移脚本: 评论区内容安全审核与管理系统
-- 创建时间: 2026-08-22
-- 功能: 为 comments 表添加审核状态、敏感词与 AI 风险字段，
--       更新 RLS 策略，扩展审核审计日志，优化评论计数触发器
-- ==========================================================

-- 1. 扩展 comments 表审核状态与风控字段
-- 复用已存在的 post_review_status 与 post_risk_level 枚举
ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS review_status post_review_status DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS ai_risk_level post_risk_level DEFAULT 'safe',
  ADD COLUMN IF NOT EXISTS ai_reason TEXT,
  ADD COLUMN IF NOT EXISTS matched_sensitive_words TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_note TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 索引支持
CREATE INDEX IF NOT EXISTS idx_comments_review_status ON public.comments(review_status);
CREATE INDEX IF NOT EXISTS idx_comments_pending_queue ON public.comments(review_status, created_at DESC) WHERE review_status = 'pending';

-- 2. 扩展 content_moderation_logs 表支持 comment_id 关联
ALTER TABLE public.content_moderation_logs
  ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_moderation_logs_comment ON public.content_moderation_logs(comment_id);

-- 3. 更新 comments 表 RLS 策略
-- 所有人仅可见已过审(approved)的评论，或者是作者本人，或者是管理员
DROP POLICY IF EXISTS "Public can view comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view approved comments or authors view own" ON public.comments;

CREATE POLICY "Anyone can view approved comments or authors view own" ON public.comments
  FOR SELECT USING (
    (review_status = 'approved')
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

-- 管理员可以更新任何评论（用于审核通过/驳回）
DROP POLICY IF EXISTS "Admins can update comments" ON public.comments;
CREATE POLICY "Admins can update comments" ON public.comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

-- 4. 优化评论计数触发器：仅已过审(approved)的评论计入 post.comment_count
-- 4.1 新增评论时：如果状态为 approved 则增加计数
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.review_status = 'approved' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 删除评论时：如果删除前是 approved 则减少计数
CREATE OR REPLACE FUNCTION public.handle_deleted_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.review_status = 'approved' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 评论状态变更时（如 pending -> approved 或 approved -> rejected）：维护计数
CREATE OR REPLACE FUNCTION public.handle_comment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 状态由 非approved 变为 approved -> 增加计数
  IF (OLD.review_status IS DISTINCT FROM 'approved') AND NEW.review_status = 'approved' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  -- 状态由 approved 变为 非approved -> 减少计数
  ELSIF OLD.review_status = 'approved' AND (NEW.review_status IS DISTINCT FROM 'approved') THEN
    UPDATE public.posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_status_changed ON public.comments;
CREATE TRIGGER on_comment_status_changed
  AFTER UPDATE OF review_status ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_status_change();
