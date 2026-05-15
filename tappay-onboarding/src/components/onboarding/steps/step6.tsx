'use client'

import { useFormContext, Controller } from 'react-hook-form'
import { FileUpload } from '@/components/onboarding/file-upload'
import { Info, CheckCircle2 } from 'lucide-react'
import type { OnboardingFormData, DocumentType } from '@/types/merchant'

interface DocumentConfig {
  key: DocumentType
  label: string
  /** 短格式提示，顯示於標題右側（如 "JPG · PNG"） */
  hint?: string
  /** 較長說明，顯示於標題下方 */
  description?: string
  /** 靜態必填 */
  required: boolean
  /** 動態必填判斷，優先於 required */
  requiredCondition?: (data: Partial<OnboardingFormData>) => boolean
  multiple?: boolean
  /** 需佔滿整行 */
  wide?: boolean
  /** 顯示條件 */
  condition?: (data: Partial<OnboardingFormData>) => boolean
}

const DOCUMENT_CONFIGS: DocumentConfig[] = [
  // ── 基本必填 ──────────────────────────────────
  {
    key: 'id_photo_front',
    label: '身分證正面',
    hint: 'JPG · PNG',
    required: true,
  },
  {
    key: 'id_photo_back',
    label: '身分證背面',
    hint: 'JPG · PNG',
    required: true,
  },
  {
    key: 'passbook_cover',
    label: '存摺封面',
    hint: 'JPG · PNG · PDF',
    required: true,
  },
  // ── 法人 ──────────────────────────────────────
  {
    key: 'company_certificate_document',
    label: '公司證明文件',
    hint: '可上傳多份',
    description: '股份公司 → 變更事項登記表　獨資 → 商業登記抄本　法人 → 法人登記證',
    required: true,
    multiple: true,
    wide: true,
    condition: (data) => data.merchant_type === 'E',
  },
  // ── 特許產業 ───────────────────────────────────
  {
    key: 'manufacture_license',
    label: '特許產業佐證文件 (1)',
    description: '旅行社 → 旅業品保協會會員證明　補習班 → 品質保證書　醫療院所 → 執業執照',
    required: true,
    wide: true,
    condition: (data) =>
      ['TRAVEL_AGENCY', 'CRAM_SCHOOL', 'MEDICAL_CLINIC'].includes(data.industry_code as string),
  },
  {
    key: 'member_certificate',
    label: '特許產業佐證文件 (2)',
    description: '旅行社、補習班 → 金融機構履約保證',
    required: true,
    wide: true,
    condition: (data) =>
      ['TRAVEL_AGENCY', 'CRAM_SCHOOL'].includes(data.industry_code as string),
  },
  // ── 實體店面照片（線下刷卡機時必填）───────────
  {
    key: 'supporting_documents',
    label: '實體商店照片',
    hint: '至少 2 張',
    description: '含店面外觀及收銀台',
    required: false,
    multiple: true,
    requiredCondition: (data) =>
      (data.payment_methods as string[] | undefined)?.includes('OFFLINE_CREDIT_CARD') ?? false,
  },
  // ── 選填 ──────────────────────────────────────
  {
    key: 'vat_number_notice',
    label: '統一編號編配書',
    hint: '選填',
    description: '非公司行號請主動提供',
    required: false,
  },
  {
    key: 'beneficiary_declaration',
    label: '實質受益人聲明書',
    hint: '選填',
    description: '合資或非上市上櫃商家請提供',
    required: false,
  },
  {
    key: 'business_tax_return',
    label: '401 / 403 報表',
    hint: '選填',
    required: false,
  },
  {
    key: 'other_document',
    label: '其他補充文件',
    hint: '最多 2 份',
    required: false,
    multiple: true,
  },
]

export function Step6() {
  const { control, watch } = useFormContext<OnboardingFormData>()

  const merchantType = watch('merchant_type')
  const industryCode = watch('industry_code')
  const paymentMethods = watch('payment_methods')

  const conditionData: Partial<OnboardingFormData> = {
    merchant_type: merchantType,
    industry_code: industryCode,
    payment_methods: paymentMethods,
  }

  // 取得動態必填狀態
  const getRequired = (doc: DocumentConfig) =>
    doc.requiredCondition ? doc.requiredCondition(conditionData) : doc.required

  // 過濾可見文件
  const visibleDocs = DOCUMENT_CONFIGS.filter(
    (doc) => !doc.condition || doc.condition(conditionData)
  )

  const requiredDocs = visibleDocs.filter(getRequired)
  const optionalDocs = visibleDocs.filter((d) => !getRequired(d))

  // 是否有刷卡機（顯示提示）
  const hasOfflineCC = (paymentMethods as string[] | undefined)?.includes('OFFLINE_CREDIT_CARD') ?? false

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">文件上傳</h2>
        <p className="text-sm text-gray-500 mt-1">JPG、PNG、PDF，單檔上限 10MB，審核約 7–10 個工作天</p>
      </div>

      {/* 線下刷卡機提示 */}
      {hasOfflineCC && (
        <div className="flex gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">申請刷卡機需提供實體商店照片（必填）</p>
        </div>
      )}

      {/* 必填文件 */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1.5">
          必填文件
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiredDocs.map((doc) => (
            <div key={doc.key} className={doc.wide ? 'md:col-span-2' : ''}>
              <Controller
                name={`documents.${doc.key}` as keyof OnboardingFormData}
                control={control}
                render={({ field, fieldState }) => (
                  <FileUpload
                    label={doc.label}
                    hint={doc.hint}
                    description={doc.description}
                    required={getRequired(doc)}
                    multiple={doc.multiple}
                    value={field.value as File | File[] | null}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 選填文件 */}
      {optionalDocs.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1.5">
            選填文件
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optionalDocs.map((doc) => (
              <div key={doc.key} className={doc.wide ? 'md:col-span-2' : ''}>
                <Controller
                  name={`documents.${doc.key}` as keyof OnboardingFormData}
                  control={control}
                  render={({ field, fieldState }) => (
                    <FileUpload
                      label={doc.label}
                      hint={doc.hint}
                      description={doc.description}
                      required={false}
                      multiple={doc.multiple}
                      value={field.value as File | File[] | null}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 送出提示 */}
      <div className="flex gap-2.5 p-3.5 rounded-xl bg-green-50 border border-green-100">
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-green-700 leading-relaxed">
          所有文件填寫完畢後，點擊「提交申請」，資料將以加密方式傳輸至 TapPay。
        </p>
      </div>
    </div>
  )
}
