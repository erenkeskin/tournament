-- Add tournament application flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tournament_status text DEFAULT 'PENDING';
COMMENT ON COLUMN public.profiles.tournament_status IS 'SPECTATOR, PENDING, APPROVED, REJECTED';

-- Create avatars table for predefined avatar options
CREATE TABLE IF NOT EXISTS public.avatars (
  id text PRIMARY KEY,
  label text NOT NULL,
  emoji text NOT NULL,
  color text NOT NULL
);

INSERT INTO public.avatars (id, label, emoji, color) VALUES
  ('lion', 'Aslan', '🦁', '#D4A843'),
  ('eagle', 'Kartal', '🦅', '#EDEAE5'),
  ('wolf', 'Kurt', '🐺', '#6B7B71'),
  ('dragon', 'Ejderha', '🐉', '#E53935'),
  ('shark', 'Köpek Balığı', '🦈', '#4CAF50'),
  ('tiger', 'Kaplan', '🐯', '#FF9800'),
  ('bull', 'Boğa', '🐂', '#8D6E63'),
  ('falcon', 'Şahin', '🦅', '#2196F3'),
  ('panther', 'Panter', '🐆', '#9C27B0'),
  ('gorilla', 'Goril', '🦍', '#607D8B'),
  ('cobra', 'Kobra', '🐍', '#4CAF50'),
  ('rhino', 'Gergedan', '🦏', '#795548')
ON CONFLICT (id) DO NOTHING;

-- Allow public to view avatars
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avatars are viewable by everyone" ON public.avatars FOR SELECT USING (true);

-- Allow users to update their own tournament_status and avatar
CREATE POLICY "Users can apply to tournament" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND tournament_status IN ('PENDING'));
