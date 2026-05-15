import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { tapPayRequest, getPlatformKey } from '../_shared/tappay-client.ts'
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
  let merchantId: string | null = null

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const {
      partner_account,
      contact_email,
      company_name,
      vat_number,
      id_number,
      merchant_id: existingMerchantId,
    } = body

    merchantId = existingMerchantId ?? null

    const platformKey = getPlatformKey()

    // Build TapPay payload
    const tappayPayload: Record<string, unknown> = {
      platform_key: platformKey,
      partner_account,
      contact_email,
      company_name,
    }

    if (vat_number) tappayPayload.vat_number = vat_number
    if (id_number) tappayPayload.id_number = id_number

    // Call TapPay API
    const tappayResponse = await tapPayRequest(
      '/platform/create-partner-account',
      tappayPayload
    )

    const duration = Date.now() - startTime
    const isSuccess = tappayResponse.status === 0

    // Upsert merchant record
    let dbMerchantId = existingMerchantId

    if (isSuccess && tappayResponse.portal_account) {
      const partnerKey = (tappayResponse.portal_account as { partner_key: string }).partner_key

      if (existingMerchantId) {
        await admin
          .from('merchants')
          .update({
            partner_key: partnerKey,
            partner_account,
            contact_email,
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existingMerchantId)
      } else {
        const { data: merchant } = await admin
          .from('merchants')
          .insert({
            user_id: user.id,
            partner_account,
            contact_email,
            company_name,
            partner_key: partnerKey,
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        dbMerchantId = merchant?.id ?? null
      }

      merchantId = dbMerchantId

      await logApiCall(admin, {
        merchant_id: merchantId,
        partner_account,
        api_name: 'create-partner-account',
        endpoint: '/platform/create-partner-account',
        request_payload: { ...tappayPayload, platform_key: '[REDACTED]' },
        response_payload: tappayResponse,
        response_status: 200,
        duration_ms: duration,
        is_success: true,
      })

      return new Response(
        JSON.stringify({
          partner_key: partnerKey,
          merchant_id: dbMerchantId,
          portal_account: tappayResponse.portal_account,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      await logApiCall(admin, {
        merchant_id: merchantId,
        partner_account,
        api_name: 'create-partner-account',
        endpoint: '/platform/create-partner-account',
        request_payload: { ...tappayPayload, platform_key: '[REDACTED]' },
        response_payload: tappayResponse,
        response_status: 200,
        duration_ms: duration,
        is_success: false,
        error_message: tappayResponse.msg,
      })

      return new Response(
        JSON.stringify({ error: tappayResponse.msg ?? 'TapPay API 失敗' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    const duration = Date.now() - startTime

    await logApiCall(admin, {
      merchant_id: merchantId,
      api_name: 'create-partner-account',
      endpoint: '/platform/create-partner-account',
      request_payload: {},
      response_payload: { error: message },
      response_status: 500,
      duration_ms: duration,
      is_success: false,
      error_message: message,
    })

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
