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
    <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-[#eceaf3]">
      {/* Logo */}
      <div className="h-16 flex items-center px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #7c6bf0, #ec5f9e)' }}>
            <Zap className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold leading-tight text-[#2d3142]">TapPay</p>
            <p className="text-[11px] leading-tight text-[#a3a7b7]">商戶進件系統</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#b6b9c8]">
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
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                isHighlighted
                  ? 'font-semibold bg-[#efecfd] text-[#6a5ae0]'
                  : 'font-medium text-[#7e8398] hover:bg-[#f5f4fb] hover:text-[#2d3142]'
              )}
            >
              {isHighlighted && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#7c6bf0]" />
              )}
              {isLoading
                ? <Loader2 className="w-[18px] h-[18px] animate-spin text-[#7c6bf0]" />
                : <Icon
                    className={cn(
                      'w-[18px] h-[18px] transition-colors duration-150',
                      isHighlighted ? 'text-[#7c6bf0]' : 'text-[#a3a7b7] group-hover:text-[#2d3142]'
                    )}
                  />
              }
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-3">
        {/* Status card */}
        <div className="rounded-2xl p-4 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c6bf0, #9d6bf0)' }}>
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
          <p className="text-xs font-semibold relative">系統運作中</p>
          <p className="text-[11px] text-white/80 mt-0.5 relative">即時同步 TapPay 進件狀態</p>
        </div>

        {/* Profile + logout */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #7c6bf0, #ec5f9e)' }}>
            管
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#2d3142] truncate leading-tight">管理員</p>
            <p className="text-[11px] text-[#a3a7b7] truncate leading-tight">後台管理</p>
          </div>
          <button
            onClick={handleSignOut}
            title="登出"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a3a7b7] hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
