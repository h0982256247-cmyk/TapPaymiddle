import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // 使用 service role key 呼叫 Edge Functions（不需要使用者登入）
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // 法人：自動將 register_info 帶入 company_info（名稱截斷、地址補全）
    if (body.merchant_type === 'E' && body.register_info) {
      const ri = body.register_info as {
        register_name?: string
        register_name_english?: string
        register_postal_code?: string
        register_city?: string
        register_address?: string
      }
      body.company_info = {
        ...body.company_info,
        company_name: (ri.register_name ?? '').slice(0, 13),
        company_name_english: (ri.register_name_english ?? '').slice(0, 22),
        company_postal_code: body.company_info?.company_postal_code || ri.register_postal_code,
        company_city: body.company_info?.company_city || ri.register_city,
        company_address: body.company_info?.company_address || ri.register_address,
      }
    }

    // 1. create-partner-account
    const createAccountRes = await fetch(
      `${SUPABASE_URL}/functions/v1/create-partner-account`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          partner_account: body.partner_account,
          contact_email: body.contact_email,
          company_name: body.company_info?.company_name,
          merchant_id: body.merchant_id,
          // create-partner-account 只接受 vat_number（法人專用）
          // id_number 屬於負責人資料，由 basic endpoint 處理，此處不送
          ...(body.merchant_type === 'E' && body.register_info?.vat_number
            ? { vat_number: body.register_info.vat_number }
            : {}),
        }),
      }
    )

    const createAccountData = await createAccountRes.json()
    if (!createAccountRes.ok || createAccountData.error) {
      // TapPay status 2201 = 帳號建立失敗，最常見原因是 partner_account 已存在
      if (createAccountData.tappay_status === 2201) {
        return NextResponse.json({ error: createAccountData.error, errorCode: 'ACCOUNT_EXISTS' }, { status: 409 })
      }
      throw new Error(createAccountData.error ?? 'create-partner-account 失敗')
    }

    const { partner_key, merchant_id } = createAccountData

    // 2. basic
    const basicRes = await fetch(
      `${SUPABASE_URL}/functions/v1/basic`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ ...body, partner_key, merchant_id }),
      }
    )

    const basicData = await basicRes.json()
    if (!basicRes.ok || basicData.error) {
      throw new Error(basicData.error ?? 'basic API 失敗')
    }

    // 3. additional
    const additionalRes = await fetch(
      `${SUPABASE_URL}/functions/v1/additional`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          partner_account: body.partner_account,
          partner_key,
          merchant_id,
          payment_methods: body.payment_methods,
          online_credit_card_info: body.online_credit_card_info,
          offline_credit_card_info: body.offline_credit_card_info,
          cvscom_info: body.cvscom_info,
          is_complete: !body.document_paths || Object.keys(body.document_paths).length === 0,
        }),
      }
    )

    const additionalData = await additionalRes.json()
    if (!additionalRes.ok || additionalData.error) {
      throw new Error(additionalData.error ?? 'additional API 失敗')
    }

    // 5. 儲存快速審查頁面資料（若有開啟）
    if (body.online_credit_card_info?.use_shop_page && body.shop_page_info) {
      const shopInfo = body.shop_page_info
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await supabaseAdmin.from('merchant_shop_pages').upsert({
        partner_account: body.partner_account,
        brand_name: shopInfo.brand_name,
        vat_number: shopInfo.vat_number ?? null,
        product_image_path: body.product_image_path ?? null,
        product_name: shopInfo.product_name,
        product_price: shopInfo.product_price,
        product_description: shopInfo.product_description ?? null,
        refund_policy: shopInfo.refund_policy,
        service_phone: shopInfo.service_phone,
        service_email: shopInfo.service_email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'partner_account' })
    }

    // 4. qualification-file（有上傳文件才呼叫）
    if (body.document_paths && Object.keys(body.document_paths).length > 0) {
      const fileRes = await fetch(
        `${SUPABASE_URL}/functions/v1/qualification-file`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            partner_account: body.partner_account,
            partner_key,
            merchant_id,
            document_paths: body.document_paths,
          }),
        }
      )

      const fileData = await fileRes.json()
      if (!fileRes.ok || fileData.error) {
        throw new Error(fileData.error ?? 'qualification-file API 失敗')
      }
    }

    return NextResponse.json({ success: true, merchant_id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
