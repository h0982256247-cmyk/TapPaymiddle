interface TopbarProps {
  title?: string
  description?: string
}

export function Topbar({ title, description }: TopbarProps) {
  return (
    <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center px-6 sticky top-0 z-40">
      <div>
        {title && <h1 className="text-sm font-semibold text-gray-900">{title}</h1>}
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
    </header>
  )
}
