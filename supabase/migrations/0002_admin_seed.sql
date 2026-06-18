-- Seed: create an initial admin user (email: admin@vig.com, password: admin123)
-- Run this manually via Supabase Studio SQL editor or supabase db push

-- Insert admin user into auth.users (only works in local dev with supabase)
-- For production, sign up via the app then run:
--   UPDATE public.profiles SET is_admin = true WHERE username = 'admin';

-- Helper function: promote a user to admin by email
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_email text)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET is_admin = true
  WHERE id = (
    SELECT id FROM auth.users WHERE email = target_email
  );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To create the first admin:
-- 1. Sign up via the app with email admin@vig.com
-- 2. Run in Supabase Studio SQL editor: SELECT promote_to_admin('admin@vig.com');
-- 3. Or directly: UPDATE public.profiles SET is_admin = true WHERE username = 'admin';
