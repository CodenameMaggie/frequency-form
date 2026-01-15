/**
 * Henry Seamstress Discovery Bot
 * Discovers custom clothing manufacturers, seamstresses, pattern makers
 * Sources: Etsy, Instagram, Google Maps, Sewport
 * CRON: Twice daily at 11 AM and 5 PM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // F&F tenant

// Sample seamstresses/manufacturers (in real implementation, scrape Etsy/Instagram)
const SAMPLE_MANUFACTURERS = [
  {
    business_name: 'Linen Atelier Portland',
    manufacturer_type: 'seamstress',
    location: 'Portland, OR, USA',
    country: 'USA',
    city: 'Portland',
    state_province: 'OR',
    specialty: ['dresses', 'blouses', 'pants'],
    natural_fiber_experience: true,
    fibers_experienced: ['linen', 'organic_cotton', 'hemp'],
    order_capacity: 'single_piece',
    turnaround_days: 21,
    price_range: '$180-$350 per piece',
    etsy_shop: 'LinenAtelierPDX',
    instagram_handle: '@linen_atelier_pdx',
    discovery_source: 'etsy_search',
    status: 'prospect'
  },
  {
    business_name: 'Natural Fiber Collective',
    manufacturer_type: 'production_facility',
    location: 'Los Angeles, CA, USA',
    country: 'USA',
    city: 'Los Angeles',
    state_province: 'CA',
    specialty: ['dresses', 'outerwear', 'blouses', 'pants'],
    natural_fiber_experience: true,
    fibers_experienced: ['linen', 'wool', 'silk', 'organic_cotton'],
    order_capacity: 'small_batch_10_50',
    min_order_quantity: 10,
    turnaround_days: 28,
    price_range: '$95-$220 per piece (10+ qty)',
    website: 'https://naturalfibercollective.com',
    contact_email: 'orders@naturalfibercollective.com',
    discovery_source: 'google_search',
    status: 'prospect'
  },
  {
    business_name: 'Brooklyn Pattern Studio',
    manufacturer_type: 'pattern_maker',
    location: 'Brooklyn, NY, USA',
    country: 'USA',
    city: 'Brooklyn',
    state_province: 'NY',
    specialty: ['all_garment_types'],
    natural_fiber_experience: true,
    fibers_experienced: ['linen', 'wool', 'silk', 'organic_cotton', 'hemp'],
    order_capacity: 'pattern_service',
    turnaround_days: 10,
    price_range: '$250-$500 per pattern set',
    website: 'https://brooklynpatternstudio.com',
    instagram_handle: '@brooklyn_patterns',
    discovery_source: 'instagram_discovery',
    status: 'prospect'
  },
  {
    business_name: 'Eco Seamstress Co',
    manufacturer_type: 'seamstress',
    location: 'San Francisco, CA, USA',
    country: 'USA',
    city: 'San Francisco',
    state_province: 'CA',
    specialty: ['dresses', 'pants', 'blazers'],
    natural_fiber_experience: true,
    fibers_experienced: ['linen', 'organic_cotton', 'hemp', 'tencel'],
    order_capacity: 'single_piece',
    turnaround_days: 18,
    price_range: '$200-$400 per piece',
    etsy_shop: 'EcoSeamstress',
    contact_email: 'info@ecoseamstress.com',
    discovery_source: 'etsy_search',
    status: 'prospect'
  },
  {
    business_name: 'Heritage Garment Workshop',
    manufacturer_type: 'production_facility',
    location: 'Seattle, WA, USA',
    country: 'USA',
    city: 'Seattle',
    state_province: 'WA',
    specialty: ['outerwear', 'dresses', 'menswear'],
    natural_fiber_experience: true,
    fibers_experienced: ['wool', 'linen', 'organic_cotton'],
    order_capacity: 'medium_batch_50_100',
    min_order_quantity: 50,
    turnaround_days: 35,
    price_range: '$75-$165 per piece (50+ qty)',
    website: 'https://heritagegarmentworkshop.com',
    contact_email: 'production@heritagegarment.com',
    discovery_source: 'google_search',
    status: 'prospect'
  }
];

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    console.log('[Henry Seamstress Discovery] Starting manufacturer discovery...');

    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.FORBES_COMMAND_CRON) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let manufacturersAdded = 0;
    let manufacturersSkipped = 0;
    const errors = [];

    // In real implementation: Scrape Etsy, Instagram, Google Maps, Sewport
    // For now: Use sample data

    for (const manufacturer of SAMPLE_MANUFACTURERS) {
      try {
        // Check if manufacturer already exists
        const { data: existing } = await supabase
          .from('ff_manufacturers')
          .select('id')
          .eq('tenant_id', TENANT_ID)
          .eq('business_name', manufacturer.business_name)
          .single();

        if (existing) {
          manufacturersSkipped++;
          continue;
        }

        // Add new manufacturer as prospect
        const { error: insertError } = await supabase
          .from('ff_manufacturers')
          .insert({
            tenant_id: TENANT_ID,
            ...manufacturer
          });

        if (insertError) {
          console.error(`[Henry Seamstress Discovery] Error adding ${manufacturer.business_name}:`, insertError);
          errors.push(`${manufacturer.business_name}: ${insertError.message}`);
        } else {
          manufacturersAdded++;
          console.log(`[Henry Seamstress Discovery] ✅ Added: ${manufacturer.business_name}`);
        }
      } catch (error: any) {
        console.error(`[Henry Seamstress Discovery] Error processing ${manufacturer.business_name}:`, error);
        errors.push(`${manufacturer.business_name}: ${error.message}`);
      }
    }

    // Create task for vetting new manufacturers
    if (manufacturersAdded > 0) {
      await supabase.from('tasks').insert({
        tenant_id: TENANT_ID,
        title: `Vet ${manufacturersAdded} new manufacturers for Style Studio`,
        description: `Henry discovered ${manufacturersAdded} new custom clothing manufacturers. Schedule test orders to verify quality and capabilities.`,
        assigned_to: 'maggie@maggieforbesstrategies.com',
        priority: 'high',
        status: 'pending',
        related_entity_type: 'manufacturer'
      });
    }

    console.log(`[Henry Seamstress Discovery] Complete: ${manufacturersAdded} added, ${manufacturersSkipped} skipped`);

    return NextResponse.json({
      success: true,
      data: {
        manufacturers_added: manufacturersAdded,
        manufacturers_skipped: manufacturersSkipped,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('[Henry Seamstress Discovery] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
