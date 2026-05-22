-- ================================================
-- Migration 008: Fix RLS policies
-- 
-- Problems fixed:
-- 1. is_admin() only checked 'admin', not 'super_admin'
-- 2. merchants.user_id is NULL for anonymously-submitted onboarding forms
--    so m.user_id = auth.uid() always fails for platform admins
-- 3. No-role (platform admin) users had no way to access merchants
--    belonging to their platform via platform_id
-- ================================================

-- Fix 1: Update is_admin() to accept both 'admin' and 'super_admin'
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin'),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: New helper – check if current user is the platform owner of a given merchant
CREATE OR REPLACE FUNCTION is_platform_owner_of_merchant(p_merchant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM merchants m
    JOIN platforms p ON p.id = m.platform_id
    WHERE m.id = p_merchant_id
      AND p.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Re-create merchants policies to include platform owner
-- ================================================
DROP POLICY IF EXISTS "merchants_select_own" ON merchants;
CREATE POLICY "merchants_select_own"
  ON merchants FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM platforms p
      WHERE p.id = merchants.platform_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "merchants_update_own" ON merchants;
CREATE POLICY "merchants_update_own"
  ON merchants FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM platforms p
      WHERE p.id = merchants.platform_id AND p.user_id = auth.uid()
    )
  );

-- ================================================
-- Re-create merchant_basic_info policies
-- ================================================
DROP POLICY IF EXISTS "basic_info_select_own" ON merchant_basic_info;
CREATE POLICY "basic_info_select_own"
  ON merchant_basic_info FOR SELECT
  USING (
    is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "basic_info_update_own" ON merchant_basic_info;
CREATE POLICY "basic_info_update_own"
  ON merchant_basic_info FOR UPDATE
  USING (
    is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

-- ================================================
-- Re-create merchant_payment_methods policies
-- ================================================
DROP POLICY IF EXISTS "payment_methods_select_own" ON merchant_payment_methods;
CREATE POLICY "payment_methods_select_own"
  ON merchant_payment_methods FOR SELECT
  USING (
    is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "payment_methods_update_own" ON merchant_payment_methods;
CREATE POLICY "payment_methods_update_own"
  ON merchant_payment_methods FOR UPDATE
  USING (
    is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

-- ================================================
-- Re-create merchant_documents policies
-- ================================================
DROP POLICY IF EXISTS "documents_select_own" ON merchant_documents;
CREATE POLICY "documents_select_own"
  ON merchant_documents FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

-- ================================================
-- Re-create merchant_notify_logs policies
-- ================================================
DROP POLICY IF EXISTS "notify_logs_select" ON merchant_notify_logs;
CREATE POLICY "notify_logs_select"
  ON merchant_notify_logs FOR SELECT
  USING (
    is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

-- ================================================
-- Re-create merchant_api_logs policies
-- ================================================
DROP POLICY IF EXISTS "api_logs_select" ON merchant_api_logs;
CREATE POLICY "api_logs_select"
  ON merchant_api_logs FOR SELECT
  USING (
    is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

-- ================================================
-- Re-create merchant_supplements policies
-- ================================================
DROP POLICY IF EXISTS "supplements_select_own" ON merchant_supplements;
CREATE POLICY "supplements_select_own"
  ON merchant_supplements FOR SELECT
  USING (
    is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "supplements_update_own" ON merchant_supplements;
CREATE POLICY "supplements_update_own"
  ON merchant_supplements FOR UPDATE
  USING (
    is_admin()
    OR is_platform_owner_of_merchant(merchant_id)
    OR EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = merchant_id AND m.user_id = auth.uid()
    )
  );
