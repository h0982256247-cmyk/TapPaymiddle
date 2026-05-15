import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getTapPayBaseUrl, getPlatformKey } from '../_shared/tappay-client.ts'
import { getAdminClient, logApiCall } from '../_shared/supabase-admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const admin = getAdminClient()
  const startTime = Date.now()

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { partner_account, partner_key, merchant_id, document_paths } = body

    const platformKey = getPlatformKey()
    const baseUrl = getTapPayBaseUrl()

    // Build multipart/form-data for TapPay
    const formData = new FormData()
    formData.append('platform_key', platformKey)
    formData.append('partner_account', partner_account)

    // Fetch files from Supabase Storage and attach to FormData
    for (const [docType, paths] of Object.entries(document_paths as Record<string, string[]>)) {
      const filePaths = Array.isArray(paths) ? paths : [paths]

      for (const filePath of filePaths) {
        const { data: fileData, error: fileError } = await admin.storage
          .from('merchant-documents')
          .download(filePath)

        if (fileError || !fileData) {
          console.error(`Failed to download ${filePath}:`, fileError)
          continue
        }

        const fileName = filePath.split('/').pop() ?? 'document'
        formData.append(docType, fileData, fileName)

        // Save document record to DB
        await admin.from('merchant_documents').insert({
          merchant_id,
          document_type: docType,
          file_path: filePath,
          file_name: fileName,
          uploaded_by: null,
        })
      }
    }

    // Call TapPay Qualification File API
    const response = await fetch(`${baseUrl}/platform/qualification/file`, {
      method: 'POST',
      headers: { 'x-api-key': platformKey },
      body: formData,
    })

    const tappayResponse = await response.json()
    const duration = Date.now() - startTime
    const isSuccess = tappayResponse.status === 0

    // Mark is_complete = true after successful file upload
    if (isSuccess && merchant_id) {
      await admin.from('merchants')
        .update({ is_complete: true })
        .eq('id', merchant_id)

      // Also call additional with is_complete=true
      await admin.from('merchant_api_logs').insert({
        merchant_id,
        partner_account,
        api_name: 'qualification-file',
        http_method: 'POST',
        endpoint: '/platform/qualification/file',
        request_payload: { document_types: Object.keys(document_paths) },
        response_payload: tappayResponse,
        response_status: response.status,
        duration_ms: duration,
        is_success: isSuccess,
        error_message: isSuccess ? null : tappayResponse.msg,
      })
    }

    if (!isSuccess) {
      return new Response(
        JSON.stringify({ error: tappayResponse.msg ?? 'QUALIFICATION FILE API 失敗' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
