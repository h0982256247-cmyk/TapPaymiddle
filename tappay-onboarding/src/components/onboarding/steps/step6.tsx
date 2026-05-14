'use client'

import { useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { FileUpload } from '@/components/onboarding/file-upload'
import { Info, CheckCircle2 } from 'lucide-react'
import type { OnboardingFormData, DocumentType, IndustryCode } from '@/types/merchant'

interface DocumentConfig {
  key: DocumentType
  label: string
  description?: string
  required: boolean
  multiple?: boolean
  condition?: (data: OnboardingFormData) => boolean
}

const DOCUMENT_CONFIGS: DocumentConfig[] = [
  {
    key: 'id_photo_front',
    label: '身分證正面',
    description: '支援 JPG、PNG',
    required: true,
  },
  {
    key: 'id_photo_back',
    label: '身分證背面',
    description: '支援 JPG、PNG',
    required: true,
  },
  {
    key: 'passbook_cover',
    label: '存摺封面',
    description: '支援 JPG、PNG、PDF',
    required: true,
  },
  {
    key: 'company_certificate_document',
    label: '公司證明文件',
    description: '股份公司：變更事項登記表；獨資：商業登記抄本；法人：法人登記證',
    required: true,
    multiple: true,
    condition: (data) => data.merchant_type === 'E',
  },
  {
    key: 'manufacture_license',
    label: '特許產業佐證文件(1)',
    description: '旅行社：旅業品保協會會員證明；補習班：品質保證書；醫療：執業執照',
    required: true,
    condition: (data) =>
      ['TRAVEL_AGENCY', 'CRAM_SCHOOL', 'MEDICAL_CLINIC'].includes(data.industry_code as string),
  },
  {
    key: 'member_certificate',
    label: '特許產業佐證文件(2)',
    description: '旅行社/補習班：金融機構履約保證',
    required: true,
    condition: (data) =>
      ['TRAVEL_AGENCY', 'CRAM_SCHOOL'].includes(data.industry_code as string),
  },
  {
    key: 'supporting_documents',
    label: '實體商店照片',
    description: '實體/線上+線下商家，至少 2 張至多 10 張',
    required: false,
    multiple: true,
  },
  {
    key: 'vat_number_notice',
    label: '統一編號編配書',
    description: '非公司行號請主動提供',
    required: false,
  },
  {
    key: 'beneficiary_declaration',
    label: '實質受益人聲明書',
    description: '合資/非上市上櫃商家請提供',
    required: false,
  },
  {
    key: 'business_tax_return',
    label: '401/403 報表',
    description: '選填',
    required: false,
  },
  {
    key: 'other_document',
    label: '其他補充文件',
    description: '最多 2 個，選填',
    required: false,
    multiple: true,
  },
]

export function Step6() {
  const { control, watch } = useFormContext<OnboardingFormData>()
  const formData = watch()

  const visibleDocs = DOCUMENT_CONFIGS.filter(
    (doc) => !doc.condition || doc.condition(formData)
  )

  const requiredDocs = visibleDocs.filter((d) => d.required)
  const optionalDocs = visibleDocs.filter((d) => !d.required)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">文件上傳</h2>
        <p className="text-sm text-gray-500 mt-1">上傳進件所需的徵審資料</p>
      </div>

      <div className="flex gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-100">
        <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-800">文件說明</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            所有文件支援 JPG、PNG、PDF 格式，單檔最大 10MB。
            文件審核通常需要 7-10 個工作天，請確保資料清晰可辨。
          </p>
        </div>
      </div>

      {/* Required Documents */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
          必填文件
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredDocs.map((doc) => (
            <Controller
              key={doc.key}
              name={`documents.${doc.key}` as keyof OnboardingFormData}
              control={control}
              render={({ field, fieldState }) => (
                <FileUpload
                  label={doc.label}
                  description={doc.description}
                  required={doc.required}
                  multiple={doc.multiple}
                  value={field.value as File | File[] | null}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          ))}
        </div>
      </section>

      {/* Optional Documents */}
      {optionalDocs.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
            選填文件
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalDocs.map((doc) => (
              <Controller
                key={doc.key}
                name={`documents.${doc.key}` as keyof OnboardingFormData}
                control={control}
                render={({ field, fieldState }) => (
                  <FileUpload
                    label={doc.label}
                    description={doc.description}
                    required={false}
                    multiple={doc.multiple}
                    value={field.value as File | File[] | null}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completion notice */}
      <div className="flex gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-800">上傳完成後即可提交申請</p>
          <p className="text-xs text-green-700 mt-1">
            所有資料將以加密方式傳輸至 TapPay，審核結果會以 Email 通知。
          </p>
        </div>
      </div>
    </div>
  )
}
