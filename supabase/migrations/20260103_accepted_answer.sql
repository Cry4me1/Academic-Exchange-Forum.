-- ============================================
-- Accepted Answer & Help Wanted Migration
-- Created: 2026-01-03
-- Function: Support accepted answers and help wanted status
-- ============================================

-- 1. Add columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_solved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_help_wanted BOOLEAN DEFAULT FALSE;

-- 2. Add columns to comments table
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;

-- 3. Index for filtering
CREATE INDEX IF NOT EXISTS idx_posts_is_help_wanted ON public.posts(is_help_wanted) WHERE is_help_wanted = TRUE;
CREATE INDEX IF NOT EXISTS idx_posts_is_solved ON public.posts(is_solved);
CREATE INDEX IF NOT EXISTS idx_comments_is_accepted ON public.comments(is_accepted) WHERE is_accepted = TRUE;

-- 4. RPC to toggle answer acceptance
CREATE OR REPLACE FUNCTION public.toggle_comment_acceptance(target_comment_id UUID)
RETURNS JSONB AS $$
DECLARE
  target_post_id UUID;
  current_is_accepted BOOLEAN;
  post_author_id UUID;
BEGIN
  -- Get comment info and lock row
  SELECT post_id, is_accepted INTO target_post_id, current_is_accepted
  FROM public.comments
  WHERE id = target_comment_id;

  -- Verify existence
  IF target_post_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Comment not found');
  END IF;

  -- Verify permission (must be post author)
  SELECT author_id INTO post_author_id
  FROM public.posts
  WHERE id = target_post_id;

  IF auth.uid() != post_author_id THEN
    RETURN jsonb_build_object('error', 'Only post author can accept answers');
  END IF;

  -- Toggle logic
  IF current_is_accepted THEN
    -- If already accepted, unaccept it
    UPDATE public.comments
    SET is_accepted = FALSE
    WHERE id = target_comment_id;

    -- Update post status
    UPDATE public.posts
    SET is_solved = FALSE
    WHERE id = target_post_id;
    
    RETURN jsonb_build_object('status', 'unaccepted');
  ELSE
    -- Unaccept any other comment in this post first
    UPDATE public.comments
    SET is_accepted = FALSE
    WHERE post_id = target_post_id AND is_accepted = TRUE;

    -- Accept the new one
    UPDATE public.comments
    SET is_accepted = TRUE
    WHERE id = target_comment_id;

    -- Update post status
    UPDATE public.posts
    SET is_solved = TRUE
    WHERE id = target_post_id;
    
    RETURN jsonb_build_object('status', 'accepted');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
