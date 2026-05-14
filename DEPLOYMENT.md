# TapPay 商戶進件系統 — 部署指南

## 目錄

1. [系統架構](#系統架構)
2. [前置準備](#前置準備)
3. [Supabase 設定](#supabase-設定)
4. [前端部署 (Vercel)](#前端部署-vercel)
5. [Edge Functions 部署](#edge-functions-部署)
6. [環境變數總覽](#環境變數總覽)
7. [TapPay Sandbox 測試](#tappay-sandbox-測試)
8. [設定管理員帳號](#設定管理員帳號)

---

## 系統架構

```
商戶前台 (Next.js on Vercel)
    ↓ HTTPS
Supabase Edge Functions (Deno)
    ↓ HTTPS + x-api-key
TapPay API (Sandbox / Production)

TapPay Notify Webhook
    ↓ POST + x-api-key (partner_key)
Next.js API Route → Supabase Edge Function
    ↓
Supabase PostgreSQL (RLS)
```

---

## 前置準備

### 需要的帳號

- [ ] [Supabase](https://supabase.com) 帳號（免費方案即可）
- [ ] [Vercel](https://vercel.com) 帳號
- [ ] TapPay 平台商帳號（取得 platform_key）

### 本地開發工具

```bash
# Node.js 18+
node --version

# Supabase CLI
npm install -g supabase

# Vercel CLI
npm install -g vercel
```

---

## Supabase 設定

### 1. 建立專案

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 建立新專案，記下 **Project URL** 和 **API Keys**

### 2. 執行 Migrations

```bash
# 方法一：使用 Supabase CLI
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# 方法二：在 Supabase SQL Editor 執行
# 依序執行以下檔案：
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_rls_policies.sql
# supabase/migrations/003_storage.sql
```

### 3. 設定 Storage Bucket

在 SQL Editor 執行 `003_storage.sql`，建立 `merchant-documents` private bucket。

### 4. 設定 Edge Function Secrets

```bash
supabase secrets set TAPPAY_PLATFORM_KEY="platform_tappay_test_key_abcdefghijklmnopqrstuvwxyzabcdefghijklm"
supabase secrets set TAPPAY_ENV="sandbox"
```

Production 時：
```bash
supabase secrets set TAPPAY_PLATFORM_KEY="your_production_platform_key"
supabase secrets set TAPPAY_ENV="production"
```

---

## 前端部署 (Vercel)

### 1. 連結 Git Repo

```bash
cd tappay-onboarding
git init && git add . && git commit -m "Initial commit"
vercel --prod
```

### 2. 設定環境變數（Vercel Dashboard）

| 變數名 | 說明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key（Server-only） |

---

## Edge Functions 部署

```bash
# 部署全部 functions
supabase functions deploy create-partner-account
supabase functions deploy basic
supabase functions deploy additional
supabase functions deploy qualification-file
supabase functions deploy query-status
supabase functions deploy tappay-notify
supabase functions deploy save-draft
supabase functions deploy supplement
```

---

## 環境變數總覽

### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

### Edge Functions (Supabase Secrets)

```
TAPPAY_PLATFORM_KEY=platform_tappay_test_key_...
TAPPAY_ENV=sandbox
```

---

## TapPay Sandbox 測試

### Sandbox 固定值

| 參數 | 值 |
|------|----|
| platform_key | `platform_tappay_test_key_abcdefghijklmnopqrstuvwxyzabcdefghijklm` |
| Base URL | `https://sandbox-cus-pf-api.tappaysdk.com` |

### 測試流程

1. 前往 `/register` 建立帳號
2. 前往 `/onboarding` 填寫表單
3. 提交後觀察 API Logs（`/dashboard/api-logs`）
4. 模擬 TapPay Notify：

```bash
curl -X POST https://your-domain.vercel.app/api/webhook/tappay-notify \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_PARTNER_KEY" \
  -d '{
    "partner_account": "test-account",
    "company_name": "測試公司",
    "status_code": 7,
    "status": "審核通過",
    "payment_method": "ONLINE_CREDIT_CARD"
  }'
```

### TapPay Notify URL 設定

告知 TapPay 業務設定 Notify URL 為：
```
https://your-domain.vercel.app/api/webhook/tappay-notify
```

---

## 設定管理員帳號

在 Supabase SQL Editor 執行：

```sql
-- 將某個 user 設為 admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@yourcompany.com';
```

管理員登入後會自動跳轉到 `/dashboard`。

---

## 安全注意事項

1. **platform_key 保護**：只存在 Supabase Secrets，不在前端或 DB 明文儲存
2. **partner_key 保護**：儲存於 DB `merchants.partner_key`，受 RLS 保護
3. **身分證/銀行帳號**：存於 JSONB，未單獨索引，僅 service_role 可查
4. **文件**：Private Supabase Storage，需簽名 URL 才能存取
5. **Notify 驗證**：驗證 `x-api-key` 須等於對應商戶的 `partner_key`
6. **RLS**：所有 table 均啟用 RLS，商戶只能存取自己的資料
