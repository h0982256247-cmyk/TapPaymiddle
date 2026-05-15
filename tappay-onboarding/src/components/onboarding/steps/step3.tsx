'use client'

import { useEffect } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { CityDistrictSelect } from '../city-district-select'
import type { OnboardingFormData } from '@/types/merchant'

const ID_REPLACEMENT_OPTIONS = [
  { value: 'FIRST_ISSUED', label: '初發' },
  { value: 'REISSUED', label: '補發' },
  { value: 'REPLACED', label: '換發' },
]

export function Step3() {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<OnboardingFormData>()

  const isForeigner = watch('merchant_owner_info.is_foreigner')
  const contactErrors = (errors.contact_info as Record<string, { message?: string }> | undefined) ?? {}
  const ownerErrors = (errors.merchant_owner_info as Record<string, { message?: string }> | undefined) ?? {}

  // 從 Step 2 公司電話自動帶入業務聯絡電話
  const companyPhoneAreaCode = watch('company_info.company_phone_area_code')
  const companyPhone = watch('company_info.company_phone')

  useEffect(() => {
    if (companyPhoneAreaCode) {
      setValue('contact_info.business_contact_phone_area_code', companyPhoneAreaCode, { shouldValidate: false })
    }
    if (companyPhone) {
      setValue('contact_info.business_contact_phone', companyPhone, { shouldValidate: false })
    }
  }, [companyPhoneAreaCode, companyPhone, setValue])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">聯絡人與負責人資訊</h2>
        <p className="text-sm text-gray-500 mt-1">業務聯絡人及商家負責人資料</p>
      </div>

      {/* Contact Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
          業務聯絡人
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">聯絡人姓名 <span className="text-red-500">*</span></Label>
            <Input placeholder="王小明" className="h-10 rounded-xl max-w-xs" {...register('contact_info.business_contact_name')} />
            {contactErrors.business_contact_name && <p className="text-xs text-red-500">{contactErrors.business_contact_name.message}</p>}
          </div>
          {/* 電話自動帶入自 Step 2，完全隱藏 */}
          <input type="hidden" {...register('contact_info.business_contact_phone_area_code')} />
          <input type="hidden" {...register('contact_info.business_contact_phone')} />
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">帳務聯絡人 Email <span className="text-red-500">*</span></Label>
            <Input type="email" placeholder="accounting@company.com" className="h-10 rounded-xl" {...register('contact_info.accounting_contact_email')} />
            {contactErrors.accounting_contact_email && <p className="text-xs text-red-500">{contactErrors.accounting_contact_email.message}</p>}
            <p className="text-xs text-gray-400">TapPay 金流手續費電子發票將寄至此信箱</p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">爭議款聯絡信箱</Label>
            <Input type="email" placeholder="dispute@company.com（選填）" className="h-10 rounded-xl" {...register('contact_info.reserved_contact_email')} />
            <p className="text-xs text-gray-400">未填寫時發生爭議款將通知帳務聯絡人信箱</p>
          </div>
        </div>
      </section>

      {/* Merchant Owner Info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
          商家負責人
        </h3>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">負責人是否為外籍人士 <span className="text-red-500">*</span></Label>
          <Controller
            name="merchant_owner_info.is_foreigner"
            control={control}
            render={({ field }) => (
              <div className="flex gap-3">
                {[{ value: false, label: '本國人' }, { value: true, label: '外籍人士' }].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`px-6 py-2 rounded-xl border text-sm font-medium transition-all
                      ${field.value === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">負責人姓名 <span className="text-red-500">*</span></Label>
            <Input placeholder="王小明" className="h-10 rounded-xl" {...register('merchant_owner_info.sub_merchant_owner_name')} />
            {ownerErrors.sub_merchant_owner_name && <p className="text-xs text-red-500">{ownerErrors.sub_merchant_owner_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">英文姓名 <span className="text-red-500">*</span></Label>
            <Input placeholder="Wang Xiao Ming" className="h-10 rounded-xl" {...register('merchant_owner_info.sub_merchant_owner_name_english')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {isForeigner ? '居留證號碼' : '身分證號碼'} <span className="text-red-500">*</span>
            </Label>
            <Input placeholder={isForeigner ? 'A12345678910' : 'A123456789'} maxLength={10} className="h-10 rounded-xl" {...register('merchant_owner_info.sub_merchant_owner_id')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">生日 <span className="text-red-500">*</span></Label>
            <Controller
              name="merchant_owner_info.sub_merchant_owner_birthday"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  format="gregorian8"
                  placeholder="請選擇負責人生日"
                  maxDate={new Date()}
                  minDate={new Date(1900, 0, 1)}
                  error={!!ownerErrors.sub_merchant_owner_birthday}
                />
              )}
            />
            {ownerErrors.sub_merchant_owner_birthday && <p className="text-xs text-red-500">{ownerErrors.sub_merchant_owner_birthday.message}</p>}
          </div>

          {/* 本國人身分證欄位 */}
          {!isForeigner && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">身分證發證日期 <span className="text-red-500">*</span></Label>
                <Controller
                  name="merchant_owner_info.id_issued_date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      format="roc7"
                      placeholder="請選擇發證日期"
                      maxDate={new Date()}
                      minDate={new Date(1945, 0, 1)}
                      error={!!ownerErrors.id_issued_date}
                    />
                  )}
                />
                {ownerErrors.id_issued_date && <p className="text-xs text-red-500">{ownerErrors.id_issued_date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">發證地點 <span className="text-red-500">*</span></Label>
                <select
                  className="h-10 w-full appearance-none rounded-xl border border-input bg-background pl-3 pr-8 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50"
                  {...register('merchant_owner_info.id_issued_place')}
                >
                  <option value="">請選擇</option>
                  <option value="北市">北市</option>
                  <option value="新北市">新北市</option>
                  <option value="基市">基市</option>
                  <option value="桃市">桃市</option>
                  <option value="竹市">竹市</option>
                  <option value="竹縣">竹縣</option>
                  <option value="苗縣">苗縣</option>
                  <option value="中市">中市</option>
                  <option value="彰縣">彰縣</option>
                  <option value="投縣">投縣</option>
                  <option value="雲縣">雲縣</option>
                  <option value="嘉市">嘉市</option>
                  <option value="嘉縣">嘉縣</option>
                  <option value="南市">南市</option>
                  <option value="高市">高市</option>
                  <option value="屏縣">屏縣</option>
                  <option value="宜縣">宜縣</option>
                  <option value="花縣">花縣</option>
                  <option value="東縣">東縣</option>
                  <option value="澎縣">澎縣</option>
                  <option value="金縣">金縣</option>
                  <option value="連縣">連縣</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">領補換類別 <span className="text-red-500">*</span></Label>
                <Controller
                  name="merchant_owner_info.id_replacement_category"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-3">
                      {ID_REPLACEMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`px-5 py-2 rounded-xl border text-sm font-medium transition-all
                            ${field.value === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
            </>
          )}

          {/* Address */}
          <CityDistrictSelect
            postalCodeField="merchant_owner_info.sub_merchant_owner_postal_code"
            cityField="merchant_owner_info.sub_merchant_owner_city"
            cityLabel="縣市地區"
          />
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">負責人地址 <span className="text-red-500">*</span></Label>
            <Input placeholder="羅斯福路二段 100 號（勿填縣市地區）" className="h-10 rounded-xl" {...register('merchant_owner_info.sub_merchant_owner_address')} />
          </div>
        </div>
      </section>
    </div>
  )
}
