import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Get all approved, active products for public marketplace
export async function GET(request: Request) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        compare_at_price,
        fabric_type,
        category,
        image_url,
        brand_partners (
          brand_name,
          brand_slug
        )
      `)
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .gt('inventory_count', 0)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const formattedProducts = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      compare_at_price: p.compare_at_price,
      fabric_type: p.fabric_type,
      category: p.category,
      image_url: p.image_url,
      brand_name: p.brand_partners?.brand_name || 'Unknown Brand',
      brand_slug: p.brand_partners?.brand_slug || '',
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error('Marketplace products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
