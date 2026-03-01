-- Simplify avatar policies: use split_part instead of storage.foldername
-- to avoid potential issues with the function

DO $$
BEGIN
  DROP POLICY IF EXISTS "avatar_insert" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_delete" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_select" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
END $$;

-- INSERT
CREATE POLICY "avatar_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- UPDATE
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- DELETE
CREATE POLICY "avatar_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- SELECT (public)
CREATE POLICY "avatar_select" ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
