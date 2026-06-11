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

    // 法人 (E) 與 自然人 (P) → 完整帶入負責人資訊
    // 注意：merchant_owner_name（中文姓名）為必填，空值會被 TapPay 拒絕（6005）
    // 只傳有值的欄位，避免 TapPay 因為空字串或 null 拒絕
    const buildMerchantOwnerInfo = (info: Record<string, unknown>) => {
      const obj: Record<string, unknown> = {
        is_foreigner: info.is_foreigner ?? false,
      }
      if (info.sub_merchant_owner_name) obj.merchant_owner_name = info.sub_merchant_owner_name
      if (info.sub_merchant_owner_name_english) obj.merchant_owner_name_english = info.sub_merchant_owner_name_english
      if (info.sub_merchant_owner_id) obj.merchant_owner_id = info.sub_merchant_owner_id
      if (info.sub_merchant_owner_birthday) obj.merchant_owner_birthday = info.sub_merchant_owner_birthday
      if (info.sub_merchant_owner_postal_code) obj.merchant_owner_postal_code = info.sub_merchant_owner_postal_code
      if (info.sub_merchant_owner_city) obj.merchant_owner_city = info.sub_merchant_owner_city
      if (info.sub_merchant_owner_address) obj.merchant_owner_address = info.sub_merchant_owner_address
      if (info.id_issued_date) obj.id_issued_date = info.id_issued_date
      if (info.id_issued_place) obj.id_issued_place = info.id_issued_place
      if (info.id_replacement_category) obj.id_replacement_category = info.id_replacement_category
      return obj
    }

    const tappayMerchantOwnerInfoE = merchant_owner_info
      ? buildMerchantOwnerInfo(merchant_owner_info as Record<string, unknown>)
      : undefined

    const tappayMerchantOwnerInfoP = merchant_owner_info
      ? buildMerchantOwnerInfo(merchant_owner_info as Record<string, unknown>)
      : undefined

    // 防護：若 merchant_owner_name 為空，提前回傳明確錯誤（避免送空值給 TapPay）
    const builtOwnerInfo = merchant_type === 'E' ? tappayMerchantOwnerInfoE : tappayMerchantOwnerInfoP
    if (builtOwnerInfo && !builtOwnerInfo.merchant_owner_name) {
      return new Response(JSON.stringify({
        error: '負責人姓名（merchant_owner_name）不得為空',
        debug: {
          merchant_type,
          received_merchant_owner_info_keys: merchant_owner_info ? Object.keys(merchant_owner_info as object) : null,
          sub_merchant_owner_name_value: (merchant_owner_info as Record<string, unknown>)?.sub_merchant_owner_name ?? 'MISSING',
        },
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

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
      // 法人 / 自然人：完整負責人物件（merchant_owner_name 必填）
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
      // 失敗時把 merchant_owner_info 實際送出的內容回傳，方便除錯
      const debugOwnerInfo = tappayPayload.merchant_owner_info
      return new Response(
        JSON.stringify({
          error: tappayResponse.msg ?? 'BASIC API 失敗',
          debug_sent_merchant_owner_info: debugOwnerInfo,
          debug_tappay_status: tappayResponse.status,
        }),
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
