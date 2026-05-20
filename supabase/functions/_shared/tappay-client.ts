// ================================================
// TapPay API Client (Shared across Edge Functions)
// ================================================

export const TAPPAY_SANDBOX_URL = 'https://sandbox-cus-pf-api.tappaysdk.com'
export const TAPPAY_PROD_URL = 'https://cus-pf-api.tappaysdk.com'

export function getTapPayBaseUrl(): string {
  const env = Deno.env.get('TAPPAY_ENV') ?? 'sandbox'
  return env === 'production' ? TAPPAY_PROD_URL : TAPPAY_SANDBOX_URL
}

export async function tapPayRequest(
  endpoint: string,
  body: Record<string, unknown>,
  platformKey: string
): Promise<{ status: number; msg: string; [key: string]: unknown }> {
  if (!platformKey) throw new Error('platform_key is required')
  const baseUrl = getTapPayBaseUrl()
  const key = platformKey

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`TapPay API HTTP error: ${response.status}`)
  }

  return response.json()
}

export interface ApiLogEntry {
  merchant_id?: string | null
  partner_account?: string | null
  api_name: string
  endpoint: string
  request_payload: Record<string, unknown>
  response_payload: Record<string, unknown>
  response_status: number
  duration_ms: number
  is_success: boolean
  error_message?: string | null
}
