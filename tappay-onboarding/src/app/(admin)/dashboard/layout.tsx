import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/sidebar'
import { getAuthContext } from '@/lib/auth-context'

const isPreview = process.env.PREVIEW_MODE === 'true'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isPreview) {
    // getAuthContext uses React.cache() — deduplicated across layout + page in same render tree
    // getSession() reads from cookie (already validated by middleware) — no extra network call
    const { user, isSuperAdmin, platformId } = await getAuthContext()

    if (!user) redirect('/login')

    // non-super_admin users must have a platform configured
    if (!isSuperAdmin && platformId === null) {
      const headersList = await headers()
      const pathname = headersList.get('x-pathname') ?? ''
      if (!pathname.startsWith('/dashboard/settings')) {
        redirect('/dashboard/settings')
      }
    }
  }

  return (
    <div className="flex h-screen bg-[#f4f3f9]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
