import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/sidebar'

const isPreview = process.env.PREVIEW_MODE === 'true'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isPreview) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const role = user.user_metadata?.role
    if (role !== 'admin' && role !== 'super_admin') redirect('/login')

    // platform merchant 尚未完成設定時，強制導向設定頁
    if (role === 'admin') {
      const headersList = await headers()
      const pathname = headersList.get('x-pathname') ?? ''
      if (!pathname.startsWith('/dashboard/settings')) {
        const { data: platform } = await supabase
          .from('platforms')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!platform) redirect('/dashboard/settings')
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-60">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
