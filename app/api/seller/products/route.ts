import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { sendNewProductAdminNotification } from '@/lib/email'

// GET - List seller's products
export async function GET(request: Request) {
  const supabase = createAdminSupabase();
  try {
    // Get current session
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create client with cookies to get session
    const { createClient } = await import('@supabase/supabase-js')
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

    // Get products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('brand_partner_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new product
export async function POST(request: Request) {
  const supabase = createAdminSupabase();
  try {
    // Get current session
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { createClient } = await import('@supabase/supabase-js')
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
      .select('id, status')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    if (profile.status !== 'approved') {
      return NextResponse.json(
        { error: 'Your seller account must be approved before listing products' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.description || !body.fabricType || !body.price || body.inventoryCount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate price
    if (body.price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    // Validate inventory
    if (body.inventoryCount < 0) {
      return NextResponse.json({ error: 'Inventory count cannot be negative' }, { status: 400 })
    }

    // Generate slug from product name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Insert product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        brand_partner_id: profile.id,
        name: body.name,
        slug: slug,
        description: body.description,
        fabric_type: body.fabricType,
        fabric_composition: body.fabricComposition || null,
        price: body.price,
        compare_at_price: body.compareAtPrice || null,
        inventory_count: body.inventoryCount,
        low_stock_threshold: body.lowStockThreshold || 10,
        category: body.category,
        care_instructions: body.careInstructions || null,
        image_url: body.imageUrl || null,
        approval_status: 'pending',
        is_active: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // Send notification email to admin about new product pending approval
    await sendNewProductAdminNotification({
      productName: body.name,
      sellerName: session.user.email || 'Unknown Seller',
      sellerEmail: session.user.email || '',
      price: body.price,
      fabricType: body.fabricType,
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
