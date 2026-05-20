import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import type { MerchantStatus } from '@/types/merchant'
import { INDUSTRY_LABELS } from '@/types/merchant'
import { Search, Filter } from 'lucide-react'
import type { Merchant } from '@/types/merchant'

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
    const user = { email: 'admin@tappay.tw' }
    const merchants = PREVIEW_MERCHANTS
    return renderPage(user, merchants, params)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const role = user?.user_metadata?.role
  const isSuperAdmin = role === 'super_admin'

  // super_admin 用 service role（無 RLS 限制），platform merchant 用自己的 session
  const { createAdminClient } = await import('@/lib/supabase/server')
  const queryClient = isSuperAdmin ? await createAdminClient() : supabase

  let query = queryClient
    .from('merchants')
    .select('id, partner_account, company_name, company_name_english, merchant_type, industry_code, status, tappay_status_code, tappay_opinion, submitted_at, created_at, platform_id')
    .order('created_at', { ascending: false })

  // platform merchant 只看自己平台的商戶
  if (!isSuperAdmin) {
    const { data: platform } = await supabase
      .from('platforms')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()
    if (platform) {
      query = query.eq('platform_id', platform.id)
    }
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.q) {
    query = query.or(`partner_account.ilike.%${params.q}%,company_name.ilike.%${params.q}%`)
  }

  const { data: merchants } = await query as { data: Merchant[] | null }
  return renderPage(user, merchants ?? [], params)
}

function renderPage(
  user: { email?: string | null } | null,
  merchants: Merchant[],
  params: SearchParams
) {
  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: '全部' },
    { value: 'DRAFT', label: '草稿' },
    { value: 'SUBMITTED', label: '已進件' },
    { value: 'UNDER_REVIEW', label: '審核中' },
    { value: 'PENDING_SUPPLEMENT', label: '待補件' },
    { value: 'APPROVED', label: '已通過' },
    { value: 'REJECTED', label: '未通過' },
    { value: 'MERCHANT_CREATED', label: '商代已建立' },
  ]

  return (
    <div>
      <Topbar title="商戶管理" description={`共 ${merchants?.length ?? 0} 筆`} email={user?.email} />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <Card className="p-4 rounded-2xl border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <form className="flex gap-3 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="搜尋帳號或公司名稱..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  name="status"
                  defaultValue={params.status ?? ''}
                  className="h-9 px-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
              >
                搜尋
              </button>
            </form>
          </div>
        </Card>

        {/* Table */}
        <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">商戶</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">商家類型</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">產業</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">狀態</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">進件日期</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(merchants ?? []).map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-600">
                            {(m.company_name ?? m.partner_account ?? '').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{m.company_name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{m.partner_account}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                        {m.merchant_type === 'E' ? '法人' : m.merchant_type === 'P' ? '自然人' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-xs">
                      {INDUSTRY_LABELS[m.industry_code as keyof typeof INDUSTRY_LABELS] ?? m.industry_code ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={m.status as MerchantStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {m.submitted_at
                        ? new Date(m.submitted_at).toLocaleDateString('zh-TW')
                        : '未進件'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/merchants/${m.id}`}
                        className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                      >
                        查看 →
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!merchants || merchants.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                      {params.q || params.status ? '找不到符合條件的商戶' : '尚無商戶資料'}
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
