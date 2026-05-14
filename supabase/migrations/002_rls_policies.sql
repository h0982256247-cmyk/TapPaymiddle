-- ================================================
-- TapPay Merchant Onboarding System
-- Migration 002: Row Level Security Policies
-- ================================================

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_notify_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_supplements ENABLE ROW LEVEL SECURITY;

-- ================================================
-- Helper: check if user is admin
-- ================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      FALSE
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- merchants policies
-- ================================================

-- Merchant owners can see their own records
CREATE POLICY "merchants_select_own"
  ON merchants FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- Merchant owners can insert their own records
CREATE POLICY "merchants_insert_own"
  ON merchants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Merchant owners can update their own records (only allowed fields)
CREATE POLICY "merchants_update_own"
  ON merchants FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

-- Only admins can delete
CREATE POLICY "merchants_delete_admin"
  ON merchants FOR DELETE
  USING (is_admin());

-- ================================================
-- merchant_basic_info policies
-- ================================================

CREATE POLICY "basic_info_select_own"
  ON merchant_basic_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND (m.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "basic_info_insert_own"
  ON merchant_basic_info FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "basic_info_update_own"
  ON merchant_basic_info FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND (m.user_id = auth.uid() OR is_admin())
    )
  );

-- ================================================
-- merchant_payment_methods policies
-- ================================================

CREATE POLICY "payment_methods_select_own"
  ON merchant_payment_methods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND (m.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "payment_methods_insert_own"
  ON merchant_payment_methods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "payment_methods_update_own"
  ON merchant_payment_methods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND (m.user_id = auth.uid() OR is_admin())
    )
  );

-- ================================================
-- merchant_documents policies
-- ================================================

CREATE POLICY "documents_select_own"
  ON merchant_documents FOR SELECT
  USING (
    uploaded_by = auth.uid() OR is_admin() OR
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "documents_insert_own"
  ON merchant_documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

-- ================================================
-- merchant_notify_logs policies (read-only for merchants)
-- ================================================

CREATE POLICY "notify_logs_select"
  ON merchant_notify_logs FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

-- Only service role can insert notify logs (via Edge Functions)
CREATE POLICY "notify_logs_insert_service"
  ON merchant_notify_logs FOR INSERT
  WITH CHECK (is_admin());

-- ================================================
-- merchant_api_logs policies (read-only for merchants)
-- ================================================

CREATE POLICY "api_logs_select"
  ON merchant_api_logs FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "api_logs_insert_service"
  ON merchant_api_logs FOR INSERT
  WITH CHECK (is_admin());

-- ================================================
-- merchant_drafts policies
-- ================================================

CREATE POLICY "drafts_select_own"
  ON merchant_drafts FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "drafts_insert_own"
  ON merchant_drafts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "drafts_update_own"
  ON merchant_drafts FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "drafts_delete_own"
  ON merchant_drafts FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- ================================================
-- merchant_supplements policies
-- ================================================

CREATE POLICY "supplements_select_own"
  ON merchant_supplements FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "supplements_insert_own"
  ON merchant_supplements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "supplements_update_own"
  ON merchant_supplements FOR UPDATE
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

-- ================================================
-- Storage Buckets RLS (apply in Supabase Dashboard)
-- ================================================
-- Bucket: merchant-documents (PRIVATE)
-- Policy: Users can only access files in their own folder: {user_id}/...
--
-- INSERT: (bucket_id = 'merchant-documents' AND auth.uid()::text = (storage.foldername(name))[1])
-- SELECT: (bucket_id = 'merchant-documents' AND auth.uid()::text = (storage.foldername(name))[1])
-- Admin can access all: is_admin()
