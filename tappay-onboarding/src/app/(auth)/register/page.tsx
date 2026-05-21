'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const registerSchema = z.object({
  email: z.string().email('請輸入有效的 Email'),
  password: z.string().min(8, '密碼至少 8 個字元'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: '兩次密碼不一致',
  path: ['confirm_password'],
})

type RegisterData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterData) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { role: 'admin' },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
        },
      })
      if (error) throw error

      toast.success('已發送驗證信，請檢查您的信箱')
      router.push('/login')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '註冊失敗，請稍後再試'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">TapPay</p>
              <p className="text-xs text-gray-400">商戶進件系統</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">建立帳號</h1>
            <p className="text-sm text-gray-400 mt-1">開始申請 TapPay 金流服務</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="h-10 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 8 個字元"
                className="h-10 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">確認密碼</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="再次輸入密碼"
                className="h-10 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
                {...register('confirm_password')}
              />
              {errors.confirm_password && (
                <p className="text-xs text-red-500">{errors.confirm_password.message}</p>
              )}
            </div>

            <p className="text-xs text-gray-400 pt-1">
              建立帳號即表示您同意我們的{' '}
              <Link href="#" className="text-gray-600 underline underline-offset-2">服務條款</Link>
            </p>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  建立帳號
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          已有帳號？{' '}
          <Link href="/login" className="text-gray-700 font-medium hover:underline">
            立即登入
          </Link>
        </p>
      </div>
    </div>
  )
}
