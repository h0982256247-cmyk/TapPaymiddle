-- ================================================
-- Migration 005: Security Hardening
-- ================================================

-- 1. 修正 merchant_drafts.user_id 允許 NULL（匿名流程）
--    原本 schema 沒有 NOT NULL，但明確加上 DROP NOT NULL 以防萬一
ALTER TABLE merchant_drafts
  ALTER COLUMN user_id DROP NOT NULL;

-- 移除 ON DELETE CASCADE FK，改為普通 FK，避免匿名草稿被誤刪
ALTER TABLE merchant_drafts
  DROP CONSTRAINT IF EXISTS merchant_drafts_user_id_fkey;

ALTER TABLE merchant_drafts
  ADD CONSTRAINT merchant_drafts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. 收緊 Storage 上傳政策：
--    檔案路徑必須以 {partner_account}/ 開頭
--    且只允許符合規範的路徑（防止目錄穿越攻擊）
DROP POLICY IF EXISTS "merchant_docs_insert" ON storage.objects;

CREATE POLICY "merchant_docs_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'merchant-documents'
    -- 路徑格式：{英數-_}/{timestamp}_{filename}，防止目錄穿越
    AND name ~ '^[a-zA-Z0-9_\-]+/[0-9]+_.+$'
    -- 禁止路徑包含 ..
    AND name NOT LIKE '%..%'
  );

-- 3. 防止 merchants 表被任意讀取（service_role 可讀，anon 不可）
-- 先確認 RLS 已啟用
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_documents ENABLE ROW LEVEL SECURITY;

-- 清除舊有公開政策（若有）
DROP POLICY IF EXISTS "anon_read_merchants" ON merchants;
DROP POLICY IF EXISTS "anon_read_drafts" ON merchant_drafts;

-- Service role 可操作所有資料（API routes 使用）
-- anon 和 authenticated 角色無法直接讀寫（只能透過 API routes）
-- 注意：Next.js API routes 使用 service_role key，所以不受 RLS 限制
