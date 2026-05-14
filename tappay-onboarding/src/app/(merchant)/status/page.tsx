import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Clock, AlertCircle, XCircle, Zap, RefreshCw } from 'lucide-react'
import type { MerchantStatus, PaymentMethod, Merchant, MerchantPaymentMethod } from '@/types/merchant'
import { PAYMENT_METHOD_LABELS } from '@/types/merchant'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const isPreview = process.env.PREVIEW_MODE === 'true'

type MerchantWithPayments = Merchant & { merchant_payment_methods: MerchantPaymentMethod[] }

const PREVIEW_MERCHANT: MerchantWithPayments = {
  id: 'preview',
  user_id: 'preview',
  partner_account: 'demo_merchant',
  merchant_type: 'E',
  industry_code: 'NON_SPECIAL_INDUSTRY',
  company_name: '示範股份有限公司',
  company_name_english: 'Demo Corp.',
  contact_email: 'demo@example.com',
  status: 'UNDER_REVIEW',
  partner_key: null,
  tappay_status_code: 6,
  tappay_opinion: null,
  is_complete: true,
  submitted_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  merchant_payment_methods: [
    { id: '1', merchant_id: 'preview', payment_method: 'ONLINE_CREDIT_CARD', payment_config: null, status: 'UNDER_REVIEW', merchant_id_ref: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', merchant_id: 'preview', payment_method: 'ATM', payment_config: null, status: 'UNDER_REVIEW', merchant_id_ref: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
}

export default async function StatusPage() {
  if (isPreview) {
    const merchant = PREVIEW_MERCHANT
    const paymentMethods = merchant.merchant_payment_methods
    return renderPage(merchant, paymentMethods)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*, merchant_payment_methods(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as { data: MerchantWithPayments | null }

  if (!merchant) redirect('/onboarding')

  const paymentMethods = merchant.merchant_payment_methods ?? []
  return renderPage(merchant, paymentMethods)
}

function renderPage(merchant: MerchantWithPayments, paymentMethods: MerchantPaymentMethod[]) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">申請進度</h1>
              <p className="text-xs text-gray-400">TapPay 商戶進件申請</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {/* Main Status Card */}
        <Card className="p-6 rounded-2xl border-gray-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {(() => {
                const s = merchant.status as MerchantStatus
                if (s === 'APPROVED' || s === 'MERCHANT_CREATED') return <CheckCircle2 className="w-5 h-5 text-green-500" />
                if (s === 'PENDING_SUPPLEMENT') return <AlertCircle className="w-5 h-5 text-orange-500" />
                if (s === 'REJECTED') return <XCircle className="w-5 h-5 text-red-500" />
                return <Clock className="w-5 h-5 text-blue-500" />
              })()}
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {merchant.company_name ?? merchant.partner_account}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">帳號：{merchant.partner_account}</p>
              </div>
            </div>
            <StatusBadge status={merchant.status as MerchantStatus} />
          </div>

          {merchant.tappay_opinion && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs font-medium text-amber-800 mb-1">TapPay 審核意見</p>
              <p className="text-sm text-amber-700">{merchant.tappay_opinion}</p>
            </div>
          )}
        </Card>

        {/* Payment Methods Status */}
        {paymentMethods.length > 0 && (
          <Card className="p-6 rounded-2xl border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">申請的支付方式</h3>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div key={pm.payment_method} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {PAYMENT_METHOD_LABELS[pm.payment_method as PaymentMethod] ?? pm.payment_method}
                    </p>
                    {pm.merchant_id_ref && (
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">商代：{pm.merchant_id_ref}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    pm.status === 'APPROVED'
                      ? 'bg-green-50 text-green-700'
                      : pm.status === 'REJECTED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {pm.status === 'APPROVED' ? '已開通' : pm.status === 'REJECTED' ? '未通過' : '審核中'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Timeline */}
        <Card className="p-6 rounded-2xl border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">進件時程</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: '申請提交', date: merchant.submitted_at, done: !!merchant.submitted_at },
              { label: 'TapPay 審核中', date: null, done: ['UNDER_REVIEW', 'APPROVED', 'MERCHANT_CREATED', 'REJECTED'].includes(merchant.status) },
              { label: '審核完成', date: null, done: ['APPROVED', 'MERCHANT_CREATED', 'REJECTED'].includes(merchant.status) },
              { label: '商代建立', date: null, done: merchant.status === 'MERCHANT_CREATED' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.done ? 'bg-gray-900' : 'bg-gray-200'}`} />
                <span className={item.done ? 'text-gray-900' : 'text-gray-400'}>{item.label}</span>
                {item.date && (
                  <span className="text-gray-400 text-xs ml-auto">
                    {new Date(item.date).toLocaleDateString('zh-TW')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Supplement action */}
        {merchant.status === 'PENDING_SUPPLEMENT' && (
          <Link
            href="/onboarding/supplement"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            前往補件
          </Link>
        )}

        <p className="text-center text-xs text-gray-400">
          審核期間請留意 {merchant.contact_email} 的 Email 通知
        </p>
      </div>
    </div>
  )
}
