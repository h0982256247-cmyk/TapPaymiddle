import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function getAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

export async function logApiCall(
  supabase: ReturnType<typeof getAdminClient>,
  log: {
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
) {
  try {
    await supabase.from('merchant_api_logs').insert({
      ...log,
      http_method: 'POST',
    })
  } catch {
    console.error('Failed to log API call')
  }
}
