import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getAdminClient } from '../_shared/supabase-admin.ts'
import type { TapPayNotifyPayload } from '../../../tappay-onboarding/src/types/merchant.ts'

const TAPPAY_STATUS_MAP: Record<number, string> = {
  1:  'SUBMITTED',
  4:  'PENDING_SUPPLEMENT',
  5:  'SUPPLEMENTED',
  6:  'UNDER_REVIEW',
  7:  'APPROVED',
  8:  'REJECTED',
  9:  'DISABLED',
  16: 'MERCHANT_CREATED',
}

serve(async (req) => {
  const admin = getAdminClient()

  try {
    // Validate x-api-key (partner_key)
    const xApiKey = req.headers.get('x-api-key')
    if (!xApiKey) {
      return new Response(JSON.stringify({ status: 1, msg: 'Missing x-api-key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload: TapPayNotifyPayload = await req.json()
    const { partner_account, status_code, status, payment_method, merchant_ids, opinion } = payload

    // Find merchant by partner_account and verify partner_key
    const { data: merchant, error: merchantError } = await admin
      .from('merchants')
      .select('id, partner_key, status')
      .eq('partner_account', partner_account)
      .single()

    if (merchantError || !merchant) {
      console.error('Merchant not found:', partner_account)
      // Return 200 to acknowledge webhook even if merchant not found
      return new Response(JSON.stringify({ status: 0, msg: 'OK' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify partner_key matches
    if (merchant.partner_key !== xApiKey) {
      return new Response(JSON.stringify({ status: 1, msg: 'Invalid x-api-key' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const newStatus = TAPPAY_STATUS_MAP[status_code] ?? merchant.status

    // 1. Update merchant status
    await admin.from('merchants').update({
      status: newStatus,
      tappay_status_code: status_code,
      tappay_opinion: opinion ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', merchant.id)

    // 2. Save notify log (use mapped English enum, not raw TapPay Chinese status)
    await admin.from('merchant_notify_logs').insert({
      merchant_id: merchant.id,
      partner_account,
      status_code,
      status: newStatus,
      payment_method,
      notify_payload: payload as unknown as Record<string, unknown>,
      processed_at: new Date().toISOString(),
    })

    // 3. Update payment method status
    if (payment_method) {
      await admin.from('merchant_payment_methods')
        .update({
          status: status_code === 16 ? 'APPROVED' : newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('merchant_id', merchant.id)
        .eq('payment_method', payment_method)
    }

    // 4. Store merchant_ids (商代) when status_code = 16
    if (status_code === 16 && merchant_ids && merchant_ids.length > 0) {
      for (const merchantIdRef of merchant_ids) {
        await admin.from('merchant_payment_methods')
          .update({ merchant_id_ref: merchantIdRef })
          .eq('merchant_id', merchant.id)
          .eq('payment_method', payment_method)
      }
    }

    // 5. Store fee info into payment config if provided
    if (status_code === 16) {
      const feeInfo: Record<string, unknown> = {}
      if (payload.fee_domestic !== null && payload.fee_domestic !== undefined) feeInfo.fee_domestic = payload.fee_domestic
      if (payload.fee_foreign !== null && payload.fee_foreign !== undefined) feeInfo.fee_foreign = payload.fee_foreign
      if (payload.atm_rate !== null && payload.atm_rate !== undefined) feeInfo.atm_rate = payload.atm_rate
      if (payload.atm_min_fee !== null && payload.atm_min_fee !== undefined) feeInfo.atm_min_fee = payload.atm_min_fee
      if (payload.cvscom_c2c_rate !== null && payload.cvscom_c2c_rate !== undefined) feeInfo.cvscom_c2c_rate = payload.cvscom_c2c_rate

      if (Object.keys(feeInfo).length > 0 && payment_method) {
        // Merge fee info into payment_config
        const { data: existingMethod } = await admin
          .from('merchant_payment_methods')
          .select('payment_config')
          .eq('merchant_id', merchant.id)
          .eq('payment_method', payment_method)
          .single()

        const updatedConfig = {
          ...(existingMethod?.payment_config ?? {}),
          fee_info: feeInfo,
        }

        await admin.from('merchant_payment_methods')
          .update({ payment_config: updatedConfig })
          .eq('merchant_id', merchant.id)
          .eq('payment_method', payment_method)
      }
    }

    console.log(`Notify processed: ${partner_account} status=${status_code} payment=${payment_method}`)

    return new Response(
      JSON.stringify({ status: 0, msg: 'OK' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('Notify error:', message)

    return new Response(
      JSON.stringify({ status: 1, msg: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
