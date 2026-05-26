import { cache } from 'react'
import { createClient, createAdminClient } from './supabase/server'

/**
 * Cached per-request auth context.
 * React cache() deduplicates calls within the same render tree —
 * so if both layout and page call this, only one network round-trip is made.
 *
 * Security model:
 * - middleware.ts calls getUser() → validates JWT with Supabase servers + refreshes cookie
 * - Here we call getSession() → reads the already-validated session from cookie (0 network calls)
 *   This is safe because middleware is the security boundary; session in cookie is already fresh.
 */
export const getAuthContext = cache(async () => {
  const supabase = await createClient()

  // getSession() reads from cookie — middleware already validated the JWT, so this is safe and fast
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const isSuperAdmin = user?.user_metadata?.role === 'super_admin'
  const queryClient = isSuperAdmin ? createAdminClient() : supabase

  let platformId: string | null = null
  if (!isSuperAdmin && user) {
    const { data: platform } = await supabase
      .from('platforms')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    platformId = platform?.id ?? null
  }

  return { user, supabase, queryClient, isSuperAdmin, platformId }
})
