/**
 * Dan's FREE Wholesale Buyer Discovery System
 * Finds retailers & wholesalers who need natural fiber products
 * Uses AI web search + email pattern guessing (no paid APIs)
 * Target: Shopify stores, boutiques, giant wholesalers (Winners, TJMaxx, etc.)
 * Business Model: Ask what they need → Source for them → Become their supplier
 * Margins: 40-50% wholesale markup (vs 15-20% marketplace commission)
 * Budget: $0/month (completely free)
 */

const axios = require('axios');
const { withCronAuth } = require('../../lib/api-wrapper');
const { queryAtlas } = require('./atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

// CRITICAL: Use Supabase client with service role key to bypass RLS
// Railway's DATABASE_URL pool connection is subject to RLS and blocks INSERTs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Dan Free Scraper] Starting wholesale buyer/retailer discovery for B2B distribution...');

  try {
    // =====================================================================
    // STEP 1: Get existing companies to avoid duplicates
    // =====================================================================

    console.log('[Dan Free Scraper] Fetching existing retailers to avoid duplicates...');
    const existingCompaniesResult = await supabase
      .from('contacts')
      .select('company')
      .eq('tenant_id', tenantId)
      .not('company', 'is', null)
      .neq('company', '')
      .order('created_at', { ascending: false })
      .limit(100);

    const existingCompanies = (existingCompaniesResult.data || []).map(row => row.company).join(', ');
    console.log(`[Dan Free Scraper] Found ${existingCompaniesResult.data?.length || 0} existing retailers to exclude`);

    // =====================================================================
    // STEP 2: Use AI to discover NEW companies (not in our database)
    // =====================================================================

    const searchPrompt = `Search the web and find 10 real retailers and wholesale buyers who would be interested in sourcing natural fiber products (linen, organic cotton, wool, hemp, silk).

CRITICAL: Find DIFFERENT retailers than the ones we've already contacted. Here are retailers to AVOID (we already have them):
${existingCompanies || 'None yet'}

IMPORTANT: Return REAL retailers that exist, with their actual domains. DO NOT include any of the retailers listed above.

TARGET RETAILERS:
1. Shopify store owners selling wellness, sustainable fashion, or home goods
2. Boutique retailers in major cities (yoga studios, gift shops, wellness stores)
3. Giant wholesalers/discount chains (Winners, TJMaxx, HomeSense, Marshall's style)
4. Department stores with conscious living sections
5. Hotel/spa gift shops
6. Museum/gallery stores
7. Online marketplaces (Etsy sellers who could wholesale)

For each retailer, provide:
- Retailer name (must be DIFFERENT from the list above)
- Website domain (e.g., retailername.com)
- Retailer type (shopify_store, boutique, wholesaler, department_store, online_marketplace)
- Size estimate (small, medium, large, giant)
- Why they'd be interested in sourcing natural fiber products

Return JSON array:
[
  {
    "name": "Retailer Name",
    "domain": "domain.com",
    "industry": "shopify_store",
    "size": "medium",
    "reason": "Online sustainable fashion store, perfect fit for wholesale natural fiber products"
  }
]

Focus on retailers that:
- Sell wellness, sustainable fashion, home goods, or natural living products
- Have existing customer base looking for natural/organic products
- Could order 50-500+ units per SKU
- Have professional operations (not just starting out)
- Would value reliable natural fiber sourcing
- Are NOT in the exclusion list above`;

    console.log('[Dan Free Scraper] Searching for NEW wholesale buyers/retailers via AI (excluding existing ones)...');

    const atlasResponse = await queryAtlas(
      searchPrompt,
      'marketing',
      tenantId,
      {
        sources: ['claude'], // Use Claude (always available)
        save_to_memory: true,
        calledBy: 'dan_free_scraper'
      }
    );

    if (!atlasResponse.success) {
      throw new Error(`Atlas search failed: ${atlasResponse.error}`);
    }

    let companies = [];
    try {
      let jsonText = atlasResponse.answer;

      // Extract JSON from markdown code blocks if present
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      // Also try to find JSON array if not in code block
      const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (arrayMatch && !jsonMatch) {
        jsonText = arrayMatch[0];
      }

      companies = JSON.parse(jsonText.trim());

      console.log(`[Dan Free Scraper] Successfully parsed ${companies.length} companies from AI response`);
    } catch (e) {
      console.error('[Dan Free Scraper] Failed to parse AI response:', e);
      console.error('[Dan Free Scraper] Raw response:', atlasResponse.answer);
      return res.status(500).json({
        success: false,
        error: 'AI returned invalid company data'
      });
    }

    console.log(`[Dan Free Scraper] Found ${companies.length} companies from AI search`);

    // =====================================================================
    // STEP 2: Generate likely email addresses using common patterns
    // =====================================================================

    const discoveredLeads = [];
    const emailPatterns = [
      'wholesale', 'buying', 'purchasing', 'buyer', 'sourcing',
      'procurement', 'vendors', 'suppliers', 'info', 'contact'
    ];

    for (const company of companies) {
      try {
        // Check if company already exists - Use Supabase to bypass RLS
        const existingCompany = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('company', company.name)
          .limit(1);

        if (existingCompany.data && existingCompany.data.length > 0) {
          console.log(`[Dan Free Scraper] ${company.name} already exists, skipping`);
          continue;
        }

        // Generate likely contact emails
        const potentialEmails = emailPatterns.map(pattern =>
          `${pattern}@${company.domain}`
        );

        // Pick the most professional email (wholesale@ or buying@ for B2B outreach)
        const primaryEmail = `wholesale@${company.domain}`;

        discoveredLeads.push({
          name: company.name,
          company: company.name,
          domain: company.domain,
          email: primaryEmail,
          alternateEmails: potentialEmails,
          industry: company.industry,
          size: company.size,
          title: 'Wholesale Buyer / Purchasing Manager',
          confidence: 60, // Lower confidence since we're guessing emails
          source: 'ai_wholesale_discovery',
          verified: false,
          discoveryReason: company.reason
        });

      } catch (error) {
        console.error(`[Dan Free Scraper] Error processing ${company.name}:`, error);
      }
    }

    console.log(`[Dan Free Scraper] Generated ${discoveredLeads.length} leads with estimated emails`);

    // =====================================================================
    // STEP 3: Add discovered leads to database
    // =====================================================================

    const addedLeads = [];

    for (const lead of discoveredLeads) {
      try {
        // Double-check email doesn't exist - Use Supabase to bypass RLS
        const existingEmail = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('email', lead.email)
          .limit(1);

        if (existingEmail.data && existingEmail.data.length > 0) {
          console.log(`[Dan Free Scraper] Email ${lead.email} already exists, skipping`);
          continue;
        }

        // Insert contact - Use Supabase client to bypass RLS
        const contactResult = await supabase
          .from('contacts')
          .insert({
            tenant_id: tenantId,
            full_name: lead.name,
            company: lead.company,
            email: lead.email,
            title: lead.title,
            stage: 'lead',
            lead_source: 'ai_web_search',
            notes: `Discovered via AI wholesale buyer discovery for natural fiber distribution (${lead.confidence}% confidence)

Retailer Type: ${lead.industry}
Business Size: ${lead.size}
Domain: ${lead.domain}
Why Good Fit: ${lead.discoveryReason}

⚠️ Email is estimated using B2B patterns (wholesale@, buying@, purchasing@) - verify before outreach
Alternate emails to try: ${lead.alternateEmails.join(', ')}

TARGET: Wholesale natural fiber products (linen, cotton, wool, hemp, silk)
APPROACH: Ask what products they need, source for them, become their supplier`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        console.log(`[Dan Free Scraper] Contact INSERT result for ${lead.email}:`, {
          hasError: !!contactResult.error,
          error: contactResult.error,
          hasData: !!contactResult.data,
          data: contactResult.data
        });

        if (contactResult.error || !contactResult.data) {
          console.error(`[Dan Free Scraper] ❌ Failed to insert ${lead.email}:`, contactResult.error || 'No data returned');
          continue;
        }

        const contactId = contactResult.data.id;

        // Log activity - Use Supabase client to bypass RLS
        const activityResult = await supabase
          .from('contact_activities')
          .insert({
            tenant_id: tenantId,
            contact_id: contactId,
            activity_type: 'lead_discovered',
            description: `Wholesale buyer/retailer discovered via free AI search: ${lead.company}

Discovery Method: ai_wholesale_discovery
Confidence: ${lead.confidence}%
Domain: ${lead.domain}
Retailer Type: ${lead.industry}
Verified: false
Target: B2B Natural Fiber Distribution`,
            created_at: new Date().toISOString()
          });

        if (activityResult.error) {
          console.error(`[Dan Free Scraper] ❌ Failed to log contact activity:`, activityResult.error);
        } else {
          console.log(`[Dan Free Scraper] ✓ Contact activity logged for ${lead.email}`);
        }

        // Log bot action - Use Supabase client to bypass RLS
        const botLogResult = await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'dan',
            action_type: 'lead_discovery',
            action_description: `Discovered wholesale buyer/retailer for natural fiber distribution: ${lead.company}`,
            status: 'completed',
            related_entity_type: 'contact',
            related_entity_id: contactId,
            triggered_by: req.body?.triggered_by || 'automated',
            metadata: {
              retailer: lead.company,
              retailer_type: lead.industry,
              source: 'ai_wholesale_discovery',
              confidence: lead.confidence,
              verified: false,
              cost: 0,
              target_program: 'b2b_distribution'
            }
          });

        if (botLogResult.error) {
          console.error(`[Dan Free Scraper] ❌ Failed to log bot action:`, botLogResult.error);
        } else {
          console.log(`[Dan Free Scraper] ✓ Bot action logged for ${lead.email}`);
        }

        // Add to outreach queue for automated email outreach
        const queueResult = await supabase
          .from('dan_outreach_queue')
          .insert({
            tenant_id: tenantId,
            contact_email: lead.email,
            contact_name: lead.name,
            company_name: lead.company,
            priority: lead.confidence >= 70 ? 'high' : 'medium',
            status: 'pending',
            subject: `Natural fiber wholesale sourcing for ${lead.company}`,
            created_at: new Date().toISOString()
          });

        if (queueResult.error) {
          console.error(`[Dan Free Scraper] ❌ Failed to queue ${lead.email}:`, queueResult.error);
        } else {
          console.log(`[Dan Free Scraper] ✓ Added ${lead.email} to outreach queue`);
        }

        addedLeads.push({
          contact_id: contactId,
          company: lead.company,
          email: lead.email,
          confidence: lead.confidence,
          verified: false,
          queued_for_outreach: !queueResult.error
        });

        console.log(`[Dan Free Scraper] Added lead: ${lead.company} (${lead.email})`);

      } catch (error) {
        console.error(`[Dan Free Scraper] Error adding lead ${lead.email}:`, error);
      }
    }

    console.log(`[Dan Free Scraper] Added ${addedLeads.length} new wholesale buyer/retailer leads for B2B distribution (100% free)`);

    return res.json({
      success: true,
      version: '5.0-b2b-wholesale-distribution',  // Version check to verify deployment
      data: {
        retailers_discovered: companies.length,
        leads_generated: discoveredLeads.length,
        leads_added: addedLeads.length,
        leads: addedLeads,
        cost: {
          total: 0,
          per_lead: 0,
          currency: 'USD',
          method: 'Free AI web search + email pattern guessing'
        },
        note: 'Emails are estimated using B2B patterns (wholesale@, buying@, purchasing@). Verify before sending outreach.',
        next_steps: [
          '1. Review wholesale buyer/retailer leads in CRM',
          '2. Verify emails manually if needed',
          '3. Retailers will be contacted asking what natural fiber products they need',
          '4. System runs every 10 minutes to find fresh wholesale buyers',
          '5. Target: Shopify stores, boutiques, giant wholesalers (Winners, TJMaxx, etc.)',
          '6. Business Model: Source products for them, become their supplier (40-50% markup)'
        ]
      }
    });

  } catch (error) {
    console.error('[Dan Free Scraper] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
