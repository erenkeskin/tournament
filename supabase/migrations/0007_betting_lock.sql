-- Add betting_locked column to matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS betting_locked boolean DEFAULT false;
