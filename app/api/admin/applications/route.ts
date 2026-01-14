import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'

// GET - Get all brand applications
export async function GET() {
  try {
    const supabase = createAdminSupabase()
    const { data: applications, error } = await supabase
      .from('brand_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ applications: applications || [] })
  } catch (error) {
    console.error('Admin applications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update application status
export async function PUT(request: Request) {
  try {
    const supabase = createAdminSupabase()
    const body = await request.json()
    const { id, status, rejection_reason } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString()
    }

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data, error } = await supabase
      .from('brand_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // If approved, create brand_partner record
    if (status === 'approved' && data) {
      const { error: partnerError } = await supabase
        .from('brand_partners')
        .insert({
          brand_name: data.brand_name,
          contact_email: data.contact_email,
          contact_name: data.contact_name,
          website_url: data.website,
          status: 'approved',
          application_id: data.id
        })

      if (partnerError) {
        console.error('Error creating brand partner:', partnerError)
      }
    }

    return NextResponse.json({ success: true, application: data })
  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
