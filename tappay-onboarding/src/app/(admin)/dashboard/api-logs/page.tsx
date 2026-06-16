import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { CheckCircle2, XCircle } from 'lucide-react'
import { getApiLogs } from '@/lib/cached-queries'

export const dynamic = 'force-dynamic'

const isPreview = process.env.PREVIEW_MODE === 'true'

interface ApiLog {
  id: string
  api_name: string
  partner_account: string | null
  is_success: boolean | null
  duration_ms: number | null
  error_message: string | null
  created_at: string
  merchants: { partner_account?: string; company_name?: string } | null
}

const PREVIEW_LOGS: ApiLog[] = [
  { id: '1', api_name: 'CREATE_PARTNER_ACCOUNT', partner_account: 'shop_001', is_success: true, duration_ms: 320, error_message: null, created_at: new Date().toISOString(), merchants: { company_name: '示範股份有限公司' } },
  { id: '2', api_name: 'BASIC', partner_account: 'shop_001', is_success: true, duration_ms: 450, error_message: null, created_at: new Date().toISOString(), merchants: { company_name: '示範股份有限公司' } },
  { id: '3', api_name: 'ADDITIONAL', partner_account: 'shop_001', is_success: true, duration_ms: 280, error_message: null, created_at: new Date().toISOString(), merchants: { company_name: '示範股份有限公司' } },
  { id: '4', api_name: 'QUALIFICATION_FILE', partner_account: 'shop_001', is_success: true, duration_ms: 890, error_message: null, created_at: new Date().toISOString(), merchants: { company_name: '示範股份有限公司' } },
  { id: '5', api_name: 'CREATE_PARTNER_ACCOUNT', partner_account: 'shop_002', is_success: false, duration_ms: 150, error_message: 'Partner account already exists', created_at: new Date().toISOString(), merchants: { company_name: '旅遊服務有限公司' } },
]

export default async function ApiLogsPage() {
  if (isPreview) {
    return renderLogs(PREVIEW_LOGS)
  }

  const logs = await getApiLogs() as ApiLog[]
  return renderLogs(logs)
}


function renderLogs(logs: ApiLog[]) {
  return (
    <div>
      <Topbar title="API 呼叫紀錄" description={`最近 ${logs.length} 筆`} />

      <div className="p-6">
        <Card className="rounded-3xl border-0 ring-0 shadow-[0_2px_12px_rgba(45,49,66,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f1f0f8] bg-[#faf9fe]">
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5 w-8"></th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">API</th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">商戶</th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">狀態</th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">耗時</th>
                  <th className="text-left text-xs font-semibold text-[#a3a7b7] uppercase tracking-wider px-4 py-3.5">時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f3f9]">
                {logs.map((log) => {
                  const merchant = log.merchants as { partner_account?: string; company_name?: string } | null
                  return (
                    <tr key={log.id} className="hover:bg-[#faf9fe] transition-colors">
                      <td className="px-4 py-3">
                        {log.is_success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-[#efecfd] px-2 py-0.5 rounded-md text-[#6a5ae0]">
                          {log.api_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#2d3142]">{merchant?.company_name ?? '—'}</p>
                        <p className="text-xs text-[#a3a7b7]">{log.partner_account}</p>
                      </td>
                      <td className="px-4 py-3">
                        {log.is_success ? (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">成功</span>
                        ) : (
                          <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full" title={log.error_message ?? ''}>
                            失敗
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#7e8398] text-xs">{log.duration_ms}ms</td>
                      <td className="px-4 py-3 text-[#a3a7b7] text-xs">
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
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#a3a7b7]">
                      尚無 API 呼叫紀錄
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
