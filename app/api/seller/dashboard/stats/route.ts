import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Get seller dashboard stats
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

    // Get products count
    const { data: products } = await supabase
      .from('products')
      .select('id, approval_status')
      .eq('brand_partner_id', profile.id)

    const productsListed = (products || []).filter((p) => p.approval_status === 'approved').length

    // Get sales data for this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data: monthlySales } = await supabase
      .from('sales')
      .select('sale_amount, brand_payout_amount, status, created_at')
      .eq('brand_partner_id', profile.id)
      .gte('created_at', startOfMonth.toISOString())

    const totalSales = (monthlySales || []).reduce((sum, sale) => sum + sale.sale_amount, 0)

    // Get pending payout (all completed but unpaid sales)
    const { data: completedSales } = await supabase
      .from('sales')
      .select('brand_payout_amount')
      .eq('brand_partner_id', profile.id)
      .eq('status', 'completed')

    const pendingPayout = (completedSales || []).reduce(
      (sum, sale) => sum + sale.brand_payout_amount,
      0
    )

    // Get recent orders (last 5)
    const { data: recentSales } = await supabase
      .from('sales')
      .select(
        `
        id,
        order_id,
        sale_amount,
        brand_payout_amount,
        status,
        created_at,
        products (
          name
        )
      `
      )
      .eq('brand_partner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const recentOrders = (recentSales || []).map((sale: any, index: number) => ({
      id: sale.id,
      orderNumber: sale.order_id?.substring(0, 8) || `${1000 + index}`,
      date: new Date(sale.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      productName: sale.products?.name || 'Unknown Product',
      amount: (sale.sale_amount / 100).toFixed(2),
      earnings: (sale.brand_payout_amount / 100).toFixed(2),
      status: sale.status,
    }))

    // Calculate conversion rate (placeholder - would need view/purchase data)
    const conversionRate = productsListed > 0 ? 3.2 : 0

    return NextResponse.json({
      totalSales,
      pendingPayout,
      productsListed,
      conversionRate,
      recentOrders,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
