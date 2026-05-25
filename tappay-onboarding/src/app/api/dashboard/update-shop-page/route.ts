import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify caller is authenticated
    const supabaseUser = await createClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授權' }, { status: 401 })
    }

    const body = await request.json()
    const { partner_account, ...fields } = body

    if (!partner_account) {
      return NextResponse.json({ error: 'partner_account 必填' }, { status: 400 })
    }

    // Verify caller owns this merchant's platform (or is super_admin)
    const role = user.user_metadata?.role
    if (role !== 'super_admin') {
      const { data: merchant } = await supabaseUser
        .from('merchants')
        .select('platform_id')
        .eq('partner_account', partner_account)
        .single()

      if (!merchant || !merchant.platform_id) {
        return NextResponse.json({ error: '商戶不存在或無權限' }, { status: 403 })
      }

      const { data: platform } = await supabaseUser
        .from('platforms')
        .select('id')
        .eq('id', merchant.platform_id)
        .eq('user_id', user.id)
        .single()

      if (!platform) {
        return NextResponse.json({ error: '無權限修改此商戶' }, { status: 403 })
      }
    }

    // Use admin client to write (bypasses RLS)
    const admin = createAdminClient()
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

    const { error } = await admin
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
