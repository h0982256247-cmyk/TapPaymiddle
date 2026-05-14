-- ================================================
-- Storage Bucket Setup
-- Run in Supabase SQL Editor or via migration
-- ================================================

-- Create merchant-documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-documents',
  'merchant-documents',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- Storage RLS Policies
-- ================================================

-- Allow users to upload to their own folder
CREATE POLICY "merchant_docs_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'merchant-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their own documents
CREATE POLICY "merchant_docs_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'merchant-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR (
        auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
      )
    )
  );

-- Allow users to delete their own documents
CREATE POLICY "merchant_docs_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'merchant-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role can access all documents (for Edge Functions)
CREATE POLICY "merchant_docs_service"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'merchant-documents'
    AND auth.role() = 'service_role'
  );
