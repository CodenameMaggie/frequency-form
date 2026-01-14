import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Get admin dashboard stats
export async function GET() {
  try {
    // Get total brand partners (approved)
    const { data: partners, count: totalBrandPartners } = await supabase
      .from('brand_partners')
      .select('id', { count: 'exact' })
      .eq('status', 'approved')

    // Get pending applications
    const { count: pendingApplications } = await supabase
      .from('brand_applications')
      .select('id', { count: 'exact' })
      .eq('status', 'pending')

    // Get total products (approved)
    const { count: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('approval_status', 'approved')

    // Get pending products
    const { count: pendingProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('approval_status', 'pending')

    // Get total revenue and platform revenue
    const { data: salesData } = await supabase
      .from('sales')
      .select('sale_amount, platform_fee_amount')
      .eq('status', 'completed')

    const totalRevenue = (salesData || []).reduce((sum, sale) => sum + (sale.sale_amount || 0), 0)
    const platformRevenue = (salesData || []).reduce((sum, sale) => sum + (sale.platform_fee_amount || 0), 0)

    // Get recent applications (last 5)
    const { data: recentApplications } = await supabase
      .from('brand_applications')
      .select('id, brand_name, contact_email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent pending products (last 5)
    const { data: recentProducts } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        fabric_type,
        brand_partners (
          brand_name
        )
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    // Format products with brand name
    const formattedProducts = (recentProducts || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      fabric_type: product.fabric_type,
      brand_name: product.brand_partners?.brand_name || 'Unknown'
    }))

    return NextResponse.json({
      totalBrandPartners: totalBrandPartners || 0,
      pendingApplications: pendingApplications || 0,
      totalProducts: totalProducts || 0,
      pendingProducts: pendingProducts || 0,
      totalRevenue: totalRevenue || 0,
      platformRevenue: platformRevenue || 0,
      recentApplications: recentApplications || [],
      recentProducts: formattedProducts || []
    })
  } catch (error) {
    console.error('Admin dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
