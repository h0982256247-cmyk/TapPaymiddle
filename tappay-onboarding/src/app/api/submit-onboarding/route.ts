import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // 使用 service role key 呼叫 Edge Functions（不需要使用者登入）
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
          vat_number: body.register_info?.vat_number,
          id_number: body.merchant_owner_info?.sub_merchant_owner_id,
          merchant_id: body.merchant_id,
        }),
      }
    )

    const createAccountData = await createAccountRes.json()
    if (!createAccountRes.ok || createAccountData.error) {
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
