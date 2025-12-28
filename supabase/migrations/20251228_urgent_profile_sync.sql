-- ============================================
-- Urgent Profile Data Sync
-- Created: 2025-12-28
-- Purpose: Run this script in Supabase SQL Editor to immediately fix empty profiles
-- ============================================

-- STEP 1: Ensure columns exist (safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT;
    END IF;
END $$;

-- STEP 2: Sync email from auth.users to profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

-- STEP 3: Populate username from email if missing
UPDATE public.profiles
SET username = COALESCE(
    NULLIF(username, ''),          -- Keep existing if not empty
    split_part(email, '@', 1)      -- Fallback to email prefix
)
WHERE username IS NULL OR username = '';

-- STEP 4: Insert missing profiles from auth.users
INSERT INTO public.profiles (id, email, username, avatar_url)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = COALESCE(NULLIF(profiles.username, ''), EXCLUDED.username);

-- STEP 5: Verify results
SELECT id, email, username, avatar_url FROM public.profiles;
