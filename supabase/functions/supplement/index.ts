import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { tapPayRequest } from '../_shared/tappay-client.ts'
import { getAdminClient, logApiCall } from '../_shared/supabase-admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { partner_account, merchant_id, payment_method, supplement_data, platform_key: bodyPlatformKey } = body

    if (!bodyPlatformKey) {
      return new Response(JSON.stringify({ error: 'platform_key is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const platformKey = bodyPlatformKey

    const tappayPayload: Record<string, unknown> = {
      platform_key: platformKey,
      partner_account,
      payment_method,
      ...supplement_data,
    }

    const tappayResponse = await tapPayRequest(
      '/platform/qualification/supplement',
      tappayPayload,
      platformKey
    )

    const duration = Date.now() - startTime
    const isSuccess = tappayResponse.status === 0

    if (merchant_id) {
      await admin.from('merchant_supplements').insert({
        merchant_id,
        payment_method,
        supplement_data,
        status: isSuccess ? 'SUBMITTED' : 'FAILED',
        submitted_at: isSuccess ? new Date().toISOString() : null,
      })

      if (isSuccess) {
        await admin.from('merchants')
          .update({ status: 'SUPPLEMENTED', tappay_status_code: 5 })
          .eq('id', merchant_id)
      }
    }

    await logApiCall(admin, {
      merchant_id,
      partner_account,
      api_name: 'supplement',
      endpoint: '/platform/qualification/supplement',
      request_payload: { ...tappayPayload, platform_key: '[REDACTED]' },
      response_payload: tappayResponse,
      response_status: 200,
      duration_ms: duration,
      is_success: isSuccess,
      error_message: isSuccess ? null : tappayResponse.msg,
    })

    if (!isSuccess) {
      return new Response(
        JSON.stringify({ error: tappayResponse.msg ?? 'SUPPLEMENT API 失敗' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
