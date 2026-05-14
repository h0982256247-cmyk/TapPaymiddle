import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

    const isAdmin = user.user_metadata?.role === 'admin'
    if (!isAdmin) redirect('/onboarding')
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
