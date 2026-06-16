import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'

interface TopbarProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function Topbar({ title, description, action }: TopbarProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-[#eceaf3] flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="min-w-0">
        {title && (
          <h1 className="text-lg font-bold text-[#2d3142] leading-tight truncate">{title}</h1>
        )}
        {description && (
          <p className="text-xs text-[#9296a8] mt-0.5 truncate">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {action}
        {action && <span className="w-px h-6 bg-[#eceaf3] mx-0.5" />}
        <button
          type="button"
          className="relative w-9 h-9 rounded-xl bg-[#f5f4fb] text-[#7e8398] flex items-center justify-center hover:bg-[#efecfd] hover:text-[#6a5ae0] transition-colors"
          aria-label="通知"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ec5f9e]" />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #7c6bf0, #ec5f9e)' }}
        >
          管
        </div>
      </div>
    </header>
  )
}
