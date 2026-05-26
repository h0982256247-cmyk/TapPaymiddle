import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

/**
 * TapPay Notify webhook proxy
 * Forwards to Supabase Edge Function for secure processing
 */
export async function POST(request: NextRequest) {
  try {
    const xApiKey = request.headers.get('x-api-key')

    if (!xApiKey) {
      return NextResponse.json({ error: 'Missing x-api-key' }, { status: 401 })
    }

    const body = await request.json()

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

    // Forward to Supabase Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/tappay-notify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': xApiKey,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Merchant status changed — bust caches so dashboard reflects it immediately
    revalidateTag('merchants', { expire: 0 })
    revalidateTag('notify-logs', { expire: 0 })

    return NextResponse.json({ status: 0, msg: 'OK' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ status: 1, msg: message }, { status: 500 })
  }
}
