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
      merchant_type,
      industry_code,
      register_info,
      company_info,
      contact_info,
      merchant_owner_info,
      bank_info,
      platform_key: bodyPlatformKey,
    } = body

    if (!bodyPlatformKey) {
      return new Response(JSON.stringify({ error: 'platform_key is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const platformKey = bodyPlatformKey

    // 法人 (E) → 完整帶入負責人資訊
    const tappayMerchantOwnerInfoE = merchant_owner_info ? {
      is_foreigner: merchant_owner_info.is_foreigner,
      merchant_owner_name: merchant_owner_info.sub_merchant_owner_name,
      merchant_owner_name_english: merchant_owner_info.sub_merchant_owner_name_english,
      merchant_owner_id: merchant_owner_info.sub_merchant_owner_id,
      merchant_owner_birthday: merchant_owner_info.sub_merchant_owner_birthday,
      merchant_owner_postal_code: merchant_owner_info.sub_merchant_owner_postal_code,
      merchant_owner_city: merchant_owner_info.sub_merchant_owner_city,
      merchant_owner_address: merchant_owner_info.sub_merchant_owner_address,
      id_issued_date: merchant_owner_info.id_issued_date,
      id_issued_place: merchant_owner_info.id_issued_place,
      id_replacement_category: merchant_owner_info.id_replacement_category,
    } : undefined

    // 自然人 (P) → 只傳 is_foreigner（頂層傳會被拒；詳細欄位也會被拒 "merchant_owner_name"）
    const tappayMerchantOwnerInfoP = merchant_owner_info != null
      ? { is_foreigner: merchant_owner_info.is_foreigner }
      : undefined

    // company_info 清理：chain_store_type 為空字串時不傳（TapPay 不接受空值）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleanCompanyInfo: Record<string, unknown> = { ...(company_info as any) }
    if (!cleanCompanyInfo.chain_store_type) {
      delete cleanCompanyInfo.chain_store_type
    }

    // Build BASIC API payload
    const tappayPayload: Record<string, unknown> = {
      platform_key: platformKey,
      partner_account,
      partner_key,
      merchant_type,
      industry_code,
      company_info: cleanCompanyInfo,
      contact_info,
      // 法人：完整負責人物件；自然人：僅 is_foreigner（置於 merchant_owner_info 內）
      merchant_owner_info: merchant_type === 'E' ? tappayMerchantOwnerInfoE : tappayMerchantOwnerInfoP,
      bank_info,
    }

    // Only include register_info for 法人
    if (merchant_type === 'E' && register_info) {
      tappayPayload.register_info = register_info
    }

    const tappayResponse = await tapPayRequest('/platform/basic', tappayPayload, platformKey)

    const duration = Date.now() - startTime
    const isSuccess = tappayResponse.status === 0

    // Save basic info to DB
    if (isSuccess && merchant_id) {
      await admin.from('merchant_basic_info').upsert({
        merchant_id,
        register_info: register_info ?? null,
        company_info,
        contact_info,
        merchant_owner_info,
        bank_info,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'merchant_id' })

      await admin.from('merchants').update({
        merchant_type,
        industry_code,
        company_name: company_info?.company_name ?? null,
        company_name_english: company_info?.company_name_english ?? null,
      }).eq('id', merchant_id)
    }

    await logApiCall(admin, {
      merchant_id,
      partner_account,
      api_name: 'basic',
      endpoint: '/platform/basic',
      request_payload: { ...tappayPayload, platform_key: '[REDACTED]', bank_info: { ...bank_info, bank_account_number: '[REDACTED]' } },
      response_payload: tappayResponse,
      response_status: 200,
      duration_ms: duration,
      is_success: isSuccess,
      error_message: isSuccess ? null : tappayResponse.msg,
    })

    if (!isSuccess) {
      return new Response(
        JSON.stringify({ error: tappayResponse.msg ?? 'BASIC API 失敗' }),
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
