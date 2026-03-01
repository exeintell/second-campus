-- Fix avatar storage policies v3
-- Drop ALL existing avatar-related policies and recreate with correct conditions

DO $$
BEGIN
  -- Drop all possible policy names we've used
  DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_insert" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_delete" ON storage.objects;
  DROP POLICY IF EXISTS "avatar_select" ON storage.objects;
END $$;

-- INSERT: authenticated users can upload to their own folder
CREATE POLICY "avatar_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: authenticated users can update their own files
CREATE POLICY "avatar_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: authenticated users can delete their own files
CREATE POLICY "avatar_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: anyone can read (public bucket)
CREATE POLICY "avatar_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
