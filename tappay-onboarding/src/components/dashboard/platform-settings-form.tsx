'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react'

interface Platform {
  id: string
  name: string
  slug: string
  tappay_platform_key: string
}

interface Props {
  initialData: Platform | null
  baseUrl: string
}

export function PlatformSettingsForm({ initialData, baseUrl }: Props) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [platformKey, setPlatformKey] = useState(initialData?.tappay_platform_key ?? '')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)

  const onboardingUrl = slug ? `${baseUrl}/onboarding/${slug}` : null

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, tappay_platform_key: platformKey }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success('平台設定已儲存')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">平台設定</p>
        <p className="text-xs text-gray-400">設定你的平台名稱、識別碼與 TapPay Platform Key</p>
      </div>

      <div className="space-y-4">
        {/* 平台名稱 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">
            平台名稱 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：ABC 支付服務"
            className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        {/* 網址識別碼 */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">
            網址識別碼（slug）<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="例：abc-pay"
            className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 font-mono focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <p className="text-xs text-gray-400">只能使用小寫英文、數字、連字號（-）</p>
        </div>

        {/* TapPay Platform Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">
            TapPay Platform Key <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={platformKey}
              onChange={(e) => setPlatformKey(e.target.value)}
              placeholder="platform_..."
              className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 pr-9 font-mono focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 進件網址預覽 */}
      {onboardingUrl && (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
          <p className="text-xs font-medium text-gray-600">你的專屬進件網址</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-700 flex-1 truncate">{onboardingUrl}</span>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(onboardingUrl); toast.success('已複製') }}
              className="text-gray-400 hover:text-gray-700 flex-shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <a href={onboardingUrl} target="_blank" rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-700 flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !name || !slug || !platformKey}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? '儲存中...' : '儲存設定'}
      </button>
    </div>
  )
}
