import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { getAuthContext } from '@/lib/auth-context'
import { RecoverMerchantForm } from '@/components/admin/recover-merchant-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RecoverMerchantPage() {
  const { isSuperAdmin } = await getAuthContext()
  if (!isSuperAdmin) redirect('/dashboard/merchants')

  return (
    <div>
      <Topbar title="帳號復原" description="修復 TapPay↔DB 資料失步問題" />

      <div className="p-6 max-w-2xl space-y-4">
        <Link
          href="/dashboard/merchants"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          返回商戶列表
        </Link>

        <RecoverMerchantForm />
      </div>
    </div>
  )
}
