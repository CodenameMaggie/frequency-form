/**
 * Dan Lead Generator Bot
 * Discovers boutiques, yoga studios, hotels for wholesale partnerships
 * Sources: Google Maps, Instagram, Yelp, sustainable fashion directories
 * CRON: Every 2 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // F&F tenant

// Sample boutique buyers (in real implementation: scrape Google Maps, Instagram, Yelp)
const SAMPLE_BOUTIQUE_BUYERS = [
  {
    business_name: 'Green Threads Boutique',
    business_type: 'boutique',
    website: 'https://greenthreadsboutique.com',
    city: 'Portland',
    state_province: 'OR',
    country: 'USA',
    instagram_handle: '@greenthreadsboutique',
    sustainable_focus: true,
    lead_source: 'google_search',
    lead_quality_score: 85,
    average_order_size: '$1000-2500',
    preferred_price_tier: 'healing'
  },
  {
    business_name: 'Zen Yoga & Wellness',
    business_type: 'yoga_studio',
    website: 'https://zenyogawellness.com',
    city: 'San Francisco',
    state_province: 'CA',
    country: 'USA',
    instagram_handle: '@zenyogasf',
    sustainable_focus: true,
    lead_source: 'instagram',
    lead_quality_score: 75,
    average_order_size: '$500-1000',
    preferred_price_tier: 'foundation'
  },
  {
    business_name: 'The Artisan Collective',
    business_type: 'boutique',
    website: 'https://artisancollective.com',
    city: 'Seattle',
    state_province: 'WA',
    country: 'USA',
    instagram_handle: '@artisancollectivesea',
    sustainable_focus: true,
    lead_source: 'google_search',
    lead_quality_score: 90,
    average_order_size: '$2500+',
    preferred_price_tier: 'healing'
  },
  {
    business_name: 'Mountain View Resort & Spa',
    business_type: 'hotel',
    website: 'https://mountainviewresortspa.com',
    city: 'Boulder',
    state_province: 'CO',
    country: 'USA',
    sustainable_focus: true,
    lead_source: 'google_search',
    lead_quality_score: 80,
    average_order_size: '$1000-2500',
    preferred_price_tier: 'healing'
  },
  {
    business_name: 'Conscious Living Boutique',
    business_type: 'boutique',
    city: 'Austin',
    state_province: 'TX',
    country: 'USA',
    instagram_handle: '@consciouslivingaustin',
    sustainable_focus: true,
    lead_source: 'instagram',
    lead_quality_score: 85,
    average_order_size: '$1000-2500',
    preferred_price_tier: 'foundation'
  }
];

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  // MFS Central Database
  const { createClient } = await import('@supabase/supabase-js');
  const mfsSupabase = createClient(
    process.env.MFS_SUPABASE_URL!,
    process.env.MFS_SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('[Dan Lead Generator] Starting boutique buyer discovery...');

    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.FORBES_COMMAND_CRON) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let leadsAdded = 0;
    let leadsSkipped = 0;
    let mfsLeadsAdded = 0;
    const errors = [];

    // In real implementation: Scrape Google Maps, Instagram, Yelp
    // Search for: "sustainable fashion boutique", "natural fiber store", "yoga studio retail"

    for (const buyer of SAMPLE_BOUTIQUE_BUYERS) {
      try {
        // Check if buyer already exists in F&F database
        const { data: existing } = await supabase
          .from('ff_boutique_buyers')
          .select('id')
          .eq('tenant_id', TENANT_ID)
          .eq('business_name', buyer.business_name)
          .single();

        if (existing) {
          leadsSkipped++;
          continue;
        }

        // Add new buyer to F&F database
        const { error: insertError } = await supabase
          .from('ff_boutique_buyers')
          .insert({
            tenant_id: TENANT_ID,
            ...buyer,
            status: 'prospect'
          });

        if (insertError) {
          console.error(`[Dan Lead Generator] Error adding ${buyer.business_name} to F&F:`, insertError);
          errors.push(`${buyer.business_name}: ${insertError.message}`);
        } else {
          leadsAdded++;
          console.log(`[Dan Lead Generator] ✅ Added to F&F: ${buyer.business_name}`);

          // Also write to MFS central database
          try {
            // Check if lead already exists in MFS central
            const { data: mfsExisting } = await mfsSupabase
              .from('leads')
              .select('id')
              .eq('source', 'FF_osm')
              .eq('business_name', buyer.business_name)
              .single();

            if (!mfsExisting) {
              const { error: mfsError } = await mfsSupabase
                .from('leads')
                .insert({
                  source: 'FF_osm',
                  business_name: buyer.business_name,
                  contact_info: buyer.website || buyer.instagram_handle || null,
                  location: `${buyer.city}, ${buyer.state_province}, ${buyer.country}`,
                  lead_quality_score: buyer.lead_quality_score,
                  notes: `${buyer.business_type} - ${buyer.sustainable_focus ? 'Sustainable focus' : 'Standard'} - Avg order: ${buyer.average_order_size || 'Unknown'}`,
                  status: 'new'
                });

              if (mfsError) {
                console.error(`[Dan Lead Generator] Error adding ${buyer.business_name} to MFS central:`, mfsError);
                errors.push(`${buyer.business_name} (MFS): ${mfsError.message}`);
              } else {
                mfsLeadsAdded++;
                console.log(`[Dan Lead Generator] ✅ Added to MFS central: ${buyer.business_name}`);
              }
            } else {
              console.log(`[Dan Lead Generator] ℹ️ Already exists in MFS central: ${buyer.business_name}`);
            }
          } catch (mfsError: any) {
            console.error(`[Dan Lead Generator] Error writing to MFS central for ${buyer.business_name}:`, mfsError);
            errors.push(`${buyer.business_name} (MFS): ${mfsError.message}`);
          }
        }
      } catch (error: any) {
        console.error(`[Dan Lead Generator] Error processing ${buyer.business_name}:`, error);
        errors.push(`${buyer.business_name}: ${error.message}`);
      }
    }

    // Create task for outreach planning
    if (leadsAdded > 0) {
      await supabase.from('tasks').insert({
        tenant_id: TENANT_ID,
        title: `Plan outreach for ${leadsAdded} new wholesale leads`,
        description: `Dan discovered ${leadsAdded} new potential wholesale buyers. Prioritize outreach based on lead quality score and fit.`,
        assigned_to: 'dan-auto-outreach-bot',
        priority: 'high',
        status: 'pending',
        related_entity_type: 'buyer'
      });
    }

    console.log(`[Dan Lead Generator] Complete: ${leadsAdded} added to F&F, ${mfsLeadsAdded} added to MFS central, ${leadsSkipped} skipped`);

    return NextResponse.json({
      success: true,
      data: {
        leads_added_ff: leadsAdded,
        leads_added_mfs_central: mfsLeadsAdded,
        leads_skipped: leadsSkipped,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('[Dan Lead Generator] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
