import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // TODO: Add admin auth check here

    // Get brand partners count
    const { data: partners } = await supabase
      .from('brand_partners')
      .select('id')
      .eq('status', 'approved')

    // Get pending applications
    const { data: applications } = await supabase
      .from('brand_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get products stats
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, approval_status')

    const totalProducts = allProducts?.length || 0
    const pendingProducts = allProducts?.filter((p) => p.approval_status === 'pending').length || 0

    // Get recent pending products
    const { data: recentProducts } = await supabase
      .from('products')
      .select(`
        *,
        brand_partners (
          brand_name
        )
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get revenue stats
    const { data: sales } = await supabase
      .from('sales')
      .select('sale_amount, commission_amount')
      .eq('status', 'completed')

    const totalRevenue = (sales || []).reduce((sum, sale) => sum + sale.sale_amount, 0)
    const platformRevenue = (sales || []).reduce((sum, sale) => sum + sale.commission_amount, 0)

    return NextResponse.json({
      totalBrandPartners: partners?.length || 0,
      pendingApplications: applications?.length || 0,
      totalProducts,
      pendingProducts,
      totalRevenue,
      platformRevenue,
      recentApplications: applications || [],
      recentProducts: (recentProducts || []).map((p: any) => ({
        ...p,
        brand_name: p.brand_partners?.brand_name || 'Unknown Brand',
      })),
    })
  } catch (error) {
    console.error('Admin dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
