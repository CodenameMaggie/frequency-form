import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// List of admin user IDs (you can add your user ID here after creating your account)
// For now, we'll check if the user email matches the admin email
const ADMIN_EMAILS = [
  'maggie@frequencyandform.com',
  'kristi@frequencyandform.com',
  'admin@frequencyandform.com',
  // Add more admin emails as needed
]

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase.auth.admin.getUserById(userId)
    if (error || !user) return false
    return ADMIN_EMAILS.includes(user.user?.email || '')
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

export async function checkAdminAccess(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return false

    // Check if user email is in admin list
    return ADMIN_EMAILS.includes(session.user.email || '')
  } catch (error) {
    console.error('Admin access check error:', error)
    return false
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Verify admin access
  if (!ADMIN_EMAILS.includes(email)) {
    await supabase.auth.signOut()
    throw new Error('Unauthorized: Admin access only')
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  return session
}
