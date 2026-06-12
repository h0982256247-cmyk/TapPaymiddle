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
        <Topbar title="設定" />
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

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

  return (
    <div>
      <Topbar title="平台設定" />
      <div className="p-6 max-w-2xl space-y-4">
        <PlatformSettingsForm initialData={platform ?? null} baseUrl={baseUrl} />
      </div>
    </div>
  )
}
