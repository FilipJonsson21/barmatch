-- BarMatch: Supabase Storage buckets for images
-- Run these via Supabase Dashboard > Storage or SQL editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('group-photos', 'group-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload group photos
CREATE POLICY "Users can upload group photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'group-photos');

CREATE POLICY "Anyone can view group photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'group-photos');
