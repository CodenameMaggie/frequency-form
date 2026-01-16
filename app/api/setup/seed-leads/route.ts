/**
 * Seed Initial Leads for Outreach
 * Populates ff_boutique_buyers with starter leads
 *
 * Call: POST /api/setup/seed-leads?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const INITIAL_LEADS = [
  // Boutiques - High value wholesale targets
  {
    business_name: 'The Conscious Closet',
    business_type: 'boutique',
    city: 'Austin',
    state_province: 'TX',
    country: 'USA',
    contact_name: 'Sarah Mitchell',
    contact_email: 'sarah@consciouscloset.com',
    website: 'https://consciouscloset.com',
    sustainable_focus: true,
    average_order_size: '$2500+',
    lead_source: 'ai_discovery',
    lead_quality_score: 85,
    notes: 'Focus on sustainable fashion, good fit for natural fibers'
  },
  {
    business_name: 'Linen & Light Boutique',
    business_type: 'boutique',
    city: 'Portland',
    state_province: 'OR',
    country: 'USA',
    contact_name: 'Emma Chen',
    contact_email: 'emma@linenandlight.com',
    website: 'https://linenandlight.com',
    sustainable_focus: true,
    average_order_size: '$1000-2500',
    lead_source: 'ai_discovery',
    lead_quality_score: 90,
    notes: 'Already specializes in linen, perfect target'
  },
  {
    business_name: 'Organic Style Co',
    business_type: 'boutique',
    city: 'San Francisco',
    state_province: 'CA',
    country: 'USA',
    contact_name: 'Maya Rodriguez',
    contact_email: 'maya@organicstyleco.com',
    website: 'https://organicstyleco.com',
    sustainable_focus: true,
    average_order_size: '$2500+',
    lead_source: 'ai_discovery',
    lead_quality_score: 88,
    notes: 'High-end organic fashion boutique'
  },

  // Yoga Studios - Natural fiber athleisure
  {
    business_name: 'Breathe Yoga Studio',
    business_type: 'yoga_studio',
    city: 'Los Angeles',
    state_province: 'CA',
    country: 'USA',
    contact_name: 'Jennifer Walsh',
    contact_email: 'jennifer@breatheyoga.com',
    website: 'https://breatheyoga.com',
    sustainable_focus: true,
    average_order_size: '$500-1000',
    lead_source: 'ai_discovery',
    lead_quality_score: 75,
    notes: 'Sells retail in studio, interested in natural fiber yoga wear'
  },
  {
    business_name: 'Sacred Flow Wellness',
    business_type: 'yoga_studio',
    city: 'Denver',
    state_province: 'CO',
    country: 'USA',
    contact_name: 'Amanda Peters',
    contact_email: 'amanda@sacredflow.com',
    website: 'https://sacredflow.com',
    sustainable_focus: true,
    average_order_size: '$500-1000',
    lead_source: 'ai_discovery',
    lead_quality_score: 72,
    notes: 'Wellness-focused, good fit for healing tier fabrics'
  },

  // Hotels/Spas - Premium home textiles
  {
    business_name: 'The Wellness Resort',
    business_type: 'hotel',
    city: 'Sedona',
    state_province: 'AZ',
    country: 'USA',
    contact_name: 'Robert Kim',
    contact_email: 'robert@wellnessresort.com',
    website: 'https://wellnessresort.com',
    sustainable_focus: true,
    average_order_size: '$2500+',
    lead_source: 'ai_discovery',
    lead_quality_score: 80,
    notes: 'Luxury wellness resort, interested in linen robes and bedding'
  },
  {
    business_name: 'Serenity Spa Hotel',
    business_type: 'spa',
    city: 'Miami',
    state_province: 'FL',
    country: 'USA',
    contact_name: 'Lisa Thompson',
    contact_email: 'lisa@serenityspa.com',
    website: 'https://serenityspa.com',
    sustainable_focus: true,
    average_order_size: '$1000-2500',
    lead_source: 'ai_discovery',
    lead_quality_score: 78,
    notes: 'High-end spa, potential for linen towels and robes'
  },

  // Gift Shops - Curated natural items
  {
    business_name: 'Earthbound Gifts',
    business_type: 'gift_shop',
    city: 'Seattle',
    state_province: 'WA',
    country: 'USA',
    contact_name: 'David Park',
    contact_email: 'david@earthboundgifts.com',
    website: 'https://earthboundgifts.com',
    sustainable_focus: true,
    average_order_size: '$500-1000',
    lead_source: 'ai_discovery',
    lead_quality_score: 70,
    notes: 'Eco-friendly gift shop, good for accessories'
  },

  // European-style boutiques
  {
    business_name: 'Parisian Threads',
    business_type: 'boutique',
    city: 'New York',
    state_province: 'NY',
    country: 'USA',
    contact_name: 'Claire Dubois',
    contact_email: 'claire@parisianthreads.com',
    website: 'https://parisianthreads.com',
    sustainable_focus: true,
    average_order_size: '$2500+',
    lead_source: 'ai_discovery',
    lead_quality_score: 92,
    notes: 'French-inspired fashion, perfect for European designer collection'
  },
  {
    business_name: 'Mediterranean Style',
    business_type: 'boutique',
    city: 'Charleston',
    state_province: 'SC',
    country: 'USA',
    contact_name: 'Sofia Greco',
    contact_email: 'sofia@mediterraneanstyle.com',
    website: 'https://mediterraneanstyle.com',
    sustainable_focus: true,
    average_order_size: '$1000-2500',
    lead_source: 'ai_discovery',
    lead_quality_score: 86,
    notes: 'Italian/Greek inspired fashion, linen focused'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabase();
    console.log('[Seed Leads] Starting lead seeding...');

    let seeded = 0;
    let skipped = 0;
    let errors = 0;

    for (const lead of INITIAL_LEADS) {
      try {
        // Check if lead already exists
        const { data: existing } = await supabase
          .from('ff_boutique_buyers')
          .select('id')
          .eq('business_name', lead.business_name)
          .eq('tenant_id', TENANT_ID)
          .single();

        if (existing) {
          console.log(`[Seed Leads] Skipping existing: ${lead.business_name}`);
          skipped++;
          continue;
        }

        // Insert new lead
        const { error } = await supabase
          .from('ff_boutique_buyers')
          .insert({
            tenant_id: TENANT_ID,
            ...lead,
            status: 'prospect',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error(`[Seed Leads] Error seeding ${lead.business_name}:`, error.message);
          errors++;
        } else {
          console.log(`[Seed Leads] Seeded: ${lead.business_name}`);
          seeded++;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Seed Leads] Exception for ${lead.business_name}:`, errorMessage);
        errors++;
      }
    }

    return NextResponse.json({
      success: errors === 0,
      data: {
        seeded,
        skipped,
        errors,
        total: INITIAL_LEADS.length
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Seed Leads] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabase();

  const { data: leads, count } = await supabase
    .from('ff_boutique_buyers')
    .select('business_name, business_type, status, lead_quality_score', { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .order('lead_quality_score', { ascending: false });

  return NextResponse.json({
    success: true,
    data: {
      total_leads: count,
      leads
    }
  });
}
