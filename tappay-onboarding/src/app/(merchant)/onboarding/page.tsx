import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default function OnboardingPage() {
  // 無需登入，直接進入六步驟進件表單
  return <OnboardingForm initialStep={1} />
}
