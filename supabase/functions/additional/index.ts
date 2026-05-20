import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const {
      partner_account,
      partner_key,
      merchant_id,
      payment_methods,
      online_credit_card_info,
      offline_credit_card_info,
      cvscom_info,
      is_complete = false,
      platform_key: bodyPlatformKey,
    } = body

    if (!bodyPlatformKey) {
      return new Response(JSON.stringify({ error: 'platform_key is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const platformKey = bodyPlatformKey

    // Build ADDITIONAL API payload
    const tappayPayload: Record<string, unknown> = {
      platform_key: platformKey,
      partner_account,
      payment_method: payment_methods,
      is_complete,
    }

    if (payment_methods.includes('ONLINE_CREDIT_CARD') && online_credit_card_info) {
      tappayPayload.online_credit_card_info = online_credit_card_info
    }
    if (payment_methods.includes('OFFLINE_CREDIT_CARD') && offline_credit_card_info) {
      tappayPayload.offline_credit_card_info = offline_credit_card_info
    }
    if (payment_methods.includes('CVSCOM_C2C') && cvscom_info) {
      tappayPayload.cvscom_info = cvscom_info
    }

    const tappayResponse = await tapPayRequest(
      '/platform/qualification/additional',
      tappayPayload,
      platformKey
    )

    const duration = Date.now() - startTime
    const isSuccess = tappayResponse.status === 0

    // Save payment methods to DB
    if (merchant_id) {
      for (const method of payment_methods) {
        let config: Record<string, unknown> = {}
        if (method === 'ONLINE_CREDIT_CARD') config = online_credit_card_info ?? {}
        if (method === 'OFFLINE_CREDIT_CARD') config = offline_credit_card_info ?? {}
        if (method === 'CVSCOM_C2C') config = cvscom_info ?? {}

        await admin.from('merchant_payment_methods').upsert({
          merchant_id,
          payment_method: method,
          payment_config: config,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'merchant_id,payment_method' })
      }

      if (is_complete) {
        await admin.from('merchants')
          .update({ is_complete: true, tappay_status_code: 1 })
          .eq('id', merchant_id)
      }
    }

    await logApiCall(admin, {
      merchant_id,
      partner_account,
      api_name: 'additional',
      endpoint: '/platform/qualification/additional',
      request_payload: { ...tappayPayload, platform_key: '[REDACTED]' },
      response_payload: tappayResponse,
      response_status: 200,
      duration_ms: duration,
      is_success: isSuccess,
      error_message: isSuccess ? null : tappayResponse.msg,
    })

    if (!isSuccess) {
      return new Response(
        JSON.stringify({ error: tappayResponse.msg ?? 'ADDITIONAL API 失敗' }),
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
