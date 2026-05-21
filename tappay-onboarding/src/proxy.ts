import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // x-pathname header: dashboard layout で現在パスを判定するために必要
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッション更新（必須 — これがないと server component でセッションが読めない）
  const { data: { user } } = await supabase.auth.getUser()

  const role = user?.user_metadata?.role as string | undefined
  const isDashboardUser = role === 'admin' || role === 'super_admin'

  // ログイン済みで /login にアクセス → ダッシュボードへ
  if (pathname === '/login' && user && isDashboardUser) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // /login は認証不要 — ループ防止のため必ず通過
  if (pathname === '/login') {
    return supabaseResponse
  }

  // /dashboard 系: 未ログインまたは権限なし → /login へ
  if (pathname.startsWith('/dashboard')) {
    if (!user || !isDashboardUser) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
