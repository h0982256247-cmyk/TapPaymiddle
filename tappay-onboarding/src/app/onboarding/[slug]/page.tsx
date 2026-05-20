import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: platform } = await supabase
    .from('platforms')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!platform) notFound()

  return <OnboardingForm initialStep={1} platformSlug={slug} platformName={platform.name} />
}
