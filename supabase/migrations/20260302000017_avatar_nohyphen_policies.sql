-- Final avatar policies: filenames use UUID without hyphens
-- Pattern: avatar_<uuid_no_hyphens>.<ext>

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- INSERT: user can upload their own avatar (UUID without hyphens)
CREATE POLICY "avatar_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE 'avatar_' || replace(auth.uid()::text, '-', '') || '.%'
  );

-- UPDATE: user can update their own avatar
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE 'avatar_' || replace(auth.uid()::text, '-', '') || '.%'
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE 'avatar_' || replace(auth.uid()::text, '-', '') || '.%'
  );

-- DELETE: user can delete their own avatar
CREATE POLICY "avatar_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE 'avatar_' || replace(auth.uid()::text, '-', '') || '.%'
  );

-- SELECT: public read for all avatars
CREATE POLICY "avatar_select" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
