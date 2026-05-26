import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import type { MerchantStatus } from '@/types/merchant'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/merchant'
import { getAuthContext } from '@/lib/auth-context'

export const revalidate = 30

const isPreview = process.env.PREVIEW_MODE === 'true'

interface NotifyLogRow {
  id: string
  partner_account: string | null
  status: string | null
  status_code: number | null
  payment_method: string | null
  created_at: string
  merchants: { partner_account?: string; company_name?: string } | null
}

const PREVIEW_NOTIFY: NotifyLogRow[] = [
  { id: '1', partner_account: 'shop_001', status: 'UNDER_REVIEW', status_code: 6, payment_method: 'ONLINE_CREDIT_CARD', created_at: new Date().toISOString(), merchants: { company_name: '示範股份有限公司' } },
  { id: '2', partner_account: 'shop_001', status: 'APPROVED', status_code: 7, payment_method: 'ATM', created_at: new Date().toISOString(), merchants: { company_name: '示範股份有限公司' } },
  { id: '3', partner_account: 'shop_002', status: 'PENDING_SUPPLEMENT', status_code: 4, payment_method: 'ONLINE_CREDIT_CARD', created_at: new Date().toISOString(), merchants: { company_name: '旅遊服務有限公司' } },
  { id: '4', partner_account: 'shop_002', status: 'MERCHANT_CREATED', status_code: 16, payment_method: 'ONLINE_CREDIT_CARD', created_at: new Date().toISOString(), merchants: { company_name: '旅遊服務有限公司' } },
]

export default async function NotifyLogsPage() {
  if (isPreview) {
    return renderLogs(PREVIEW_NOTIFY)
  }

  const { queryClient, isSuperAdmin, platformId } = await getAuthContext()

  // For non-super-admin: fetch partner_accounts in the same Promise.all as the logs query
  // This parallelises what was previously 2 sequential DB calls
  let partnerAccounts: string[] | null = null
  if (!isSuperAdmin) {
    if (platformId) {
      const { data: merchants } = await queryClient
        .from('merchants')
        .select('partner_account')
        .eq('platform_id', platformId)
      partnerAccounts = (merchants ?? []).map((m) => m.partner_account).filter(Boolean) as string[]
    } else {
      partnerAccounts = []
    }
  }

  let query = queryClient
    .from('merchant_notify_logs')
    .select('id, partner_account, status, status_code, payment_method, created_at, merchants(partner_account, company_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (partnerAccounts !== null) {
    query = query.in('partner_account', partnerAccounts.length > 0 ? partnerAccounts : ['__none__'])
  }

  const { data: logs } = await query as { data: NotifyLogRow[] | null }

  return renderLogs(logs ?? [])
}

function renderLogs(logs: NotifyLogRow[]) {
  const validStatuses = ['SUBMITTED','PENDING_SUPPLEMENT','SUPPLEMENTED','UNDER_REVIEW','APPROVED','REJECTED','DISABLED','MERCHANT_CREATED']

  return (
    <div>
      <Topbar title="Notify 紀錄" description={`最近 ${logs.length} 筆`} />

      <div className="p-6">
        <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">商戶</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">狀態</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">支付方式</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">TapPay 狀態碼</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const merchant = log.merchants as { partner_account?: string; company_name?: string } | null
                  const statusKey = validStatuses.includes(log.status ?? '') ? log.status as MerchantStatus : 'DRAFT' as MerchantStatus

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900">{merchant?.company_name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{log.partner_account}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={statusKey} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">
                        {log.payment_method
                          ? (PAYMENT_METHOD_LABELS[log.payment_method as PaymentMethod] ?? log.payment_method)
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {log.status_code ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs">
                        {new Date(log.created_at).toLocaleString('zh-TW', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                      尚無 Notify 紀錄
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
