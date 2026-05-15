'use client'

import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Store, Package, Landmark, Info, MapPin } from 'lucide-react'
import { CityDistrictSelect } from '../city-district-select'
import { cn } from '@/lib/utils'
import type { OnboardingFormData, PaymentMethod } from '@/types/merchant'
import { PAYMENT_METHOD_LABELS } from '@/types/merchant'

const PAYMENT_OPTIONS: { value: PaymentMethod; icon: React.ReactNode; desc: string }[] = [
  {
    value: 'ONLINE_CREDIT_CARD',
    icon: <CreditCard className="w-5 h-5" />,
    desc: '網路購物、訂閱服務',
  },
  {
    value: 'OFFLINE_CREDIT_CARD',
    icon: <Store className="w-5 h-5" />,
    desc: '實體刷卡機收款',
  },
  {
    value: 'ATM',
    icon: <Landmark className="w-5 h-5" />,
    desc: '虛擬帳號 ATM 轉帳',
  },
  {
    value: 'CVSCOM_C2C',
    icon: <Package className="w-5 h-5" />,
    desc: '超商店到店取貨付款',
  },
]

export function Step5() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<OnboardingFormData>()

  const selectedMethods = watch('payment_methods') ?? []
  const onlineErrors = (errors.online_credit_card_info as Record<string, { message?: string }> | undefined) ?? {}
  const offlineErrors = (errors.offline_credit_card_info as Record<string, { message?: string }> | undefined) ?? {}
  const cvscomErrors = (errors.cvscom_info as Record<string, { message?: string }> | undefined) ?? {}

  function toggleMethod(
    current: PaymentMethod[],
    method: PaymentMethod,
    onChange: (v: PaymentMethod[]) => void
  ) {
    if (current.includes(method)) {
      onChange(current.filter((m) => m !== method))
    } else {
      onChange([...current, method])
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">支付方式申請</h2>
        <p className="text-sm text-gray-500 mt-1">選擇您需要申請的金流服務（可複選）</p>
      </div>

      {/* Payment Method Selection */}
      <Controller
        name="payment_methods"
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAYMENT_OPTIONS.map((option) => {
              const isSelected = field.value?.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleMethod(field.value ?? [], option.value, field.onChange)}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150',
                    isSelected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  )}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{PAYMENT_METHOD_LABELS[option.value]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                  )}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      />
      {errors.payment_methods && (
        <p className="text-xs text-red-500">{errors.payment_methods.message as string}</p>
      )}

      {/* Online Credit Card Config */}
      {selectedMethods.includes('ONLINE_CREDIT_CARD') && (
        <section className="space-y-4 p-5 rounded-xl bg-gray-50 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> 線上信用卡設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">MCC 行業代碼 <span className="text-red-500">*</span></Label>
              <Input placeholder="5999" maxLength={4} className="h-10 rounded-xl bg-white" {...register('online_credit_card_info.mcc_online')} />
              {onlineErrors.mcc_online && <p className="text-xs text-red-500">{onlineErrors.mcc_online.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">線上商店網址 <span className="text-red-500">*</span></Label>
              <Input placeholder="https://www.example.com" type="url" className="h-10 rounded-xl bg-white" {...register('online_credit_card_info.online_shop_url')} />
              {onlineErrors.online_shop_url && <p className="text-xs text-red-500">{onlineErrors.online_shop_url.message}</p>}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">商品類別描述 <span className="text-red-500">*</span></Label>
              <Input placeholder="線上販售各類商品及服務" className="h-10 rounded-xl bg-white" {...register('online_credit_card_info.shop_description_online')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">是否有定期定額（訂閱）需求</Label>
              <Controller
                name="online_credit_card_info.is_subscription_service"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-3">
                    {[{ value: false, label: '否' }, { value: true, label: '是' }].map((opt) => (
                      <button key={String(opt.value)} type="button" onClick={() => field.onChange(opt.value)}
                        className={`px-6 py-2 rounded-xl border text-sm font-medium transition-all
                          ${field.value === opt.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}>
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

      {/* Offline Credit Card Config */}
      {selectedMethods.includes('OFFLINE_CREDIT_CARD') && (
        <section className="space-y-4 p-5 rounded-xl bg-gray-50 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Store className="w-4 h-4" /> 線下信用卡設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">MCC 行業代碼 <span className="text-red-500">*</span></Label>
              <Input placeholder="5411" maxLength={4} className="h-10 rounded-xl bg-white" {...register('offline_credit_card_info.mcc_offline')} />
              {offlineErrors.mcc_offline && <p className="text-xs text-red-500">{offlineErrors.mcc_offline.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">申請收款裝置數量 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                placeholder="1"
                className="h-10 rounded-xl bg-white"
                {...register('offline_credit_card_info.device_quantity', { valueAsNumber: true })}
              />
              {offlineErrors.device_quantity && <p className="text-xs text-red-500">{offlineErrors.device_quantity.message}</p>}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">商品類別描述 <span className="text-red-500">*</span></Label>
              <Input placeholder="販售各類實體商品" className="h-10 rounded-xl bg-white" {...register('offline_credit_card_info.shop_description_offline')} />
            </div>
          </div>
        </section>
      )}

      {/* CVSCOM Config */}
      {selectedMethods.includes('CVSCOM_C2C') && (
        <section className="space-y-4 p-5 rounded-xl bg-gray-50 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-4 h-4" /> 超商取貨設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">寄件人姓名 <span className="text-red-500">*</span></Label>
              <Input placeholder="王小明（自然人資訊）" className="h-10 rounded-xl bg-white" {...register('cvscom_info.shipper_name')} />
              {cvscomErrors.shipper_name && <p className="text-xs text-red-500">{cvscomErrors.shipper_name.message}</p>}
              <p className="text-xs text-gray-400">消費者逾期未取件，退件時需出示身分證</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">寄件人電話 <span className="text-red-500">*</span></Label>
              <Input placeholder="0912345678" className="h-10 rounded-xl bg-white" {...register('cvscom_info.shipper_phone')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">退貨收件人姓名 <span className="text-red-500">*</span></Label>
              <Input placeholder="王小明" className="h-10 rounded-xl bg-white" {...register('cvscom_info.return_receiver_name')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">退貨收件人電話 <span className="text-red-500">*</span></Label>
              <Input placeholder="0912345678" className="h-10 rounded-xl bg-white" {...register('cvscom_info.return_receiver_phone')} />
            </div>
            <CityDistrictSelect
              postalCodeField="cvscom_info.return_receiver_postal_code"
              cityField="cvscom_info.return_receiver_city"
              cityLabel="退貨縣市地區"
            />
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">退貨地址 <span className="text-red-500">*</span></Label>
              <Input placeholder="羅斯福路二段 100 號" className="h-10 rounded-xl bg-white" {...register('cvscom_info.return_receiver_address')} />
            </div>
            <div className="md:col-span-2">
              <div className="flex gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  若需指定 7-11 退貨門市，請填寫以下欄位（可選）。
                  門市資訊需透過 TapPay SDK 選取。
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">退貨門市店號</Label>
              <Input placeholder="131386（可選）" className="h-10 rounded-xl bg-white" {...register('cvscom_info.return_store_id')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">退貨門市名稱</Label>
              <Input placeholder="台北中正門市" className="h-10 rounded-xl bg-white" {...register('cvscom_info.return_store_name')} />
            </div>
          </div>
        </section>
      )}

      {selectedMethods.includes('ATM') && (
        <div className="flex gap-2.5 p-4 rounded-xl bg-green-50 border border-green-100">
          <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-700">
            ATM 繳費無需額外設定，TapPay 將自動配置虛擬帳號服務，手續費由平台商預設費率計算。
          </p>
        </div>
      )}
    </div>
  )
}
