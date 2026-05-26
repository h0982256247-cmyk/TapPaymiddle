import { cache } from 'react'
import { createClient, createAdminClient } from './supabase/server'

/**
 * Cached per-request auth context.
 * React cache() deduplicates calls within the same render tree —
 * so if both layout and page call this, only one network round-trip is made.
 */
export const getAuthContext = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
