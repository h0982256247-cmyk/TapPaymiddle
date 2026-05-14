'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { StepIndicator } from './step-indicator'
import { Step1 } from './steps/step1'
import { Step2 } from './steps/step2'
import { Step3 } from './steps/step3'
import { Step4 } from './steps/step4'
import { Step5 } from './steps/step5'
import { Step6 } from './steps/step6'
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
} from '@/lib/schemas/onboarding'
import type { OnboardingFormData } from '@/types/merchant'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Loader2, Save, Send, AlertCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STEP_SCHEMAS = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, null]
const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6]
const TOTAL_STEPS = 6

// 欄位名稱對照表（顯示中文）
const FIELD_LABELS: Record<string, string> = {
  partner_account: '合作帳號',
  contact_email: '聯絡 Email',
  merchant_type: '商家類型',
  vat_number: '統一編號',
  id_number: '身分證號碼',
  company_name: '對外營業名稱',
  'register_info.vat_number': '統編',
  'register_info.register_name': '公司登記名稱',
  'register_info.register_name_english': '英文公司名稱',
  'register_info.register_postal_code': '登記郵遞區號',
  'register_info.register_city': '登記城市',
  'register_info.register_address': '登記地址',
  'register_info.company_capital': '資本額',
  'register_info.company_establishment_date': '公司設立日期',
  'company_info.company_name': '公司名稱',
  'company_info.company_name_english': '英文公司名稱',
  'company_info.company_postal_code': '公司郵遞區號',
  'company_info.company_city': '公司城市',
  'company_info.company_address': '公司地址',
  'company_info.company_phone_area_code': '電話區碼',
  'company_info.company_phone': '公司電話',
  'company_info.chain_store_type': '連鎖店類型',
  'contact_info.business_contact_name': '業務聯絡人姓名',
  'contact_info.business_contact_phone_area_code': '業務電話區碼',
  'contact_info.business_contact_phone': '業務聯絡電話',
  'contact_info.accounting_contact_email': '財務聯絡 Email',
  'merchant_owner_info.sub_merchant_owner_name': '負責人姓名',
  'merchant_owner_info.sub_merchant_owner_name_english': '負責人英文姓名',
  'merchant_owner_info.sub_merchant_owner_id': '負責人身分證',
  'merchant_owner_info.sub_merchant_owner_birthday': '負責人生日',
  'merchant_owner_info.sub_merchant_owner_postal_code': '負責人郵遞區號',
  'merchant_owner_info.sub_merchant_owner_city': '負責人城市',
  'merchant_owner_info.sub_merchant_owner_address': '負責人地址',
  'merchant_owner_info.id_issued_date': '身分證發證日期',
  'merchant_owner_info.id_issued_place': '身分證發證地點',
  'merchant_owner_info.id_replacement_category': '領補換類別',
  'bank_info.bank_code': '銀行代碼',
  'bank_info.branch_code': '分行代碼',
  'bank_info.bank_account_name': '帳戶名稱',
  'bank_info.bank_account_number': '帳號',
  payment_methods: '支付方式',
  'online_credit_card_info.mcc_online': '線上刷卡 MCC',
  'online_credit_card_info.online_shop_url': '購物網址',
  'online_credit_card_info.shop_description_online': '線上商店說明',
  'offline_credit_card_info.mcc_offline': '實體刷卡 MCC',
  'offline_credit_card_info.device_quantity': '刷卡機數量',
  'offline_credit_card_info.shop_description_offline': '實體商店說明',
}

function extractZodErrors(error: { issues?: Array<{ path: (string | number)[]; message: string }> }): string[] {
  if (!error.issues) return []
  const seen = new Set<string>()
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.')
      const label = FIELD_LABELS[path] ?? path
      const msg = `${label}：${issue.message}`
      if (seen.has(msg)) return null
      seen.add(msg)
      return msg
    })
    .filter((m): m is string => m !== null)
}

interface OnboardingFormProps {
  initialData?: Partial<OnboardingFormData>
  initialStep?: number
  merchantId?: string
}

const DRAFT_STORAGE_KEY = 'tappay_draft_merchant_id'

export function OnboardingForm({ initialData, initialStep = 1, merchantId }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  // 優先使用 prop 傳入的 merchantId，其次從 localStorage 恢復
  const [currentMerchantId, setCurrentMerchantId] = useState<string | undefined>(
    merchantId ?? (typeof window !== 'undefined' ? (localStorage.getItem(DRAFT_STORAGE_KEY) ?? undefined) : undefined)
  )
  const router = useRouter()
  const supabase = createClient()

  const methods = useForm<OnboardingFormData>({
    defaultValues: {
      industry_code: 'NON_SPECIAL_INDUSTRY',
      payment_methods: [],
      company_info: { is_chain_store: false },
      merchant_owner_info: { is_foreigner: false },
      ...initialData,
    },
    mode: 'onTouched',
  })

  const { handleSubmit, trigger, getValues } = methods

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [currentStep, currentMerchantId])

  async function saveDraft(showToast = true) {
    setSavingDraft(true)
    try {
      const data = getValues()
      const response = await fetch('/api/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: currentMerchantId,
          draft_payload: data,
          current_step: currentStep,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // 若是第一次建立，記下新的 merchant_id 並存入 localStorage
        if (result.merchant_id && !currentMerchantId) {
          setCurrentMerchantId(result.merchant_id)
          localStorage.setItem(DRAFT_STORAGE_KEY, result.merchant_id)
        }
        if (showToast) toast.success('草稿已儲存')
      }
    } catch {
      if (showToast) toast.error('儲存草稿失敗')
    } finally {
      setSavingDraft(false)
    }
  }

  async function handleNext() {
    const schema = STEP_SCHEMAS[currentStep - 1]

    if (schema) {
      const currentData = getValues()
      const result = schema.safeParse(currentData)

      if (!result.success) {
        // 觸發 inline 錯誤
        await trigger()
        // 同時顯示浮動視窗
        const errors = extractZodErrors(result.error as Parameters<typeof extractZodErrors>[0])
        setValidationErrors(errors)
        // 滾動到頁面頂部讓使用者看到
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    setValidationErrors([])
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])])
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setValidationErrors([])
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(data: OnboardingFormData) {
    setSubmitting(true)
    try {
      const documentUrls: Record<string, string[]> = {}
      if (data.documents) {
        for (const [docType, files] of Object.entries(data.documents)) {
          if (!files) continue
          const fileArray = Array.isArray(files) ? files : [files]
          const urls: string[] = []

          for (const file of fileArray) {
            const partnerAccount = data.partner_account ?? `anon_${Date.now()}`
            const filePath = `${partnerAccount}/${Date.now()}_${file.name}`
            const { error } = await supabase.storage
              .from('merchant-documents')
              .upload(filePath, file, { upsert: true })

            if (error) throw error
            urls.push(filePath)
          }
          documentUrls[docType] = urls
        }
      }

      const response = await fetch('/api/submit-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          document_paths: documentUrls,
          merchant_id: currentMerchantId,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || '提交失敗')

      // 送出成功後清除草稿紀錄
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      toast.success('申請已成功提交！TapPay 將於 7-10 個工作天內完成審核。')
      router.push(`/onboarding/status?account=${encodeURIComponent(data.partner_account)}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '提交失敗，請稍後再試'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const StepComponent = STEP_COMPONENTS[currentStep - 1]
  const isLastStep = currentStep === TOTAL_STEPS

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-base font-semibold text-gray-900">TapPay 商戶進件申請</h1>
                <p className="text-xs text-gray-400 mt-0.5">完成申請以啟用 TapPay 金流服務</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => saveDraft(true)}
                disabled={savingDraft}
                className="text-gray-500 h-8 text-xs gap-1.5"
              >
                {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                儲存草稿
              </Button>
            </div>
            <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <StepComponent />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="h-10 rounded-xl border-gray-200 text-gray-600 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                上一步
              </Button>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{currentStep} / {TOTAL_STEPS}</span>
                {isLastStep ? (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 px-6"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" />提交申請</>}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 px-6"
                  >
                    下一步
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 驗證錯誤浮動視窗 */}
      {validationErrors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setValidationErrors([])}
          />
          {/* 視窗 */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* 關閉按鈕 */}
            <button
              onClick={() => setValidationErrors([])}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* 標題 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">請填寫必填欄位</h3>
                <p className="text-xs text-gray-400 mt-0.5">以下欄位尚未填寫或格式不正確</p>
              </div>
            </div>

            {/* 錯誤列表 */}
            <ul className="space-y-2 mb-5">
              {validationErrors.map((err, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {err}
                </li>
              ))}
            </ul>

            {/* 確認按鈕 */}
            <button
              onClick={() => setValidationErrors([])}
              className="w-full h-10 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              返回填寫
            </button>
          </div>
        </div>
      )}
    </FormProvider>
  )
}
