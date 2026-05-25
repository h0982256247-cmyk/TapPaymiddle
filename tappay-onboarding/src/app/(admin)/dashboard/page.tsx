import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  Users, Activity, CheckCircle2, Clock, AlertCircle, TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import type { MerchantStatus } from '@/types/merchant'

export const dynamic = 'force-dynamic'

const isPreview = process.env.PREVIEW_MODE === 'true'

export default async function DashboardPage() {
  if (isPreview) {
    const user = { email: 'admin@tappay.tw' }
    const stats = [
      { label: '商戶總數', value: 24, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: '已進件', value: 8, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: '已通過', value: 12, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
      { label: '待補件', value: 3, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    ]
    const recentMerchants = [
      { id: '1', partner_account: 'shop_001', company_name: '示範商店一', status: 'UNDER_REVIEW', created_at: new Date().toISOString() },
      { id: '2', partner_account: 'shop_002', company_name: '示範商店二', status: 'APPROVED', created_at: new Date().toISOString() },
      { id: '3', partner_account: 'shop_003', company_name: null, status: 'PENDING_SUPPLEMENT', created_at: new Date().toISOString() },
    ]
    const apiLogs = 1024
    return renderDashboard(user, stats, recentMerchants, apiLogs)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const role = user?.user_metadata?.role
  const isSuperAdmin = role === 'super_admin'

  // super_admin 用 service role（無 RLS 限制），platform merchant 用自己的 session
  const { createAdminClient } = await import('@/lib/supabase/server')
  const queryClient = isSuperAdmin ? createAdminClient() : supabase

  // no-role 用戶：取得自己的 platform_id 做 filter
  let platformId: string | null = null
  if (!isSuperAdmin) {
    const { data: platform } = await supabase
      .from('platforms')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()
    platformId = platform?.id ?? null
  }

  const buildMerchantQuery = (status?: string) => {
    let q = queryClient.from('merchants').select('*', { count: 'exact', head: true })
    if (!isSuperAdmin && platformId) q = q.eq('platform_id', platformId)
    if (status) q = q.eq('status', status)
    return q
  }

  // Stats queries in parallel
  const [
    { count: total },
    { count: pending },
    { count: approved },
    { count: supplement },
    { data: recentMerchants },
    { count: apiLogs },
  ] = await Promise.all([
    buildMerchantQuery(),
    buildMerchantQuery('SUBMITTED'),
    buildMerchantQuery('APPROVED'),
    buildMerchantQuery('PENDING_SUPPLEMENT'),
    (() => {
      let q = queryClient.from('merchants').select('id, partner_account, company_name, status, created_at').order('created_at', { ascending: false }).limit(8)
      if (!isSuperAdmin && platformId) q = q.eq('platform_id', platformId)
      return q
    })() as unknown as Promise<{ data: Array<{ id: string; partner_account: string; company_name: string | null; status: string; created_at: string }> | null }>,
    queryClient.from('merchant_api_logs').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: '商戶總數', value: total ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '已進件', value: pending ?? 0, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '已通過', value: approved ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '待補件', value: supplement ?? 0, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return renderDashboard(user, stats, recentMerchants ?? [], apiLogs ?? 0)
}

type StatItem = { label: string; value: number; icon: React.ElementType; color: string; bg: string }
type RecentMerchant = { id: string; partner_account: string; company_name: string | null; status: string; created_at: string }

function renderDashboard(
  user: { email?: string | null } | null,
  stats: StatItem[],
  recentMerchants: RecentMerchant[],
  apiLogs: number
) {
  return (
    <div>
      <Topbar
        title="總覽"
        description="TapPay 商戶進件管理"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="p-5 rounded-2xl border-gray-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Merchants */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">最新商戶</h2>
                <Link
                  href="/dashboard/merchants"
                  className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  查看全部 →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {(recentMerchants ?? []).map((m) => (
                  <Link
                    key={m.id}
                    href={`/dashboard/merchants/${m.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600">
                          {(m.company_name ?? m.partner_account ?? '').slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {m.company_name ?? m.partner_account}
                        </p>
                        <p className="text-xs text-gray-400">{m.partner_account}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <StatusBadge status={m.status as MerchantStatus} />
                      <span className="text-xs text-gray-400">
                        {new Date(m.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </Link>
                ))}
                {(!recentMerchants || recentMerchants.length === 0) && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    尚無商戶資料
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="p-5 rounded-2xl border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">API 呼叫紀錄</p>
                  <p className="text-xs text-gray-400">累計</p>
                </div>
              </div>
              <p className="text-3xl font-semibold text-gray-900">{apiLogs ?? 0}</p>
              <Link
                href="/dashboard/api-logs"
                className="text-xs text-gray-400 hover:text-gray-700 mt-2 inline-block"
              >
                查看詳細 →
              </Link>
            </Card>

            <Card className="p-5 rounded-2xl border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">狀態分布</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: '已進件', key: 'SUBMITTED' as MerchantStatus },
                  { label: '已通過', key: 'APPROVED' as MerchantStatus },
                  { label: '商代已建立', key: 'MERCHANT_CREATED' as MerchantStatus },
                  { label: '待補件', key: 'PENDING_SUPPLEMENT' as MerchantStatus },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <StatusBadge status={item.key} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
