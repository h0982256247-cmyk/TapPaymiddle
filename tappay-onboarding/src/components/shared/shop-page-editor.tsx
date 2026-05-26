'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Save, ExternalLink, Plus, Trash2, ImagePlus, Loader2, X } from 'lucide-react'
import Image from 'next/image'

interface ProductItem {
  product_name: string
  product_price: number
  product_description: string
  product_image_path?: string | null
}

interface ShopPage {
  partner_account: string
  brand_name: string
  vat_number?: string | null
  products?: ProductItem[] | null
  refund_policy: string
  service_phone: string
  service_email: string
}

interface Props {
  initialData: ShopPage & Record<string, unknown>
  shopUrl: string
}

function defaultProducts(data: ShopPage & Record<string, unknown>): ProductItem[] {
  if (Array.isArray(data.products) && data.products.length > 0) return data.products as ProductItem[]
  if (data.product_name) {
    return [{ product_name: String(data.product_name), product_price: Number(data.product_price ?? 0), product_description: String(data.product_description ?? ''), product_image_path: (data.product_image_path as string | null) ?? null }]
  }
  return [{ product_name: '', product_price: 0, product_description: '', product_image_path: null }]
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  // If it's already a full URL, return as-is
  if (path.startsWith('http')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/shop-images/${path}`
}

export function ShopPageEditor({ initialData, shopUrl }: Props) {
  const [data, setData] = useState<ShopPage>({ ...initialData, products: defaultProducts(initialData) })
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(field: keyof ShopPage, value: string | number) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  function handleProductChange(idx: number, field: keyof ProductItem, value: string | number | null) {
    setData((prev) => {
      const products = [...(prev.products ?? [])]
      products[idx] = { ...products[idx], [field]: value }
      return { ...prev, products }
    })
  }

  function addProduct() {
    setData((prev) => ({ ...prev, products: [...(prev.products ?? []), { product_name: '', product_price: 0, product_description: '', product_image_path: null }] }))
  }

  function removeProduct(idx: number) {
    setData((prev) => ({ ...prev, products: (prev.products ?? []).filter((_, i) => i !== idx) }))
  }

  async function handleImageUpload(idx: number, file: File) {
    setUploadingIdx(idx)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('partner_account', data.partner_account)

      const res = await fetch('/api/dashboard/upload-product-image', {
        method: 'POST',
        body: form,
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      handleProductChange(idx, 'product_image_path', result.path)
      toast.success('圖片已上傳')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '圖片上傳失敗')
    } finally {
      setUploadingIdx(null)
    }
  }

  function handleFileChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    handleImageUpload(idx, file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/update-shop-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success('審查頁面已儲存')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const baseFields: { key: keyof ShopPage; label: string; type?: string; required?: boolean; span2?: boolean }[] = [
    { key: 'brand_name', label: '品牌名稱', required: true },
    { key: 'vat_number', label: '統一編號（選填）' },
    { key: 'refund_policy', label: '退款政策', required: true, span2: true },
    { key: 'service_phone', label: '客服電話', required: true },
    { key: 'service_email', label: '客服信箱', type: 'email', required: true },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <a
          href={shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          預覽審查頁面
        </a>
      </div>

      {/* 基本資訊 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {baseFields.map(({ key, label, type, required, span2 }) => (
          <div key={key} className={span2 ? 'sm:col-span-2' : ''}>
            <label className="block text-xs text-gray-500 mb-1">
              {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {span2 ? (
              <textarea
                rows={3}
                value={String(data[key] ?? '')}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              />
            ) : (
              <input
                type={type ?? 'text'}
                value={String(data[key] ?? '')}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            )}
          </div>
        ))}
      </div>

      {/* 商品列表 */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">商品資訊</p>
        {(data.products ?? []).map((product, idx) => {
          const imageUrl = getImageUrl(product.product_image_path)
          const isUploading = uploadingIdx === idx

          return (
            <div key={idx} className="p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">商品 {idx + 1}</span>
                {(data.products ?? []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(idx)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />移除
                  </button>
                )}
              </div>

              {/* 商品圖片上傳 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">商品圖片</label>
                <div className="relative">
                  {imageUrl ? (
                    /* 已有圖片 — 顯示預覽，右上角可替換 */
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 group">
                      <Image
                        src={imageUrl}
                        alt={product.product_name || '商品圖片'}
                        fill
                        className="object-cover"
                        unoptimized={false}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[idx]?.click()}
                          disabled={isUploading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImagePlus className="w-3.5 h-3.5" />
                          )}
                          更換圖片
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProductChange(idx, 'product_image_path', null)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          移除
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 無圖片 — 顯示上傳區 */
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      disabled={isUploading}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                          <span className="text-xs text-gray-400">上傳中...</span>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="w-6 h-6 text-gray-300" />
                          <span className="text-xs text-gray-400">點擊上傳商品圖片</span>
                          <span className="text-[10px] text-gray-300">JPG / PNG / WebP，最大 5MB</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={(el) => { fileInputRefs.current[idx] = el }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleFileChange(idx, e)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">商品名稱 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={product.product_name}
                    onChange={(e) => handleProductChange(idx, 'product_name', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">商品價格 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={product.product_price}
                    onChange={(e) => handleProductChange(idx, 'product_price', Number(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">商品描述</label>
                  <textarea
                    rows={3}
                    value={product.product_description}
                    onChange={(e) => handleProductChange(idx, 'product_description', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                  />
                </div>
              </div>
            </div>
          )
        })}
        <button
          type="button"
          onClick={addProduct}
          className="flex items-center gap-2 w-full justify-center py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增商品
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? '儲存中...' : '儲存變更'}
      </button>
    </div>
  )
}
