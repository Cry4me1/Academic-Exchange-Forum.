-- ==========================================================
-- 迁移脚本: AI 内容安全初审与审核管理系统
-- 创建时间: 2026-08-20
-- 功能: 敏感词库、AI 审稿记录、审核缓存、帖子审核状态扩展与 RLS 权限
-- ==========================================================

-- 1. 扩展 posts 表审核状态与风控字段
DO $$ BEGIN
    CREATE TYPE post_review_status AS ENUM ('approved', 'pending', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_risk_level AS ENUM ('safe', 'sensitive', 'dangerous');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS review_status post_review_status DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS ai_risk_level post_risk_level DEFAULT 'safe',
  ADD COLUMN IF NOT EXISTS ai_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_suggested_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS matched_sensitive_words TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_note TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 索引支持
CREATE INDEX IF NOT EXISTS idx_posts_review_status ON public.posts(review_status);
CREATE INDEX IF NOT EXISTS idx_posts_pending_queue ON public.posts(review_status, created_at DESC) WHERE review_status = 'pending';

-- 2. 敏感词库表 (sensitive_words)
CREATE TABLE IF NOT EXISTS public.sensitive_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general', -- 'politics', 'violence', 'porn', 'ad', 'academic_fraud', 'general'
  match_level TEXT NOT NULL CHECK (match_level IN ('pending', 'block')), -- pending=转人工待审, block=直接拦截
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensitive_words_active ON public.sensitive_words(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sensitive_words_category ON public.sensitive_words(category);

-- 3. 审核审计日志表 (content_moderation_logs)
CREATE TABLE IF NOT EXISTS public.content_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  model_name TEXT DEFAULT 'deepseek-chat',
  score INTEGER NOT NULL,
  risk_level post_risk_level NOT NULL,
  reason TEXT,
  detected_tags TEXT[] DEFAULT '{}',
  matched_sensitive_words TEXT[] DEFAULT '{}',
  final_action TEXT NOT NULL, -- 'auto_approved', 'auto_pending', 'auto_rejected', 'manual_approved', 'manual_rejected'
  cost_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  is_cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_post ON public.content_moderation_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_author ON public.content_moderation_logs(author_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON public.content_moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON public.content_moderation_logs(final_action);

-- 4. 审核结果缓存表 (content_moderation_cache)
CREATE TABLE IF NOT EXISTS public.content_moderation_cache (
  content_hash VARCHAR(64) PRIMARY KEY,
  score INTEGER NOT NULL,
  risk_level post_risk_level NOT NULL,
  reason TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_moderation_cache_expires ON public.content_moderation_cache(expires_at);

-- 5. RLS 权限策略配置
ALTER TABLE public.sensitive_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_cache ENABLE ROW LEVEL SECURITY;

-- 5.1 帖子表 RLS 策略更新：普通用户仅可看已发布、未隐藏且审核通过(review_status='approved')的帖子
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;
CREATE POLICY "Anyone can view published posts" ON public.posts
  FOR SELECT USING (
    (is_published = TRUE AND is_hidden = FALSE AND review_status = 'approved')
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

-- 5.2 敏感词表 RLS：登录用户可读活跃敏感词，管理员可全量管理
DROP POLICY IF EXISTS "Authenticated users can read sensitive words" ON public.sensitive_words;
CREATE POLICY "Authenticated users can read sensitive words" ON public.sensitive_words
  FOR SELECT TO authenticated USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage sensitive words" ON public.sensitive_words;
CREATE POLICY "Admins can manage sensitive words" ON public.sensitive_words
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

-- 5.3 审核日志表 RLS：作者可查自己帖子的审核日志，管理员可查全部
DROP POLICY IF EXISTS "Authors and Admins can view logs" ON public.content_moderation_logs;
CREATE POLICY "Authors and Admins can view logs" ON public.content_moderation_logs
  FOR SELECT USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service or Authenticated can insert logs" ON public.content_moderation_logs;
CREATE POLICY "Service or Authenticated can insert logs" ON public.content_moderation_logs
  FOR INSERT WITH CHECK (auth.uid() = author_id OR auth.uid() IS NOT NULL);

-- 5.4 审核缓存表 RLS：允许登录用户查询和写入缓存
DROP POLICY IF EXISTS "Authenticated users can access cache" ON public.content_moderation_cache;
CREATE POLICY "Authenticated users can access cache" ON public.content_moderation_cache
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 6. 插入初始敏感词种子数据（示例）
INSERT INTO public.sensitive_words (word, category, match_level)
VALUES
  ('代写论文', 'academic_fraud', 'block'),
  ('买卖论文', 'academic_fraud', 'block'),
  ('包过SCI', 'academic_fraud', 'block'),
  ('枪手代考', 'academic_fraud', 'block'),
  ('博彩源码', 'ad', 'block'),
  ('成人私密群', 'porn', 'block'),
  ('兼职刷单', 'ad', 'block'),
  ('翻墙梯子', 'general', 'pending'),
  ('内部机密资料', 'general', 'pending')
ON CONFLICT (word) DO NOTHING;
