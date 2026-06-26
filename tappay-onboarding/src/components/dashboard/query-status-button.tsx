'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function QueryStatusButton({ merchantId }: { merchantId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/query-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: merchantId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '查詢失敗')

      toast.success(
        data.status ? `已更新：${data.status}` : '已更新最新狀態',
        data.opinion ? { description: '已取得 TapPay 審核意見' } : undefined
      )
      startTransition(() => router.refresh())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '查詢失敗')
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || isPending

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-medium text-white transition-colors hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: '#7c6bf0' }}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
      {busy ? '查詢中…' : '查詢最新狀態'}
    </button>
  )
}
