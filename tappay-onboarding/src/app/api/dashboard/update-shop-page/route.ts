import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()
    const { partner_account, ...fields } = body

    if (!partner_account) {
      return NextResponse.json({ error: 'partner_account 必填' }, { status: 400 })
    }

    const { error } = await supabase
      .from('merchant_shop_pages')
      .upsert({ partner_account, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'partner_account' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
