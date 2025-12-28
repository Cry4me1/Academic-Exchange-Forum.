-- ============================================
-- Fix Empty Profiles & Schema 
-- Created: 2025-12-28
-- Purpose: Ensure columns exist and populate/sync data from auth.users and full_name
-- ============================================

-- 1. Schema Fix: Ensure 'email' and 'username' columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- 2. Data Fix: Sync email from auth.users
UPDATE public.profiles p
SET 
  email = u.email
FROM auth.users u
WHERE p.id = u.id
AND (p.email IS NULL OR p.email = '');

-- 3. Data Fix: Populate username
-- Strategy: Use existing username > use full_name > use email prefix
UPDATE public.profiles
SET username = COALESCE(
    username,                  -- Keep existing if not null
    full_name,                 -- Fallback to full_name (e.g. '管理员01')
    split_part(email, '@', 1)  -- Fallback to email prefix
)
WHERE username IS NULL OR username = '';

-- 4. Backfill completely missing profiles
INSERT INTO public.profiles (id, email, username, full_name)
SELECT 
  id, 
  email,
  split_part(email, '@', 1),
  split_part(email, '@', 1) -- Set full_name too if missing
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
