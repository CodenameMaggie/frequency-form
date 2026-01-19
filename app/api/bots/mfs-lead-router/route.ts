/**
 * MFS Lead Router
 * Pulls leads from MFS gap-finder and routes fashion-relevant ones to F&F
 *
 * The MFS gap-finder finds high-value prospects for all businesses.
 * This bot filters for fashion/retail/wellness businesses that could be:
 * 1. Wholesale buyers (boutiques, yoga studios, spas, hotels)
 * 2. Potential partners (fashion brands, designers)
 *
 * CRON: Every 4 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { sendBotMessage } from '@/lib/mfs-bot-comms';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';
const MFS_API_URL = process.env.MFS_API_URL || 'http://5.78.139.9:3000';

// Keywords that indicate a fashion/retail/wellness business
const FASHION_KEYWORDS = [
  'fashion', 'clothing', 'apparel', 'boutique', 'designer', 'textile',
  'linen', 'cotton', 'silk', 'cashmere', 'wool', 'hemp', 'natural fiber',
  'sustainable fashion', 'eco fashion', 'ethical fashion', 'slow fashion'
];

const WELLNESS_KEYWORDS = [
  'yoga', 'spa', 'wellness', 'meditation', 'retreat', 'pilates',
  'holistic', 'ayurveda', 'mindfulness', 'healing', 'spiritual'
];

const RETAIL_KEYWORDS = [
  'boutique', 'store', 'shop', 'retail', 'department store', 'gift shop',
  'hotel amenities', 'resort', 'luxury hotel', 'lifestyle brand'
];

function isRelevantForFF(contact: {
  company?: string;
  notes?: string;
  tags?: string[];
  lead_source?: string;
}): { relevant: boolean; type: 'partner' | 'wholesale' | null; reason: string } {
  const searchText = [
    contact.company || '',
    contact.notes || '',
    (contact.tags || []).join(' ')
  ].join(' ').toLowerCase();

  // Check for fashion brands (potential partners)
  for (const keyword of FASHION_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return { relevant: true, type: 'partner', reason: `Fashion keyword: ${keyword}` };
    }
  }

  // Check for wellness businesses (potential wholesale)
  for (const keyword of WELLNESS_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return { relevant: true, type: 'wholesale', reason: `Wellness keyword: ${keyword}` };
    }
  }

  // Check for retail businesses (potential wholesale)
  for (const keyword of RETAIL_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return { relevant: true, type: 'wholesale', reason: `Retail keyword: ${keyword}` };
    }
  }

  return { relevant: false, type: null, reason: 'No relevant keywords found' };
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[MFS Lead Router] Checking MFS for F&F-relevant leads...');

    // 1. Get all contacts from MFS that haven't been processed for F&F
    let allContacts: any[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await fetch(
        `${MFS_API_URL}/api/contacts?limit=${limit}&offset=${offset}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) {
        console.error('[MFS Lead Router] Failed to fetch contacts from MFS');
        break;
      }

      const data = await response.json();
      if (!data.contacts || data.contacts.length === 0) break;

      allContacts.push(...data.contacts);
      offset += limit;

      // Safety limit
      if (offset > 500) break;
    }

    console.log(`[MFS Lead Router] Found ${allContacts.length} contacts in MFS`);

    let partnersRouted = 0;
    let wholesaleRouted = 0;
    let skipped = 0;
    let alreadyExists = 0;

    for (const contact of allContacts) {
      // Skip if it's already an F&F lead (from our own sync)
      if (contact.lead_source?.includes('ff_')) {
        skipped++;
        continue;
      }

      // Check relevance
      const { relevant, type, reason } = isRelevantForFF(contact);

      if (!relevant) {
        skipped++;
        continue;
      }

      // Check if we already have this contact
      if (contact.email) {
        const { data: existingPartner } = await supabase
          .from('ff_partners')
          .select('id')
          .eq('tenant_id', TENANT_ID)
          .eq('contact_email', contact.email)
          .single();

        const { data: existingBuyer } = await supabase
          .from('ff_boutique_buyers')
          .select('id')
          .eq('tenant_id', TENANT_ID)
          .eq('contact_email', contact.email)
          .single();

        if (existingPartner || existingBuyer) {
          alreadyExists++;
          continue;
        }
      }

      // Route to appropriate table
      try {
        if (type === 'partner') {
          const { error } = await supabase.from('ff_partners').insert({
            tenant_id: TENANT_ID,
            brand_name: contact.company || contact.full_name,
            contact_name: contact.full_name,
            contact_email: contact.email,
            website: contact.website,
            discovery_source: `mfs_${contact.lead_source || 'gap_finder'}`,
            status: 'prospect',
            primary_fabric: 'unknown',
            price_tier: 'foundation',
            notes: `Routed from MFS. ${reason}. Original notes: ${contact.notes || 'none'}`
          });

          if (!error) {
            partnersRouted++;
            console.log(`[MFS Lead Router] ✅ Partner: ${contact.company || contact.full_name}`);
          }
        } else if (type === 'wholesale') {
          const { error } = await supabase.from('ff_boutique_buyers').insert({
            tenant_id: TENANT_ID,
            business_name: contact.company || contact.full_name,
            contact_name: contact.full_name,
            contact_email: contact.email,
            website: contact.website,
            business_type: contact.notes?.toLowerCase().includes('yoga') ? 'yoga_studio' :
                          contact.notes?.toLowerCase().includes('spa') ? 'spa' :
                          contact.notes?.toLowerCase().includes('hotel') ? 'hotel' : 'boutique',
            status: contact.email ? 'prospect' : 'research_needed',
            lead_source: `mfs_${contact.lead_source || 'gap_finder'}`,
            lead_quality_score: contact.fit_score || 50,
            emails_sent_count: 0,
            notes: `Routed from MFS. ${reason}. Original notes: ${contact.notes || 'none'}`
          });

          if (!error) {
            wholesaleRouted++;
            console.log(`[MFS Lead Router] ✅ Wholesale: ${contact.company || contact.full_name}`);
          }
        }
      } catch (err) {
        console.error(`[MFS Lead Router] Error routing ${contact.full_name}:`, err);
      }
    }

    // Report to C-suite
    if (partnersRouted > 0 || wholesaleRouted > 0) {
      await sendBotMessage('henry', 'atlas', {
        type: 'report',
        subject: `MFS Lead Routing Complete: ${partnersRouted + wholesaleRouted} leads for F&F`,
        body: `Atlas,

I've scanned MFS gap-finder and routed relevant leads to F&F:
- Fashion brands (partners): ${partnersRouted}
- Retail/wellness (wholesale): ${wholesaleRouted}
- Already in F&F: ${alreadyExists}
- Not relevant: ${skipped}

Total MFS contacts reviewed: ${allContacts.length}

Dan can begin outreach on the new prospects.

- Henry`,
        data: {
          partners_routed: partnersRouted,
          wholesale_routed: wholesaleRouted,
          already_exists: alreadyExists,
          skipped,
          total_reviewed: allContacts.length
        }
      }, { channel: 'LEADS', priority: partnersRouted + wholesaleRouted > 10 ? 'HIGH' : 'NORMAL' });
    }

    // Log action
    await supabase.from('ff_bot_actions').insert({
      bot_name: 'mfs-lead-router',
      action_type: 'lead_routing',
      status: 'completed',
      details: {
        partners_routed: partnersRouted,
        wholesale_routed: wholesaleRouted,
        already_exists: alreadyExists,
        skipped,
        total_reviewed: allContacts.length
      },
      cost: 0
    });

    console.log(`[MFS Lead Router] Complete: ${partnersRouted} partners, ${wholesaleRouted} wholesale`);

    return NextResponse.json({
      success: true,
      data: {
        partners_routed: partnersRouted,
        wholesale_routed: wholesaleRouted,
        already_exists: alreadyExists,
        skipped,
        total_reviewed: allContacts.length
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[MFS Lead Router] Error:', error);
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

  // Get recent routing actions
  const { data: recentActions } = await supabase
    .from('ff_bot_actions')
    .select('*')
    .eq('bot_name', 'mfs-lead-router')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get MFS contact count
  let mfsContactCount = 0;
  try {
    const response = await fetch(`${MFS_API_URL}/api/contacts?limit=1`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      mfsContactCount = data.total || data.contacts?.length || 0;
    }
  } catch {
    // MFS not reachable
  }

  return NextResponse.json({
    success: true,
    data: {
      mfs_contact_count: mfsContactCount,
      recent_routes: recentActions?.map(a => ({
        timestamp: a.created_at,
        status: a.status,
        details: a.details
      })) || []
    }
  });
}
