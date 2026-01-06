import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Get seller payout stats and history
export async function GET(request: Request) {
  try {
    // Get current session
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: authHeader,
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabaseWithAuth.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller profile
    const { data: profile } = await supabase
      .from('brand_partners')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // Get payout history
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .eq('brand_partner_id', profile.id)
      .order('payout_date', { ascending: false })

    if (payoutsError) {
      console.error('Payouts error:', payoutsError)
    }

    // Get all completed sales for this seller
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('sale_amount, brand_payout_amount, status')
      .eq('brand_partner_id', profile.id)

    if (salesError) {
      console.error('Sales error:', salesError)
    }

    // Calculate stats
    const completedSales = (sales || []).filter((s) => s.status === 'completed')
    const pendingSales = (sales || []).filter(
      (s) => s.status === 'pending' || s.status === 'processing'
    )

    const totalEarnings = completedSales.reduce((sum, sale) => sum + sale.brand_payout_amount, 0)
    const pendingPayout = pendingSales.reduce((sum, sale) => sum + sale.brand_payout_amount, 0)

    const lastPayout = payouts && payouts.length > 0 ? payouts[0] : null

    // Calculate next payout date (next Monday)
    const today = new Date()
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    const nextPayoutDate = nextMonday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    const stats = {
      pendingPayout,
      totalEarnings,
      lastPayoutAmount: lastPayout?.amount || 0,
      lastPayoutDate: lastPayout?.payout_date || null,
      nextPayoutDate,
    }

    return NextResponse.json({
      stats,
      payouts: payouts || [],
    })
  } catch (error) {
    console.error('Payouts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
