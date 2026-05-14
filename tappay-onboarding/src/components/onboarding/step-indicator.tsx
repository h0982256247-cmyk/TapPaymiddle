import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  number: number
  label: string
  description?: string
}

const STEPS: Step[] = [
  { number: 1, label: '帳號資訊', description: '商家類型' },
  { number: 2, label: '商家資料', description: '公司基本資訊' },
  { number: 3, label: '聯絡 & 負責人', description: '聯絡人資訊' },
  { number: 4, label: '銀行資料', description: '撥款帳戶' },
  { number: 5, label: '支付方式', description: '申請服務' },
  { number: 6, label: '文件上傳', description: '徵審資料' },
]

interface StepIndicatorProps {
  currentStep: number
  completedSteps: number[]
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Mobile: progress bar */}
      <div className="flex md:hidden items-center justify-between mb-6">
        <span className="text-sm text-gray-500">步驟 {currentStep} / {STEPS.length}</span>
        <span className="text-sm font-medium text-gray-900">{STEPS[currentStep - 1]?.label}</span>
      </div>

      {/* Desktop: step list */}
      <div className="hidden md:flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number)
          const isCurrent = step.number === currentStep
          const isUpcoming = step.number > currentStep && !isCompleted

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 border-2',
                    isCompleted && 'bg-gray-900 border-gray-900 text-white',
                    isCurrent && 'bg-white border-gray-900 text-gray-900',
                    isUpcoming && 'bg-white border-gray-200 text-gray-300'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <div className="mt-1.5 text-center min-w-[72px]">
                  <p className={cn(
                    'text-xs font-medium leading-tight',
                    isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-600' : 'text-gray-300'
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-px mx-3 mb-5 transition-colors duration-200',
                  completedSteps.includes(step.number) ? 'bg-gray-900' : 'bg-gray-200'
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: compact steps */}
      <div className="flex md:hidden gap-1 mb-2">
        {STEPS.map((step) => {
          const isCompleted = completedSteps.includes(step.number)
          const isCurrent = step.number === currentStep
          return (
            <div
              key={step.number}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                isCompleted ? 'bg-gray-900' : isCurrent ? 'bg-gray-400' : 'bg-gray-200'
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
