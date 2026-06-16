import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import type { MerchantStatus } from '@/types/merchant'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/merchant'
import { getAuthContext } from '@/lib/auth-context'
import { getNotifyLogs } from '@/lib/cached-queries'

export const dynamic = 'force-dynamic'

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

  const { isSuperAdmin, platformId } = await getAuthContext()
  const logs = await getNotifyLogs(platformId, isSuperAdmin) as NotifyLogRow[]

  return renderLogs(logs)
}

function renderLogs(logs: NotifyLogRow[]) {
  const validStatuses = ['SUBMITTED','PENDING_SUPPLEMENT','SUPPLEMENTED','UNDER_REVIEW','APPROVED','REJECTED','DISABLED','MERCHANT_CREATED']

  return (
    <div>
      <Topbar title="Notify 紀錄" description={`最近 ${logs.length} 筆`} />

      <div className="p-6">
        <Card className="rounded-3xl border-0 ring-0 shadow-[0_2px_12px_rgba(45,49,66,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f1f0f8] bg-[#faf9fe]">
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">商戶</th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">狀態</th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">支付方式</th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">TapPay 狀態碼</th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f3f9]">
                {logs.map((log) => {
                  const merchant = log.merchants as { partner_account?: string; company_name?: string } | null
                  const statusKey = validStatuses.includes(log.status ?? '') ? log.status as MerchantStatus : 'DRAFT' as MerchantStatus

                  return (
                    <tr key={log.id} className="hover:bg-[#faf9fe] transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#2d3142]">{merchant?.company_name ?? '—'}</p>
                        <p className="text-xs text-[#a3a7b7]">{log.partner_account}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={statusKey} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#7e8398]">
                        {log.payment_method
                          ? (PAYMENT_METHOD_LABELS[log.payment_method as PaymentMethod] ?? log.payment_method)
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-[#efecfd] px-2 py-0.5 rounded-md text-[#6a5ae0]">
                          {log.status_code ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#a3a7b7] text-xs">
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
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-[#a3a7b7]">
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
