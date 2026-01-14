import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'

// GET - Get all pending payouts grouped by brand partner
export async function GET() {
  try {
    const supabase = createAdminSupabase()
    // Get all completed sales that haven't been paid out yet
    const { data: pendingSales, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        brand_partner_id,
        brand_payout_amount,
        status,
        created_at,
        brand_partners (
          id,
          brand_name,
          contact_email
        )
      `)
      .eq('status', 'completed')
      .is('payout_id', null)

    if (salesError) throw salesError

    // Group by brand partner
    const payoutsByPartner: { [key: string]: any } = {}

    for (const sale of (pendingSales || [])) {
      const partnerId = sale.brand_partner_id
      if (!partnerId) continue

      if (!payoutsByPartner[partnerId]) {
        payoutsByPartner[partnerId] = {
          brand_partner_id: partnerId,
          brand_name: (sale.brand_partners as any)?.brand_name || 'Unknown',
          contact_email: (sale.brand_partners as any)?.contact_email || '',
          total_amount: 0,
          sales_count: 0,
          sales: []
        }
      }

      payoutsByPartner[partnerId].total_amount += sale.brand_payout_amount || 0
      payoutsByPartner[partnerId].sales_count += 1
      payoutsByPartner[partnerId].sales.push(sale.id)
    }

    const payouts = Object.values(payoutsByPartner)

    return NextResponse.json({ payouts })
  } catch (error) {
    console.error('Admin payouts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
