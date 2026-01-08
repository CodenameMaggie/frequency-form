import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


// GET - List all products with brand info
export async function GET(request: Request) {
  try {
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // TODO: Add admin auth check

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        brand_partners (
          brand_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const formattedProducts = (products || []).map((p: any) => ({
      ...p,
      brand_name: p.brand_partners?.brand_name || 'Unknown Brand',
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Approve, reject, or request changes for a product
export async function POST(request: Request) {
    // TODO: Add admin auth check

    const body = await request.json()
    const { productId, action, feedback } = body

    if (!productId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validActions = ['approve', 'reject', 'request_changes']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let updateData: any = {
      reviewed_at: new Date().toISOString(),
      admin_feedback: feedback || null,
    }

    if (action === 'approve') {
      updateData.approval_status = 'approved'
      updateData.is_active = true
    } else if (action === 'reject') {
      updateData.approval_status = 'rejected'
      updateData.is_active = false
    } else if (action === 'request_changes') {
      updateData.approval_status = 'needs_changes'
      updateData.is_active = false
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    // TODO: Send notification email to seller
    // (Will be added when RESEND_API_KEY is available)

    return NextResponse.json({
      success: true,
      message: `Product ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'returned for changes'}`,
    })
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
