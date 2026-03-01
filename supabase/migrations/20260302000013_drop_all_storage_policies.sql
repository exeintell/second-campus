-- Drop ALL policies on storage.objects (not just the ones we know about)
-- Then recreate only what we need

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Recreate: fully permissive for avatars bucket
CREATE POLICY "avatar_authenticated_all" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatar_public_select" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
