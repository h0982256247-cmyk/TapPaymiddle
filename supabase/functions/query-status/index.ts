import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { tapPayRequest, getPlatformKey } from '../_shared/tappay-client.ts'
import { getAdminClient, logApiCall } from '../_shared/supabase-admin.ts'
import type { TapPayStatusCode } from '../../../tappay-onboarding/src/types/merchant.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TAPPAY_STATUS_MAP: Record<number, string> = {
  1:  'SUBMITTED',
  4:  'PENDING_SUPPLEMENT',
  5:  'SUPPLEMENTED',
  6:  'UNDER_REVIEW',
  7:  'APPROVED',
  8:  'REJECTED',
  9:  'DISABLED',
  16: 'MERCHANT_CREATED',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const admin = getAdminClient()
  const startTime = Date.now()

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { partner_account, merchant_id } = body

    const platformKey = getPlatformKey()

    const tappayPayload: Record<string, unknown> = {
      platform_key: platformKey,
    }
    if (partner_account) tappayPayload.partner_account = partner_account

    const tappayResponse = await tapPayRequest(
      '/platform/qualification/status',
      tappayPayload,
      platformKey
    )

    const duration = Date.now() - startTime
    const isSuccess = tappayResponse.status === 0

    // Update merchant status in DB
    if (isSuccess && tappayResponse.platform_qualification_status && merchant_id) {
      const statuses = tappayResponse.platform_qualification_status as Array<{
        partner_account: string
        status: string
        opinion: string
      }>

      for (const statusItem of statuses) {
        // Map status text to status code
        const statusCode = Object.entries(TAPPAY_STATUS_MAP).find(
          ([, v]) => v === statusItem.status
        )?.[0]

        if (statusCode) {
          await admin.from('merchants')
            .update({
              status: TAPPAY_STATUS_MAP[Number(statusCode)] ?? 'SUBMITTED',
              tappay_status_code: Number(statusCode),
              tappay_opinion: statusItem.opinion ?? null,
            })
            .eq('partner_account', statusItem.partner_account)
        }
      }
    }

    await logApiCall(admin, {
      merchant_id,
      partner_account,
      api_name: 'query-status',
      endpoint: '/platform/qualification/status',
      request_payload: { partner_account },
      response_payload: tappayResponse,
      response_status: 200,
      duration_ms: duration,
      is_success: isSuccess,
      error_message: isSuccess ? null : tappayResponse.msg,
    })

    return new Response(
      JSON.stringify(tappayResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
