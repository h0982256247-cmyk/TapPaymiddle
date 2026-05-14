'use client'

import { Bell, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopbarProps {
  title?: string
  description?: string
  email?: string | null
}

export function Topbar({ title, description, email }: TopbarProps) {
  const initials = email ? email.slice(0, 2).toUpperCase() : 'AD'

  return (
    <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        {title && <h1 className="text-sm font-semibold text-gray-900">{title}</h1>}
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>

      <div className="flex items-center gap-2">
        {/* Search hint */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-400 cursor-pointer hover:border-gray-300 transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>搜尋</span>
          <kbd className="px-1 py-0.5 rounded text-[10px] bg-gray-100 border border-gray-200">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors relative">
          <Bell className="w-4 h-4 text-gray-500" />
        </button>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="text-xs bg-gray-900 text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs text-gray-500">{email || '管理員'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>帳號設定</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">登出</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
