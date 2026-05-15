import { z } from 'zod'
import { parseCityDistrict } from '@/lib/taiwan-districts'

const cityDistrictField = z
  .string()
  .min(1, '請選擇縣市')
  .refine((val) => parseCityDistrict(val).district !== '', { message: '請選擇區' })

// ================================================
// Step 1: 帳號 + 商家類型
// ================================================

export const step1Schema = z.object({
  partner_account: z
    .string()
    .min(4, '帳號至少 4 個字元')
    .max(32, '帳號最多 32 個字元')
    .regex(/^[a-zA-Z0-9_-]+$/, '帳號只能包含英文、數字、底線、連字號'),
  contact_email: z.string().email('請輸入有效的 Email'),
  merchant_type: z.enum(['E', 'P'], { error: '請選擇商家類型' }),
  industry_code: z.enum([
    'NON_SPECIAL_INDUSTRY',
    'TRAVEL_AGENCY',
    'CRAM_SCHOOL',
    'MEDICAL_CLINIC',
  ]),
})

// ================================================
// Step 2: 商家基本資料
// ================================================

export const registerInfoSchema = z.object({
  vat_number: z.string().length(8, '統一編號須為 8 碼'),
  register_name: z.string().min(1, '必填').max(30),
  register_name_english: z.string().min(1, '必填').max(100),
  register_postal_code: z.string().length(3, '郵遞區號須為 3 碼'),
  register_city: cityDistrictField,
  register_address: z.string().min(1, '必填').max(26),
  is_prepaid_product: z.boolean(),
  company_capital: z.number().positive('資本額必須大於 0'),
  company_establishment_date: z
    .string()
    .regex(/^\d{7}$/, '格式為民國年 7 碼，例：1040401'),
})

export const companyInfoSchema = z.object({
  company_name: z.string().min(1, '必填').max(13),
  company_name_english: z.string().min(1, '必填').max(22),
  company_postal_code: z.string().length(3, '郵遞區號須為 3 碼'),
  company_city: cityDistrictField,
  company_address: z.string().min(1, '必填').max(26),
  company_address_english: z.string().max(130).optional(),
  company_phone_area_code: z.string().min(1, '必填').max(4),
  company_phone: z.string().min(1, '必填').max(15),
  company_fax_area_code: z.string().max(4).optional(),
  company_fax: z.string().max(15).optional(),
  is_chain_store: z.boolean(),
  chain_store_type: z.enum(['DIRECT', 'FRANCHISE', '']).optional(),
}).superRefine((data, ctx) => {
  if (data.is_chain_store && !data.chain_store_type) {
    ctx.addIssue({ code: 'custom', path: ['chain_store_type'], message: '連鎖店請選擇直營或加盟' })
  }
})

export const step2Schema = z.object({
  register_info: registerInfoSchema.optional(),
  company_info: companyInfoSchema,
})

// ================================================
// Step 3: 聯絡人 + 負責人
// ================================================

export const contactInfoSchema = z.object({
  business_contact_name: z.string().min(1, '必填').max(10),
  business_contact_phone_area_code: z.string().min(1, '必填').max(4),
  business_contact_phone: z.string().min(1, '必填').max(15),
  accounting_contact_email: z.string().email('請輸入有效 Email'),
  accounting_contact_name: z.string().max(10).optional(),
  accounting_contact_phone_area_code: z.string().max(4).optional(),
  accounting_contact_phone: z.string().max(10).optional(),
  reserved_contact_email: z.string().email('請輸入有效 Email').optional().or(z.literal('')),
})

export const merchantOwnerInfoSchema = z.object({
  is_foreigner: z.boolean(),
  sub_merchant_owner_name: z.string().min(1, '必填').max(10),
  sub_merchant_owner_name_english: z.string().min(1, '必填').max(50),
  sub_merchant_owner_id: z.string().min(1, '必填').max(10),
  sub_merchant_owner_birthday: z
    .string()
    .regex(/^\d{8}$/, '格式為西元年 8 碼，例：20001213'),
  id_issued_date: z.string().optional(),
  id_issued_place: z.string().max(8).optional(),
  id_replacement_category: z.enum(['FIRST_ISSUED', 'REISSUED', 'REPLACED']).optional(),
  sub_merchant_owner_postal_code: z.string().length(3, '郵遞區號須為 3 碼'),
  sub_merchant_owner_city: cityDistrictField,
  sub_merchant_owner_address: z.string().min(1, '必填').max(26),
}).superRefine((data, ctx) => {
  if (!data.is_foreigner) {
    if (!data.id_issued_date) {
      ctx.addIssue({ code: 'custom', path: ['id_issued_date'], message: '本國人需填寫發證日期' })
    }
    if (!data.id_issued_place) {
      ctx.addIssue({ code: 'custom', path: ['id_issued_place'], message: '本國人需填寫發證地點' })
    }
    if (!data.id_replacement_category) {
      ctx.addIssue({ code: 'custom', path: ['id_replacement_category'], message: '本國人需選擇領補換類別' })
    }
  }
})

export const step3Schema = z.object({
  contact_info: contactInfoSchema,
  merchant_owner_info: merchantOwnerInfoSchema,
})

// ================================================
// Step 4: 銀行資料
// ================================================

export const bankInfoSchema = z.object({
  bank_code: z.string().length(3, '銀行代碼須為 3 碼'),
  branch_code: z.string().length(4, '分行代碼須為 4 碼'),
  bank_account_name: z.string().min(1, '必填').max(32),
  bank_account_number: z.string().min(1, '必填').max(16),
})

export const step4Schema = z.object({
  bank_info: bankInfoSchema,
})

// ================================================
// Step 5: 支付方式
// ================================================

export const onlineCreditCardSchema = z.object({
  mcc_online: z.string().min(1, '必填').max(4),
  online_shop_url: z.string().url('請輸入有效的網址'),
  shop_description_online: z.string().min(1, '必填'),
  is_subscription_service: z.boolean().default(false),
})

export const offlineCreditCardSchema = z.object({
  mcc_offline: z.string().min(1, '必填').max(4),
  device_quantity: z.number().int().positive('數量必須大於 0'),
  shop_description_offline: z.string().min(1, '必填'),
})

export const cvscomSchema = z.object({
  shipper_name: z.string().min(1, '必填').max(10),
  shipper_phone: z.string().min(1, '必填').max(10),
  return_receiver_name: z.string().min(1, '必填').max(10),
  return_receiver_phone: z.string().min(1, '必填').max(10),
  return_receiver_postal_code: z.string().length(3, '郵遞區號須為 3 碼'),
  return_receiver_city: cityDistrictField,
  return_receiver_address: z.string().min(1, '必填').max(80),
  return_store_id: z.string().optional(),
  return_store_name: z.string().optional(),
  return_store_address: z.string().optional(),
})

export const step5Schema = z.object({
  payment_methods: z.array(
    z.enum(['ONLINE_CREDIT_CARD', 'OFFLINE_CREDIT_CARD', 'ATM', 'CVSCOM_C2C'])
  ).min(1, '至少選擇一種支付方式'),
  online_credit_card_info: onlineCreditCardSchema.optional(),
  offline_credit_card_info: offlineCreditCardSchema.optional(),
  cvscom_info: cvscomSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.payment_methods.includes('ONLINE_CREDIT_CARD') && !data.online_credit_card_info) {
    ctx.addIssue({ code: 'custom', path: ['online_credit_card_info'], message: '選擇線上信用卡需填寫相關資訊' })
  }
  if (data.payment_methods.includes('OFFLINE_CREDIT_CARD') && !data.offline_credit_card_info) {
    ctx.addIssue({ code: 'custom', path: ['offline_credit_card_info'], message: '選擇線下信用卡需填寫相關資訊' })
  }
  if (data.payment_methods.includes('CVSCOM_C2C') && !data.cvscom_info) {
    ctx.addIssue({ code: 'custom', path: ['cvscom_info'], message: '選擇超商取貨需填寫相關資訊' })
  }
})

// ================================================
// Step 6: 文件上傳 (File validation done client-side)
// ================================================

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return '僅支援 JPG、PNG、PDF 格式'
  }
  if (file.size > MAX_FILE_SIZE) {
    return '檔案大小不可超過 10MB'
  }
  return null
}

// ================================================
// Complete form schema
// ================================================

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
export type Step4Data = z.infer<typeof step4Schema>
export type Step5Data = z.infer<typeof step5Schema>
