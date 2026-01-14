import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Get all products for admin review
export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        brand_partners (
          brand_name,
          contact_email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedProducts = (products || []).map((product: any) => ({
      ...product,
      brand_name: product.brand_partners?.brand_name || 'Unknown',
      brand_email: product.brand_partners?.contact_email || ''
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error('Admin products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update product approval status
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, approval_status, rejection_reason } = body

    if (!id || !approval_status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updateData: any = {
      approval_status,
      reviewed_at: new Date().toISOString()
    }

    if (approval_status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
