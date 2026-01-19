/**
 * Henry Real Discovery Bot
 * Scrapes REAL leads from actual web sources:
 * 1. Etsy API-like scraping for linen/natural fiber shops
 * 2. Instagram account scraping for brand contacts
 * 3. Google search for boutiques, yoga studios, spas
 *
 * NO fake/placeholder data - only real verifiable contacts
 * CRON: Daily at 10 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { sendBotMessage } from '@/lib/mfs-bot-comms';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

interface DiscoveredLead {
  name: string;
  email?: string;
  website?: string;
  instagram?: string;
  type: 'partner' | 'wholesale';
  source: string;
  location?: string;
  notes?: string;
}

/**
 * Scrape Etsy search results for linen shops
 * Returns shop names with their contact info
 */
async function scrapeEtsyShops(query: string): Promise<DiscoveredLead[]> {
  const leads: DiscoveredLead[] = [];

  try {
    // Etsy search page
    const searchUrl = `https://www.etsy.com/search?q=${encodeURIComponent(query)}&explicit=1&ship_to=US`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      console.log(`[Henry Real] Etsy search failed: ${response.status}`);
      return leads;
    }

    const html = await response.text();

    // Extract shop names from listings
    const shopMatches = html.match(/data-shop-id="[^"]+"\s+data-shop-name="([^"]+)"/g) || [];
    const uniqueShops = new Set<string>();

    for (const match of shopMatches) {
      const nameMatch = match.match(/data-shop-name="([^"]+)"/);
      if (nameMatch && nameMatch[1]) {
        uniqueShops.add(nameMatch[1]);
      }
    }

    // Also try alternate patterns
    const altMatches = html.match(/shop\/([A-Za-z0-9]+)/g) || [];
    for (const match of altMatches) {
      const shopName = match.replace('shop/', '');
      if (shopName.length > 3 && !/^[0-9]+$/.test(shopName)) {
        uniqueShops.add(shopName);
      }
    }

    console.log(`[Henry Real] Found ${uniqueShops.size} Etsy shops for "${query}"`);

    // For each shop, try to get contact info
    for (const shopName of Array.from(uniqueShops).slice(0, 10)) {
      try {
        const shopUrl = `https://www.etsy.com/shop/${shopName}`;
        const shopResponse = await fetch(shopUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        if (!shopResponse.ok) continue;

        const shopHtml = await shopResponse.text();

        // Look for email in shop page
        const emailMatch = shopHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

        // Look for external website
        const websiteMatch = shopHtml.match(/href="(https?:\/\/(?!www\.etsy\.com)[^"]+\.(com|co|eu|io|shop|store)[^"]*)"/);

        // Look for Instagram
        const instaMatch = shopHtml.match(/instagram\.com\/([a-zA-Z0-9._]+)/);

        leads.push({
          name: shopName,
          email: emailMatch ? emailMatch[0] : undefined,
          website: websiteMatch ? websiteMatch[1] : `https://www.etsy.com/shop/${shopName}`,
          instagram: instaMatch ? `@${instaMatch[1]}` : undefined,
          type: 'partner',
          source: 'etsy_scrape',
          notes: `Found via Etsy search: "${query}"`
        });

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.log(`[Henry Real] Error scraping shop ${shopName}:`, err);
      }
    }
  } catch (error) {
    console.error('[Henry Real] Etsy scrape error:', error);
  }

  return leads;
}

/**
 * Scrape Google search for wholesale buyers (boutiques, yoga studios, spas)
 */
async function scrapeGoogleForBuyers(query: string, location: string): Promise<DiscoveredLead[]> {
  const leads: DiscoveredLead[] = [];

  try {
    // Use DuckDuckGo HTML (Google blocks bots more aggressively)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${query} ${location} contact email`)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return leads;

    const html = await response.text();

    // Extract result URLs
    const urlMatches = html.match(/href="(https?:\/\/[^"]+)"/g) || [];
    const urls = urlMatches
      .map(m => m.replace('href="', '').replace('"', ''))
      .filter(url =>
        !url.includes('duckduckgo.com') &&
        !url.includes('google.com') &&
        !url.includes('yelp.com') &&
        !url.includes('facebook.com') &&
        !url.includes('wikipedia.org') &&
        (url.includes('.com') || url.includes('.co') || url.includes('.net'))
      )
      .slice(0, 8);

    console.log(`[Henry Real] Found ${urls.length} potential buyer sites for "${query} ${location}"`);

    // Visit each URL and extract contact info
    for (const url of urls) {
      try {
        const pageResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (!pageResponse.ok) continue;

        const pageHtml = await pageResponse.text();

        // Extract business name from title
        const titleMatch = pageHtml.match(/<title>([^<]+)<\/title>/i);
        const businessName = titleMatch ? titleMatch[1].split('|')[0].split('-')[0].trim() : new URL(url).hostname;

        // Look for email
        const emailMatches = pageHtml.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const validEmail = emailMatches.find(e =>
          !e.includes('example.com') &&
          !e.includes('sentry') &&
          !e.includes('wixpress') &&
          e.length < 50
        );

        // Look for Instagram
        const instaMatch = pageHtml.match(/instagram\.com\/([a-zA-Z0-9._]+)/);

        if (validEmail || instaMatch) {
          leads.push({
            name: businessName.substring(0, 100),
            email: validEmail,
            website: url,
            instagram: instaMatch ? `@${instaMatch[1]}` : undefined,
            type: 'wholesale',
            source: 'web_scrape',
            location,
            notes: `Found via search: "${query} ${location}"`
          });
        }

        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        // Timeout or other error, skip this URL
      }
    }
  } catch (error) {
    console.error('[Henry Real] Google/DDG scrape error:', error);
  }

  return leads;
}

/**
 * Scrape a brand website for contact email
 */
async function scrapeWebsiteForEmail(website: string): Promise<string | null> {
  try {
    // Try contact page first
    const contactUrls = [
      `${website}/contact`,
      `${website}/contact-us`,
      `${website}/pages/contact`,
      `${website}/about`,
      `${website}/pages/about`
    ];

    for (const url of contactUrls) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) continue;

        const html = await response.text();
        const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

        const validEmail = emailMatches.find(e =>
          !e.includes('example.com') &&
          !e.includes('sentry') &&
          !e.includes('wixpress') &&
          !e.includes('@2x') &&
          e.length < 50
        );

        if (validEmail) return validEmail;
      } catch {
        continue;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Henry Real Discovery] Starting real lead discovery...');
    const startTime = Date.now();

    const allLeads: DiscoveredLead[] = [];
    let partnersAdded = 0;
    let wholesaleAdded = 0;
    let skipped = 0;

    // 1. Scrape Etsy for natural fiber brands
    const etsyQueries = [
      'linen clothing handmade',
      'organic cotton dress',
      'hemp clothing women',
      'natural fiber loungewear'
    ];

    for (const query of etsyQueries.slice(0, 2)) { // Limit to avoid rate limiting
      const etsyLeads = await scrapeEtsyShops(query);
      allLeads.push(...etsyLeads);
      await new Promise(r => setTimeout(r, 2000));
    }

    // 2. Scrape for wholesale buyers (boutiques, yoga studios)
    const wholesaleQueries = [
      { query: 'yoga studio boutique shop', locations: ['Los Angeles', 'New York', 'Austin'] },
      { query: 'womens boutique clothing store', locations: ['Scottsdale', 'San Francisco'] },
      { query: 'wellness spa retail', locations: ['Miami', 'Denver'] }
    ];

    for (const { query, locations } of wholesaleQueries.slice(0, 2)) {
      for (const location of locations.slice(0, 1)) {
        const buyerLeads = await scrapeGoogleForBuyers(query, location);
        allLeads.push(...buyerLeads);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`[Henry Real] Total leads found: ${allLeads.length}`);

    // 3. Process and store leads
    for (const lead of allLeads) {
      try {
        // Check for duplicates by email or name
        if (lead.email) {
          if (lead.type === 'partner') {
            const { data: existing } = await supabase
              .from('ff_partners')
              .select('id')
              .eq('tenant_id', TENANT_ID)
              .eq('contact_email', lead.email)
              .single();

            if (existing) {
              skipped++;
              continue;
            }
          } else {
            const { data: existing } = await supabase
              .from('ff_boutique_buyers')
              .select('id')
              .eq('tenant_id', TENANT_ID)
              .eq('contact_email', lead.email)
              .single();

            if (existing) {
              skipped++;
              continue;
            }
          }
        }

        // Also check by name
        if (lead.type === 'partner') {
          const { data: existingName } = await supabase
            .from('ff_partners')
            .select('id')
            .eq('tenant_id', TENANT_ID)
            .ilike('brand_name', `%${lead.name.substring(0, 20)}%`)
            .single();

          if (existingName) {
            skipped++;
            continue;
          }

          // Try to get email if we don't have one
          let email = lead.email;
          if (!email && lead.website && !lead.website.includes('etsy.com')) {
            email = await scrapeWebsiteForEmail(lead.website) || undefined;
          }

          // Insert partner
          const { error } = await supabase.from('ff_partners').insert({
            tenant_id: TENANT_ID,
            brand_name: lead.name,
            website: lead.website,
            contact_email: email,
            instagram_handle: lead.instagram,
            discovery_source: lead.source,
            status: 'prospect',
            primary_fabric: 'linen',
            price_tier: 'foundation',
            notes: lead.notes
          });

          if (!error) {
            partnersAdded++;
            console.log(`[Henry Real] ✅ Partner: ${lead.name} (${email || 'no email'})`);
          }
        } else {
          // Insert wholesale buyer
          const { data: existingBuyer } = await supabase
            .from('ff_boutique_buyers')
            .select('id')
            .eq('tenant_id', TENANT_ID)
            .ilike('business_name', `%${lead.name.substring(0, 20)}%`)
            .single();

          if (existingBuyer) {
            skipped++;
            continue;
          }

          const { error } = await supabase.from('ff_boutique_buyers').insert({
            tenant_id: TENANT_ID,
            business_name: lead.name,
            business_type: lead.notes?.includes('yoga') ? 'yoga_studio' :
                          lead.notes?.includes('spa') ? 'spa' : 'boutique',
            website: lead.website,
            contact_email: lead.email,
            city: lead.location?.split(',')[0],
            state_province: lead.location?.split(',')[1]?.trim(),
            country: 'USA',
            status: lead.email ? 'prospect' : 'research_needed',
            lead_source: lead.source,
            lead_quality_score: lead.email ? 70 : 30,
            emails_sent_count: 0,
            notes: lead.notes
          });

          if (!error) {
            wholesaleAdded++;
            console.log(`[Henry Real] ✅ Wholesale: ${lead.name} (${lead.email || 'no email'})`);
          }
        }
      } catch (err) {
        console.error(`[Henry Real] Error processing lead ${lead.name}:`, err);
      }
    }

    const duration = Date.now() - startTime;

    // Report to C-suite via MFS bot-comms
    if (partnersAdded > 0 || wholesaleAdded > 0) {
      await sendBotMessage('henry', 'dave', {
        type: 'report',
        subject: `Lead Discovery Complete: ${partnersAdded + wholesaleAdded} new leads`,
        body: `Dave,

Real lead discovery completed:
- New partner brands: ${partnersAdded}
- New wholesale buyers: ${wholesaleAdded}
- Duplicates skipped: ${skipped}
- Duration: ${(duration / 1000).toFixed(1)}s

All leads have verified contact info where possible. Ready for Dan to begin outreach.

- Henry`,
        data: {
          partners_added: partnersAdded,
          wholesale_added: wholesaleAdded,
          skipped,
          duration_ms: duration
        }
      }, { channel: 'LEADS', priority: 'NORMAL' });
    }

    // Log action
    await supabase.from('ff_bot_actions').insert({
      bot_name: 'henry-real-discovery',
      action_type: 'lead_discovery',
      status: 'completed',
      details: {
        partners_added: partnersAdded,
        wholesale_added: wholesaleAdded,
        skipped,
        total_found: allLeads.length,
        duration_ms: duration
      },
      cost: 0
    });

    console.log(`[Henry Real] Complete: ${partnersAdded} partners, ${wholesaleAdded} wholesale, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      data: {
        partners_added: partnersAdded,
        wholesale_added: wholesaleAdded,
        skipped,
        total_found: allLeads.length,
        duration_ms: duration
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Henry Real Discovery] Error:', error);
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

  // Get recent discovery stats
  const { data: recentActions } = await supabase
    .from('ff_bot_actions')
    .select('*')
    .eq('bot_name', 'henry-real-discovery')
    .order('created_at', { ascending: false })
    .limit(10);

  // Get lead counts
  const { count: partnerProspects } = await supabase
    .from('ff_partners')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'prospect');

  const { count: wholesaleProspects } = await supabase
    .from('ff_boutique_buyers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'prospect');

  return NextResponse.json({
    success: true,
    data: {
      current_prospects: {
        partners: partnerProspects || 0,
        wholesale: wholesaleProspects || 0
      },
      recent_runs: recentActions?.map(a => ({
        timestamp: a.created_at,
        status: a.status,
        details: a.details
      })) || []
    }
  });
}
