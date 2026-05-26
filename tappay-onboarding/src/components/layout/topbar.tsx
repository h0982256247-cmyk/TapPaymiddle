import type { ReactNode } from 'react'

interface TopbarProps {
  title?: string
  description?: string
  action?: ReactNode
}

export function Topbar({ title, description, action }: TopbarProps) {
  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        )}
        {description && (
          <>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <p className="text-xs text-gray-400">{description}</p>
          </>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </header>
  )
}
