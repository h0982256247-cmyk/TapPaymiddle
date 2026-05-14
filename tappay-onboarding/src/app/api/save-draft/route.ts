import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { merchant_id, draft_payload, current_step } = body

    const admin = await createAdminClient()

    if (merchant_id) {
      // Upsert draft
      const { error } = await admin
        .from('merchant_drafts')
        .upsert({
          merchant_id,
          user_id: user.id,
          draft_payload,
          current_step: current_step ?? 1,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'merchant_id',
        })

      if (error) throw error
    } else {
      // Create merchant record first, then draft
      const { data: merchant, error: merchantError } = await admin
        .from('merchants')
        .insert({
          user_id: user.id,
          partner_account: draft_payload?.partner_account ?? `draft_${user.id.slice(0, 8)}`,
          contact_email: draft_payload?.contact_email ?? user.email,
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
          user_id: user.id,
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
