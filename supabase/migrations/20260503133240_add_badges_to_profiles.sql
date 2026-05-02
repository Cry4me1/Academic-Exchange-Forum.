-- Add special_title and badges to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS special_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
