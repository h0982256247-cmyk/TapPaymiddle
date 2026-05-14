import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merchant_id, draft_payload, current_step } = body

    const admin = await createAdminClient()

    if (merchant_id) {
      // 更新既有草稿
      const { error } = await admin
        .from('merchant_drafts')
        .upsert({
          merchant_id,
          user_id: 'anonymous',
          draft_payload,
          current_step: current_step ?? 1,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'merchant_id' })

      if (error) throw error
    } else {
      // 建立商戶紀錄 + 草稿
      const partnerAccount = draft_payload?.partner_account
        ?? `draft_${Date.now()}`

      const { data: merchant, error: merchantError } = await admin
        .from('merchants')
        .insert({
          user_id: null,
          partner_account: partnerAccount,
          contact_email: draft_payload?.contact_email ?? null,
          merchant_type: draft_payload?.merchant_type ?? null,
          industry_code: draft_payload?.industry_code ?? 'NON_SPECIAL_INDUSTRY',
          company_name: draft_payload?.company_info?.company_name ?? null,
          status: 'DRAFT',
        })
        .select('id')
        .single()

      if (merchantError) throw merchantError

      await admin
        .from('merchant_drafts')
        .insert({
          merchant_id: merchant.id,
          user_id: 'anonymous',
          draft_payload,
          current_step: current_step ?? 1,
        })

      return NextResponse.json({ merchant_id: merchant.id })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
