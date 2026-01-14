import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'

// POST - Process a payout for a brand partner
export async function POST(request: Request) {
  try {
    const supabase = createAdminSupabase()
    const body = await request.json()
    const { brand_partner_id, sales_ids, amount, payment_method, payment_reference } = body

    if (!brand_partner_id || !sales_ids || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        brand_partner_id,
        amount,
        status: 'completed',
        payment_method: payment_method || 'bank_transfer',
        payment_reference: payment_reference || null,
        processed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (payoutError) throw payoutError

    // Update all sales with the payout ID
    const { error: salesError } = await supabase
      .from('sales')
      .update({
        payout_id: payout.id,
        status: 'paid_out'
      })
      .in('id', sales_ids)

    if (salesError) throw salesError

    return NextResponse.json({
      success: true,
      payout: payout,
      sales_updated: sales_ids.length
    })
  } catch (error) {
    console.error('Process payout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
