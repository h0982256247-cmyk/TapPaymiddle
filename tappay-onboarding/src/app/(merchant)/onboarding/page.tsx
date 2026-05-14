import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import type { OnboardingFormData } from '@/types/merchant'

const isPreview = process.env.PREVIEW_MODE === 'true'

export default async function OnboardingPage() {
  if (isPreview) {
    return <OnboardingForm initialStep={1} />
  }

  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  type MerchantRow = { id: string; status: string }
  type DraftRow = { draft_payload: Record<string, unknown>; current_step: number | null }

  // Check for existing draft
  const { data: existingMerchant } = await supabase
    .from('merchants')
    .select('id, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single() as { data: MerchantRow | null }

  // If already submitted/approved, redirect to status
  if (existingMerchant && existingMerchant.status !== 'DRAFT') {
    redirect('/onboarding/status')
  }

  let initialData: Partial<OnboardingFormData> | undefined
  let initialStep = 1
  let merchantId: string | undefined

  if (existingMerchant) {
    merchantId = existingMerchant.id

    const { data: draft } = await supabase
      .from('merchant_drafts')
      .select('draft_payload, current_step')
      .eq('merchant_id', existingMerchant.id)
      .single() as { data: DraftRow | null }

    if (draft) {
      initialData = draft.draft_payload as Partial<OnboardingFormData>
      initialStep = draft.current_step ?? 1
    }
  }

  return (
    <OnboardingForm
      initialData={initialData}
      initialStep={initialStep}
      merchantId={merchantId}
    />
  )
}
