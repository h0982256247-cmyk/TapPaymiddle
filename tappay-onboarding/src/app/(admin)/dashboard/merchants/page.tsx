import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import type { MerchantStatus } from '@/types/merchant'
import { INDUSTRY_LABELS } from '@/types/merchant'
import { Search, ArrowRight, ChevronRight } from 'lucide-react'
import type { Merchant } from '@/types/merchant'
import { cn } from '@/lib/utils'
import { getAuthContext } from '@/lib/auth-context'
import { getMerchantsList } from '@/lib/cached-queries'

export const dynamic = 'force-dynamic'

const isPreview = process.env.PREVIEW_MODE === 'true'

const PREVIEW_MERCHANTS: Merchant[] = [
  { id: '1', user_id: 'u1', partner_account: 'shop_001', merchant_type: 'E', industry_code: 'NON_SPECIAL_INDUSTRY', company_name: '示範股份有限公司', company_name_english: 'Demo Corp', contact_email: 'a@demo.com', status: 'UNDER_REVIEW', partner_key: null, tappay_status_code: 6, tappay_opinion: null, is_complete: true, submitted_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', user_id: 'u2', partner_account: 'shop_002', merchant_type: 'E', industry_code: 'TRAVEL_AGENCY', company_name: '旅遊服務有限公司', company_name_english: 'Travel Ltd', contact_email: 'b@demo.com', status: 'APPROVED', partner_key: null, tappay_status_code: 7, tappay_opinion: null, is_complete: true, submitted_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', user_id: 'u3', partner_account: 'shop_003', merchant_type: 'P', industry_code: 'NON_SPECIAL_INDUSTRY', company_name: null, company_name_english: null, contact_email: 'c@demo.com', status: 'PENDING_SUPPLEMENT', partner_key: null, tappay_status_code: 4, tappay_opinion: '請補充負責人身分證正反面', is_complete: false, submitted_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', user_id: 'u4', partner_account: 'shop_004', merchant_type: 'E', industry_code: 'CRAM_SCHOOL', company_name: '補習班教育機構', company_name_english: 'Edu School', contact_email: 'd@demo.com', status: 'MERCHANT_CREATED', partner_key: null, tappay_status_code: 16, tappay_opinion: null, is_complete: true, submitted_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', user_id: 'u5', partner_account: 'shop_005', merchant_type: 'E', industry_code: 'NON_SPECIAL_INDUSTRY', company_name: '草稿商家', company_name_english: null, contact_email: 'e@demo.com', status: 'DRAFT', partner_key: null, tappay_status_code: null, tappay_opinion: null, is_complete: false, submitted_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

interface SearchParams {
  status?: string
  q?: string
}

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  if (isPreview) {
    return renderPage(PREVIEW_MERCHANTS, params)
  }

  const { isSuperAdmin, platformId } = await getAuthContext()
  const merchants = await getMerchantsList(platformId, isSuperAdmin, params.status, params.q) as Merchant[]
  return renderPage(merchants, params, isSuperAdmin)
}

const STATUS_TABS = [
  { value: '', label: '全部' },
  { value: 'SUBMITTED', label: '已進件' },
  { value: 'UNDER_REVIEW', label: '審核中' },
  { value: 'PENDING_SUPPLEMENT', label: '待補件' },
  { value: 'SUPPLEMENTED', label: '已補件' },
  { value: 'APPROVED', label: '已通過' },
  { value: 'MERCHANT_CREATED', label: '商代已建立' },
  { value: 'REJECTED', label: '未通過' },
  { value: 'DRAFT', label: '草稿' },
]

function renderPage(merchants: Merchant[], params: SearchParams, isSuperAdmin = false) {
  const activeStatus = params.status ?? ''

  return (
    <div>
      <Topbar
        title="商戶管理"
        description={`${merchants?.length ?? 0} 筆`}
      />

      <div className="p-6 space-y-4">

        {/* Super Admin: 帳號復原入口 */}
        {isSuperAdmin && (
          <div className="flex justify-end">
            <Link
              href="/dashboard/merchants/recover"
              className="flex items-center gap-1.5 text-xs text-amber-600 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <span>⚠</span> 帳號復原工具
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Status Pill Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => {
              const isActive = activeStatus === tab.value
              return (
                <Link
                  key={tab.value}
                  href={`/dashboard/merchants${tab.value ? `?status=${tab.value}` : ''}`}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[#7c6bf0] text-white shadow-sm shadow-[#7c6bf0]/30'
                      : 'bg-white text-[#7e8398] border border-[#eceaf3] hover:border-[#d8d4ec] hover:text-[#2d3142]'
                  )}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>

          {/* Search */}
          <form className="flex gap-2 ml-auto" method="get" action="/dashboard/merchants">
            {activeStatus && (
              <input type="hidden" name="status" value={activeStatus} />
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                name="q"
                defaultValue={params.q}
                placeholder="搜尋帳號或公司名稱"
                className="w-52 h-9 pl-8 pr-3 rounded-xl border border-[#eceaf3] text-xs bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c6bf0]/20 focus:border-[#b9b0f5] placeholder:text-[#a3a7b7]"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl text-xs font-medium text-white transition-colors hover:brightness-110"
              style={{ background: '#7c6bf0' }}
            >
              搜尋
            </button>
            {params.q && (
              <Link
                href={`/dashboard/merchants${activeStatus ? `?status=${activeStatus}` : ''}`}
                className="h-9 px-3 rounded-xl text-xs font-medium text-[#7e8398] bg-white border border-[#eceaf3] flex items-center hover:border-[#d8d4ec]"
              >
                清除
              </Link>
            )}
          </form>
        </div>

        {/* Table */}
        <Card className="rounded-3xl border-0 ring-0 bg-white shadow-[0_2px_12px_rgba(45,49,66,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf9fe] border-b border-[#f1f0f8]">
                  <th className="text-left text-[11px] font-semibold text-[#a3a7b7] uppercase tracking-wider px-5 py-3.5">商戶</th>
                  <th className="text-left text-[11px] font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">類型</th>
                  <th className="text-left text-[11px] font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">產業</th>
                  <th className="text-left text-[11px] font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">狀態</th>
                  <th className="text-left text-[11px] font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">進件日期</th>
                  <th className="px-4 py-3.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(merchants ?? []).map((m) => (
                  <tr
                    key={m.id}
                    className="transition-colors hover:bg-[#faf9fe] group border-b border-[#f4f3f9]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #7c6bf0, #ec5f9e)' }}
                        >
                          {(m.company_name ?? m.partner_account ?? '').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-[#2d3142]">{m.company_name ?? '—'}</p>
                          <p className="text-xs text-[#a3a7b7] font-mono mt-0.5">{m.partner_account}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f1f0f8] text-[#7e8398]">
                        {m.merchant_type === 'E' ? '法人' : m.merchant_type === 'P' ? '自然人' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-[#7e8398]">
                        {INDUSTRY_LABELS[m.industry_code as keyof typeof INDUSTRY_LABELS] ?? m.industry_code ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <StatusBadge status={m.status as MerchantStatus} />
                        {m.tappay_opinion && (
                          <p className="text-[10px] text-orange-600 mt-1 max-w-[160px] truncate" title={m.tappay_opinion}>
                            {m.tappay_opinion}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-[#7e8398] tabular-nums">
                        {m.submitted_at
                          ? new Date(m.submitted_at).toLocaleDateString('zh-TW')
                          : <span className="text-[#cfd2dd]">未進件</span>
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/merchants/${m.id}`}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors group-hover:bg-[#efecfd]"
                      >
                        <ChevronRight className="w-4 h-4 text-[#cfd2dd] group-hover:text-[#7c6bf0] transition-colors" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!merchants || merchants.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#f1f0f8]">
                          <Search className="w-4 h-4 text-[#a3a7b7]" />
                        </div>
                        <p className="text-sm text-[#7e8398]">
                          {params.q || params.status ? '找不到符合條件的商戶' : '尚無商戶資料'}
                        </p>
                        {(params.q || params.status) && (
                          <Link
                            href="/dashboard/merchants"
                            className="text-xs text-[#7c6bf0] hover:text-[#6a5ae0] font-medium flex items-center gap-1 mt-1"
                          >
                            清除篩選 <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
