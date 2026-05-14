'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Info } from 'lucide-react'
import type { OnboardingFormData } from '@/types/merchant'

export function Step4() {
  const {
    register,
    formState: { errors },
  } = useFormContext<OnboardingFormData>()

  const bankErrors = (errors.bank_info as Record<string, { message?: string }> | undefined) ?? {}

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">銀行撥款資料</h2>
        <p className="text-sm text-gray-500 mt-1">TapPay 撥款時使用的銀行帳戶</p>
      </div>

      {/* Security notice */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
        <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-800">資料安全保護</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            您的銀行帳號資訊以加密方式傳輸並儲存，僅用於 TapPay 金流撥款用途，不會用於任何其他用途。
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
          銀行帳戶資訊
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              金融機構代碼 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="004"
              maxLength={3}
              className="h-10 rounded-xl"
              {...register('bank_info.bank_code')}
            />
            {bankErrors.bank_code && <p className="text-xs text-red-500">{bankErrors.bank_code.message}</p>}
            <p className="text-xs text-gray-400">3 碼銀行代碼，例：004（台灣銀行）</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              分行代碼 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="0151"
              maxLength={4}
              className="h-10 rounded-xl"
              {...register('bank_info.branch_code')}
            />
            {bankErrors.branch_code && <p className="text-xs text-red-500">{bankErrors.branch_code.message}</p>}
            <p className="text-xs text-gray-400">4 碼分行代碼</p>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">
              帳戶戶名 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="王小明 / XX 有限公司"
              className="h-10 rounded-xl"
              {...register('bank_info.bank_account_name')}
            />
            {bankErrors.bank_account_name && <p className="text-xs text-red-500">{bankErrors.bank_account_name.message}</p>}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">
              銀行帳號 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="1234567890123456"
              maxLength={16}
              className="h-10 rounded-xl font-mono tracking-wider"
              {...register('bank_info.bank_account_number')}
            />
            {bankErrors.bank_account_number && <p className="text-xs text-red-500">{bankErrors.bank_account_number.message}</p>}
          </div>
        </div>
      </section>

      <div className="flex gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
        <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          請確認帳戶戶名與商家負責人姓名或公司名稱一致，並在文件上傳步驟提供存摺封面照片。
        </p>
      </div>
    </div>
  )
}
