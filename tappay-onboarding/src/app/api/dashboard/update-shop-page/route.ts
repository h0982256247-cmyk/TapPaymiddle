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

    const productsArray = Array.isArray(fields.products) ? fields.products : undefined
    const first = productsArray?.[0] ?? {}
    const upsertData: Record<string, unknown> = {
      partner_account,
      ...fields,
      updated_at: new Date().toISOString(),
    }
    if (productsArray) {
      upsertData.products = productsArray
      upsertData.product_name = (first as Record<string, unknown>).product_name ?? null
      upsertData.product_price = (first as Record<string, unknown>).product_price ?? null
      upsertData.product_description = (first as Record<string, unknown>).product_description ?? null
    }

    const { error } = await supabase
      .from('merchant_shop_pages')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(upsertData as any, { onConflict: 'partner_account' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
