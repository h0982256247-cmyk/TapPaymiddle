import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'

// 進件流程需依序呼叫 4 個 TapPay API，延長 timeout 避免 Vercel 10s 限制
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // 1. 從 DB 撈取 platform 資料（platform_key + platform_id）
    const platformSlug = body.platform_slug as string | undefined
    if (!platformSlug) {
      return NextResponse.json({ error: '缺少 platform_slug' }, { status: 400 })
    }

    const { data: platform, error: platformError } = await supabaseAdmin
      .from('platforms')
      .select('id, tappay_platform_key')
      .eq('slug', platformSlug)
      .single()

    if (platformError || !platform) {
      return NextResponse.json({ error: '找不到對應的平台設定' }, { status: 400 })
    }

    const tappayPlatformKey = platform.tappay_platform_key
    const platformId = platform.id

    // 法人：自動將 register_info 帶入 company_info
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

    // 2. create-partner-account
    const createAccountRes = await fetch(
      `${SUPABASE_URL}/functions/v1/create-partner-account`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          partner_account: body.partner_account,
          contact_email: body.contact_email,
          company_name: body.company_info?.company_name,
          merchant_id: body.merchant_id,
          platform_key: tappayPlatformKey,
          platform_id: platformId,
          ...(body.merchant_type === 'E' && body.register_info?.vat_number
            ? { vat_number: body.register_info.vat_number }
            : {}),
        }),
      }
    )

    const createAccountData = await createAccountRes.json()
    let partner_key: string
    let merchant_id: string

    if (!createAccountRes.ok || createAccountData.error) {
      // TapPay 1117 / 2201 = 帳號已存在 → 嘗試從 DB 撈已建立的記錄繼續後面的步驟
      const accountAlreadyExists = createAccountData.tappay_status === 1117 || createAccountData.tappay_status === 2201
      if (accountAlreadyExists) {
        const { data: existingMerchant } = await supabaseAdmin
          .from('merchants')
          .select('id, partner_key')
          .eq('partner_account', body.partner_account)
          .single()

        if (existingMerchant?.partner_key) {
          // 帳號存在於 TapPay 也存在於 DB → 繼續後面步驟
          partner_key = existingMerchant.partner_key
          merchant_id = existingMerchant.id
        } else {
          // 帳號存在於 TapPay 但不在我們 DB → 真正的衝突，要求更換帳號
          return NextResponse.json({ error: createAccountData.error, errorCode: 'ACCOUNT_EXISTS' }, { status: 409 })
        }
      } else {
        throw new Error(createAccountData.error ?? 'create-partner-account 失敗')
      }
    } else {
      partner_key = createAccountData.partner_key
      merchant_id = createAccountData.merchant_id
    }

    // 3. basic
    const basicRes = await fetch(
      `${SUPABASE_URL}/functions/v1/basic`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ ...body, partner_key, merchant_id, platform_key: tappayPlatformKey }),
      }
    )

    const basicData = await basicRes.json()
    if (!basicRes.ok || basicData.error) {
      throw new Error(basicData.error ?? 'basic API 失敗')
    }

    // 4. additional
    const additionalRes = await fetch(
      `${SUPABASE_URL}/functions/v1/additional`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          partner_account: body.partner_account,
          partner_key,
          merchant_id,
          payment_methods: body.payment_methods,
          online_credit_card_info: body.online_credit_card_info,
          offline_credit_card_info: body.offline_credit_card_info,
          cvscom_info: body.cvscom_info,
          is_complete: !body.document_paths || Object.keys(body.document_paths).length === 0,
          platform_key: tappayPlatformKey,
        }),
      }
    )

    const additionalData = await additionalRes.json()
    if (!additionalRes.ok || additionalData.error) {
      throw new Error(additionalData.error ?? 'additional API 失敗')
    }

    // 5. 儲存快速審查頁面資料
    if (body.online_credit_card_info?.use_shop_page && body.shop_page_info) {
      const shopInfo = body.shop_page_info
      const imagePaths: (string | null)[] = Array.isArray(body.product_image_paths) ? body.product_image_paths : []
      const productsArray = Array.isArray(shopInfo.products)
        ? shopInfo.products.map((p: Record<string, unknown>, i: number) => ({
            product_name: p.product_name,
            product_price: p.product_price,
            product_description: p.product_description,
            product_image_path: imagePaths[i] ?? null,
          }))
        : []
      const first = productsArray[0] ?? {}
      await supabaseAdmin.from('merchant_shop_pages').upsert({
        partner_account: body.partner_account,
        brand_name: shopInfo.brand_name,
        vat_number: shopInfo.vat_number ?? null,
        products: productsArray,
        product_image_path: (first as Record<string, unknown>).product_image_path ?? null,
        product_name: (first as Record<string, unknown>).product_name ?? null,
        product_price: (first as Record<string, unknown>).product_price ?? null,
        product_description: (first as Record<string, unknown>).product_description ?? null,
        refund_policy: shopInfo.refund_policy,
        service_phone: shopInfo.service_phone,
        service_email: shopInfo.service_email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'partner_account' })
    }

    // 6. qualification-file
    if (body.document_paths && Object.keys(body.document_paths).length > 0) {
      const fileRes = await fetch(
        `${SUPABASE_URL}/functions/v1/qualification-file`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
          body: JSON.stringify({
            partner_account: body.partner_account,
            partner_key,
            merchant_id,
            document_paths: body.document_paths,
            platform_key: tappayPlatformKey,
          }),
        }
      )

      const fileData = await fileRes.json()
      if (!fileRes.ok || fileData.error) {
        throw new Error(fileData.error ?? 'qualification-file API 失敗')
      }
    }

    // Bust dashboard caches so the new merchant appears immediately
    revalidateTag('merchants', 'max')
    revalidateTag('api-logs', 'max')

    return NextResponse.json({ success: true, merchant_id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
