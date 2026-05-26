import { unstable_cache } from 'next/cache'
import { createAdminClient } from './supabase/server'

/**
 * unstable_cache wraps the DB query result — unlike `revalidate` on pages
 * (which is ignored when cookies() is used), this actually stores results
 * in Next.js's Data Cache keyed by the arguments.
 *
 * Cache tag 'merchants' lets us call revalidateTag('merchants') after
 * a new onboarding submission to bust the cache immediately.
 */

const REVALIDATE = 30 // seconds

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export const getDashboardStats = unstable_cache(
  async (platformId: string | null, isSuperAdmin: boolean) => {
    const admin = createAdminClient()

    const buildQ = (status?: string) => {
      let q = admin.from('merchants').select('*', { count: 'exact', head: true })
      if (!isSuperAdmin && platformId) q = q.eq('platform_id', platformId)
      if (status) q = q.eq('status', status)
      return q
    }

    const [
      { count: total },
      { count: draft },
      { count: submitted },
      { count: underReview },
      { count: pendingSupplement },
      { count: approved },
      { count: rejected },
      { count: merchantCreated },
      { data: recentMerchants },
      { count: apiLogs },
    ] = await Promise.all([
      buildQ(),
      buildQ('DRAFT'),
      buildQ('SUBMITTED'),
      buildQ('UNDER_REVIEW'),
      buildQ('PENDING_SUPPLEMENT'),
      buildQ('APPROVED'),
      buildQ('REJECTED'),
      buildQ('MERCHANT_CREATED'),
      (() => {
        let q = admin
          .from('merchants')
          .select('id, partner_account, company_name, status, created_at')
          .order('created_at', { ascending: false })
          .limit(6)
        if (!isSuperAdmin && platformId) q = q.eq('platform_id', platformId)
        return q
      })(),
      admin.from('merchant_api_logs').select('*', { count: 'exact', head: true }),
    ])

    return {
      stats: {
        total: total ?? 0,
        draft: draft ?? 0,
        submitted: submitted ?? 0,
        underReview: underReview ?? 0,
        pendingSupplement: pendingSupplement ?? 0,
        approved: approved ?? 0,
        rejected: rejected ?? 0,
        merchantCreated: merchantCreated ?? 0,
      },
      recentMerchants: (recentMerchants ?? []) as Array<{
        id: string
        partner_account: string
        company_name: string | null
        status: string
        created_at: string
      }>,
      apiLogs: apiLogs ?? 0,
    }
  },
  ['dashboard-stats'],
  { revalidate: REVALIDATE, tags: ['merchants'] }
)

// ─── Merchants list ────────────────────────────────────────────────────────────

export const getMerchantsList = unstable_cache(
  async (
    platformId: string | null,
    isSuperAdmin: boolean,
    status?: string,
    q?: string
  ) => {
    const admin = createAdminClient()

    let query = admin
      .from('merchants')
      .select('id, partner_account, company_name, company_name_english, merchant_type, industry_code, status, tappay_status_code, tappay_opinion, submitted_at, created_at, platform_id')
      .order('created_at', { ascending: false })

    if (!isSuperAdmin && platformId) query = query.eq('platform_id', platformId)
    if (status) query = query.eq('status', status)
    if (q) query = query.or(`partner_account.ilike.%${q}%,company_name.ilike.%${q}%`)

    const { data } = await query
    return data ?? []
  },
  ['merchants-list'],
  { revalidate: REVALIDATE, tags: ['merchants'] }
)

// ─── Notify logs ──────────────────────────────────────────────────────────────

export const getNotifyLogs = unstable_cache(
  async (platformId: string | null, isSuperAdmin: boolean) => {
    const admin = createAdminClient()

    let query = admin
      .from('merchant_notify_logs')
      .select('id, partner_account, status, status_code, payment_method, created_at, merchants(partner_account, company_name)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!isSuperAdmin && platformId) {
      const { data: merchants } = await admin
        .from('merchants')
        .select('partner_account')
        .eq('platform_id', platformId)
      const accounts = (merchants ?? []).map((m) => m.partner_account).filter(Boolean) as string[]
      query = query.in('partner_account', accounts.length > 0 ? accounts : ['__none__'])
    }

    const { data } = await query
    return data ?? []
  },
  ['notify-logs'],
  { revalidate: REVALIDATE, tags: ['merchants', 'notify-logs'] }
)

// ─── API logs ─────────────────────────────────────────────────────────────────

export const getApiLogs = unstable_cache(
  async () => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('merchant_api_logs')
      .select('id, api_name, partner_account, is_success, duration_ms, error_message, created_at, merchants(partner_account, company_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    return data ?? []
  },
  ['api-logs'],
  { revalidate: REVALIDATE, tags: ['api-logs'] }
)
