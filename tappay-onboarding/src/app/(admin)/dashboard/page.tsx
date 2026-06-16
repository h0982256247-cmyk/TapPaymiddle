import React from 'react'
import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  Users, Activity, CheckCircle2, Clock, AlertCircle, ArrowRight, TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import type { MerchantStatus } from '@/types/merchant'
import { getAuthContext } from '@/lib/auth-context'
import { getDashboardStats } from '@/lib/cached-queries'

// force-dynamic because createClient() uses cookies() — page itself can't be
// statically cached. DB queries are cached via unstable_cache in cached-queries.ts.
export const dynamic = 'force-dynamic'

const isPreview = process.env.PREVIEW_MODE === 'true'

export default async function DashboardPage() {
  if (isPreview) {
    const stats = {
      total: 24, submitted: 8, underReview: 5, pendingSupplement: 3,
      approved: 6, rejected: 1, merchantCreated: 4, draft: 2,
    }
    const recentMerchants = [
      { id: '1', partner_account: 'shop_001', company_name: '示範商店一', status: 'UNDER_REVIEW', created_at: new Date().toISOString() },
      { id: '2', partner_account: 'shop_002', company_name: '示範商店二', status: 'APPROVED', created_at: new Date().toISOString() },
      { id: '3', partner_account: 'shop_003', company_name: null, status: 'PENDING_SUPPLEMENT', created_at: new Date().toISOString() },
    ]
    return renderDashboard(stats, recentMerchants, 1024)
  }

  const { isSuperAdmin, platformId } = await getAuthContext()
  const { stats, recentMerchants, apiLogs } = await getDashboardStats(platformId, isSuperAdmin)

  return renderDashboard(stats, recentMerchants, apiLogs)
}

type Stats = {
  total: number
  draft: number
  submitted: number
  underReview: number
  pendingSupplement: number
  approved: number
  rejected: number
  merchantCreated: number
}

type RecentMerchant = { id: string; partner_account: string; company_name: string | null; status: string; created_at: string }

function renderDashboard(stats: Stats, recentMerchants: RecentMerchant[], apiLogs: number) {
  const activeCount = stats.submitted + stats.underReview + stats.pendingSupplement
  const completedCount = stats.approved + stats.merchantCreated

  const pipeline: Array<{ status: MerchantStatus; count: number; label: string }> = [
    { status: 'SUBMITTED', count: stats.submitted, label: '已進件' },
    { status: 'UNDER_REVIEW', count: stats.underReview, label: '審核中' },
    { status: 'PENDING_SUPPLEMENT', count: stats.pendingSupplement, label: '待補件' },
    { status: 'APPROVED', count: stats.approved, label: '審核通過' },
    { status: 'MERCHANT_CREATED', count: stats.merchantCreated, label: '商代已建立' },
  ]

  return (
    <div>
      <Topbar title="總覽" description="進件狀態一覽" />

      <div className="p-6 space-y-5">

        {/* Welcome hero */}
        <div
          className="relative overflow-hidden rounded-3xl px-7 py-6 text-white"
          style={{ background: 'linear-gradient(120deg, #7c6bf0 0%, #9d6bf0 55%, #ec5f9e 130%)' }}
        >
          <div className="absolute -top-10 -right-6 w-44 h-44 rounded-full bg-white/10" />
          <div className="absolute top-10 right-24 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-xl font-bold flex items-center gap-2">Hi，歡迎回來 <span aria-hidden>👋</span></p>
            <p className="text-sm text-white/85 mt-1.5">即時掌握 TapPay 商戶進件與審核狀態</p>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: '商戶總數',
              value: stats.total,
              sub: `${stats.draft} 份草稿`,
              icon: Users,
              accent: '#7c6bf0',
              bg: 'rgba(124,107,240,0.1)',
              href: '/dashboard/merchants',
            },
            {
              label: '進行中',
              value: activeCount,
              sub: `${stats.submitted} 已進件`,
              icon: Clock,
              accent: '#f5a524',
              bg: 'rgba(245,165,36,0.12)',
              href: `/dashboard/merchants?status=SUBMITTED`,
            },
            {
              label: '待補件',
              value: stats.pendingSupplement,
              sub: '需要關注',
              icon: AlertCircle,
              accent: '#ec5f9e',
              bg: 'rgba(236,95,158,0.1)',
              href: `/dashboard/merchants?status=PENDING_SUPPLEMENT`,
            },
            {
              label: '已完成',
              value: completedCount,
              sub: `${stats.merchantCreated} 商代已建立`,
              icon: CheckCircle2,
              accent: '#46c5ae',
              bg: 'rgba(70,197,174,0.12)',
              href: `/dashboard/merchants?status=MERCHANT_CREATED`,
            },
          ].map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.label} href={card.href}>
                <Card className="p-5 rounded-3xl border-0 ring-0 bg-white shadow-[0_2px_12px_rgba(45,49,66,0.05)] hover:shadow-[0_6px_20px_rgba(124,107,240,0.12)] transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ background: card.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: card.accent }} />
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: card.bg, color: card.accent }}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {card.sub}
                    </span>
                  </div>
                  <p className="text-[28px] leading-none font-bold text-[#2d3142] tabular-nums">{card.value}</p>
                  <p className="text-xs font-medium text-[#9296a8] mt-2">{card.label}</p>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Pipeline Tracker */}
        <Card className="p-5 rounded-3xl border-0 ring-0 bg-white shadow-[0_2px_12px_rgba(45,49,66,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#2d3142]">審核流程看板</h2>
              <p className="text-xs text-[#9296a8] mt-0.5">各階段商戶分布</p>
            </div>
            <Link
              href="/dashboard/merchants"
              className="flex items-center gap-1 text-xs text-[#7c6bf0] hover:text-[#6a5ae0] font-medium"
            >
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {pipeline.map((step, i) => (
              <Link key={step.status} href={`/dashboard/merchants?status=${step.status}`}>
                <div className="relative group cursor-pointer">
                  {/* Connector line */}
                  {i < pipeline.length - 1 && (
                    <div
                      className="absolute right-0 top-5 w-2 h-px translate-x-full z-10"
                      style={{ background: 'rgba(209,213,219,0.8)' }}
                    />
                  )}
                  <div
                    className="rounded-2xl p-3 text-center transition-all duration-150 group-hover:scale-[1.02]"
                    style={{
                      background: step.count > 0 ? 'rgba(124,107,240,0.08)' : '#f7f6fb',
                      border: step.count > 0 ? '1px solid rgba(124,107,240,0.18)' : '1px solid #eceaf3',
                    }}
                  >
                    <p
                      className="text-xl font-bold tabular-nums"
                      style={{ color: step.count > 0 ? '#6a5ae0' : '#b6b9c8' }}
                    >
                      {step.count}
                    </p>
                    <p className="text-[10px] font-medium text-[#9296a8] mt-1 leading-tight">{step.label}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Rejected indicator */}
          {stats.rejected > 0 && (
            <Link href="/dashboard/merchants?status=REJECTED">
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100/70 transition-colors cursor-pointer">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-xs text-red-700 font-medium">{stats.rejected} 筆審核不通過</span>
                <ArrowRight className="w-3 h-3 text-red-400 ml-auto" />
              </div>
            </Link>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Merchants */}
          <div className="lg:col-span-2">
            <Card className="rounded-3xl border-0 ring-0 bg-white shadow-[0_2px_12px_rgba(45,49,66,0.05)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f0f8]">
                <h2 className="text-sm font-semibold text-[#2d3142]">最新商戶</h2>
                <Link
                  href="/dashboard/merchants"
                  className="flex items-center gap-1 text-xs text-[#7c6bf0] hover:text-[#6a5ae0] font-medium"
                >
                  查看全部 <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-[#f4f3f9]">
                {(recentMerchants ?? []).map((m) => (
                  <Link
                    key={m.id}
                    href={`/dashboard/merchants/${m.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[#faf9fe] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #7c6bf0, #ec5f9e)' }}
                      >
                        {(m.company_name ?? m.partner_account ?? '').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#2d3142] truncate">
                          {m.company_name ?? m.partner_account}
                        </p>
                        <p className="text-xs text-[#a3a7b7] font-mono">{m.partner_account}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <StatusBadge status={m.status as MerchantStatus} />
                      <span className="text-xs text-[#a3a7b7] tabular-nums">
                        {new Date(m.created_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#cfd2dd] group-hover:text-[#7c6bf0] transition-colors" />
                    </div>
                  </Link>
                ))}
                {(!recentMerchants || recentMerchants.length === 0) && (
                  <div className="px-5 py-10 text-center text-sm text-[#a3a7b7]">
                    尚無商戶資料
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* API Logs */}
            <Card className="p-5 rounded-3xl border-0 ring-0 bg-white shadow-[0_2px_12px_rgba(45,49,66,0.05)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,107,240,0.1)' }}>
                  <Activity className="w-5 h-5" style={{ color: '#7c6bf0' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2d3142]">API 呼叫紀錄</p>
                  <p className="text-xs text-[#9296a8]">累計次數</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#2d3142] tabular-nums">{apiLogs.toLocaleString()}</p>
              <Link
                href="/dashboard/api-logs"
                className="flex items-center gap-1 text-xs text-[#7c6bf0] hover:text-[#6a5ae0] font-medium mt-2"
              >
                查看詳細 <ArrowRight className="w-3 h-3" />
              </Link>
            </Card>

            {/* Attention Required */}
            {stats.pendingSupplement > 0 && (
              <Card className="p-5 rounded-3xl overflow-hidden relative border-0 ring-0 shadow-[0_2px_12px_rgba(45,49,66,0.05)]"
                style={{ background: 'linear-gradient(135deg, #fff7ed, #ffedd5)' }}
              >
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-6 translate-x-6 opacity-30"
                  style={{ background: '#f97316' }}
                />
                <AlertCircle className="w-5 h-5 mb-2" style={{ color: '#ea580c' }} />
                <p className="text-sm font-semibold text-orange-900">待補件通知</p>
                <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: '#c2410c' }}>
                  {stats.pendingSupplement}
                </p>
                <p className="text-xs text-orange-700/80 mt-0.5">筆需要補件</p>
                <Link
                  href="/dashboard/merchants?status=PENDING_SUPPLEMENT"
                  className="flex items-center gap-1 text-xs font-semibold mt-3"
                  style={{ color: '#c2410c' }}
                >
                  立即處理 <ArrowRight className="w-3 h-3" />
                </Link>
              </Card>
            )}

            {/* Status Summary */}
            <Card className="p-5 rounded-3xl border-0 ring-0 bg-white shadow-[0_2px_12px_rgba(45,49,66,0.05)]">
              <p className="text-sm font-semibold text-[#2d3142] mb-3">狀態摘要</p>
              <div className="space-y-2.5">
                {([
                  { label: '審核通過', count: stats.approved, status: 'APPROVED' as MerchantStatus },
                  { label: '商代已建立', count: stats.merchantCreated, status: 'MERCHANT_CREATED' as MerchantStatus },
                  { label: '審核不通過', count: stats.rejected, status: 'REJECTED' as MerchantStatus },
                  { label: '草稿', count: stats.draft, status: 'DRAFT' as MerchantStatus },
                ] as Array<{ label: string; count: number; status: MerchantStatus }>).map((item) => (
                  <Link
                    key={item.status}
                    href={`/dashboard/merchants?status=${item.status}`}
                    className="flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <StatusBadge status={item.status} />
                    <span className="text-sm font-semibold text-gray-700 tabular-nums">{item.count}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
