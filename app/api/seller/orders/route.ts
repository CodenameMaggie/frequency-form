import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - List seller's orders
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

    // Get orders/sales for this seller's products
    // Join sales with products to get product details
    const { data: sales, error } = await supabase
      .from('sales')
      .select(
        `
        id,
        order_id,
        product_id,
        sale_amount,
        commission_amount,
        brand_payout_amount,
        status,
        created_at,
        products (
          name,
          image_url
        )
      `
      )
      .eq('brand_partner_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Transform data to match order interface
    const orders = (sales || []).map((sale: any, index: number) => ({
      id: sale.id,
      order_number: sale.order_id?.substring(0, 8) || `ORD${1000 + index}`,
      product_name: sale.products?.name || 'Unknown Product',
      product_id: sale.product_id,
      customer_email: 'customer@example.com', // TODO: Join with actual order data when available
      quantity: 1, // TODO: Get from order items when available
      sale_amount: sale.sale_amount,
      commission_amount: sale.commission_amount,
      brand_payout_amount: sale.brand_payout_amount,
      status: sale.status,
      shipping_status: sale.status === 'completed' ? 'delivered' : 'pending',
      created_at: sale.created_at,
    }))

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
