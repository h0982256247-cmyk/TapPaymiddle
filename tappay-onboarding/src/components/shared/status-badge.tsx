import { cn } from '@/lib/utils'
import type { MerchantStatus } from '@/types/merchant'
import { STATUS_CONFIG } from '@/types/merchant'

interface StatusBadgeProps {
  status: MerchantStatus
  className?: string
}

// Each color variant maps to a distinct visual treatment
// Filled (solid bg) = terminal / action-required states
// Soft (tinted bg + border) = in-progress states
const styleMap: Record<string, string> = {
  gray:    'bg-gray-100 text-gray-500 border border-gray-200/80',
  blue:    'bg-[#7c6bf0] text-white shadow-sm shadow-[#7c6bf0]/30',
  orange:  'bg-orange-500 text-white shadow-sm shadow-orange-200',
  cyan:    'bg-sky-100 text-sky-700 border border-sky-200/80',
  purple:  'bg-violet-100 text-violet-700 border border-violet-200/80',
  green:   'bg-green-100 text-green-700 border border-green-200/80',
  red:     'bg-red-500 text-white shadow-sm shadow-red-200',
  emerald: 'bg-emerald-500 text-white shadow-sm shadow-emerald-200',
}

const dotStyleMap: Record<string, string> = {
  gray:    'bg-gray-400',
  blue:    'bg-white/80',
  orange:  'bg-white/80',
  cyan:    'bg-sky-500',
  purple:  'bg-violet-500',
  green:   'bg-green-500',
  red:     'bg-white/80',
  emerald: 'bg-white/80',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        styleMap[config.color],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotStyleMap[config.color])} />
      {config.label}
    </span>
  )
}
