import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const supabase = getSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export async function getSellerProfile() {
  const supabase = getSupabase()
  const session = await getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('brand_partners')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single()

  if (error) throw error
  return data
}

export async function resetPassword(email: string) {
  const supabase = getSupabase()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabase()
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
}
