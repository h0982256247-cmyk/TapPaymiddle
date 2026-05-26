'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

interface RecoverResult {
  success: boolean
  message?: string
  merchant_id?: string
  error?: string
}

export function RecoverMerchantForm() {
  const [partnerAccount, setPartnerAccount] = useState('')
  const [partnerKey, setPartnerKey] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [platformSlug, setPlatformSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RecoverResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/recover-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_account: partnerAccount.trim(),
          partner_key: partnerKey.trim(),
          contact_email: contactEmail.trim() || undefined,
          company_name: companyName.trim() || undefined,
          platform_slug: platformSlug.trim() || undefined,
        }),
      })
      const data = await res.json() as RecoverResult
      setResult(data)
    } catch {
      setResult({ success: false, error: '網路錯誤，請稍後再試' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 rounded-2xl border-gray-200 shadow-sm">
      {/* 說明 */}
      <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 mb-6">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1 leading-relaxed">
          <p className="font-semibold">何時使用？</p>
          <p>
            當商戶在 TapPay 已成功建立帳號，但本系統 DB 沒有對應紀錄（錯誤碼 ACCOUNT_DESYNC），
            導致再次提交時被封鎖。
          </p>
          <p>
            <span className="font-medium">操作步驟：</span>
            ① 登入 TapPay 後台取得該帳號的 partner_key
            → ② 填入下方表單送出
            → ③ 系統補建 DB 紀錄後，商戶即可重新登入繼續流程。
          </p>
        </div>
      </div>

      <form onSubmit={void handleSubmit} className="space-y-4">
        {/* partner_account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Partner Account <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={partnerAccount}
            onChange={(e) => setPartnerAccount(e.target.value)}
            placeholder="例：eeats365"
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>

        {/* partner_key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Partner Key <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="password"
            value={partnerKey}
            onChange={(e) => setPartnerKey(e.target.value)}
            placeholder="從 TapPay 後台取得"
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* contact_email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              聯絡信箱（選填）
            </label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="merchant@example.com"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>

          {/* company_name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公司名稱（選填）
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="XX 有限公司"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
          </div>
        </div>

        {/* platform_slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            平台 Slug（選填，若已知請填入以正確關聯）
          </label>
          <input
            value={platformSlug}
            onChange={(e) => setPlatformSlug(e.target.value)}
            placeholder="例：my-platform"
            className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !partnerAccount || !partnerKey}
          className="w-full h-10 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: loading ? '#6366f1' : '#4f46e5' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> 復原中...
            </span>
          ) : (
            '執行帳號復原'
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div
          className={`mt-4 flex gap-2.5 p-3.5 rounded-xl text-sm ${
            result.success
              ? 'bg-green-50 border border-green-100 text-green-800'
              : 'bg-red-50 border border-red-100 text-red-800'
          }`}
        >
          {result.success
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          }
          <div>
            <p className="font-medium">{result.success ? '復原成功' : '復原失敗'}</p>
            <p className="text-xs mt-0.5 opacity-80">{result.message ?? result.error}</p>
            {result.merchant_id && (
              <p className="text-xs mt-1 font-mono opacity-70">merchant_id: {result.merchant_id}</p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
