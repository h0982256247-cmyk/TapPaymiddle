'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, ExternalLink } from 'lucide-react'

interface ShopPage {
  partner_account: string
  brand_name: string
  vat_number?: string | null
  product_name: string
  product_price: number
  product_description?: string | null
  refund_policy: string
  service_phone: string
  service_email: string
  product_image_path?: string | null
}

interface Props {
  initialData: ShopPage
  shopUrl: string
}

export function ShopPageEditor({ initialData, shopUrl }: Props) {
  const [data, setData] = useState<ShopPage>(initialData)
  const [saving, setSaving] = useState(false)

  function handleChange(field: keyof ShopPage, value: string | number) {
    setData((prev) => ({ ...prev, [field]: value }))
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

  const fields: { key: keyof ShopPage; label: string; type?: string; required?: boolean }[] = [
    { key: 'brand_name', label: '品牌名稱', required: true },
    { key: 'vat_number', label: '統一編號（選填）' },
    { key: 'product_name', label: '商品名稱', required: true },
    { key: 'product_price', label: '商品價格', type: 'number', required: true },
    { key: 'product_description', label: '商品描述' },
    { key: 'refund_policy', label: '退款政策', required: true },
    { key: 'service_phone', label: '客服電話', required: true },
    { key: 'service_email', label: '客服信箱', type: 'email', required: true },
  ]

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(({ key, label, type, required }) => (
          <div key={key} className={key === 'product_description' || key === 'refund_policy' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs text-gray-500 mb-1">
              {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {key === 'product_description' || key === 'refund_policy' ? (
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
                onChange={(e) => handleChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            )}
          </div>
        ))}
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
