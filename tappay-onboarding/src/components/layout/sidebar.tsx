'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  Activity,
  Bell,
  Settings,
  LogOut,
  Zap,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  {
    label: '總覽',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: '商戶管理',
    href: '/dashboard/merchants',
    icon: Users,
  },
  {
    label: 'API 紀錄',
    href: '/dashboard/api-logs',
    icon: Activity,
  },
  {
    label: 'Notify 紀錄',
    href: '/dashboard/notify-logs',
    icon: Bell,
  },
  {
    label: '設定',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (pendingHref && (pathname === pendingHref || pathname.startsWith(pendingHref + '/'))) {
      setPendingHref(null)
    }
  }, [pathname, pendingHref])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col" style={{ background: '#0d1117' }}>
      {/* Logo */}
      <div className="h-14 flex items-center px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">TapPay</p>
            <p className="text-[10px] leading-tight" style={{ color: 'rgba(148,163,184,0.6)' }}>商戶進件系統</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.35)' }}>
          主選單
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isLoading = isPending && pendingHref === item.href
          const isHighlighted = isActive || isLoading
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (!isActive) {
                  setPendingHref(item.href)
                  startTransition(() => {})
                }
              }}
              className={cn(
                'group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isHighlighted
                  ? 'font-medium'
                  : 'hover:bg-white/[0.04]'
              )}
              style={isHighlighted
                ? { background: 'rgba(99,102,241,0.15)', color: 'white' }
                : { color: 'rgba(148,163,184,0.7)' }
              }
            >
              {isHighlighted && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: '#818cf8' }}
                />
              )}
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(148,163,184,0.6)' }} />
                : <Icon
                    className="w-4 h-4 transition-colors duration-150"
                    style={{ color: isHighlighted ? '#818cf8' : 'rgba(148,163,184,0.5)' }}
                  />
              }
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2.5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 hover:bg-red-500/10 hover:text-red-300 text-slate-400/70"
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </div>
    </aside>
  )
}
