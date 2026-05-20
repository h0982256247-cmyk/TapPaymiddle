import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { PlatformSettingsForm } from '@/components/dashboard/platform-settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isSuperAdmin = user?.user_metadata?.role === 'super_admin'

  // Super admin 不需要設定 platform
  if (isSuperAdmin) {
    return (
      <div>
        <Topbar title="設定" email={user?.email} />
        <div className="p-6 max-w-2xl">
          <div className="p-5 rounded-2xl border border-gray-200 bg-white">
            <p className="text-sm font-semibold text-gray-900 mb-1">超級管理員帳號</p>
            <p className="text-sm text-gray-500">此帳號具有全平台管理權限，不需要設定個別的 Platform Key。</p>
          </div>
        </div>
      </div>
    )
  }

  // 讀取現有 platform 資料
  const { data: platform } = await supabase
    .from('platforms')
    .select('id, name, slug, tappay_platform_key')
    .eq('user_id', user!.id)
    .maybeSingle()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <div>
      <Topbar title="平台設定" email={user?.email} />
      <div className="p-6 max-w-2xl space-y-4">
        <div className="p-1 rounded-2xl border border-blue-100 bg-blue-50">
          <p className="text-xs text-blue-700 px-4 py-2">
            設定完成後，你的專屬進件網址為：
            <span className="font-mono font-semibold ml-1">
              {baseUrl}/onboarding/{platform?.slug ?? '[識別碼]'}
            </span>
            ，請將此網址提供給你的商戶填寫進件申請。
          </p>
        </div>

        <PlatformSettingsForm initialData={platform ?? null} baseUrl={baseUrl} />
      </div>
    </div>
  )
}
