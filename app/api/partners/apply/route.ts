import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.brandName || !body.contactEmail || !body.contactName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert application into database
    const { data, error } = await supabase
      .from('brand_applications')
      .insert({
        brand_name: body.brandName,
        website: body.website,
        instagram: body.instagram,
        contact_name: body.contactName,
        contact_email: body.contactEmail,
        contact_phone: body.contactPhone,
        product_types: body.productTypes,
        price_range: body.priceRange,
        monthly_volume: body.monthlyVolume,
        uses_synthetic_fibers: body.usesSyntheticFibers === 'yes',
        synthetic_explanation: body.syntheticExplanation,
        willing_to_comply: body.willingToComply === 'yes',
        why_join: body.whyJoin,
        how_heard: body.howHeard,
        sample_products: body.sampleProducts,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email to applicant
    // TODO: Send notification email to admin
    // (Will be added when RESEND_API_KEY is available)

    return NextResponse.json({
      success: true,
      applicationId: data.id,
    })
  } catch (error) {
    console.error('Application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
