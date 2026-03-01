-- Update avatar policies for flat path: avatar_{user_id}.{ext}
-- Users can only manage their own avatar files

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname LIKE 'avatar%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- INSERT: user can upload their own avatar
CREATE POLICY "avatar_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE 'avatar_' || auth.uid()::text || '.%'
  );

-- UPDATE: user can update their own avatar
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE 'avatar_' || auth.uid()::text || '.%'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE 'avatar_' || auth.uid()::text || '.%'
  );

-- DELETE: user can delete their own avatar
CREATE POLICY "avatar_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE 'avatar_' || auth.uid()::text || '.%'
  );

-- SELECT: public read
CREATE POLICY "avatar_select" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Clean up test bucket policies and bucket
DROP POLICY IF EXISTS "test_upload_all" ON storage.objects;
DROP POLICY IF EXISTS "test_upload_select" ON storage.objects;
DROP POLICY IF EXISTS "test_bucket_visible" ON storage.buckets;
