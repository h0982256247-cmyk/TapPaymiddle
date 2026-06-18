'use client'

import { useState, useEffect } from 'react'
import { useFormContext, Controller, useFieldArray } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Store, Package, Landmark, Info, MapPin, Globe, Zap, Link as LinkIcon, X, Phone, Mail, RotateCcw, ShoppingCart, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { CityDistrictSelect } from '../city-district-select'
import { FileUpload } from '../file-upload'
import { cn } from '@/lib/utils'
import type { OnboardingFormData, PaymentMethod, UploadedFile } from '@/types/merchant'
import { PAYMENT_METHOD_LABELS, isUploadedFile } from '@/types/merchant'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { normalizeTapPayText } from '@/lib/schemas/onboarding'

const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tap-paymiddle.vercel.app').replace(/\/$/, '')

// ── 審查頁面預覽 Modal ─────────────────────────

interface ProductPreviewItem {
  product_image?: File | UploadedFile | null
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
  const [quantities, setQuantities] = useState<number[]>(products.map(() => 1))
  const [cart, setCart] = useState<{ idx: number; name: string; price: number; qty: number }[]>([])

  const supabaseForPreview = createClient()
  const imageUrls = products.map((p) => {
    if (p.product_image instanceof File) return URL.createObjectURL(p.product_image)
    if (isUploadedFile(p.product_image)) {
      return supabaseForPreview.storage.from('shop-images').getPublicUrl(p.product_image.path).data.publicUrl
    }
    return null
  })

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => { if (url) URL.revokeObjectURL(url) })
    }
  })

  useEffect(() => {
    if (open) {
      setQuantities(products.map(() => 1))
      setCart([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  function updateQty(idx: number, delta: number) {
    setQuantities((prev) => prev.map((q, i) => (i === idx ? Math.max(1, q + delta) : q)))
  }

  function addToCart(idx: number) {
    const qty = quantities[idx]
    const product = products[idx]
    setCart((prev) => {
      const existing = prev.find((item) => item.idx === idx)
      if (existing) {
        return prev.map((item) => item.idx === idx ? { ...item, qty: item.qty + qty } : item)
      }
      return [...prev, { idx, name: product.product_name || '(未填寫)', price: product.product_price ?? 0, qty }]
    })
    setQuantities((prev) => prev.map((q, i) => (i === idx ? 1 : q)))
  }

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0)

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
        <div className="p-4 space-y-4">
          {products.length === 0 ? (
            <div className="text-xs text-gray-300">尚未新增商品</div>
          ) : products.map((product, idx) => {
            const imgUrl = imageUrls[idx]
            return (
              <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="w-full aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                  {imgUrl ? (
                    <img src={imgUrl} alt="商品圖片" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">尚未上傳圖片</span>
                  )}
                </div>
                <div className="p-3 space-y-2">
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
                  {/* 數量選擇 + 加入購物車 */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button type="button" onClick={() => updateQty(idx, -1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-xs font-semibold text-gray-900 text-center">{quantities[idx]}</span>
                      <button type="button" onClick={() => updateQty(idx, 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <button type="button" onClick={() => addToCart(idx)}
                      className="flex-1 h-8 rounded-lg border border-gray-900 text-gray-900 text-xs font-semibold hover:bg-gray-50 transition-colors">
                      加入購物車
                    </button>
                  </div>
                </div>
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

        {/* 底部 spacer */}
        <div className="h-16" />
      </div>

      {/* 浮動購物車按鈕（相對於 modal 右下） */}
      <div className="absolute right-8 bottom-12 pointer-events-none">
        <div className="relative w-11 h-11 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center pointer-events-auto">
          <ShoppingCart className="w-5 h-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MCC 代碼分類 ──────────────────────────────
// 來源：TapPay 平台商進件 API 1.7「承作商店類別清單」(2024-03-29)
// online = 線上刷卡(ONLINE) 承作；offline = 實體刷卡(OFFLINE 企業/個人任一) 承作
type MccOption = { value: string; label: string; online: boolean; offline: boolean }
const MCC_GROUPS_ALL: { label: string; options: MccOption[] }[] = [
  {
    label: "居民與商業服務",
    options: [
      { value: "0780", label: "0780　景歡美化及園藝服務", online: true, offline: false },
      { value: "5542", label: "5542　自助加油站", online: true, offline: false },
      { value: "5811", label: "5811　包辦伙食、宴會承包商", online: true, offline: false },
      { value: "5965", label: "5965　目錄銷售", online: true, offline: false },
      { value: "6300", label: "6300　保險繳款", online: true, offline: false },
      { value: "7210", label: "7210　洗衣店", online: true, offline: false },
      { value: "7211", label: "7211　洗熨服務(自助洗衣服務)", online: true, offline: false },
      { value: "7221", label: "7221　攝影工作室", online: false, offline: true },
      { value: "7299", label: "7299　未列入其他代碼的個人服務", online: true, offline: false },
      { value: "7311", label: "7311　廣告服務", online: true, offline: false },
      { value: "7333", label: "7333　商業攝影服務", online: true, offline: true },
      { value: "7338", label: "7338　複印及繪圖服務", online: true, offline: false },
      { value: "7395", label: "7395　照相洗印服務", online: true, offline: true },
      { value: "7399", label: "7399　商業服務(其他)", online: true, offline: false },
      { value: "7523", label: "7523　停車場", online: true, offline: true },
      { value: "8912", label: "8912　裝修、裝潢、園藝", online: true, offline: true },
      { value: "8931", label: "8931　會計、審計、財務服務", online: true, offline: false },
      { value: "8999", label: "8999　未列入其他代碼的專業服務", online: true, offline: false },
    ],
  },
  {
    label: "旅遊、運輸、物流",
    options: [
      { value: "4121", label: "4121　計程車,加長禮車", online: true, offline: true },
      { value: "4214", label: "4214　貨物搬運和託運", online: true, offline: false },
      { value: "4215", label: "4215　快遞服務", online: true, offline: false },
      { value: "4225", label: "4225　公共倉儲服務", online: true, offline: false },
      { value: "4722", label: "4722　旅行社", online: true, offline: false },
      { value: "4789", label: "4789　交通運輸", online: true, offline: false },
    ],
  },
  {
    label: "家用電器及電子產品專門零售",
    options: [
      { value: "4812", label: "4812　電信設備", online: true, offline: true },
      { value: "5722", label: "5722　家用電器商店", online: true, offline: true },
      { value: "5732", label: "5732　家用電器商店", online: true, offline: true },
      { value: "5734", label: "5734　電腦軟體／硬體商店、軟體下載", online: true, offline: true },
    ],
  },
  {
    label: "資訊與電腦服務",
    options: [
      { value: "4816", label: "4816　電腦網絡／信息服務", online: true, offline: false },
      { value: "7372", label: "7372　電腦軟體開發、系統整合、資料處理服務", online: true, offline: false },
    ],
  },
  {
    label: "批發商家",
    options: [
      { value: "5021", label: "5021　辦公及商務家具(批發商)", online: true, offline: false },
      { value: "5039", label: "5039　未列入其他代碼的建材批發", online: true, offline: false },
      { value: "5044", label: "5044　辦公、影印及攝影器材(批發商)", online: true, offline: true },
      { value: "5045", label: "5045　電腦、電腦週邊設備", online: true, offline: false },
      { value: "5065", label: "5065　電器零件和設備(批發商)", online: true, offline: false },
      { value: "5111", label: "5111　文具、辦公用品(批發商)", online: true, offline: false },
      { value: "5131", label: "5131　布料、縫紉用品(批發商)", online: true, offline: false },
      { value: "5137", label: "5137　男女及兒童服裝(批發商)", online: true, offline: true },
      { value: "5139", label: "5139　鞋類(批發商)", online: true, offline: false },
      { value: "5192", label: "5192　書、期刊和報紙(批發商)", online: true, offline: false },
      { value: "5193", label: "5193　花木栽種用品(批發商)", online: true, offline: false },
      { value: "5198", label: "5198　油漆、清漆用品(批發商)", online: true, offline: false },
      { value: "5998", label: "5998　其他批發商", online: true, offline: false },
    ],
  },
  {
    label: "零售業(綜合零售)",
    options: [
      { value: "5094", label: "5094　貴重珠寶、首飾、鐘錶零售", online: true, offline: true },
      { value: "5300", label: "5300　會員制批量零售店", online: true, offline: false },
      { value: "5309", label: "5309　大批發會員店", online: true, offline: false },
      { value: "5311", label: "5311　大批發會員店(百貨公司)", online: true, offline: true },
      { value: "5331", label: "5331　雜貨店", online: true, offline: true },
      { value: "5399", label: "5399　一般用品(其他)", online: true, offline: true },
      { value: "5411", label: "5411　超市,量販店", online: true, offline: true },
      { value: "5422", label: "5422　冷藏、儲藏肉類供應商", online: true, offline: true },
      { value: "5441", label: "5441　糖果店、堅果店", online: true, offline: true },
      { value: "5451", label: "5451　乳製品店、冷飲店", online: true, offline: true },
      { value: "5462", label: "5462　糕品店", online: true, offline: true },
      { value: "5499", label: "5499　便利商店", online: true, offline: true },
      { value: "5611", label: "5611　男子和男童服裝及附件商店", online: true, offline: true },
      { value: "5621", label: "5621　婦女時裝商店", online: true, offline: true },
      { value: "5631", label: "5631　飾品商店", online: true, offline: true },
      { value: "5641", label: "5641　兒童嬰兒用品商店", online: true, offline: true },
      { value: "5651", label: "5651　家庭服裝商店", online: true, offline: false },
      { value: "5655", label: "5655　運動服飾商店", online: true, offline: false },
      { value: "5661", label: "5661　鞋店", online: true, offline: true },
      { value: "5681", label: "5681　皮貨商店", online: true, offline: true },
      { value: "5691", label: "5691　服飾店", online: true, offline: true },
      { value: "5697", label: "5697　裁縫、修補、改衣店", online: true, offline: true },
      { value: "5699", label: "5699　各種服飾(配件)", online: true, offline: false },
      { value: "5921", label: "5921　啤酒屋", online: true, offline: true },
      { value: "5944", label: "5944　銀器商店", online: true, offline: true },
      { value: "5947", label: "5947　禮品、紀念品商店", online: true, offline: true },
      { value: "5948", label: "5948　箱包、皮具店", online: true, offline: true },
      { value: "5949", label: "5949　紡織品及針織品零售", online: true, offline: true },
      { value: "5950", label: "5950　玻璃器皿和水晶飾品店", online: true, offline: true },
      { value: "5970", label: "5970　工藝美術商店", online: true, offline: true },
      { value: "5971", label: "5971　藝術商和畫廊", online: true, offline: true },
      { value: "5972", label: "5972　郵票和錢幣店", online: false, offline: true },
      { value: "5973", label: "5973　宗教用品", online: true, offline: true },
      { value: "5975", label: "5975　助聽器-銷售、服務和耗材", online: false, offline: true },
      { value: "5977", label: "5977　化妝品店", online: true, offline: true },
      { value: "5995", label: "5995　寵物店", online: true, offline: true },
      { value: "5999", label: "5999　其他專門零售店", online: true, offline: false },
      { value: "7278", label: "7278　購物服務", online: true, offline: false },
      { value: "8043", label: "8043　光學儀器商和眼鏡商", online: true, offline: true },
    ],
  },
  {
    label: "五金、家具及室內裝修材料專門零售",
    options: [
      { value: "5200", label: "5200　家庭用品(家用、家飾、電器、DIY)", online: false, offline: true },
      { value: "5211", label: "5211　木材和建材賣場", online: true, offline: true },
      { value: "5231", label: "5231　玻璃、油漆、壁纸商店", online: true, offline: true },
      { value: "5251", label: "5251　五金商店", online: true, offline: true },
      { value: "5261", label: "5261　草坪、花園品商店", online: true, offline: true },
      { value: "5310", label: "5310　折扣商店", online: true, offline: false },
      { value: "5712", label: "5712　家具、家用設備零售商", online: true, offline: true },
      { value: "5713", label: "5713　地板鋪設專賣店(地毯、地磚、石材、木地板)", online: false, offline: true },
      { value: "5714", label: "5714　幃帳、窗簾、室內裝潢商店", online: true, offline: true },
      { value: "5718", label: "5718　壁爐及配件商店", online: true, offline: false },
      { value: "5719", label: "5719　各種家庭裝飾專營店", online: true, offline: false },
      { value: "5931", label: "5931　舊商品店、二手商品店", online: true, offline: true },
      { value: "5992", label: "5992　花店", online: true, offline: true },
    ],
  },
  {
    label: "汽車、摩托車、燃料及零配件專門零售",
    options: [
      { value: "5532", label: "5532　汽車輪胎及相關零件銷售", online: false, offline: true },
      { value: "5533", label: "5533　汽車零件配件商店", online: true, offline: true },
      { value: "5541", label: "5541　加油站", online: true, offline: true },
      { value: "7531", label: "7531　修車場", online: true, offline: false },
      { value: "7535", label: "7535　汽車噴漆", online: true, offline: false },
    ],
  },
  {
    label: "文化、體育用品及器材專門零售",
    options: [
      { value: "5733", label: "5733　音樂商店", online: true, offline: true },
      { value: "5735", label: "5735　音像製品商店", online: true, offline: true },
      { value: "5940", label: "5940　自行車商店", online: true, offline: true },
      { value: "5941", label: "5941　運動用品店", online: true, offline: true },
      { value: "5942", label: "5942　書店", online: true, offline: true },
      { value: "5943", label: "5943　文具店、辦公室、學校用品店", online: true, offline: true },
      { value: "5945", label: "5945　玩具、遊戲店", online: true, offline: true },
      { value: "5946", label: "5946　照相器材店", online: true, offline: true },
      { value: "5994", label: "5994　報亭、報攤", online: true, offline: false },
    ],
  },
  {
    label: "住宿、餐飲、休閒娛樂",
    options: [
      { value: "5812", label: "5812　餐廳", online: true, offline: true },
      { value: "5813", label: "5813　飲酒場所、酒吧、夜總會", online: true, offline: false },
      { value: "5814", label: "5814　連鎖餐廳", online: true, offline: true },
      { value: "7011", label: "7011　住宿服務", online: true, offline: false },
      { value: "7032", label: "7032　運動和娛樂露營地", online: true, offline: false },
      { value: "7033", label: "7033　活動房車及露營場所", online: true, offline: false },
      { value: "7829", label: "7829　電影和錄像創作發行", online: true, offline: false },
      { value: "7832", label: "7832　電影院", online: true, offline: false },
      { value: "7941", label: "7941　體育場館、體育俱樂部", online: true, offline: false },
      { value: "7997", label: "7997　健身、各種俱樂部", online: true, offline: false },
      { value: "7999", label: "7999　各種娛樂設備", online: true, offline: false },
    ],
  },
  {
    label: "美容、美髮、SPA",
    options: [
      { value: "7230", label: "7230　美髮", online: true, offline: true },
      { value: "7297", label: "7297　按摩服務", online: false, offline: true },
      { value: "7298", label: "7298　美容、ＳＰＡ", online: true, offline: true },
    ],
  },
  {
    label: "租賃服務",
    options: [
      { value: "7394", label: "7394　設備、工具、家具和電器出租", online: true, offline: false },
      { value: "7512", label: "7512　汽車出租", online: true, offline: false },
    ],
  },
  {
    label: "維修及其他專業服務",
    options: [
      { value: "7538", label: "7538　汽車服務", online: true, offline: true },
      { value: "7542", label: "7542　洗車", online: true, offline: true },
      { value: "7622", label: "7622　電器維修", online: true, offline: true },
      { value: "7623", label: "7623　空調及冷藏設備維修店", online: true, offline: false },
      { value: "7629", label: "7629　家電維修店", online: true, offline: false },
      { value: "7699", label: "7699　各類維修店", online: true, offline: false },
    ],
  },
  {
    label: "醫療、衛生",
    options: [
      { value: "8011", label: "8011　醫療", online: true, offline: false },
      { value: "8041", label: "8041　按摩醫生、盲人按摩", online: true, offline: false },
      { value: "8042", label: "8042　眼光配鏡師、眼科醫生", online: true, offline: false },
      { value: "8062", label: "8062　醫院", online: true, offline: false },
    ],
  },
  {
    label: "教育",
    options: [
      { value: "8220", label: "8220　大專學校", online: true, offline: false },
      { value: "8241", label: "8241　函授學校", online: true, offline: false },
      { value: "8299", label: "8299　學校服務", online: true, offline: false },
    ],
  },
  {
    label: "政府、社福、宗教團體",
    options: [
      { value: "8398", label: "8398　社會服務機構", online: true, offline: true },
      { value: "8651", label: "8651　政治機構", online: true, offline: false },
      { value: "8661", label: "8661　宗教機構", online: true, offline: true },
      { value: "9399", label: "9399　政府服務", online: true, offline: false },
    ],
  },
]

const selectClass =
  'h-10 w-full appearance-none rounded-xl border border-input bg-white pl-3 pr-8 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

// 兩層 MCC 選單元件
function MccSelect({
  fieldName,
  error,
  channel,
}: {
  fieldName: 'online_credit_card_info.mcc_online' | 'offline_credit_card_info.mcc_offline'
  error?: boolean
  channel: 'online' | 'offline'
}) {
  const { register, setValue, watch } = useFormContext<OnboardingFormData>()
  const currentValue = watch(fieldName)

  // 依通路（線上 / 實體刷卡）只顯示 TapPay 承作的 MCC，避免進件被退（Invalid Data Element）
  const MCC_GROUPS = MCC_GROUPS_ALL
    .map((g) => ({
      label: g.label,
      options: g.options.filter((o) => (channel === 'online' ? o.online : o.offline)),
    }))
    .filter((g) => g.options.length > 0)

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

  const supabase = createClient()

  async function uploadProductImageFn(file: File): Promise<UploadedFile> {
    const account = (partnerAccount || `anon_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_') || `anon_${Date.now()}`
    const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9_\-.]/g, '_') || 'file'
    const path = `${account}/${Date.now()}_${safeName}`
    const { error } = await supabase.storage.from('shop-images').upload(path, file)
    if (error) throw new Error(error.message)
    return { _uploaded: true, path, name: file.name, size: file.size, type: file.type }
  }

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control,
    name: 'shop_page_info.products' as never,
  })

  useEffect(() => {
    if (useShopPage && productFields.length === 0) {
      appendProduct({ product_image: null, product_name: '', product_price: 0, product_description: '' } as never)
    }
  }, [useShopPage])

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
                channel="online"
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
                        const currentProducts = getValues('shop_page_info')?.products
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
                                  value={imgField.value as UploadedFile | null}
                                  onChange={imgField.onChange}
                                  uploadFn={uploadProductImageFn}
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
              <Input
                placeholder="線上販售各類商品及服務"
                className="h-10 rounded-xl bg-white"
                maxLength={50}
                {...register('online_credit_card_info.shop_description_online')}
                onBlur={(e) => {
                  const v = normalizeTapPayText(e.target.value)
                  if (v !== e.target.value) {
                    setValue('online_credit_card_info.shop_description_online', v, { shouldValidate: true, shouldTouch: true })
                  }
                }}
              />
              <p className="text-[11px] text-gray-400">50 字以內，請使用半形標點（, - _ .），全形符號會自動轉換</p>
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
                channel="offline"
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
              <Input
                placeholder="販售各類實體商品"
                className="h-10 rounded-xl bg-white"
                maxLength={50}
                {...register('offline_credit_card_info.shop_description_offline')}
                onBlur={(e) => {
                  const v = normalizeTapPayText(e.target.value)
                  if (v !== e.target.value) {
                    setValue('offline_credit_card_info.shop_description_offline', v, { shouldValidate: true, shouldTouch: true })
                  }
                }}
              />
              <p className="text-[11px] text-gray-400">50 字以內，請使用半形標點（, - _ .），全形符號會自動轉換</p>
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
