'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  value: string
  masked?: boolean
}

export function CopyField({ value, masked = false }: Props) {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const display = masked && !revealed
    ? value.slice(0, 8) + '••••••••••••••••' + value.slice(-4)
    : value

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="text-xs font-mono text-gray-700 truncate cursor-pointer select-all"
        onClick={() => masked && setRevealed((r) => !r)}
        title={masked ? (revealed ? '點擊隱藏' : '點擊顯示') : undefined}
      >
        {display}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
        title="複製"
      >
        {copied
          ? <Check className="w-3.5 h-3.5 text-green-500" />
          : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
