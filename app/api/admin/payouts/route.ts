import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MINIMUM_PAYOUT_AMOUNT = 2500 // $25.00 in cents

// GET - Get payout stats and pending payouts
export async function GET(request: Request) {
  try {
    // TODO: Add admin auth check

    // Get all completed sales grouped by brand
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        brand_partner_id,
        brand_payout_amount,
        status,
        brand_partners (
          brand_name,
          email
        )
      `)
      .eq('status', 'completed')

    if (salesError) {
      console.error('Sales error:', salesError)
    }

    // Calculate pending payouts per brand
    const brandPayouts = new Map<string, BrandPayout>()

    ;(sales || []).forEach((sale: any) => {
      const brandId = sale.brand_partner_id
      if (!brandPayouts.has(brandId)) {
        brandPayouts.set(brandId, {
          brand_partner_id: brandId,
          brand_name: sale.brand_partners?.brand_name || 'Unknown',
          email: sale.brand_partners?.email || '',
          pending_amount: 0,
          completed_sales: 0,
        })
      }
      const payout = brandPayouts.get(brandId)!
      payout.pending_amount += sale.brand_payout_amount
      payout.completed_sales += 1
    })

    const pendingPayouts = Array.from(brandPayouts.values())

    // Get payouts made this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data: monthlyPayouts } = await supabase
      .from('payouts')
      .select('amount')
      .gte('payout_date', startOfMonth.toISOString())

    const totalPaidThisMonth = (monthlyPayouts || []).reduce(
      (sum, p) => sum + p.amount,
      0
    )

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
      totalPendingPayouts: pendingPayouts.reduce((sum, p) => sum + p.pending_amount, 0),
      totalPaidThisMonth,
      brandsDuePayout: pendingPayouts.filter((p) => p.pending_amount >= MINIMUM_PAYOUT_AMOUNT)
        .length,
      nextPayoutDate,
    }

    return NextResponse.json({
      stats,
      pendingPayouts,
    })
  } catch (error) {
    console.error('Payouts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

interface BrandPayout {
  brand_partner_id: string
  brand_name: string
  email: string
  pending_amount: number
  completed_sales: number
}
