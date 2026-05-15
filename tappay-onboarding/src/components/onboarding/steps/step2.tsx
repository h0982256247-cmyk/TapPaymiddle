'use client'

import { useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Globe } from 'lucide-react'
import type { OnboardingFormData } from '@/types/merchant'
import { CityDistrictSelect } from '../city-district-select'

async function translateToEnglish(text: string): Promise<string> {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh-TW|en-US`
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any
  return (data.responseData?.translatedText as string) ?? ''
}

export function Step2() {
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  const {
    register,
    control,
    watch,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue,
    formState: { errors },
  } = useFormContext<OnboardingFormData>()

  async function handleTranslate(sourceField: string, targetField: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const source = (watch as any)(sourceField) as string
    if (!source?.trim()) return
    setTranslating((prev) => ({ ...prev, [targetField]: true }))
    try {
      const result = await translateToEnglish(source)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(setValue as any)(targetField, result)
    } finally {
      setTranslating((prev) => ({ ...prev, [targetField]: false }))
    }
  }

  const merchantType = watch('merchant_type')
  const isChainStore = watch('company_info.is_chain_store')
  const companyErrors = (errors.company_info as Record<string, { message?: string }> | undefined) ?? {}
  const registerErrors = (errors.register_info as Record<string, { message?: string }> | undefined) ?? {}

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">商家基本資料</h2>
        <p className="text-sm text-gray-500 mt-1">填寫商家的營業資訊</p>
      </div>

      {/* 法人：公司登記資訊 */}
      {merchantType === 'E' && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
            公司登記資訊
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">統一編號 <span className="text-red-500">*</span></Label>
              <Input placeholder="12345678" maxLength={8} className="h-10 rounded-xl" {...register('register_info.vat_number')} />
              {registerErrors.vat_number && <p className="text-xs text-red-500">{registerErrors.vat_number.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">資本額 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                placeholder="1000000"
                className="h-10 rounded-xl"
                {...register('register_info.company_capital', { valueAsNumber: true })}
              />
              {registerErrors.company_capital && <p className="text-xs text-red-500">{registerErrors.company_capital.message}</p>}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">營業登記名稱 <span className="text-red-500">*</span></Label>
              <Input placeholder="XX 股份有限公司" className="h-10 rounded-xl" {...register('register_info.register_name')} />
              {registerErrors.register_name && <p className="text-xs text-red-500">{registerErrors.register_name.message}</p>}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">登記英文名稱 <span className="text-red-500">*</span></Label>
              <Input placeholder="XX Co., Ltd." className="h-10 rounded-xl" {...register('register_info.register_name_english')} />
              {registerErrors.register_name_english && <p className="text-xs text-red-500">{registerErrors.register_name_english.message}</p>}
            </div>
            <CityDistrictSelect
              postalCodeField="register_info.register_postal_code"
              cityField="register_info.register_city"
              cityLabel="縣市地區"
            />
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">登記地址 <span className="text-red-500">*</span></Label>
              <Input placeholder="羅斯福路二段 100 號（勿填縣市地區）" className="h-10 rounded-xl" {...register('register_info.register_address')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">成立日期 <span className="text-red-500">*</span></Label>
              <Input placeholder="1040401（民國年）" maxLength={7} className="h-10 rounded-xl" {...register('register_info.company_establishment_date')} />
              {registerErrors.company_establishment_date && <p className="text-xs text-red-500">{registerErrors.company_establishment_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">是否銷售遞延性或預付型商品 <span className="text-red-500">*</span></Label>
              <Controller
                name="register_info.is_prepaid_product"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-3">
                    {[{ value: true, label: '是' }, { value: false, label: '否' }].map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all
                          ${field.value === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
        </section>
      )}

      {/* 商家營業資訊 */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
          營業資訊
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">對外營業名稱（中文）<span className="text-red-500">*</span></Label>
            <Input placeholder="測試商店" className="h-10 rounded-xl" {...register('company_info.company_name')} />
            {companyErrors.company_name && <p className="text-xs text-red-500">{companyErrors.company_name.message}</p>}
            <p className="text-xs text-gray-400">持卡人對帳單顯示，請勿填寫個人姓名</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">英文名稱 <span className="text-red-500">*</span></Label>
              <button
                type="button"
                onClick={() => handleTranslate('company_info.company_name', 'company_info.company_name_english')}
                disabled={translating['company_info.company_name_english']}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 disabled:opacity-50"
              >
                {translating['company_info.company_name_english']
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Globe className="w-3 h-3" />}
                一鍵翻譯
              </button>
            </div>
            <Input placeholder="Test Shop" className="h-10 rounded-xl" {...register('company_info.company_name_english')} />
            {companyErrors.company_name_english && <p className="text-xs text-red-500">{companyErrors.company_name_english.message}</p>}
          </div>
          <CityDistrictSelect
            postalCodeField="company_info.company_postal_code"
            cityField="company_info.company_city"
            cityLabel="縣市地區"
          />
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">營業地址 <span className="text-red-500">*</span></Label>
            <Input placeholder="羅斯福路二段 100 號（勿填縣市地區）" className="h-10 rounded-xl" {...register('company_info.company_address')} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">英文地址</Label>
              <button
                type="button"
                onClick={() => handleTranslate('company_info.company_address', 'company_info.company_address_english')}
                disabled={translating['company_info.company_address_english']}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 disabled:opacity-50"
              >
                {translating['company_info.company_address_english']
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Globe className="w-3 h-3" />}
                一鍵翻譯
              </button>
            </div>
            <Input placeholder="100 Roosevelt Rd Sec 2" className="h-10 rounded-xl" {...register('company_info.company_address_english')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">電話區碼 <span className="text-red-500">*</span></Label>
            <Input placeholder="02" maxLength={4} className="h-10 rounded-xl" {...register('company_info.company_phone_area_code')} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">電話號碼 <span className="text-red-500">*</span></Label>
            <Input placeholder="23456789" maxLength={15} className="h-10 rounded-xl" {...register('company_info.company_phone')} />
          </div>

          {/* Chain Store */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium text-gray-700">是否為連鎖店 <span className="text-red-500">*</span></Label>
            <Controller
              name="company_info.is_chain_store"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3">
                  {[{ value: true, label: '是' }, { value: false, label: '否' }].map((opt) => (
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

          {isChainStore && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">連鎖類型 <span className="text-red-500">*</span></Label>
              <Controller
                name="company_info.chain_store_type"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-3">
                    {[{ value: 'DIRECT', label: '直營店' }, { value: 'FRANCHISE', label: '加盟店' }].map((opt) => (
                      <button
                        key={opt.value}
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
          )}
        </div>
      </section>
    </div>
  )
}
