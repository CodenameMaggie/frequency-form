/**
 * Dan's FREE Brand Discovery System
 * Finds natural fiber clothing brands for Frequency & Form marketplace
 * Uses AI web search + email pattern guessing (no paid APIs)
 * Target: Small-medium brands making linen, organic cotton, wool, hemp, silk
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

  console.log('[Dan Free Scraper] Starting free brand discovery for Frequency & Form...');

  try {
    // =====================================================================
    // STEP 1: Get existing companies to avoid duplicates
    // =====================================================================

    console.log('[Dan Free Scraper] Fetching existing brands to avoid duplicates...');
    const existingCompaniesResult = await supabase
      .from('contacts')
      .select('company')
      .eq('tenant_id', tenantId)
      .not('company', 'is', null)
      .neq('company', '')
      .order('created_at', { ascending: false })
      .limit(100);

    const existingCompanies = (existingCompaniesResult.data || []).map(row => row.company).join(', ');
    console.log(`[Dan Free Scraper] Found ${existingCompaniesResult.data?.length || 0} existing brands to exclude`);

    // =====================================================================
    // STEP 2: Use AI to discover NEW companies (not in our database)
    // =====================================================================

    const searchPrompt = `Search the web and find 10 real natural fiber clothing brands that would be perfect for Frequency & Form's marketplace.

CRITICAL: Find DIFFERENT brands than the ones we've already contacted. Here are brands to AVOID (we already have them):
${existingCompanies || 'None yet'}

IMPORTANT: Return REAL brands that exist, with their actual domains. DO NOT include any of the brands listed above.

We are looking for brands that make clothing or home goods from:
- Linen (healing frequency: 5,000 Hz)
- Organic cotton (foundation frequency: 100 Hz)
- Wool and cashmere (healing frequency: 5,000 Hz)
- Hemp (healing frequency: 5,000 Hz)
- Silk (healing frequency: 15 Hz)
- NO SYNTHETIC FIBERS (polyester, nylon, acrylic, rayon)

For each brand, provide:
- Brand name (must be DIFFERENT from the list above)
- Website domain (e.g., brandname.com)
- Category (linen, organic_cotton, wool, hemp, silk, natural_bedding)
- Size estimate (small, medium, large)
- Why they're a good fit for our natural fiber marketplace

Return JSON array:
[
  {
    "name": "Brand Name",
    "domain": "domain.com",
    "industry": "linen",
    "size": "small",
    "reason": "Makes beautiful linen basics, perfect for our healing tier"
  }
]

Focus on brands that:
- Use ONLY natural fibers (100% linen, cotton, wool, hemp, silk)
- Are small to medium-sized (not huge corporations)
- Have $100K - $5M annual revenue
- Care about sustainability and natural materials
- Can handle their own fulfillment
- Have professional product photography
- Are NOT in the exclusion list above`;

    console.log('[Dan Free Scraper] Searching for NEW natural fiber brands via AI (excluding existing ones)...');

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
      'partnerships', 'wholesale', 'hello', 'info', 'contact',
      'collaborate', 'press', 'team', 'admin'
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

        // Pick the most professional email (partnerships@ or wholesale@ for brand outreach)
        const primaryEmail = `partnerships@${company.domain}`;

        discoveredLeads.push({
          name: company.name,
          company: company.name,
          domain: company.domain,
          email: primaryEmail,
          alternateEmails: potentialEmails,
          industry: company.industry,
          size: company.size,
          title: 'Brand Partnership Contact',
          confidence: 60, // Lower confidence since we're guessing emails
          source: 'ai_brand_discovery',
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
            notes: `Discovered via AI brand discovery for Frequency & Form marketplace (${lead.confidence}% confidence)

Fabric Category: ${lead.industry}
Brand Size: ${lead.size}
Domain: ${lead.domain}
Why Good Fit: ${lead.discoveryReason}

⚠️ Email is estimated using common patterns (partnerships@, wholesale@, etc.) - verify before outreach
Alternate emails to try: ${lead.alternateEmails.join(', ')}

Target for Founding Partner Program: 15% commission (first 50 brands)`,
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
            description: `Natural fiber brand discovered via free AI search: ${lead.company}

Discovery Method: ai_brand_discovery
Confidence: ${lead.confidence}%
Domain: ${lead.domain}
Fabric Category: ${lead.industry}
Verified: false
Target: Founding Partner Program`,
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
            action_description: `Discovered new natural fiber brand via free AI search: ${lead.company}`,
            status: 'completed',
            related_entity_type: 'contact',
            related_entity_id: contactId,
            triggered_by: req.body?.triggered_by || 'automated',
            metadata: {
              brand: lead.company,
              fabric_category: lead.industry,
              source: 'ai_brand_discovery',
              confidence: lead.confidence,
              verified: false,
              cost: 0,
              target_program: 'founding_partner'
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
            subject: `Partnership opportunity for ${lead.company}`,
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

    console.log(`[Dan Free Scraper] Added ${addedLeads.length} new brand leads for Frequency & Form (100% free)`);

    return res.json({
      success: true,
      version: '4.0-natural-fiber-brands',  // Version check to verify deployment
      data: {
        brands_discovered: companies.length,
        leads_generated: discoveredLeads.length,
        leads_added: addedLeads.length,
        leads: addedLeads,
        cost: {
          total: 0,
          per_lead: 0,
          currency: 'USD',
          method: 'Free AI web search + email pattern guessing'
        },
        note: 'Emails are estimated using partnerships@/wholesale@ patterns. Verify before sending outreach.',
        next_steps: [
          '1. Review brand leads in CRM',
          '2. Verify emails manually if needed',
          '3. Brands will be contacted by auto-outreach for Founding Partner program',
          '4. System runs every 10 minutes to find fresh natural fiber brands',
          '5. Target: 50 Founding Partners at 15% commission rate'
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
