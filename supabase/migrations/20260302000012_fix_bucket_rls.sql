-- Fix: allow authenticated users to see the avatars bucket
-- storage.buckets has RLS enabled, and without a SELECT policy,
-- authenticated users cannot find the bucket (causing "Bucket not found" on upload)

CREATE POLICY "Anyone can see avatars bucket"
  ON storage.buckets FOR SELECT
  TO public
  USING (id = 'avatars');
