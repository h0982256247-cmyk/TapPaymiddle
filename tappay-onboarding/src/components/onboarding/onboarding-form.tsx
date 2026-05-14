'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { ArrowLeft, ArrowRight, Loader2, Save, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STEP_SCHEMAS = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, null]
const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6]
const TOTAL_STEPS = 6

interface OnboardingFormProps {
  initialData?: Partial<OnboardingFormData>
  initialStep?: number
  merchantId?: string
}

export function OnboardingForm({ initialData, initialStep = 1, merchantId }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const methods = useForm<OnboardingFormData>({
    defaultValues: {
      industry_code: 'NON_SPECIAL_INDUSTRY',
      payment_methods: [],
      company_info: {
        is_chain_store: false,
      },
      merchant_owner_info: {
        is_foreigner: false,
      },
      ...initialData,
    },
    mode: 'onTouched',
  })

  const { handleSubmit, trigger, getValues, watch } = methods

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [currentStep])

  async function saveDraft(showToast = true) {
    setSavingDraft(true)
    try {
      const data = getValues()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          draft_payload: data,
          current_step: currentStep,
        }),
      })

      if (response.ok && showToast) {
        toast.success('草稿已儲存')
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
        await trigger()
        return
      }
    }

    setCompletedSteps((prev) => [...new Set([...prev, currentStep])])
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(data: OnboardingFormData) {
    setSubmitting(true)
    try {
      // Upload documents first
      const documentUrls: Record<string, string[]> = {}
      if (data.documents) {
        for (const [docType, files] of Object.entries(data.documents)) {
          if (!files) continue
          const fileArray = Array.isArray(files) ? files : [files]
          const urls: string[] = []

          for (const file of fileArray) {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('未登入')

            const filePath = `${user.id}/${Date.now()}_${file.name}`
            const { error } = await supabase.storage
              .from('merchant-documents')
              .upload(filePath, file, { upsert: true })

            if (error) throw error
            urls.push(filePath)
          }
          documentUrls[docType] = urls
        }
      }

      // Submit to Edge Functions
      const response = await fetch('/api/submit-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          document_paths: documentUrls,
          merchant_id: merchantId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '提交失敗')
      }

      toast.success('申請已成功提交！TapPay 將於 7-10 個工作天內完成審核。')
      router.push('/onboarding/status')
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
                {savingDraft ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
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
                <span className="text-sm text-gray-400">
                  {currentStep} / {TOTAL_STEPS}
                </span>

                {isLastStep ? (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 px-6"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        提交申請
                      </>
                    )}
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
    </FormProvider>
  )
}
