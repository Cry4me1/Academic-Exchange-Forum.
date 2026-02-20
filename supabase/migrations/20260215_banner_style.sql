-- Add banner_style column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_style text;

-- Set default value for existing rows (optional, but good for consistency)
UPDATE profiles 
SET banner_style = 'default' 
WHERE banner_style IS NULL;
