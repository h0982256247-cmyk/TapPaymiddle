import { cn } from '@/lib/utils'
import type { MerchantStatus } from '@/types/merchant'
import { STATUS_CONFIG } from '@/types/merchant'

interface StatusBadgeProps {
  status: MerchantStatus
  className?: string
}

const colorMap: Record<string, string> = {
  gray:    'bg-gray-100 text-gray-600 border-gray-200',
  blue:    'bg-blue-50 text-blue-700 border-blue-100',
  orange:  'bg-orange-50 text-orange-700 border-orange-100',
  cyan:    'bg-cyan-50 text-cyan-700 border-cyan-100',
  purple:  'bg-purple-50 text-purple-700 border-purple-100',
  green:   'bg-green-50 text-green-700 border-green-100',
  red:     'bg-red-50 text-red-700 border-red-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}

const dotMap: Record<string, string> = {
  gray:    'bg-gray-400',
  blue:    'bg-blue-500',
  orange:  'bg-orange-500',
  cyan:    'bg-cyan-500',
  purple:  'bg-purple-500',
  green:   'bg-green-500',
  red:     'bg-red-500',
  emerald: 'bg-emerald-500',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        colorMap[config.color],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotMap[config.color])} />
      {config.label}
    </span>
  )
}
