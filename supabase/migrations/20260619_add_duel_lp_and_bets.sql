-- ============================================
-- 学术决斗系统强化：LP血条机制与观众下注
-- 创建时间: 2026-06-19
-- ============================================

-- 1. 扩展 duels 表：增加 LP (Logic Points)
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS challenger_lp INTEGER DEFAULT 100;
ALTER TABLE public.duels ADD COLUMN IF NOT EXISTS opponent_lp INTEGER DEFAULT 100;

-- 2. 创建 duel_bets 表：观众下注
CREATE TABLE IF NOT EXISTS public.duel_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id UUID REFERENCES public.duels(id) ON DELETE CASCADE NOT NULL,
  spectator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- 押注的选手
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT CHECK (status IN ('pending', 'won', 'lost', 'refunded')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_duel_bets_duel ON public.duel_bets(duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_bets_spectator ON public.duel_bets(spectator_id);
CREATE INDEX IF NOT EXISTS idx_duel_bets_status ON public.duel_bets(status);

-- 3. RLS 策略 for duel_bets
ALTER TABLE public.duel_bets ENABLE ROW LEVEL SECURITY;

-- 所有人可查看下注
DROP POLICY IF EXISTS "Anyone can view bets" ON public.duel_bets;
CREATE POLICY "Anyone can view bets" ON public.duel_bets
  FOR SELECT USING (TRUE);

-- 用户可以创建下注（通过 API 确保扣款一致性，这里允许用户自己 insert 即可，但是 API 也会用 service_role，为了安全可以只允许 service role insert 或限制本人）
DROP POLICY IF EXISTS "Users can insert own bets" ON public.duel_bets;
CREATE POLICY "Users can insert own bets" ON public.duel_bets
  FOR INSERT WITH CHECK (auth.uid() = spectator_id);

-- 4. 触发器：决斗结束时结算下注
CREATE OR REPLACE FUNCTION public.handle_duel_bets_settlement()
RETURNS TRIGGER AS $$
BEGIN
  -- 当决斗状态变为 completed 时
  IF NEW.status = 'completed' AND OLD.status = 'active' THEN
    
    -- 情况 1：有赢家
    IF NEW.winner_id IS NOT NULL THEN
      -- 押中的（won）
      UPDATE public.duel_bets
      SET status = 'won', settled_at = NOW()
      WHERE duel_id = NEW.id AND target_id = NEW.winner_id AND status = 'pending';
      
      -- 给押中的观众发放奖励（本金 + 1倍奖励，即总共返还 2倍金额）
      -- 注意：本金在下注时已经预先扣除了，所以这里发放 2 倍
      UPDATE public.profiles p
      SET reputation_score = p.reputation_score + (b.amount * 2)
      FROM public.duel_bets b
      WHERE b.duel_id = NEW.id 
        AND b.target_id = NEW.winner_id 
        AND b.spectator_id = p.id
        AND b.status = 'won'
        AND b.settled_at = NOW(); -- 仅对刚刚结算的更新

      -- 押错的（lost），本金已被扣除，无需返还
      UPDATE public.duel_bets
      SET status = 'lost', settled_at = NOW()
      WHERE duel_id = NEW.id AND target_id != NEW.winner_id AND status = 'pending';
      
    -- 情况 2：平局 或 被取消 (Refund)
    ELSE
      UPDATE public.duel_bets
      SET status = 'refunded', settled_at = NOW()
      WHERE duel_id = NEW.id AND status = 'pending';
      
      -- 退还本金
      UPDATE public.profiles p
      SET reputation_score = p.reputation_score + b.amount
      FROM public.duel_bets b
      WHERE b.duel_id = NEW.id 
        AND b.spectator_id = p.id
        AND b.status = 'refunded'
        AND b.settled_at = NOW();
    END IF;

  -- 当决斗被取消时
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      UPDATE public.duel_bets
      SET status = 'refunded', settled_at = NOW()
      WHERE duel_id = NEW.id AND status = 'pending';
      
      -- 退还本金
      UPDATE public.profiles p
      SET reputation_score = p.reputation_score + b.amount
      FROM public.duel_bets b
      WHERE b.duel_id = NEW.id 
        AND b.spectator_id = p.id
        AND b.status = 'refunded'
        AND b.settled_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_duel_end_settle_bets ON public.duels;
CREATE TRIGGER on_duel_end_settle_bets
  AFTER UPDATE ON public.duels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_duel_bets_settlement();

-- 5. 把 duel_bets 添加到实时频道
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'duel_bets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_bets;
  END IF;
END $$;
