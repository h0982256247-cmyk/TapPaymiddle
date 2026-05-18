import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Phone, Mail, RotateCcw } from 'lucide-react'
import { ShopActions } from './shop-actions'

interface ProductItem {
  product_name: string
  product_price: number
  product_description: string | null
  product_image_path: string | null
}

interface ShopPage {
  partner_account: string
  brand_name: string
  vat_number: string | null
  product_image_path: string | null
  product_name: string
  product_price: number
  product_description: string | null
  products: ProductItem[] | null
  refund_policy: string
  service_phone: string
  service_email: string
}

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: shop, error } = await supabase
    .from('merchant_shop_pages')
    .select('*')
    .eq('partner_account', slug)
    .single()

  if (error || !shop) notFound()

  const shopData = shop as ShopPage

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  const products: ProductItem[] = shopData.products?.length
    ? shopData.products
    : shopData.product_name
      ? [{ product_name: shopData.product_name, product_price: shopData.product_price, product_description: shopData.product_description, product_image_path: shopData.product_image_path }]
      : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">{shopData.brand_name}</h1>
            {shopData.vat_number && (
              <p className="text-xs text-gray-400 mt-0.5">統一編號：{shopData.vat_number}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 商品卡片列表 */}
        {products.map((product, idx) => {
          const imageUrl = product.product_image_path
            ? `${supabaseUrl}/storage/v1/object/public/shop-images/${product.product_image_path}`
            : null
          return (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {imageUrl ? (
                <div className="relative w-full aspect-video bg-gray-100">
                  <Image src={imageUrl} alt={product.product_name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">尚未上傳商品圖片</p>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-gray-900 flex-1">{product.product_name}</h2>
                  <p className="text-lg font-bold text-gray-900 flex-shrink-0">NT$ {Number(product.product_price).toLocaleString()}</p>
                </div>
                {product.product_description && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{product.product_description}</p>
                )}
              </div>
            </div>
          )
        })}

        {/* 退款政策 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">退款政策</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{shopData.refund_policy}</p>
        </div>

        {/* 客服資訊 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">客服資訊</h3>
          <div className="space-y-2">
            <a href={`tel:${shopData.service_phone}`}
              className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {shopData.service_phone}
            </a>
            <a href={`mailto:${shopData.service_email}`}
              className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {shopData.service_email}
            </a>
          </div>
        </div>

      </main>

      <ShopActions
        productName={products[0]?.product_name ?? ''}
        productPrice={products[0]?.product_price ?? 0}
      />
    </div>
  )
}
