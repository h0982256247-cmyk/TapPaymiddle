'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { isUploadedFile } from '@/types/merchant'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Loader2, Save, Send, AlertCircle, X, RotateCcw } from 'lucide-react'

const STEP_SCHEMAS = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, null]
const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6]
const TOTAL_STEPS = 6

// localStorage 鍵值
const LS_FORM_DATA = 'tappay_form_data'
const LS_FORM_STEP = 'tappay_form_step'

const DEFAULT_VALUES: Partial<OnboardingFormData> = {
  industry_code: 'NON_SPECIAL_INDUSTRY',
  payment_methods: [],
  company_info: { is_chain_store: false },
  merchant_owner_info: { is_foreigner: false },
  offline_credit_card_info: { device_quantity: 1 },
}

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
  platformSlug?: string
  platformName?: string
}

export function OnboardingForm({ initialData, initialStep = 1, merchantId, platformSlug, platformName }: OnboardingFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [hasSavedDraft, setHasSavedDraft] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentStepRef = useRef(currentStep)

  const methods = useForm<OnboardingFormData>({
    defaultValues: { ...DEFAULT_VALUES, ...initialData },
    mode: 'onTouched',
  })

  const { handleSubmit: rhfHandleSubmit, trigger, getValues, reset } = methods

  // 保持 ref 與 state 同步，供 auto-save interval 讀取
  useEffect(() => { currentStepRef.current = currentStep }, [currentStep])

  // ── 頁面載入：從 localStorage 恢復草稿 ──
  useEffect(() => {
    // 若有 prop 傳入的 initialData，優先使用（補件流程）
    if (initialData && Object.keys(initialData).length > 0) return

    try {
      const savedData = localStorage.getItem(LS_FORM_DATA)
      const savedStep = localStorage.getItem(LS_FORM_STEP)

      if (savedData) {
        const parsed = JSON.parse(savedData) as Partial<OnboardingFormData>
        reset({ ...DEFAULT_VALUES, ...parsed })
        setHasSavedDraft(true)

        if (savedStep) {
          const step = parseInt(savedStep, 10)
          if (step >= 1 && step <= TOTAL_STEPS) {
            setCurrentStep(step)
            // 標記已完成的步驟
            setCompletedSteps(Array.from({ length: step - 1 }, (_, i) => i + 1))
          }
        }

        toast('找到上次的草稿', {
          description: '已自動還原您之前填寫的資料',
          duration: 4000,
        })
      }
    } catch {
      // localStorage 資料損毀時靜默忽略
    }
  }, [])

  // ── 儲存到 localStorage（不打 DB）──
  const saveToLocalStorage = useCallback((showToast = true) => {
    try {
      const data = getValues()
      localStorage.setItem(LS_FORM_DATA, JSON.stringify(data))
      localStorage.setItem(LS_FORM_STEP, String(currentStepRef.current))
      setHasSavedDraft(true)
      if (showToast) toast.success('草稿已暫存到瀏覽器')
    } catch {
      if (showToast) toast.error('暫存失敗，請確認瀏覽器儲存空間')
    }
  }, [getValues])

  // ── 自動暫存：每 30 秒存一次 localStorage（不因換步驟重置計時器）──
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      saveToLocalStorage(false)
    }, 30000)
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, [saveToLocalStorage])

  // ── 清除所有草稿並重設表單 ──
  function handleReset() {
    localStorage.removeItem(LS_FORM_DATA)
    localStorage.removeItem(LS_FORM_STEP)
    reset({ ...DEFAULT_VALUES })
    setCurrentStep(1)
    setCompletedSteps([])
    setValidationErrors([])
    setHasSavedDraft(false)
    setShowResetConfirm(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success('已重新填寫，所有資料已清除')
  }

  async function handleNext() {
    if (isNavigating) return
    setIsNavigating(true)
    try {
      const schema = STEP_SCHEMAS[currentStep - 1]

      if (schema) {
        const currentData = getValues()
        const result = schema.safeParse(currentData)

        if (!result.success) {
          await trigger()
          const errors = extractZodErrors(result.error as Parameters<typeof extractZodErrors>[0])
          setValidationErrors(errors)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      }

      // 驗證通過：自動暫存當前進度
      saveToLocalStorage(false)
      setValidationErrors([])
      setCompletedSteps((prev) => [...new Set([...prev, currentStep])])
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsNavigating(false)
    }
  }

  function handleBack() {
    setValidationErrors([])
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleStepClick(step: number) {
    if (!completedSteps.includes(step) && step !== currentStep) return
    setValidationErrors([])
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(data: OnboardingFormData) {
    if (currentStep !== TOTAL_STEPS) return

    // 防呆：申請刷卡機時，實體商店照片至少 2 張
    if (data.payment_methods?.includes('OFFLINE_CREDIT_CARD')) {
      const docs = data.documents?.supporting_documents
      const count = Array.isArray(docs)
        ? docs.filter((f) => f instanceof File).length
        : docs instanceof File ? 1 : 0
      if (count < 2) {
        toast.error('實體商店照片至少需要上傳 2 張（含店面招牌、商品展示、售價照）')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    setSubmitting(true)
    try {
      // 文件已在選檔時即時上傳，此處只提取 Storage path
      const documentUrls: Record<string, string[]> = {}
      if (data.documents) {
        for (const [docType, fileOrFiles] of Object.entries(data.documents)) {
          if (!fileOrFiles) continue
          const fileArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]
          const paths = fileArray.filter(isUploadedFile).map(f => f.path)
          if (paths.length > 0) documentUrls[docType] = paths
        }
      }

      // 商品圖片已在選檔時即時上傳，提取路徑
      const productImagePaths: (string | null)[] = []
      if (data.online_credit_card_info?.use_shop_page && Array.isArray(data.shop_page_info?.products)) {
        for (const product of data.shop_page_info.products as Array<{ product_image?: unknown }>) {
          const img = product.product_image
          productImagePaths.push(isUploadedFile(img) ? img.path : null)
        }
      }

      // 選擇快速建立審查頁面時，將自動產生的 URL 補入 online_shop_url
      // （UI 只顯示預覽，未實際寫入表單欄位，需在送出前手動補值）
      if (data.online_credit_card_info?.use_shop_page && data.partner_account) {
        const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tap-paymiddle.vercel.app').replace(/\/$/, '')
        data.online_credit_card_info.online_shop_url = `${appBaseUrl}/shop/${data.partner_account}`
      }

      const response = await fetch('/api/submit-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          document_paths: documentUrls,
          merchant_id: merchantId,
          product_image_paths: productImagePaths,
          platform_slug: platformSlug,
        }),
      })

      const result = await response.json()

      // 帳號已存在：跳回第一步並在欄位顯示錯誤
      if (result.errorCode === 'ACCOUNT_EXISTS') {
        methods.setError('partner_account', { message: '此帳號已存在，請更換一個不同的帳號' })
        setCurrentStep(1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        toast.error('Partner Account 已存在，請更換後重新提交')
        return
      }

      if (!response.ok) throw new Error(result.error || '提交失敗')

      // 送出成功：清除草稿並導向狀態頁
      localStorage.removeItem(LS_FORM_DATA)
      localStorage.removeItem(LS_FORM_STEP)
      router.push(`/status?account=${data.partner_account}`)
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
                <p className="text-xs text-gray-400 mt-0.5">{platformName ? `${platformName} · ` : ''}完成申請以啟用 TapPay 金流服務</p>
              </div>

              <div className="flex items-center gap-2">
                {/* 一鍵重新 */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-gray-400 hover:text-red-500 h-8 text-xs gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重新填寫
                </Button>

                {/* 儲存草稿 */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => saveToLocalStorage(true)}
                  className="text-gray-500 h-8 text-xs gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {hasSavedDraft ? '更新草稿' : '儲存草稿'}
                </Button>
              </div>
            </div>
            <StepIndicator currentStep={currentStep} completedSteps={completedSteps} onStepClick={handleStepClick} />
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <form
            onSubmit={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault()
            }}
          >
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
                    type="button"
                    disabled={submitting}
                    onClick={() => rhfHandleSubmit(onSubmit)()}
                    className="h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 px-6"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" />提交申請</>}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isNavigating}
                    className="h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 px-6"
                  >
                    {isNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : <>下一步<ArrowRight className="w-4 h-4" /></>}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ── 驗證錯誤浮動視窗 ── */}
      {validationErrors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setValidationErrors([])}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setValidationErrors([])}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">請填寫必填欄位</h3>
                <p className="text-xs text-gray-400 mt-0.5">以下欄位尚未填寫或格式不正確</p>
              </div>
            </div>

            <ul className="space-y-2 mb-5">
              {validationErrors.map((err, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {err}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setValidationErrors([])}
              className="w-full h-10 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              返回填寫
            </button>
          </div>
        </div>
      )}

      {/* ── 重新填寫確認視窗 ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">確認重新填寫？</h3>
                <p className="text-xs text-gray-400 mt-0.5">所有已填寫的資料將被清除</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              包含暫存的草稿也會一併刪除，此操作無法復原。確定要從頭開始嗎？
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                確認重新填寫
              </button>
            </div>
          </div>
        </div>
      )}
    </FormProvider>
  )
}
