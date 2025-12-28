-- ============================================
-- Profile System Extension
-- Created: 2025-12-28
-- Purpose: Extend profiles table with full_name, gender, bio, etc.
-- ============================================

-- 1. Add new columns to profiles table (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'private') OR gender IS NULL);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Update existing profiles: set username from email prefix if empty
UPDATE public.profiles
SET username = split_part(email, '@', 1)
WHERE (username IS NULL OR username = '') AND email IS NOT NULL;

-- 3. Sync email from auth.users for empty emails
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 4. Create index for new searchable fields
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- 5. Update search_users function to include new fields
-- First DROP the existing function (required to change return type)
DROP FUNCTION IF EXISTS search_users(text);

CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.full_name, p.avatar_url, p.bio
  FROM profiles p
  WHERE p.username ILIKE '%' || search_term || '%'
     OR p.full_name ILIKE '%' || search_term || '%'
  LIMIT 20;
END;
$$;

-- 6. Update handle_new_user trigger to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(NULLIF(profiles.username, ''), EXCLUDED.username),
    full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Verify by listing profiles
SELECT id, email, username, full_name, gender, bio FROM public.profiles LIMIT 5;
