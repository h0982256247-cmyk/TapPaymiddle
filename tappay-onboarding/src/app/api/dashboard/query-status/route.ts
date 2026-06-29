import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// 後台「查詢最新狀態 / 取得補件原因」
// 呼叫既有的 query-status Edge Function（內含 TapPay 環境設定 + 寫回 tappay_opinion/status）
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user || !session) {
      return NextResponse.json({ error: '未登入' }, { status: 401 })
    }

    const { merchant_id } = await request.json()
    if (!merchant_id) {
      return NextResponse.json({ error: '缺少 merchant_id' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 取得商戶與其平台金鑰
    const { data: merchant } = await admin
      .from('merchants')
      .select('id, partner_account, platform_id')
      .eq('id', merchant_id)
      .single()

    if (!merchant) {
      return NextResponse.json({ error: '找不到此商戶' }, { status: 404 })
    }

    if (!merchant.platform_id) {
      return NextResponse.json({ error: '此商戶尚未綁定平台' }, { status: 400 })
    }

    const { data: platform } = await admin
      .from('platforms')
      .select('id, user_id, tappay_platform_key')
      .eq('id', merchant.platform_id)
      .single()

    if (!platform?.tappay_platform_key) {
      return NextResponse.json({ error: '找不到平台 Platform Key' }, { status: 400 })
    }

    // 權限：super_admin 或該商戶所屬平台的擁有者
    const isSuperAdmin = user.user_metadata?.role === 'super_admin'
    if (!isSuperAdmin && platform.user_id !== user.id) {
      return NextResponse.json({ error: '無權限查詢此商戶' }, { status: 403 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

    // 轉發登入使用者的 access token（query-status Edge Function 會驗證使用者）
    const res = await fetch(`${SUPABASE_URL}/functions/v1/query-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        partner_account: merchant.partner_account,
        merchant_id: merchant.id,
        platform_key: platform.tappay_platform_key,
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error || data.status !== 0) {
      return NextResponse.json(
        { error: data.error ?? data.msg ?? 'TapPay 查詢失敗' },
        { status: 502 }
      )
    }

    // 讓詳情頁 / 列表頁立即看到更新後的狀態與補件意見
    revalidateTag('merchants', 'max')

    const first = Array.isArray(data.platform_qualification_status)
      ? data.platform_qualification_status[0]
      : null

    return NextResponse.json({
      success: true,
      status: first?.status ?? null,
      opinion: first?.opinion ?? null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
