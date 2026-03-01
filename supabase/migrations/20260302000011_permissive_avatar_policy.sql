-- Temporary permissive policy to debug upload issue
-- Allow ALL operations on avatars bucket for any authenticated user

DO $$
BEGIN
  DROP POLICY IF EXISTS "avatar_insert" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_delete" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_select" ON storage.objects;
END $$;

-- Allow everything for authenticated users on avatars bucket
CREATE POLICY "avatar_all" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Public read
CREATE POLICY "avatar_public_select" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
