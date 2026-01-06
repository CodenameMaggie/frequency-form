import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List all applications
export async function GET(request: Request) {
  try {
    // TODO: Add admin auth check

    const { data: applications, error } = await supabase
      .from('brand_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    return NextResponse.json({ applications: applications || [] })
  } catch (error) {
    console.error('Applications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Approve or reject application
export async function POST(request: Request) {
  try {
    // TODO: Add admin auth check

    const body = await request.json()
    const { applicationId, action, rejectionReason } = body

    if (!applicationId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the application
    const { data: application, error: appError } = await supabase
      .from('brand_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (action === 'approve') {
      // Create auth user for the brand partner
      const temporaryPassword = Math.random().toString(36).slice(-12) + 'Aa1!'

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: application.contact_email,
        password: temporaryPassword,
        email_confirm: true,
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
      }

      // Create brand partner record
      const brandSlug = application.brand_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check if this is a founding partner (first 50 brands)
      const { data: existingPartners } = await supabase
        .from('brand_partners')
        .select('id')

      const isFoundingPartner = (existingPartners?.length || 0) < 50
      const foundingPartnerNumber = isFoundingPartner ? (existingPartners?.length || 0) + 1 : null

      const { error: partnerError } = await supabase.from('brand_partners').insert({
        auth_user_id: authData.user.id,
        email: application.contact_email,
        brand_name: application.brand_name,
        brand_slug: brandSlug,
        website: application.website,
        instagram: application.instagram,
        contact_name: application.contact_name,
        contact_phone: application.contact_phone,
        status: 'approved',
        commission_rate: isFoundingPartner ? 15 : 20,
        is_founding_partner: isFoundingPartner,
        founding_partner_number: foundingPartnerNumber,
      })

      if (partnerError) {
        console.error('Partner creation error:', partnerError)
        // Rollback auth user
        await supabase.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: 'Failed to create partner account' }, { status: 500 })
      }

      // Update application status
      await supabase
        .from('brand_applications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', applicationId)

      // TODO: Send approval email with login credentials
      // (Will be added when RESEND_API_KEY is available)

      return NextResponse.json({
        success: true,
        message: 'Application approved',
        temporaryPassword, // Return this so admin can share it manually for now
      })
    } else {
      // Reject application
      await supabase
        .from('brand_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq('id', applicationId)

      // TODO: Send rejection email
      // (Will be added when RESEND_API_KEY is available)

      return NextResponse.json({
        success: true,
        message: 'Application rejected',
      })
    }
  } catch (error) {
    console.error('Applications POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
