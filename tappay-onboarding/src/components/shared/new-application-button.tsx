'use client'

import { useRouter } from 'next/navigation'
import { PlusCircle } from 'lucide-react'

interface NewApplicationButtonProps {
  platformSlug: string
}

export function NewApplicationButton({ platformSlug }: NewApplicationButtonProps) {
  const router = useRouter()

  function handleClick() {
    // 清除舊草稿，讓表單從第一步重新開始
    try {
      localStorage.removeItem('tappay_form_data')
      localStorage.removeItem('tappay_form_step')
    } catch { /* ignore */ }
    router.push(`/onboarding/${platformSlug}`)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
      style={{ background: '#111827' }}
    >
      <PlusCircle className="w-4 h-4" />
      我要進件
    </button>
  )
}
