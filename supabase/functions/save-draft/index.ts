import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAdminClient } from '../_shared/supabase-admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const admin = getAdminClient()

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { merchant_id, draft_payload, current_step } = await req.json()

    if (!merchant_id) {
      // Create merchant + draft
      const { data: merchant } = await admin.from('merchants').insert({
        user_id: user.id,
        partner_account: `draft_${user.id.slice(0, 8)}_${Date.now()}`,
        status: 'DRAFT',
        contact_email: user.email,
      }).select('id').single()

      if (!merchant) throw new Error('Failed to create merchant')

      await admin.from('merchant_drafts').insert({
        merchant_id: merchant.id,
        user_id: user.id,
        draft_payload,
        current_step: current_step ?? 1,
      })

      return new Response(
        JSON.stringify({ success: true, merchant_id: merchant.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert draft
    const { error: draftError } = await admin.from('merchant_drafts').upsert({
      merchant_id,
      user_id: user.id,
      draft_payload,
      current_step: current_step ?? 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'merchant_id' })

    if (draftError) throw draftError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
