import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/auth-context'
import { revalidateTag } from 'next/cache'

/**
 * POST /api/admin/recover-merchant
 *
 * 用於修復 TapPay↔DB 失步（desync）狀態：
 * TapPay 已有帳號，但 DB merchants 表缺少對應紀錄。
 *
 * 管理員需從 TapPay 後台取得 partner_key，再呼叫此 API 補建 DB 紀錄。
 *
 * 僅限 super_admin 使用。
 */
export async function POST(request: NextRequest) {
  try {
    // ── 驗證 super_admin 身份 ──────────────────────────────────
    const { isSuperAdmin } = await getAuthContext()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 })
    }

    const body = await request.json()
    const { partner_account, partner_key, contact_email, company_name, platform_slug } = body

    if (!partner_account || !partner_key) {
      return NextResponse.json(
        { error: '必填欄位：partner_account、partner_key' },
        { status: 400 }
      )
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createAdminClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // ── 取得 platform_id（若有提供 slug）──────────────────────
    let platformId: string | null = null
    if (platform_slug) {
      const { data: platform } = await supabaseAdmin
        .from('platforms')
        .select('id')
        .eq('slug', platform_slug)
        .single()
      platformId = platform?.id ?? null
    }

    // ── 確認目前狀態 ──────────────────────────────────────────
    const { data: existing } = await supabaseAdmin
      .from('merchants')
      .select('id, partner_key, status')
      .eq('partner_account', partner_account)
      .single()

    if (existing?.partner_key) {
      return NextResponse.json(
        {
          error: '此帳號在 DB 已有 partner_key，無需復原。',
          existing_id: existing.id,
          existing_status: existing.status,
        },
        { status: 409 }
      )
    }

    // ── 補建或更新 DB 紀錄 ────────────────────────────────────
    const { data: recovered, error: upsertError } = await supabaseAdmin
      .from('merchants')
      .upsert(
        {
          partner_account,
          partner_key,
          contact_email: contact_email ?? null,
          company_name: company_name ?? null,
          platform_id: platformId,
          user_id: null,
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'partner_account' }
      )
      .select('id, partner_account, status')
      .single()

    if (upsertError || !recovered) {
      return NextResponse.json(
        { error: `DB 寫入失敗：${upsertError?.message ?? '未知錯誤'}` },
        { status: 500 }
      )
    }

    revalidateTag('merchants', 'max')

    return NextResponse.json({
      success: true,
      message: `帳號 ${partner_account} 已成功復原，merchant_id: ${recovered.id}`,
      merchant_id: recovered.id,
      partner_account: recovered.partner_account,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
