import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const body = await request.json()
    const { name, slug, tappay_platform_key } = body

    if (!name || !slug || !tappay_platform_key) {
      return NextResponse.json({ error: '平台名稱、網址識別碼、Platform Key 均為必填' }, { status: 400 })
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: '網址識別碼只能包含小寫英文、數字、連字號' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Check slug uniqueness (excluding current user's platform)
    const { data: existing } = await admin
      .from('platforms')
      .select('id, user_id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json({ error: '此網址識別碼已被使用，請換一個' }, { status: 409 })
    }

    const { data: myPlatform } = await admin
      .from('platforms')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let data, error
    if (myPlatform) {
      ;({ data, error } = await admin
        .from('platforms')
        .update({ name, slug, tappay_platform_key, updated_at: new Date().toISOString() })
        .eq('id', myPlatform.id)
        .select('id, name, slug')
        .single())
    } else {
      ;({ data, error } = await admin
        .from('platforms')
        .insert({ user_id: user.id, name, slug, tappay_platform_key })
        .select('id, name, slug')
        .single())
    }

    if (error) throw error

    return NextResponse.json({ success: true, platform: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const { data, error } = await supabase
      .from('platforms')
      .select('id, name, slug, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ platform: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
