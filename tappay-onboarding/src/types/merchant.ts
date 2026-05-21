// ================================================
// TapPay Merchant Onboarding - Type Definitions
// ================================================

export type MerchantType = 'E' | 'P'

export type IndustryCode =
  | 'NON_SPECIAL_INDUSTRY'
  | 'TRAVEL_AGENCY'
  | 'CRAM_SCHOOL'
  | 'MEDICAL_CLINIC'

export type PaymentMethod =
  | 'ONLINE_CREDIT_CARD'
  | 'OFFLINE_CREDIT_CARD'
  | 'ATM'
  | 'CVSCOM_C2C'

export type MerchantStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_SUPPLEMENT'
  | 'SUPPLEMENTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISABLED'
  | 'MERCHANT_CREATED'

export type TapPayStatusCode = 1 | 4 | 5 | 6 | 7 | 8 | 9 | 16

export type DocumentType =
  | 'id_photo_front'
  | 'id_photo_back'
  | 'passbook_cover'
  | 'company_certificate_document'
  | 'manufacture_license'
  | 'member_certificate'
  | 'guarantee_document'
  | 'supporting_documents'
  | 'vat_number_notice'
  | 'beneficiary_declaration'
  | 'business_tax_return'
  | 'other_document'

// ================================================
// Database Row Types
// ================================================

export interface Merchant {
  id: string
  user_id: string | null
  platform_id?: string | null
  partner_account: string
  merchant_type: MerchantType | null
  industry_code: IndustryCode
  company_name: string | null
  company_name_english: string | null
  contact_email: string | null
  status: MerchantStatus
  partner_key: string | null
  tappay_status_code: TapPayStatusCode | null
  tappay_opinion: string | null
  is_complete: boolean
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export interface MerchantBasicInfo {
  id: string
  merchant_id: string
  register_info: RegisterInfo | null
  company_info: CompanyInfo
  contact_info: ContactInfo
  merchant_owner_info: MerchantOwnerInfo
  bank_info: BankInfo
  created_at: string
  updated_at: string
}

export interface MerchantPaymentMethod {
  id: string
  merchant_id: string
  payment_method: PaymentMethod
  payment_config: OnlineCreditCardConfig | OfflineCreditCardConfig | CvscomConfig | AtmConfig | null
  status: string
  merchant_id_ref: string | null
  created_at: string
  updated_at: string
}

export interface MerchantDocument {
  id: string
  merchant_id: string
  document_type: DocumentType
  file_path: string
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface MerchantNotifyLog {
  id: string
  merchant_id: string | null
  partner_account: string | null
  status_code: TapPayStatusCode | null
  status: string | null
  payment_method: string | null
  notify_payload: TapPayNotifyPayload
  processed_at: string
  created_at: string
}

export interface MerchantApiLog {
  id: string
  merchant_id: string | null
  partner_account: string | null
  api_name: string
  http_method: string
  endpoint: string | null
  request_payload: Record<string, unknown> | null
  response_payload: Record<string, unknown> | null
  response_status: number | null
  duration_ms: number | null
  is_success: boolean | null
  error_message: string | null
  created_at: string
}

export interface MerchantDraft {
  id: string
  merchant_id: string
  user_id: string
  draft_payload: Partial<OnboardingFormData>
  current_step: number
  updated_at: string
}

// ================================================
// TapPay API Payload Types
// ================================================

export interface RegisterInfo {
  vat_number: string
  register_name: string
  register_name_english: string
  register_postal_code: string
  register_city: string
  register_address: string
  is_prepaid_product: boolean | null
  company_capital: number | null
  company_establishment_date: string
}

export interface CompanyInfo {
  company_name: string
  company_name_english: string
  company_postal_code: string
  company_city: string
  company_address: string
  company_address_english?: string
  company_phone_area_code: string
  company_phone: string
  company_fax_area_code?: string
  company_fax?: string
  is_chain_store: boolean
  chain_store_type?: 'DIRECT' | 'FRANCHISE' | ''
}

export interface ContactInfo {
  business_contact_name: string
  business_contact_phone_area_code: string
  business_contact_phone: string
  accounting_contact_email: string
  accounting_contact_name?: string
  accounting_contact_phone_area_code?: string
  accounting_contact_phone?: string
  reserved_contact_email?: string
}

export interface MerchantOwnerInfo {
  is_foreigner: boolean
  sub_merchant_owner_name: string
  sub_merchant_owner_name_english: string
  sub_merchant_owner_id: string
  sub_merchant_owner_birthday: string
  id_issued_date?: string
  id_issued_place?: string
  id_replacement_category?: 'FIRST_ISSUED' | 'REISSUED' | 'REPLACED'
  sub_merchant_owner_postal_code: string
  sub_merchant_owner_city: string
  sub_merchant_owner_address: string
}

export interface BankInfo {
  bank_code: string
  branch_code: string
  bank_account_name: string
  bank_account_number: string
}

export interface OnlineCreditCardConfig {
  mcc_online: string
  online_shop_url: string
  shop_description_online: string
  is_subscription_service?: boolean
  use_shop_page?: boolean
}

export interface ProductItem {
  product_image?: File | null
  product_name: string
  product_price: number
  product_description: string
}

export interface ShopPageInfo {
  brand_name: string
  vat_number?: string
  products: ProductItem[]
  refund_policy: string
  service_phone: string
  service_email: string
}

export interface OfflineCreditCardConfig {
  mcc_offline: string
  device_quantity: number
  shop_description_offline: string
}

export interface CvscomConfig {
  shipper_name: string
  shipper_phone: string
  return_receiver_name: string
  return_receiver_phone: string
  return_receiver_postal_code: string
  return_receiver_city: string
  return_receiver_address: string
  return_store_id?: string
  return_store_name?: string
  return_store_address?: string
}

export interface AtmConfig {
  // ATM 無額外設定
}

// ================================================
// Notify API Payload
// ================================================

export interface TapPayNotifyPayload {
  partner_account: string
  company_name: string
  status_code: TapPayStatusCode
  status: string
  payment_method: string
  merchant_ids?: string[]
  merchant_id_to_tid?: Array<{ merchant_id: string; tid: string }> | null
  fee_domestic?: number | null
  fee_foreign?: number | null
  atm_rate?: number | null
  atm_min_fee?: number | null
  cvscom_c2c_rate?: number | null
  cvscom_c2c_min_fee?: number | null
  cvscom_c2c_delivery_seven_fee?: number | null
  cvscom_c2c_delivery_family_fee?: number | null
  cvscom_c2c_delivery_ok_fee?: number | null
  cvscom_c2c_delivery_hilife_fee?: number | null
}

// ================================================
// Form Data Type (Multi-step form)
// ================================================

export interface OnboardingFormData {
  // Step 1: 帳號 + 商家類型
  partner_account: string
  contact_email: string
  merchant_type: MerchantType
  industry_code: IndustryCode
  // vat_number for E type, id_number for P type
  vat_number?: string
  id_number?: string
  company_name?: string

  // Step 2: 商家基本資料 (company_info + register_info)
  register_info?: Partial<RegisterInfo>
  company_info: Partial<CompanyInfo>

  // Step 3: 聯絡人 + 負責人
  contact_info: Partial<ContactInfo>
  merchant_owner_info: Partial<MerchantOwnerInfo>

  // Step 4: 銀行資料
  bank_info: Partial<BankInfo>

  // Step 5: 支付方式
  payment_methods: PaymentMethod[]
  online_credit_card_info?: Partial<OnlineCreditCardConfig>
  offline_credit_card_info?: Partial<OfflineCreditCardConfig>
  cvscom_info?: Partial<CvscomConfig>
  shop_page_info?: Partial<ShopPageInfo>

  // Step 6: 文件上傳
  documents?: Partial<Record<DocumentType, File | null>>
}

// ================================================
// API Response Types
// ================================================

export interface TapPayApiResponse {
  status: number
  msg: string
  [key: string]: unknown
}

export interface CreatePartnerAccountResponse extends TapPayApiResponse {
  portal_account?: {
    account: string
    email: string
    partner_key: string
  }
}

export interface QueryStatusResponse extends TapPayApiResponse {
  platform_qualification_status?: Array<{
    partner_account: string
    company_name: string
    business_model: string
    payment_method: string
    status: string
    opinion: string
  }>
}

// ================================================
// Status Display Helper
// ================================================

export const STATUS_CONFIG: Record<MerchantStatus, { label: string; color: string; statusCode?: TapPayStatusCode }> = {
  DRAFT:              { label: '草稿', color: 'gray' },
  SUBMITTED:          { label: '已進件', color: 'blue', statusCode: 1 },
  PENDING_SUPPLEMENT: { label: '待補件', color: 'orange', statusCode: 4 },
  SUPPLEMENTED:       { label: '已補件', color: 'cyan', statusCode: 5 },
  UNDER_REVIEW:       { label: '審核中', color: 'purple', statusCode: 6 },
  APPROVED:           { label: '審核通過', color: 'green', statusCode: 7 },
  REJECTED:           { label: '審核不通過', color: 'red', statusCode: 8 },
  DISABLED:           { label: '已停用', color: 'gray', statusCode: 9 },
  MERCHANT_CREATED:   { label: '商代已建立', color: 'emerald', statusCode: 16 },
}

export const TAPPAY_STATUS_MAP: Record<TapPayStatusCode, MerchantStatus> = {
  1:  'SUBMITTED',
  4:  'PENDING_SUPPLEMENT',
  5:  'SUPPLEMENTED',
  6:  'UNDER_REVIEW',
  7:  'APPROVED',
  8:  'REJECTED',
  9:  'DISABLED',
  16: 'MERCHANT_CREATED',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ONLINE_CREDIT_CARD:  '線上信用卡',
  OFFLINE_CREDIT_CARD: '線下信用卡 (刷卡機)',
  ATM:                 'ATM 繳費',
  CVSCOM_C2C:          '超商取貨 (店到店)',
}

export const INDUSTRY_LABELS: Record<IndustryCode, string> = {
  NON_SPECIAL_INDUSTRY: '一般產業',
  TRAVEL_AGENCY:        '旅行社',
  CRAM_SCHOOL:          '補習班',
  MEDICAL_CLINIC:       '醫療院所',
}
