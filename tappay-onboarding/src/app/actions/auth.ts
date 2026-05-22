'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { error: '請輸入 Email 和密碼' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Map common Supabase error messages to Traditional Chinese
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email 或密碼錯誤，請重新確認' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: '請先確認您的 Email 後再登入' }
    }
    return { error: error.message }
  }

  // super_admin 和 no-role 用戶都可以進入 dashboard
  // super_admin 看全部資料，no-role 只看自己平台的商戶
  redirect('/dashboard')
}
