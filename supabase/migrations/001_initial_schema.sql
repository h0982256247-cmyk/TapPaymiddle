-- ================================================
-- TapPay Merchant Onboarding System
-- Migration 001: Initial Schema
-- ================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE merchant_type AS ENUM ('E', 'P');
CREATE TYPE merchant_status AS ENUM (
  'DRAFT',          -- 草稿暫存
  'SUBMITTED',      -- 已進件 (1)
  'PENDING_SUPPLEMENT', -- 待補件 (4)
  'SUPPLEMENTED',   -- 已補件 (5)
  'UNDER_REVIEW',   -- 審核中 (6)
  'APPROVED',       -- 審核通過 (7)
  'REJECTED',       -- 審核不通過 (8)
  'DISABLED',       -- 已停用 (9)
  'MERCHANT_CREATED' -- 商代已建立 (16)
);

CREATE TYPE industry_code AS ENUM (
  'NON_SPECIAL_INDUSTRY',
  'TRAVEL_AGENCY',
  'CRAM_SCHOOL',
  'MEDICAL_CLINIC'
);

CREATE TYPE payment_method AS ENUM (
  'ONLINE_CREDIT_CARD',
  'OFFLINE_CREDIT_CARD',
  'ATM',
  'CVSCOM_C2C'
);

CREATE TYPE document_type AS ENUM (
  'id_photo_front',
  'id_photo_back',
  'passbook_cover',
  'company_certificate_document',
  'manufacture_license',
  'member_certificate',
  'guarantee_document',
  'supporting_documents',
  'vat_number_notice',
  'beneficiary_declaration',
  'business_tax_return',
  'other_document'
);

-- ================================================
-- TABLES
-- ================================================

-- Merchants (主表)
CREATE TABLE merchants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_account     VARCHAR(32) UNIQUE NOT NULL,
  merchant_type       merchant_type,
  industry_code       industry_code DEFAULT 'NON_SPECIAL_INDUSTRY',
  company_name        VARCHAR(100),
  company_name_english VARCHAR(200),
  contact_email       VARCHAR(64),
  status              merchant_status DEFAULT 'DRAFT',
  partner_key         TEXT,           -- 加密儲存
  tappay_status_code  SMALLINT,       -- TapPay 回傳的狀態碼
  tappay_opinion      TEXT,           -- TapPay 審核意見
  is_complete         BOOLEAN DEFAULT FALSE,
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Merchant Basic Info (進件基本資料)
CREATE TABLE merchant_basic_info (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id         UUID REFERENCES merchants(id) ON DELETE CASCADE,
  -- register_info (法人)
  register_info       JSONB,
  -- company_info
  company_info        JSONB NOT NULL DEFAULT '{}',
  -- contact_info
  contact_info        JSONB NOT NULL DEFAULT '{}',
  -- merchant_owner_info
  merchant_owner_info JSONB NOT NULL DEFAULT '{}',
  -- bank_info
  bank_info           JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id)
);

-- Merchant Payment Methods (支付方式)
CREATE TABLE merchant_payment_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
  payment_method  payment_method NOT NULL,
  payment_config  JSONB DEFAULT '{}',
  status          VARCHAR(32) DEFAULT 'PENDING',
  merchant_id_ref VARCHAR(100),  -- TapPay 回傳的商代
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, payment_method)
);

-- Merchant Documents (文件)
CREATE TABLE merchant_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
  document_type   document_type NOT NULL,
  file_path       TEXT NOT NULL,  -- Supabase Storage path
  file_name       TEXT,
  file_size       BIGINT,
  mime_type       VARCHAR(100),
  uploaded_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Merchant Notify Logs (TapPay Notify webhook logs)
CREATE TABLE merchant_notify_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID REFERENCES merchants(id) ON DELETE SET NULL,
  partner_account VARCHAR(32),
  status_code     SMALLINT,
  status          VARCHAR(50),
  payment_method  VARCHAR(50),
  notify_payload  JSONB NOT NULL,
  processed_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Merchant API Logs (TapPay API 呼叫日誌)
CREATE TABLE merchant_api_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       UUID REFERENCES merchants(id) ON DELETE SET NULL,
  partner_account   VARCHAR(32),
  api_name          VARCHAR(100) NOT NULL,
  http_method       VARCHAR(10) DEFAULT 'POST',
  endpoint          TEXT,
  request_payload   JSONB,
  response_payload  JSONB,
  response_status   SMALLINT,
  duration_ms       INTEGER,
  is_success        BOOLEAN,
  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Merchant Drafts (草稿暫存)
CREATE TABLE merchant_drafts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_payload   JSONB NOT NULL DEFAULT '{}',
  current_step    SMALLINT DEFAULT 1,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id)
);

-- Supplement Requests (補件申請)
CREATE TABLE merchant_supplements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID REFERENCES merchants(id) ON DELETE CASCADE,
  payment_method  payment_method,
  supplement_data JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(32) DEFAULT 'PENDING',
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_partner_account ON merchants(partner_account);
CREATE INDEX idx_merchant_basic_info_merchant_id ON merchant_basic_info(merchant_id);
CREATE INDEX idx_merchant_payment_methods_merchant_id ON merchant_payment_methods(merchant_id);
CREATE INDEX idx_merchant_documents_merchant_id ON merchant_documents(merchant_id);
CREATE INDEX idx_merchant_notify_logs_merchant_id ON merchant_notify_logs(merchant_id);
CREATE INDEX idx_merchant_api_logs_merchant_id ON merchant_api_logs(merchant_id);
CREATE INDEX idx_merchant_api_logs_created_at ON merchant_api_logs(created_at DESC);
CREATE INDEX idx_merchant_drafts_merchant_id ON merchant_drafts(merchant_id);
CREATE INDEX idx_merchant_drafts_user_id ON merchant_drafts(user_id);

-- ================================================
-- UPDATED_AT TRIGGER
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER merchant_basic_info_updated_at
  BEFORE UPDATE ON merchant_basic_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER merchant_payment_methods_updated_at
  BEFORE UPDATE ON merchant_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER merchant_drafts_updated_at
  BEFORE UPDATE ON merchant_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER merchant_supplements_updated_at
  BEFORE UPDATE ON merchant_supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
