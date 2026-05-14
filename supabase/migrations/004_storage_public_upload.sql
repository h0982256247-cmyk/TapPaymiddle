-- 更新 Storage 政策：允許匿名商戶上傳文件（不需要登入）

DROP POLICY IF EXISTS "merchant_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "merchant_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "merchant_docs_delete" ON storage.objects;
DROP POLICY IF EXISTS "merchant_docs_service" ON storage.objects;

-- 允許任何人上傳到 merchant-documents bucket
CREATE POLICY "merchant_docs_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'merchant-documents');

-- admin 和 service role 可讀取所有文件
CREATE POLICY "merchant_docs_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'merchant-documents'
    AND (
      auth.role() = 'service_role'
      OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    )
  );

-- service role 可刪除
CREATE POLICY "merchant_docs_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'merchant-documents'
    AND auth.role() = 'service_role'
  );
