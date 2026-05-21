'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, { error: null })

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
            <h1 className="text-xl font-semibold text-gray-900">歡迎回來</h1>
            <p className="text-sm text-gray-400 mt-1">登入以管理商戶進件</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
                className="h-10 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                密碼
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="h-10 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white"
              />
            </div>

            {state.error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm gap-2 mt-2"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  登入
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
