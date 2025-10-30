-- Add columns to profiles table for user statistics
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS points integer DEFAULT 3000 NOT NULL,
ADD COLUMN IF NOT EXISTS gifticons_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS payment_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS selling_count integer DEFAULT 0 NOT NULL;

-- Update existing profiles to have default values
UPDATE public.profiles
SET 
  points = 3000,
  gifticons_count = 0,
  payment_count = 0,
  selling_count = 0
WHERE points IS NULL;