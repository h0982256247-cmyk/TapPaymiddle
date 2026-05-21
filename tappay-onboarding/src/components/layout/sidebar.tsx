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
  ChevronRight,
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

  // 頁面切換完成後清除 pending 狀態
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
    <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">TapPay</p>
            <p className="text-[10px] text-gray-400 leading-tight">商戶進件系統</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
                'group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isHighlighted
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <div className="flex items-center gap-2.5">
                {isLoading
                  ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  : <Icon className={cn('w-4 h-4', isHighlighted ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600')} />
                }
                {item.label}
              </div>
              {isHighlighted && !isLoading && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          登出
        </button>
      </div>
    </aside>
  )
}
