/**
 * Henry's European Partner Discovery Bot
 * Discovers European natural fiber designers and brands for F&F marketplace
 *
 * Discovery Sources:
 * - Pinterest (European linen brands, natural fiber fashion)
 * - Instagram hashtags (#europeanlinen #sustainablefashioneurope)
 * - Trade shows (Première Vision, Pitti Uomo, Copenhagen Fashion Week)
 * - Sustainable fashion directories (Common Objective, GOTS certified)
 *
 * Target Partners:
 * - European designers specializing in natural fibers
 * - Linen, wool, silk, organic cotton, hemp specialists
 * - Transparent supply chains
 * - Authentic craftsmanship
 *
 * Runs: Twice daily via cron (10 AM and 4 PM)
 * Uses: AI web search, Atlas knowledge, pattern matching
 */

const { withCronAuth } = require('../../lib/api-wrapper');
const { queryAtlas } = require('./atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Henry Partner Discovery] Starting European partner discovery for natural fiber brands...');

  try {
    // =====================================================================
    // STEP 1: Get existing partners to avoid duplicates
    // =====================================================================

    console.log('[Henry Partner Discovery] Fetching existing partners...');
    const { data: existingPartners } = await supabase
      .from('ff_partners')
      .select('brand_name, website')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    const existingBrands = (existingPartners || []).map(p => p.brand_name).join(', ');
    console.log(`[Henry Partner Discovery] Found ${existingPartners?.length || 0} existing partners to exclude`);

    // =====================================================================
    // STEP 2: Get F&F partner requirements from Atlas
    // =====================================================================

    const requirementsPrompt = `Retrieve Frequency & Form partner requirements and discovery strategy.
Include:
1. Partner requirements (European, natural fibers, craftsmanship)
2. Discovery sources (Pinterest, Instagram, trade shows)
3. Target fabric types (linen, wool, silk, organic cotton, hemp)
4. Ideal partner profile`;

    const partnerKnowledge = await queryAtlas(requirementsPrompt, 'partner', tenantId, {
      sources: ['claude'],
      save_to_memory: false
    });

    if (!partnerKnowledge.success) {
      throw new Error('Failed to retrieve partner requirements from Atlas');
    }

    console.log('[Henry Partner Discovery] Retrieved F&F partner criteria from Atlas');

    // =====================================================================
    // STEP 3: Use AI to discover NEW European brands
    // =====================================================================

    const discoveryPrompt = `Search the web and discover 8-10 REAL European natural fiber fashion brands that would be perfect partners for Frequency & Form marketplace.

CRITICAL: Find DIFFERENT brands than ones we already have. AVOID these existing partners:
${existingBrands || 'None yet'}

F&F PARTNER REQUIREMENTS:
${partnerKnowledge.answer}

TARGET BRANDS:
- European-based (France, Italy, Spain, Portugal, Germany, Scandinavia, Belgium, Netherlands)
- Specialize in natural fibers: linen, wool (merino/cashmere), silk, organic cotton, hemp
- Sustainable, transparent supply chains
- Authentic craftsmanship and quality
- Existing online presence (website with e-commerce preferred)
- Professional operations (not just starting out)
- Products in $100-$800 range (healing tier) or $50-$200 (foundation tier)

DISCOVERY SOURCES TO EXPLORE:
1. Pinterest: "European linen brands", "Italian linen fashion", "French natural fiber clothing"
2. Instagram: #europeanlinen #sustainablefashioneurope #linen #merino #naturaldyeing
3. European fashion magazines and blogs
4. Sustainable fashion directories (Common Objective, GOTS certified brands)
5. European trade shows (Première Vision, Pitti Uomo)

For each brand, provide:
- Brand name (must be DIFFERENT from exclusion list)
- Website URL (actual working website)
- Country (European only)
- Primary fabric specialty (linen, wool, silk, cotton, hemp)
- Product types (dresses, shirts, home textiles, accessories)
- Price range (healing tier $150-800 or foundation tier $50-200)
- Why they're a good fit for F&F marketplace
- Contact info (if available: email, Instagram handle)

Return JSON array:
[
  {
    "brand_name": "Brand Name",
    "website": "https://brandwebsite.com",
    "country": "Italy",
    "primary_fabric": "linen",
    "product_types": ["dresses", "shirts", "home textiles"],
    "price_range": "healing_tier",
    "f&f_fit_reason": "Italian linen specialist with beautiful summer collection, perfect for healing tier",
    "instagram": "@brandname",
    "email": "wholesale@brandname.com"
  }
]

IMPORTANT: Return ONLY real, existing brands with actual websites. Verify they sell natural fiber products.`;

    console.log('[Henry Partner Discovery] Searching for European natural fiber brands via AI...');

    const discoveryResponse = await queryAtlas(
      discoveryPrompt,
      'partner',
      tenantId,
      {
        sources: ['perplexity'], // Use Perplexity for real-time web search
        save_to_memory: true,
        calledBy: 'henry_partner_discovery'
      }
    );

    if (!discoveryResponse.success) {
      throw new Error(`Partner discovery failed: ${discoveryResponse.error}`);
    }

    // Parse brands
    let brands = [];
    try {
      let jsonText = discoveryResponse.answer;

      // Extract JSON from markdown code blocks
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          jsonText = arrayMatch[0];
        }
      }

      brands = JSON.parse(jsonText.trim());
      console.log(`[Henry Partner Discovery] Successfully parsed ${brands.length} brands`);

    } catch (parseError) {
      console.error('[Henry Partner Discovery] Failed to parse AI response:', parseError);
      console.error('[Henry Partner Discovery] Raw response:', discoveryResponse.answer);
      return res.status(500).json({
        success: false,
        error: 'AI returned invalid brand data'
      });
    }

    console.log(`[Henry Partner Discovery] Discovered ${brands.length} potential partners`);

    // =====================================================================
    // STEP 4: Add discovered partners to database
    // =====================================================================

    const addedPartners = [];

    for (const brand of brands) {
      try {
        // Check if brand already exists
        const { data: existing } = await supabase
          .from('ff_partners')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('brand_name', brand.brand_name)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`[Henry Partner Discovery] ${brand.brand_name} already exists, skipping`);
          continue;
        }

        // Insert new partner
        const { data: partner, error: insertError } = await supabase
          .from('ff_partners')
          .insert({
            tenant_id: tenantId,
            brand_name: brand.brand_name,
            website: brand.website,
            country: brand.country,
            primary_fabric: brand.primary_fabric,
            product_types: brand.product_types || [],
            price_tier: brand.price_range === 'healing_tier' ? 'healing' : 'foundation',
            status: 'prospect', // Needs outreach
            contact_email: brand.email || null,
            instagram_handle: brand.instagram || null,
            notes: `Discovered via AI partner search

Why Good Fit: ${brand['f&f_fit_reason'] || brand.fit_reason || 'Natural fiber specialist'}

Product Types: ${(brand.product_types || []).join(', ')}
Primary Fabric: ${brand.primary_fabric}
Price Tier: ${brand.price_range}

Next Steps:
1. Research brand more thoroughly
2. Prepare partnership outreach email
3. Contact via ${brand.email || brand.instagram || 'website contact form'}
4. Discuss partnership terms (commission vs wholesale)`,
            discovery_source: 'ai_web_search',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Henry Partner Discovery] Failed to insert ${brand.brand_name}:`, insertError);
          continue;
        }

        // Log activity
        await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'henry',
            action_type: 'partner_discovery',
            action_description: `Discovered European partner: ${brand.brand_name} (${brand.country})`,
            status: 'completed',
            related_entity_type: 'partner',
            related_entity_id: partner.id,
            metadata: {
              brand: brand.brand_name,
              country: brand.country,
              fabric: brand.primary_fabric,
              price_tier: brand.price_range,
              website: brand.website,
              source: 'ai_web_search'
            }
          });

        addedPartners.push({
          id: partner.id,
          brand_name: brand.brand_name,
          website: brand.website,
          country: brand.country,
          fabric: brand.primary_fabric,
          price_tier: brand.price_range
        });

        console.log(`[Henry Partner Discovery] ✅ Added partner: ${brand.brand_name} (${brand.country})`);

      } catch (error) {
        console.error(`[Henry Partner Discovery] Error adding ${brand.brand_name}:`, error);
      }
    }

    console.log(`[Henry Partner Discovery] Added ${addedPartners.length} new potential partners`);

    // =====================================================================
    // STEP 5: Create outreach tasks for new partners
    // =====================================================================

    let outreachTasksCreated = 0;

    for (const partner of addedPartners) {
      try {
        // Create task for Henry to reach out
        const { error: taskError } = await supabase
          .from('tasks')
          .insert({
            tenant_id: tenantId,
            title: `Partner Outreach: ${partner.brand_name}`,
            description: `Reach out to ${partner.brand_name} (${partner.country}) about F&F marketplace partnership.

Fabric Specialty: ${partner.fabric}
Price Tier: ${partner.price_tier}
Website: ${partner.website}

Talking Points:
- Curated marketplace for European natural fiber fashion
- Target: Conscious consumers seeking high-vibration, sustainable fashion
- Partnership model: Commission or wholesale
- Marketing support: Featured on website, Pinterest, social media

Next Step: Send partnership inquiry email`,
            assigned_to: 'henry', // Henry handles partnerships
            priority: 'medium',
            status: 'pending',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 1 week
            related_entity_type: 'partner',
            related_entity_id: partner.id,
            created_at: new Date().toISOString()
          });

        if (!taskError) {
          outreachTasksCreated++;
          console.log(`[Henry Partner Discovery] ✅ Created outreach task for ${partner.brand_name}`);
        }

      } catch (error) {
        console.error(`[Henry Partner Discovery] Error creating task for ${partner.brand_name}:`, error);
      }
    }

    return res.json({
      success: true,
      data: {
        brands_discovered: brands.length,
        partners_added: addedPartners.length,
        outreach_tasks_created: outreachTasksCreated,
        partners: addedPartners,
        discovery_source: 'ai_web_search',
        message: `Discovered ${addedPartners.length} new European natural fiber brands for F&F marketplace`
      }
    });

  } catch (error) {
    console.error('[Henry Partner Discovery] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'henry',
        action_type: 'partner_discovery',
        action_description: 'Failed to discover partners',
        status: 'failed',
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
