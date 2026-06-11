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
      platform_key: bodyPlatformKey,
      platform_id: bodyPlatformId,
    } = body

    merchantId = existingMerchantId ?? null

    if (!bodyPlatformKey) {
      return new Response(JSON.stringify({ error: 'platform_key is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const platformKey = bodyPlatformKey

    // Build TapPay payload
    const tappayPayload: Record<string, unknown> = {
      platform_key: platformKey,
      partner_account,
      contact_email,
      company_name,
    }

    // 法人帶 vat_number（統一編號），個人戶帶 id_number（身分證號碼）
    // TapPay 要求二擇一，否則回傳 "vat_number and id_number can't be both empty"
    if (vat_number) tappayPayload.vat_number = vat_number
    if (id_number) tappayPayload.id_number = id_number

    // Call TapPay API
    const tappayResponse = await tapPayRequest(
      '/platform/create-partner-account',
      tappayPayload,
      platformKey
    )

    const duration = Date.now() - startTime
    const isSuccess = tappayResponse.status === 0

    // Upsert merchant record
    let dbMerchantId = existingMerchantId

    if (isSuccess && tappayResponse.portal_account) {
      const partnerKey = (tappayResponse.portal_account as { partner_key: string }).partner_key

      if (existingMerchantId) {
        const { error: updateError } = await admin
          .from('merchants')
          .update({
            partner_key: partnerKey,
            partner_account,
            contact_email,
            status: 'SUBMITTED',
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existingMerchantId)

        if (updateError) {
          // TapPay 帳號已建立但 DB 更新失敗 — 記錄完整資訊以便人工補救
          console.error(`[DESYNC] TapPay account created but DB update failed. partner_account=${partner_account} partner_key=${partnerKey} merchant_id=${existingMerchantId} error=${updateError.message}`)
          throw new Error(`DB 更新失敗 (TapPay 帳號已建立): ${updateError.message}`)
        }
      } else {
        // 使用 upsert 取代 insert：若因 retry 造成 partner_account 已存在，自動補寫 partner_key
        const { data: merchant, error: upsertError } = await admin
          .from('merchants')
          .upsert(
            {
              partner_account,
              user_id: null,
              contact_email,
              company_name,
              partner_key: partnerKey,
              platform_id: bodyPlatformId ?? null,
              status: 'SUBMITTED',
              submitted_at: new Date().toISOString(),
            },
            { onConflict: 'partner_account' }
          )
          .select('id')
          .single()

        if (upsertError || !merchant) {
          // 關鍵：TapPay 帳號已建立但 DB 寫入失敗，記錄 partner_key 供人工復原
          console.error(`[DESYNC] TapPay account created but DB upsert failed. partner_account=${partner_account} partner_key=${partnerKey} error=${upsertError?.message ?? 'no data'}`)
          throw new Error(`資料庫寫入失敗 (TapPay 帳號已建立，partner_account=${partner_account})，請聯絡技術支援。`)
        }

        dbMerchantId = merchant.id
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
        JSON.stringify({ error: tappayResponse.msg ?? 'TapPay API 失敗', tappay_status: tappayResponse.status }),
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
