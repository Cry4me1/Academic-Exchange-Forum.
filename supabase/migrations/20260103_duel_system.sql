-- ============================================
-- 学术决斗场 (Scholarly Duel) 系统
-- 创建时间: 2026-01-03
-- 功能: 决斗、回合记录、AI 评分、信誉积分
-- ============================================

-- ============================================
-- 0. 扩展 profiles 表：添加信誉积分
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duel_wins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duel_losses INTEGER DEFAULT 0;

-- ============================================
-- 1. DUELS 表：决斗主记录
-- ============================================
CREATE TABLE public.duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,                    -- 辩题
  description TEXT,                        -- 辩题详细描述
  challenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  opponent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  challenger_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  challenger_position TEXT DEFAULT '正方', -- 挑战者立场
  opponent_position TEXT DEFAULT '反方',   -- 对手立场
  max_rounds INTEGER DEFAULT 5,
  current_round INTEGER DEFAULT 0,
  current_turn_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- 当前应该出手的用户
  ko_type TEXT,                            -- KO 类型：fallacy_limit / negative_streak
  ko_reason TEXT,                          -- KO 原因描述
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_duels_status ON public.duels(status);
CREATE INDEX idx_duels_challenger ON public.duels(challenger_id);
CREATE INDEX idx_duels_opponent ON public.duels(opponent_id);
CREATE INDEX idx_duels_created_at ON public.duels(created_at DESC);

-- ============================================
-- 2. DUEL_ROUNDS 表：每一回合的论点
-- ============================================
CREATE TABLE public.duel_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID REFERENCES public.duels(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,                  -- Tiptap 编辑器 JSON 格式内容
  content_text TEXT,                       -- 纯文本内容（用于 AI 分析）
  
  -- AI 评分结果
  evidence_score INTEGER DEFAULT 0,        -- 证据力度 (0-5)
  citation_score INTEGER DEFAULT 0,        -- 引用权威性 (0-3)
  logic_score INTEGER DEFAULT 0,           -- 逻辑严密 (0-2)
  fallacy_penalty INTEGER DEFAULT 0,       -- 谬误扣分 (0 或 -10)
  total_score INTEGER DEFAULT 0,           -- 总分
  
  has_fallacy BOOLEAN DEFAULT FALSE,       -- 是否存在逻辑谬误
  fallacy_type TEXT,                       -- 谬误类型
  ai_analysis TEXT,                        -- AI 分析说明
  ai_analyzed_at TIMESTAMPTZ,              -- AI 分析完成时间
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_duel_rounds_duel ON public.duel_rounds(duel_id);
CREATE INDEX idx_duel_rounds_author ON public.duel_rounds(author_id);
CREATE INDEX idx_duel_rounds_round ON public.duel_rounds(duel_id, round_number);

-- ============================================
-- 3. DUEL_INVITATIONS 表：决斗邀请
-- ============================================
CREATE TABLE public.duel_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID REFERENCES public.duels(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(duel_id, invitee_id)
);

-- 索引
CREATE INDEX idx_duel_invitations_invitee ON public.duel_invitations(invitee_id);
CREATE INDEX idx_duel_invitations_status ON public.duel_invitations(status);

-- ============================================
-- 4. RLS 策略
-- ============================================

-- Duels 表 RLS
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看进行中或已完成的决斗（观战）
DROP POLICY IF EXISTS "Anyone can view active duels" ON public.duels;
CREATE POLICY "Anyone can view active duels" ON public.duels
  FOR SELECT USING (status IN ('active', 'completed'));

-- 参与者可以查看自己的待处理决斗
DROP POLICY IF EXISTS "Participants can view own pending duels" ON public.duels;
CREATE POLICY "Participants can view own pending duels" ON public.duels
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- 登录用户可以创建决斗
DROP POLICY IF EXISTS "Users can create duels" ON public.duels;
CREATE POLICY "Users can create duels" ON public.duels
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

-- 参与者可以更新决斗状态
DROP POLICY IF EXISTS "Participants can update duels" ON public.duels;
CREATE POLICY "Participants can update duels" ON public.duels
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Duel Rounds 表 RLS  
ALTER TABLE public.duel_rounds ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看回合（公开观战）
DROP POLICY IF EXISTS "Anyone can view rounds" ON public.duel_rounds;
CREATE POLICY "Anyone can view rounds" ON public.duel_rounds
  FOR SELECT USING (TRUE);

-- 参与者可以创建回合（仅限自己的回合）
DROP POLICY IF EXISTS "Participants can create rounds" ON public.duel_rounds;
CREATE POLICY "Participants can create rounds" ON public.duel_rounds
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.duels 
      WHERE id = duel_id 
      AND status = 'active'
      AND (challenger_id = auth.uid() OR opponent_id = auth.uid())
    )
  );

-- 系统可以更新回合评分（通过 service role）
DROP POLICY IF EXISTS "System can update rounds" ON public.duel_rounds;
CREATE POLICY "System can update rounds" ON public.duel_rounds
  FOR UPDATE USING (TRUE);

-- Duel Invitations 表 RLS
ALTER TABLE public.duel_invitations ENABLE ROW LEVEL SECURITY;

-- 被邀请者可以查看邀请
DROP POLICY IF EXISTS "Invitees can view invitations" ON public.duel_invitations;
CREATE POLICY "Invitees can view invitations" ON public.duel_invitations
  FOR SELECT USING (auth.uid() = invitee_id);

-- 决斗发起者可以查看自己发出的邀请
DROP POLICY IF EXISTS "Challengers can view sent invitations" ON public.duel_invitations;
CREATE POLICY "Challengers can view sent invitations" ON public.duel_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.duels WHERE id = duel_id AND challenger_id = auth.uid()
    )
  );

-- 发起者可以创建邀请
DROP POLICY IF EXISTS "Challengers can create invitations" ON public.duel_invitations;
CREATE POLICY "Challengers can create invitations" ON public.duel_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.duels WHERE id = duel_id AND challenger_id = auth.uid()
    )
  );

-- 被邀请者可以更新邀请状态（接受/拒绝）
DROP POLICY IF EXISTS "Invitees can respond to invitations" ON public.duel_invitations;
CREATE POLICY "Invitees can respond to invitations" ON public.duel_invitations
  FOR UPDATE USING (auth.uid() = invitee_id);

-- ============================================
-- 5. 触发器：决斗结束后更新积分
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_duel_end()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在决斗完成时处理
  IF NEW.status = 'completed' AND OLD.status = 'active' AND NEW.winner_id IS NOT NULL THEN
    -- 赢家 +10 分，+1 胜场
    UPDATE public.profiles 
    SET reputation_score = reputation_score + 10,
        duel_wins = duel_wins + 1
    WHERE id = NEW.winner_id;
    
    -- 输家 -5 分（最低不低于 0），+1 败场
    UPDATE public.profiles 
    SET reputation_score = GREATEST(reputation_score - 5, 0),
        duel_losses = duel_losses + 1
    WHERE id = CASE 
      WHEN NEW.winner_id = NEW.challenger_id THEN NEW.opponent_id 
      ELSE NEW.challenger_id 
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_duel_end ON public.duels;
CREATE TRIGGER on_duel_end
  AFTER UPDATE ON public.duels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_duel_end();

-- ============================================
-- 6. 触发器：更新决斗分数
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_round_score_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新对应用户的决斗总分
  IF NEW.author_id = (SELECT challenger_id FROM public.duels WHERE id = NEW.duel_id) THEN
    UPDATE public.duels 
    SET challenger_score = (
      SELECT COALESCE(SUM(total_score), 0) 
      FROM public.duel_rounds 
      WHERE duel_id = NEW.duel_id AND author_id = NEW.author_id
    )
    WHERE id = NEW.duel_id;
  ELSE
    UPDATE public.duels 
    SET opponent_score = (
      SELECT COALESCE(SUM(total_score), 0) 
      FROM public.duel_rounds 
      WHERE duel_id = NEW.duel_id AND author_id = NEW.author_id
    )
    WHERE id = NEW.duel_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_round_score_update ON public.duel_rounds;
CREATE TRIGGER on_round_score_update
  AFTER INSERT OR UPDATE ON public.duel_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_round_score_update();

-- ============================================
-- 7. 启用 Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_invitations;

-- ============================================
-- 8. RPC 函数：获取用户决斗统计
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_duel_stats(target_user_id UUID)
RETURNS TABLE (
  reputation_score INTEGER,
  duel_wins INTEGER,
  duel_losses INTEGER,
  win_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.reputation_score,
    p.duel_wins,
    p.duel_losses,
    CASE 
      WHEN (p.duel_wins + p.duel_losses) > 0 
      THEN ROUND(p.duel_wins::NUMERIC / (p.duel_wins + p.duel_losses) * 100, 1)
      ELSE 0
    END as win_rate
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
