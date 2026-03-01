-- Temporary: policies for test-upload bucket
CREATE POLICY "test_bucket_visible" ON storage.buckets FOR SELECT TO public USING (id = 'test-upload');
CREATE POLICY "test_upload_all" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'test-upload') WITH CHECK (bucket_id = 'test-upload');
CREATE POLICY "test_upload_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'test-upload');
