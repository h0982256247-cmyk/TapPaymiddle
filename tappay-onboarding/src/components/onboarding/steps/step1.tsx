'use client'

import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, User, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Step1Data } from '@/lib/schemas/onboarding'

const INDUSTRY_OPTIONS = [
  { value: 'NON_SPECIAL_INDUSTRY', label: '一般產業', desc: '一般商品或服務' },
  { value: 'TRAVEL_AGENCY', label: '旅行社', desc: '需提供旅業品保相關文件' },
  { value: 'CRAM_SCHOOL', label: '補習班', desc: '需提供品質保證書與履約保證' },
  { value: 'MEDICAL_CLINIC', label: '醫療院所', desc: '需提供執業執照' },
]

export function Step1() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<Step1Data>()

  const merchantType = watch('merchant_type')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">帳號資訊</h2>
        <p className="text-sm text-gray-500 mt-1">建立您的 TapPay 商戶帳號</p>
      </div>

      {/* Partner Account */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">帳號設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              商戶帳號 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="my-shop-account"
              className="h-10 rounded-xl"
              {...register('partner_account')}
            />
            {errors.partner_account && (
              <p className="text-xs text-red-500">{errors.partner_account.message}</p>
            )}
            <p className="text-xs text-gray-400">英文、數字、底線、連字號，4-32 字元</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              聯絡 Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="contact@company.com"
              className="h-10 rounded-xl"
              {...register('contact_email')}
            />
            {errors.contact_email && (
              <p className="text-xs text-red-500">{errors.contact_email.message}</p>
            )}
            <p className="text-xs text-gray-400">TapPay 審核通知將發送至此信箱</p>
          </div>
        </div>
      </div>

      {/* Merchant Type */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">商家類型</h3>
        <Controller
          name="merchant_type"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 法人 */}
              <button
                type="button"
                onClick={() => field.onChange('E')}
                className={cn(
                  'relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150',
                  field.value === 'E'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  field.value === 'E' ? 'bg-gray-900' : 'bg-gray-100'
                )}>
                  <Building2 className={cn('w-5 h-5', field.value === 'E' ? 'text-white' : 'text-gray-400')} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">法人商家</p>
                  <p className="text-xs text-gray-500 mt-0.5">公司行號、法人組織</p>
                  <p className="text-xs text-gray-400 mt-1">需填寫統一編號</p>
                </div>
                {field.value === 'E' && (
                  <div className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0 mt-1" />
                )}
              </button>

              {/* 自然人 */}
              <button
                type="button"
                onClick={() => field.onChange('P')}
                className={cn(
                  'relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150',
                  field.value === 'P'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  field.value === 'P' ? 'bg-gray-900' : 'bg-gray-100'
                )}>
                  <User className={cn('w-5 h-5', field.value === 'P' ? 'text-white' : 'text-gray-400')} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">自然人商家</p>
                  <p className="text-xs text-gray-500 mt-0.5">個人賣家、獨立工作者</p>
                  <p className="text-xs text-gray-400 mt-1">需填寫身分證號</p>
                </div>
                {field.value === 'P' && (
                  <div className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0 mt-1" />
                )}
              </button>
            </div>
          )}
        />
        {errors.merchant_type && (
          <p className="text-xs text-red-500">{errors.merchant_type.message}</p>
        )}
      </div>

      {/* Conditional fields based on merchant type */}
      {merchantType === 'E' && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">
            統一編號 <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="12345678"
            maxLength={8}
            className="h-10 rounded-xl max-w-xs"
            {...register('vat_number')}
          />
          {errors.vat_number && (
            <p className="text-xs text-red-500">{errors.vat_number.message}</p>
          )}
        </div>
      )}

      {merchantType === 'P' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              身分證號碼 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="A123456789"
              maxLength={10}
              className="h-10 rounded-xl"
              {...register('id_number')}
            />
            {errors.id_number && (
              <p className="text-xs text-red-500">{errors.id_number.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              對外營業名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="王小明設計師"
              className="h-10 rounded-xl"
              {...register('company_name')}
            />
            {errors.company_name && (
              <p className="text-xs text-red-500">{errors.company_name.message}</p>
            )}
            <p className="text-xs text-gray-400">持卡人對帳單顯示名稱，勿填寫個人姓名</p>
          </div>
        </div>
      )}

      {/* Industry Code */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">產業類別</h3>
        <Controller
          name="industry_code"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {INDUSTRY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150',
                    field.value === option.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    field.value === option.value ? 'bg-gray-900' : 'bg-gray-300'
                  )} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{option.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        />

        {/* Special industry notice */}
        {['TRAVEL_AGENCY', 'CRAM_SCHOOL', 'MEDICAL_CLINIC'].includes(watch('industry_code') || '') && (
          <div className="flex gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              特許產業需在文件上傳步驟提供相關佐證文件，審核時間可能較長。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
