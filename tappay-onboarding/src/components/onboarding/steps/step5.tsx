'use client'

import { useState, useEffect } from 'react'
import { useFormContext, Controller, useFieldArray } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Store, Package, Landmark, Info, MapPin, Globe, Zap, Link as LinkIcon, X, Phone, Mail, RotateCcw, ShoppingCart, Plus, Trash2 } from 'lucide-react'
import { CityDistrictSelect } from '../city-district-select'
import { FileUpload } from '../file-upload'
import { cn } from '@/lib/utils'
import type { OnboardingFormData, PaymentMethod } from '@/types/merchant'
import { PAYMENT_METHOD_LABELS } from '@/types/merchant'
import { toast } from 'sonner'

const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tap-paymiddle.vercel.app').replace(/\/$/, '')

// ── 審查頁面預覽 Modal ─────────────────────────

interface ProductPreviewItem {
  product_image?: File | null
  product_name?: string
  product_price?: number
  product_description?: string
}

interface ShopPagePreviewModalProps {
  open: boolean
  onClose: () => void
  brandName: string
  vatNumber?: string
  merchantType: string
  products?: ProductPreviewItem[]
  refundPolicy?: string
  servicePhone?: string
  serviceEmail?: string
}

function ShopPagePreviewModal({
  open,
  onClose,
  brandName,
  vatNumber,
  merchantType,
  products = [],
  refundPolicy,
  servicePhone,
  serviceEmail,
}: ShopPagePreviewModalProps) {
  const [cartCount, setCartCount] = useState(0)

  const imageUrls = products.map((p) => (p.product_image instanceof File ? URL.createObjectURL(p.product_image) : null))

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => { if (url) URL.revokeObjectURL(url) })
    }
  })

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-sm w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-gray-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部工具列 */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 rounded-t-2xl">
          <span className="text-sm font-semibold text-gray-800">審查頁面預覽</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 品牌 header */}
        <div className="sticky top-[49px] z-10 px-4 py-3 bg-white border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">
            {brandName || <span className="text-gray-300">尚未填寫</span>}
          </p>
          {merchantType === 'E' && vatNumber && (
            <p className="text-xs text-gray-500 mt-0.5">統一編號：{vatNumber}</p>
          )}
        </div>

        {/* 商品區塊 */}
        <div className="space-y-0">
          {products.length === 0 ? (
            <div className="p-4 text-xs text-gray-300">尚未新增商品</div>
          ) : products.map((product, idx) => {
            const imgUrl = imageUrls[idx]
            return (
              <div key={idx} className={`p-4 space-y-3 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                  {imgUrl ? (
                    <img src={imgUrl} alt="商品圖片" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">尚未上傳圖片</span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 flex-1">
                    {product.product_name || <span className="text-gray-300">尚未填寫</span>}
                  </p>
                  {product.product_price && product.product_price > 0 ? (
                    <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                      NT$ {Number(product.product_price).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-300 flex-shrink-0">NT$ —</p>
                  )}
                </div>
                <p className={`text-xs leading-relaxed whitespace-pre-wrap ${product.product_description ? 'text-gray-600' : 'text-gray-300'}`}>
                  {product.product_description || '尚未填寫'}
                </p>
              </div>
            )
          })}
        </div>

        {/* 分隔線 */}
        <div className="h-2 bg-gray-100" />

        {/* 退款政策 */}
        <div className="p-4 bg-white space-y-2">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-800">退款政策</p>
          </div>
          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${refundPolicy ? 'text-gray-600' : 'text-gray-300'}`}>
            {refundPolicy || '尚未填寫'}
          </p>
        </div>

        {/* 分隔線 */}
        <div className="h-2 bg-gray-100" />

        {/* 客服資訊 */}
        <div className="p-4 bg-white space-y-3">
          <p className="text-sm font-semibold text-gray-800">客服資訊</p>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className={`text-xs ${servicePhone ? 'text-gray-700' : 'text-gray-300'}`}>
              {servicePhone || '尚未填寫'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className={`text-xs ${serviceEmail ? 'text-gray-700' : 'text-gray-300'}`}>
              {serviceEmail || '尚未填寫'}
            </span>
          </div>
        </div>

        {/* 底部按鈕 spacer */}
        <div className="h-20" />

        {/* 底部購物按鈕（sticky bottom，吸附在 modal 內底部） */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
          <button
            type="button"
            onClick={() => setCartCount((c) => c + 1)}
            className="flex-1 h-10 rounded-xl border-2 border-gray-900 text-gray-900 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            加入購物車
          </button>
          <button
            type="button"
            className="flex-1 h-10 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
          >
            立即結帳
          </button>
        </div>
      </div>

      {/* 浮動購物車按鈕（相對於 modal 右下） */}
      <div className="absolute right-8 bottom-20 pointer-events-none">
        <div className="relative w-11 h-11 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center pointer-events-auto">
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MCC 代碼分類 ──────────────────────────────
const MCC_GROUPS: { label: string; options: { value: string; label: string }[] }[] = [
  {
    label: '零售業',
    options: [
      { value: '5999', label: '5999　綜合零售' },
      { value: '5411', label: '5411　超市 / 食品雜貨' },
      { value: '5912', label: '5912　藥局 / 藥妝店' },
      { value: '5691', label: '5691　服飾綜合' },
      { value: '5621', label: '5621　女裝服飾' },
      { value: '5611', label: '5611　男裝服飾' },
      { value: '5661', label: '5661　鞋類' },
      { value: '5941', label: '5941　運動用品' },
      { value: '5045', label: '5045　電腦及周邊設備' },
      { value: '5065', label: '5065　電子零件 / 3C' },
      { value: '5722', label: '5722　家電' },
      { value: '5712', label: '5712　家具 / 家居用品' },
      { value: '5251', label: '5251　五金 / 工具' },
      { value: '5261', label: '5261　花卉 / 園藝' },
      { value: '5977', label: '5977　化妝品 / 美容用品' },
      { value: '5947', label: '5947　禮品 / 精品店' },
      { value: '5511', label: '5511　汽車銷售' },
      { value: '5533', label: '5533　汽車零件' },
      { value: '5571', label: '5571　機車' },
      { value: '5815', label: '5815　數位內容下載（書籍、音樂）' },
      { value: '5816', label: '5816　遊戲點數 / 虛寶' },
      { value: '5734', label: '5734　電腦軟體零售' },
    ],
  },
  {
    label: '餐飲業',
    options: [
      { value: '5812', label: '5812　餐廳 / 飲食店' },
      { value: '5814', label: '5814　速食店' },
      { value: '5813', label: '5813　酒吧 / 夜店' },
      { value: '5921', label: '5921　酒類零售' },
    ],
  },
  {
    label: '旅遊 / 住宿',
    options: [
      { value: '7011', label: '7011　飯店 / 旅館' },
      { value: '7012', label: '7012　民宿' },
      { value: '4511', label: '4511　航空公司' },
      { value: '4722', label: '4722　旅行社' },
      { value: '7512', label: '7512　租車服務' },
      { value: '4131', label: '4131　客運巴士' },
    ],
  },
  {
    label: '娛樂 / 休閒',
    options: [
      { value: '7832', label: '7832　電影院' },
      { value: '7993', label: '7993　遊樂場 / 電子遊戲' },
      { value: '7999', label: '7999　休閒娛樂綜合' },
      { value: '7922', label: '7922　表演票券' },
      { value: '7941', label: '7941　職業運動' },
    ],
  },
  {
    label: '醫療 / 健康 / 美容',
    options: [
      { value: '8099', label: '8099　醫療服務綜合' },
      { value: '8011', label: '8011　醫師診所' },
      { value: '8021', label: '8021　牙科診所' },
      { value: '7298', label: '7298　健康 / 美容 SPA' },
      { value: '7230', label: '7230　美容院 / 理髮廳' },
      { value: '5047', label: '5047　醫療器材' },
    ],
  },
  {
    label: '教育',
    options: [
      { value: '8299', label: '8299　補習班 / 教育服務' },
      { value: '8241', label: '8241　函授課程 / 線上課程' },
      { value: '8220', label: '8220　大學 / 高等教育' },
      { value: '8211', label: '8211　中小學' },
    ],
  },
  {
    label: '服務業 / 專業服務',
    options: [
      { value: '7389', label: '7389　商業服務綜合' },
      { value: '7372', label: '7372　軟體服務 / SaaS' },
      { value: '7371', label: '7371　程式設計 / IT 服務' },
      { value: '8742', label: '8742　管理顧問' },
      { value: '8911', label: '8911　建築師 / 工程師' },
      { value: '7349', label: '7349　清潔 / 維護服務' },
      { value: '8999', label: '8999　其他專業服務' },
    ],
  },
  {
    label: '交通 / 汽車服務',
    options: [
      { value: '7521', label: '7521　停車場' },
      { value: '7538', label: '7538　汽車修理廠' },
      { value: '7542', label: '7542　洗車' },
    ],
  },
  {
    label: '電信 / 數位服務',
    options: [
      { value: '4814', label: '4814　電信服務' },
      { value: '4816', label: '4816　電腦網路服務' },
      { value: '4899', label: '4899　有線電視 / 串流' },
    ],
  },
  {
    label: '其他',
    options: [
      { value: '8398', label: '8398　慈善機構 / 非營利' },
      { value: '6300', label: '6300　保險' },
      { value: '9399', label: '9399　政府 / 公共服務' },
    ],
  },
]

const selectClass =
  'h-10 w-full appearance-none rounded-xl border border-input bg-white pl-3 pr-8 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

// 兩層 MCC 選單元件
function MccSelect({
  fieldName,
  error,
}: {
  fieldName: 'online_credit_card_info.mcc_online' | 'offline_credit_card_info.mcc_offline'
  error?: boolean
}) {
  const { register, setValue, watch } = useFormContext<OnboardingFormData>()
  const currentValue = watch(fieldName)

  // 從目前值反推初始分類
  const initCategory = MCC_GROUPS.find((g) =>
    g.options.some((o) => o.value === currentValue)
  )?.label ?? ''

  const [category, setCategory] = useState(initCategory)

  const filteredOptions = MCC_GROUPS.find((g) => g.label === category)?.options ?? []

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCategory(e.target.value)
    setValue(fieldName, '', { shouldValidate: false })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* 第一層：大分類 */}
      <div className="space-y-1.5">
        <p className="text-xs text-gray-500">① 選擇產業大分類</p>
        <select
          className={selectClass}
          value={category}
          onChange={handleCategoryChange}
        >
          <option value="">請選擇大分類</option>
          {MCC_GROUPS.map((g) => (
            <option key={g.label} value={g.label}>{g.label}</option>
          ))}
        </select>
      </div>

      {/* 第二層：對應 MCC code */}
      <div className="space-y-1.5">
        <p className="text-xs text-gray-500">② 選擇對應業別 / MCC 代碼</p>
        <select
          className={cn(selectClass, error && 'border-red-300')}
          disabled={!category}
          {...register(fieldName)}
        >
          <option value="">{category ? '請選擇業別' : '請先選擇大分類'}</option>
          {filteredOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ── 支付選項 ──────────────────────────────────
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
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<OnboardingFormData>()

  const [previewOpen, setPreviewOpen] = useState(false)

  const selectedMethods = watch('payment_methods') ?? []
  const onlineErrors = (errors.online_credit_card_info as Record<string, { message?: string }> | undefined) ?? {}
  const offlineErrors = (errors.offline_credit_card_info as Record<string, { message?: string }> | undefined) ?? {}
  const cvscomErrors = (errors.cvscom_info as Record<string, { message?: string }> | undefined) ?? {}

  const useShopPage = watch('online_credit_card_info.use_shop_page') ?? false
  const partnerAccount = watch('partner_account')
  const merchantType = watch('merchant_type')
  const brandName = watch('company_info.company_name')
  const vatNumber = watch('register_info.vat_number')
  const products = watch('shop_page_info.products') ?? []
  const refundPolicy = watch('shop_page_info.refund_policy')
  const servicePhone = watch('shop_page_info.service_phone')
  const serviceEmail = watch('shop_page_info.service_email')

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control,
    name: 'shop_page_info.products' as never,
  })

  function toggleMethod(
    current: PaymentMethod[],
    method: PaymentMethod,
    onChange: (v: PaymentMethod[]) => void
  ) {
    if (current.includes(method)) {
      onChange(current.filter((m) => m !== method))
      // 取消時清除對應子物件，避免殘留值觸發驗證錯誤
      if (method === 'ONLINE_CREDIT_CARD') setValue('online_credit_card_info', undefined)
      if (method === 'OFFLINE_CREDIT_CARD') setValue('offline_credit_card_info', undefined)
      if (method === 'CVSCOM_C2C') setValue('cvscom_info', undefined)
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
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                MCC 行業代碼 <span className="text-red-500">*</span>
              </Label>
              <MccSelect
                fieldName="online_credit_card_info.mcc_online"
                error={!!onlineErrors.mcc_online}
              />
              {onlineErrors.mcc_online && <p className="text-xs text-red-500">{onlineErrors.mcc_online.message}</p>}
            </div>
            {/* 網址模式切換 */}
            <div className="space-y-3 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                線上商店網址 <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="online_credit_card_info.use_shop_page"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button"
                      onClick={() => { field.onChange(false); setValue('shop_page_info', undefined, { shouldValidate: false }) }}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all
                        ${!field.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-xs">我已有網站</p>
                        <p className={`text-xs mt-0.5 ${!field.value ? 'text-gray-300' : 'text-gray-400'}`}>填寫現有網址</p>
                      </div>
                    </button>
                    <button type="button"
                      onClick={() => {
                        field.onChange(true)
                        setValue('shop_page_info.brand_name', brandName ?? '', { shouldValidate: false })
                        if (merchantType === 'E' && vatNumber) {
                          setValue('shop_page_info.vat_number', vatNumber, { shouldValidate: false })
                        }
                        const currentProducts = getValues('shop_page_info.products' as never) as unknown[]
                        if (!currentProducts?.length) {
                          setValue('shop_page_info.products' as never, [{ product_image: null, product_name: '', product_price: 0, product_description: '' }] as never, { shouldValidate: false })
                        }
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all
                        ${field.value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                      <Zap className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-xs">快速建立審查頁面</p>
                        <p className={`text-xs mt-0.5 ${field.value ? 'text-gray-300' : 'text-gray-400'}`}>無需自有網站</p>
                      </div>
                    </button>
                  </div>
                )}
              />

              {/* 已有網站：顯示 URL 輸入 */}
              {!useShopPage && (
                <div>
                  <Input placeholder="https://www.example.com" type="url" className="h-10 rounded-xl bg-white"
                    {...register('online_credit_card_info.online_shop_url')} />
                  {onlineErrors.online_shop_url && <p className="text-xs text-red-500 mt-1">{onlineErrors.online_shop_url.message}</p>}
                </div>
              )}

              {/* 快速建立：顯示自動產生 URL + 頁面內容表單 */}
              {useShopPage && (
                <div className="space-y-4">
                  {/* 自動產生的審查頁面 URL */}
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-blue-700 flex-1 truncate">
                      {APP_BASE_URL}/shop/{partnerAccount || '[帳號]'}
                    </span>
                    {partnerAccount && (
                      <button type="button"
                        onClick={() => { navigator.clipboard.writeText(`${APP_BASE_URL}/shop/${partnerAccount}`); toast.success('已複製') }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0">
                        複製
                      </button>
                    )}
                    <button type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0 font-medium">
                      預覽
                    </button>
                  </div>

                  {/* 商家資訊（auto-filled） */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">① 商家資訊（自動帶入）</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">品牌 / 公司名稱</Label>
                        <Input readOnly value={brandName ?? ''} className="h-9 rounded-lg bg-gray-50 text-sm"
                          {...register('shop_page_info.brand_name')} />
                      </div>
                      {merchantType === 'E' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">統一編號</Label>
                          <Input readOnly value={vatNumber ?? ''} className="h-9 rounded-lg bg-gray-50 text-sm"
                            {...register('shop_page_info.vat_number')} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 商品資訊 */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">② 商品資訊</h4>

                    {productFields.map((field, idx) => {
                      type ShopErrors = { products?: Array<{ product_image?: { message?: string }; product_name?: { message?: string }; product_price?: { message?: string }; product_description?: { message?: string } }> }
                      const shopErrors = errors.shop_page_info as ShopErrors | undefined
                      const productErrors = shopErrors?.products?.[idx]
                      return (
                        <div key={field.id} className={`space-y-3 ${idx > 0 ? 'pt-4 border-t border-gray-100' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">商品 {idx + 1}</span>
                            {productFields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeProduct(idx)}
                                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                移除
                              </button>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-700">商品圖片 <span className="text-red-500">*</span></Label>
                            <Controller
                              name={`shop_page_info.products.${idx}.product_image` as never}
                              control={control}
                              render={({ field: imgField, fieldState }) => (
                                <FileUpload
                                  label=""
                                  hint="JPG · PNG · WEBP"
                                  required
                                  accept=".jpg,.jpeg,.png,.webp"
                                  value={imgField.value as File | null}
                                  onChange={imgField.onChange}
                                  error={fieldState.error?.message}
                                />
                              )}
                            />
                            {productErrors?.product_image && (
                              <p className="text-xs text-red-500">{productErrors.product_image.message}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-700">商品名稱 <span className="text-red-500">*</span></Label>
                              <Input placeholder="範例商品" className="h-9 rounded-lg text-sm bg-white"
                                {...register(`shop_page_info.products.${idx}.product_name` as never)} />
                              {productErrors?.product_name && (
                                <p className="text-xs text-red-500">{productErrors.product_name.message}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-700">售價（NT$）<span className="text-red-500">*</span></Label>
                              <Input type="number" min={1} placeholder="999" className="h-9 rounded-lg text-sm bg-white"
                                {...register(`shop_page_info.products.${idx}.product_price` as never, { valueAsNumber: true })} />
                              {productErrors?.product_price && (
                                <p className="text-xs text-red-500">{productErrors.product_price.message}</p>
                              )}
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <Label className="text-xs font-medium text-gray-700">商品描述 <span className="text-red-500">*</span></Label>
                              <textarea rows={3} placeholder="詳細描述您的商品或服務內容..."
                                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring/50 resize-none"
                                {...register(`shop_page_info.products.${idx}.product_description` as never)} />
                              {productErrors?.product_description && (
                                <p className="text-xs text-red-500">{productErrors.product_description.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => appendProduct({ product_image: null, product_name: '', product_price: 0, product_description: '' } as never)}
                      className="flex items-center gap-2 w-full justify-center py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      新增商品
                    </button>
                  </div>

                  {/* 退款政策 */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">③ 退款政策</h4>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">退款說明 <span className="text-red-500">*</span></Label>
                      <textarea rows={3} placeholder="例：商品出貨後 7 天內可申請退換貨，需保持商品完整未拆封..."
                        className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring/50 resize-none"
                        {...register('shop_page_info.refund_policy')} />
                      {(errors.shop_page_info as Record<string, { message?: string }> | undefined)?.refund_policy && (
                        <p className="text-xs text-red-500">{(errors.shop_page_info as Record<string, { message?: string }> | undefined)?.refund_policy?.message}</p>
                      )}
                    </div>
                  </div>

                  {/* 客服資訊 */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">④ 客服資訊</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">客服電話 <span className="text-red-500">*</span></Label>
                        <Input placeholder="0800-XXX-XXX" className="h-9 rounded-lg text-sm bg-white"
                          {...register('shop_page_info.service_phone')} />
                        {(errors.shop_page_info as Record<string, { message?: string }> | undefined)?.service_phone && (
                          <p className="text-xs text-red-500">{(errors.shop_page_info as Record<string, { message?: string }> | undefined)?.service_phone?.message}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700">客服 Email <span className="text-red-500">*</span></Label>
                        <Input type="email" placeholder="service@example.com" className="h-9 rounded-lg text-sm bg-white"
                          {...register('shop_page_info.service_email')} />
                        {(errors.shop_page_info as Record<string, { message?: string }> | undefined)?.service_email && (
                          <p className="text-xs text-red-500">{(errors.shop_page_info as Record<string, { message?: string }> | undefined)?.service_email?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <ShopPagePreviewModal
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    brandName={brandName ?? ''}
                    vatNumber={vatNumber}
                    merchantType={merchantType ?? ''}
                    products={products as ProductPreviewItem[]}
                    refundPolicy={refundPolicy}
                    servicePhone={servicePhone}
                    serviceEmail={serviceEmail}
                  />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">商品類別描述 <span className="text-red-500">*</span></Label>
              <Input placeholder="線上販售各類商品及服務" className="h-10 rounded-xl bg-white" {...register('online_credit_card_info.shop_description_online')} />
              {onlineErrors.shop_description_online && <p className="text-xs text-red-500">{onlineErrors.shop_description_online.message}</p>}
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
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">
                MCC 行業代碼 <span className="text-red-500">*</span>
              </Label>
              <MccSelect
                fieldName="offline_credit_card_info.mcc_offline"
                error={!!offlineErrors.mcc_offline}
              />
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
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">商品類別描述 <span className="text-red-500">*</span></Label>
              <Input placeholder="販售各類實體商品" className="h-10 rounded-xl bg-white" {...register('offline_credit_card_info.shop_description_offline')} />
              {offlineErrors.shop_description_offline && <p className="text-xs text-red-500">{offlineErrors.shop_description_offline.message}</p>}
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
