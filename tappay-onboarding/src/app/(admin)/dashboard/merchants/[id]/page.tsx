import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import type { MerchantStatus, PaymentMethod } from '@/types/merchant'
import { PAYMENT_METHOD_LABELS, INDUSTRY_LABELS } from '@/types/merchant'
import { ArrowLeft, KeyRound } from 'lucide-react'
import Link from 'next/link'
import type { Merchant, MerchantBasicInfo, MerchantPaymentMethod, MerchantDocument, MerchantApiLog, MerchantNotifyLog } from '@/types/merchant'
import { CopyField } from '@/components/shared/copy-field'
import { ShopPageEditor } from '@/components/shared/shop-page-editor'

export const dynamic = 'force-dynamic'

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { id } = await params

  const [merchantRes, basicInfoRes, paymentMethodsRes, documentsRes, apiLogsRes, notifyLogsRes] =
    await Promise.all([
      supabase.from('merchants').select('*').eq('id', id).single(),
      supabase.from('merchant_basic_info').select('*').eq('merchant_id', id).single(),
      supabase.from('merchant_payment_methods').select('*').eq('merchant_id', id),
      supabase.from('merchant_documents').select('*').eq('merchant_id', id).order('created_at', { ascending: false }),
      supabase.from('merchant_api_logs').select('*').eq('merchant_id', id).order('created_at', { ascending: false }).limit(10),
      supabase.from('merchant_notify_logs').select('*').eq('merchant_id', id).order('created_at', { ascending: false }).limit(5),
    ])

  const merchant = merchantRes.data as Merchant | null
  if (!merchant) notFound()

  const shopPageRes = await supabase
    .from('merchant_shop_pages')
    .select('*')
    .eq('partner_account', merchant.partner_account)
    .maybeSingle()

  const basicInfo = basicInfoRes.data as MerchantBasicInfo | null
  const paymentMethods = (paymentMethodsRes.data ?? []) as MerchantPaymentMethod[]
  const documents = (documentsRes.data ?? []) as MerchantDocument[]
  const apiLogs = (apiLogsRes.data ?? []) as MerchantApiLog[]
  const notifyLogs = (notifyLogsRes.data ?? []) as unknown as MerchantNotifyLog[]
  const shopPage = shopPageRes?.data ?? null

  const companyInfo = basicInfo?.company_info as unknown as Record<string, unknown> | null
  const contactInfo = basicInfo?.contact_info as unknown as Record<string, unknown> | null
  const bankInfo = basicInfo?.bank_info as unknown as Record<string, unknown> | null

  return (
    <div>
      <Topbar title="商戶詳情" email={user?.email} />

      <div className="p-6 space-y-4 max-w-5xl">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/merchants"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            商戶列表
          </Link>
        </div>

        {/* Merchant Header */}
        <Card className="p-6 rounded-2xl border-gray-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-gray-600">
                  {(merchant.company_name ?? merchant.partner_account ?? '').slice(0, 2)}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {merchant.company_name ?? merchant.partner_account}
                </h1>
                <p className="text-sm text-gray-500 font-mono mt-0.5">{merchant.partner_account}</p>
                {merchant.partner_key && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                    <KeyRound className="w-3.5 h-3.5 flex-shrink-0" />
                    <CopyField value={merchant.partner_key} masked />
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={merchant.status as MerchantStatus} />
                  <span className="text-xs text-gray-400">
                    {merchant.merchant_type === 'E' ? '法人' : '自然人'}
                    {' · '}
                    {INDUSTRY_LABELS[merchant.industry_code as keyof typeof INDUSTRY_LABELS]}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-xs text-gray-400">進件日期</p>
              <p className="text-gray-700 font-medium mt-0.5">
                {merchant.submitted_at
                  ? new Date(merchant.submitted_at).toLocaleDateString('zh-TW')
                  : '未進件'}
              </p>
            </div>
          </div>

          {merchant.tappay_opinion && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs font-medium text-amber-800 mb-1">TapPay 審核意見</p>
              <p className="text-sm text-amber-700">{merchant.tappay_opinion}</p>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Company Info */}
          {companyInfo && (
            <Card className="p-5 rounded-2xl border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">營業資訊</h3>
              <dl className="space-y-2 text-sm">
                {(
                  [
                    ['公司名稱', companyInfo.company_name],
                    ['英文名稱', companyInfo.company_name_english],
                    ['營業地址', `${companyInfo.company_city} ${companyInfo.company_address}`],
                    ['電話', `${companyInfo.company_phone_area_code}-${companyInfo.company_phone}`],
                  ] as [string, unknown][]
                ).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</dt>
                    <dd className="text-gray-700">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {/* Contact Info */}
          {contactInfo && (
            <Card className="p-5 rounded-2xl border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">聯絡資訊</h3>
              <dl className="space-y-2 text-sm">
                {(
                  [
                    ['業務聯絡', contactInfo.business_contact_name],
                    ['聯絡電話', `${contactInfo.business_contact_phone_area_code}-${contactInfo.business_contact_phone}`],
                    ['帳務信箱', contactInfo.accounting_contact_email],
                  ] as [string, unknown][]
                ).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</dt>
                    <dd className="text-gray-700">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {/* Bank Info */}
          {bankInfo && (
            <Card className="p-5 rounded-2xl border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">撥款銀行</h3>
              <dl className="space-y-2 text-sm">
                {(
                  [
                    ['銀行代碼', bankInfo.bank_code],
                    ['分行代碼', bankInfo.branch_code],
                    ['帳戶戶名', bankInfo.bank_account_name],
                    ['帳號', '•••• ' + String(bankInfo.bank_account_number ?? '').slice(-4)],
                  ] as [string, unknown][]
                ).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="text-xs text-gray-400 w-20 flex-shrink-0">{label}</dt>
                    <dd className="text-gray-700 font-mono text-xs">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {/* Payment Methods */}
          <Card className="p-5 rounded-2xl border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">支付方式</h3>
            {(paymentMethods ?? []).length === 0 ? (
              <p className="text-xs text-gray-400">尚無申請</p>
            ) : (
              <div className="space-y-2">
                {(paymentMethods ?? []).map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-900">
                        {PAYMENT_METHOD_LABELS[pm.payment_method as PaymentMethod] ?? pm.payment_method}
                      </p>
                      {pm.merchant_id_ref && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{pm.merchant_id_ref}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pm.status === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {pm.status === 'APPROVED' ? '已開通' : '審核中'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Documents */}
        {(documents ?? []).length > 0 && (
          <Card className="p-5 rounded-2xl border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">已上傳文件</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(documents ?? []).map((doc) => (
                <div key={doc.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">📄</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{doc.document_type}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Shop Page */}
        {shopPage && (
          <Card className="p-5 rounded-2xl border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">快速審查頁面</h3>
            <ShopPageEditor
              initialData={shopPage}
              shopUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/shop/${merchant.partner_account}`}
            />
          </Card>
        )}

        {/* API Logs */}
        {(apiLogs ?? []).length > 0 && (
          <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">API 呼叫紀錄</h3>
              <Link href="/dashboard/api-logs" className="text-xs text-gray-400 hover:text-gray-700">
                查看全部 →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(apiLogs ?? []).map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.is_success ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm font-mono text-gray-700 w-48 truncate">{log.api_name}</span>
                  <span className="text-xs text-gray-400 flex-1">{log.error_message ?? 'OK'}</span>
                  <span className="text-xs text-gray-400">{log.duration_ms}ms</span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notify Logs */}
        {(notifyLogs ?? []).length > 0 && (
          <Card className="rounded-2xl border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Notify 紀錄</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {(notifyLogs ?? []).map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-center gap-4">
                  <StatusBadge
                    status={(['SUBMITTED','PENDING_SUPPLEMENT','SUPPLEMENTED','UNDER_REVIEW','APPROVED','REJECTED','DISABLED','MERCHANT_CREATED'].includes(log.status ?? '') ? log.status : 'DRAFT') as MerchantStatus}
                  />
                  <span className="text-xs text-gray-600">{log.payment_method}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(log.created_at).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
