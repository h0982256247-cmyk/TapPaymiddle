/**
 * Typed query helpers for Supabase
 * Avoids repeated type casting across pages
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Merchant, MerchantBasicInfo, MerchantDraft, MerchantPaymentMethod } from '@/types/merchant'

export async function getMerchantByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<Merchant | null> {
  const { data } = await supabase
    .from('merchants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data as Merchant | null
}

export async function getMerchantById(
  supabase: SupabaseClient,
  id: string
): Promise<Merchant | null> {
  const { data } = await supabase
    .from('merchants')
    .select('*')
    .eq('id', id)
    .single()
  return data as Merchant | null
}

export async function getMerchantWithPaymentMethods(
  supabase: SupabaseClient,
  userId: string
): Promise<(Merchant & { merchant_payment_methods: MerchantPaymentMethod[] }) | null> {
  const { data } = await supabase
    .from('merchants')
    .select('*, merchant_payment_methods(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data as (Merchant & { merchant_payment_methods: MerchantPaymentMethod[] }) | null
}

export async function getDraftByMerchantId(
  supabase: SupabaseClient,
  merchantId: string
): Promise<MerchantDraft | null> {
  const { data } = await supabase
    .from('merchant_drafts')
    .select('draft_payload, current_step')
    .eq('merchant_id', merchantId)
    .single()
  return data as MerchantDraft | null
}

export async function getRecentMerchants(
  supabase: SupabaseClient,
  limit = 8
): Promise<Partial<Merchant>[]> {
  const { data } = await supabase
    .from('merchants')
    .select('id, partner_account, company_name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as Partial<Merchant>[]
}
