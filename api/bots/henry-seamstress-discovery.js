/**
 * Henry's Custom Clothing Manufacturer Discovery Bot
 * Discovers seamstresses, pattern makers, and small production facilities
 * for fulfilling F&F Style Studio custom garment orders
 *
 * Discovery Sources:
 * - Etsy (custom clothing makers, pattern makers)
 * - Instagram (#customseamstress #madeto order #patternmaker)
 * - Google Maps (local tailors, seamstresses, alteration shops)
 * - Maker networks (Fashion Revolution, Fibershed)
 * - Small batch manufacturers (Sewport listings)
 *
 * Target Manufacturers:
 * - Custom clothing seamstresses (made-to-measure specialists)
 * - Pattern makers (can work from design specs)
 * - Small production facilities (10-100 garment runs)
 * - Natural fiber specialists (linen, wool, silk experience)
 * - Quality craftsmanship + reasonable turnaround (2-4 weeks)
 *
 * Runs: Twice daily via cron (11 AM and 5 PM)
 * Uses: AI web search, Atlas knowledge, geographic targeting
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

  console.log('[Henry Seamstress Discovery] Starting custom clothing manufacturer discovery...');

  try {
    // =====================================================================
    // STEP 1: Get existing manufacturers to avoid duplicates
    // =====================================================================

    console.log('[Henry Seamstress Discovery] Fetching existing manufacturers...');
    const { data: existingMakers } = await supabase
      .from('ff_manufacturers')
      .select('business_name, location')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    const existingNames = (existingMakers || []).map(m => `${m.business_name} (${m.location})`).join(', ');
    console.log(`[Henry Seamstress Discovery] Found ${existingMakers?.length || 0} existing manufacturers to exclude`);

    // =====================================================================
    // STEP 2: Get F&F manufacturing requirements from Atlas
    // =====================================================================

    const requirementsPrompt = `Retrieve Frequency & Form custom garment manufacturing requirements.
Include:
1. Manufacturing criteria (natural fiber experience, quality standards)
2. Order volume capabilities (single custom pieces to small batch 10-50)
3. Turnaround expectations (2-4 weeks ideal)
4. Communication requirements (can work from specs, tech packs)`;

    const manufacturingKnowledge = await queryAtlas(requirementsPrompt, 'manufacturing', tenantId, {
      sources: ['claude'],
      save_to_memory: false
    });

    if (!manufacturingKnowledge.success) {
      throw new Error('Failed to retrieve manufacturing requirements from Atlas');
    }

    console.log('[Henry Seamstress Discovery] Retrieved F&F manufacturing criteria from Atlas');

    // =====================================================================
    // STEP 3: Use AI to discover seamstresses & manufacturers
    // =====================================================================

    const discoveryPrompt = `Search the web and discover 10-12 REAL custom clothing manufacturers, seamstresses, or small production facilities that could fulfill custom garment orders for Frequency & Form.

CRITICAL: Find DIFFERENT makers than ones we already have. AVOID these existing manufacturers:
${existingNames || 'None yet'}

F&F MANUFACTURING REQUIREMENTS:
${manufacturingKnowledge.answer}

TARGET MANUFACTURERS - THREE TYPES:

**Type 1: Custom Seamstresses** (Single piece specialists)
- Independent seamstresses offering made-to-measure services
- Can work from design specs/tech packs
- Experience with natural fibers (linen, wool, silk)
- 2-4 week turnaround for single garments
- Price: $150-$400 per custom garment

**Type 2: Small Production Facilities** (Small batch 10-100)
- Small workshops or studios
- Can handle small production runs (10-50 pieces)
- Natural fiber experience essential
- Tech pack interpretation skills
- Price: $80-$250 per piece (depending on volume)

**Type 3: Pattern Makers** (Can create patterns from designs)
- Digital pattern makers
- Can translate design specs into sewing patterns
- Grading capabilities (size range development)
- Price: $200-$500 per pattern set

GEOGRAPHIC PREFERENCE:
- US-based preferred (easier logistics, faster turnaround)
- European makers acceptable (if exceptional quality/specialization)
- Focus: California, Oregon, NYC, North Carolina (textile hubs)

DISCOVERY SOURCES TO EXPLORE:
1. Etsy: "custom clothing seamstress", "made to order garments", "pattern maker"
2. Instagram: #customseamstress #madetoorder #smallbatchproduction #patternmaker
3. Google Maps: Search "custom clothing" + "seamstress" + "tailor" in textile hub cities
4. Sewport directory (small batch manufacturers)
5. Fashion Revolution maker networks
6. Fibershed regional fiber sheds (natural fiber specialists)
7. LinkedIn: Pattern makers, tech designers, sample makers

QUALITY INDICATORS:
- Portfolio/examples of past work (Instagram, website)
- Natural fiber experience mentioned
- Professional communication (responds to emails, has intake process)
- Pricing transparency
- Clear turnaround times
- Willingness to work from tech packs/specs

For each manufacturer found, provide:
- Business name (must be DIFFERENT from exclusion list)
- Type (seamstress, production_facility, pattern_maker)
- Location (city, state, country)
- Specialty (what they make best: dresses, outerwear, menswear, etc.)
- Natural fiber experience (yes/no + which fibers)
- Order capacity (single pieces, small batch 10-50, medium batch 50-100)
- Estimated turnaround time
- Price range (per garment or per order)
- Contact info (website, email, Etsy shop, Instagram)
- Why good fit for F&F

Return JSON array:
[
  {
    "business_name": "Maker Name / Business Name",
    "type": "seamstress|production_facility|pattern_maker",
    "location": "Portland, OR, USA",
    "specialty": ["dresses", "blouses", "pants"],
    "natural_fiber_experience": true,
    "fibers_experienced": ["linen", "organic_cotton", "wool"],
    "order_capacity": "small_batch_10_50",
    "turnaround_days": 21,
    "price_range": "$120-$280 per piece",
    "website": "https://website.com",
    "email": "orders@maker.com",
    "etsy_shop": "EtsyShopName",
    "instagram": "@makername",
    "f&f_fit_reason": "Specializes in linen garments, sustainable practices, 3-week turnaround",
    "portfolio_url": "https://instagram.com/makername or website.com/portfolio"
  }
]

IMPORTANT: Return ONLY real, existing makers with verifiable contact information. Include at least 3-4 of each type (seamstresses, production facilities, pattern makers).`;

    console.log('[Henry Seamstress Discovery] Searching for custom clothing manufacturers via AI...');

    const discoveryResponse = await queryAtlas(
      discoveryPrompt,
      'manufacturing',
      tenantId,
      {
        sources: ['perplexity'], // Use Perplexity for real-time web search
        save_to_memory: true,
        calledBy: 'henry_seamstress_discovery'
      }
    );

    if (!discoveryResponse.success) {
      throw new Error(`Manufacturer discovery failed: ${discoveryResponse.error}`);
    }

    // Parse manufacturers
    let manufacturers = [];
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

      manufacturers = JSON.parse(jsonText.trim());
      console.log(`[Henry Seamstress Discovery] Successfully parsed ${manufacturers.length} manufacturers`);

    } catch (parseError) {
      console.error('[Henry Seamstress Discovery] Failed to parse AI response:', parseError);
      console.error('[Henry Seamstress Discovery] Raw response:', discoveryResponse.answer);
      return res.status(500).json({
        success: false,
        error: 'AI returned invalid manufacturer data'
      });
    }

    console.log(`[Henry Seamstress Discovery] Discovered ${manufacturers.length} potential manufacturers`);

    // =====================================================================
    // STEP 4: Add discovered manufacturers to database
    // =====================================================================

    const addedManufacturers = [];

    for (const maker of manufacturers) {
      try {
        // Check if manufacturer already exists
        const { data: existing } = await supabase
          .from('ff_manufacturers')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('business_name', maker.business_name)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`[Henry Seamstress Discovery] ${maker.business_name} already exists, skipping`);
          continue;
        }

        // Insert new manufacturer
        const { data: manufacturer, error: insertError } = await supabase
          .from('ff_manufacturers')
          .insert({
            tenant_id: tenantId,
            business_name: maker.business_name,
            manufacturer_type: maker.type, // seamstress, production_facility, pattern_maker
            location: maker.location,
            specialty: maker.specialty || [],
            natural_fiber_experience: maker.natural_fiber_experience || false,
            fibers_experienced: maker.fibers_experienced || [],
            order_capacity: maker.order_capacity, // single_piece, small_batch_10_50, medium_batch_50_100
            turnaround_days: maker.turnaround_days || 21,
            price_range: maker.price_range,
            website: maker.website || null,
            contact_email: maker.email || null,
            etsy_shop: maker.etsy_shop || null,
            instagram_handle: maker.instagram || null,
            portfolio_url: maker.portfolio_url || null,
            status: 'prospect', // Needs vetting/outreach
            notes: `Discovered via AI manufacturer search

Why Good Fit: ${maker['f&f_fit_reason'] || maker.fit_reason || 'Custom garment specialist'}

Specialty: ${(maker.specialty || []).join(', ')}
Natural Fibers: ${(maker.fibers_experienced || []).join(', ')}
Order Capacity: ${maker.order_capacity}
Turnaround: ${maker.turnaround_days} days
Price Range: ${maker.price_range}

Next Steps:
1. Review portfolio/past work (${maker.portfolio_url || maker.instagram || 'website'})
2. Send sample order inquiry (test quality)
3. Request pricing sheet for different garment types
4. Discuss tech pack requirements and communication process
5. Place test order (1-2 garments) before full integration`,
            discovery_source: 'ai_web_search',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Henry Seamstress Discovery] Failed to insert ${maker.business_name}:`, insertError);
          continue;
        }

        // Log activity
        await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'henry',
            action_type: 'manufacturer_discovery',
            action_description: `Discovered manufacturer: ${maker.business_name} (${maker.type} - ${maker.location})`,
            status: 'completed',
            related_entity_type: 'manufacturer',
            related_entity_id: manufacturer.id,
            metadata: {
              business: maker.business_name,
              type: maker.type,
              location: maker.location,
              specialty: maker.specialty,
              capacity: maker.order_capacity,
              natural_fibers: maker.natural_fiber_experience,
              source: 'ai_web_search'
            }
          });

        addedManufacturers.push({
          id: manufacturer.id,
          business_name: maker.business_name,
          type: maker.type,
          location: maker.location,
          specialty: maker.specialty,
          capacity: maker.order_capacity,
          turnaround: maker.turnaround_days,
          price: maker.price_range
        });

        console.log(`[Henry Seamstress Discovery] ✅ Added manufacturer: ${maker.business_name} (${maker.type})`);

      } catch (error) {
        console.error(`[Henry Seamstress Discovery] Error adding ${maker.business_name}:`, error);
      }
    }

    console.log(`[Henry Seamstress Discovery] Added ${addedManufacturers.length} new potential manufacturers`);

    // =====================================================================
    // STEP 5: Create vetting tasks for new manufacturers
    // =====================================================================

    let vettingTasksCreated = 0;

    for (const manufacturer of addedManufacturers) {
      try {
        // Create task for vetting and test order
        const { error: taskError } = await supabase
          .from('tasks')
          .insert({
            tenant_id: tenantId,
            title: `Vet Manufacturer: ${manufacturer.business_name}`,
            description: `Vet ${manufacturer.business_name} (${manufacturer.type}) for F&F custom garment fulfillment.

Type: ${manufacturer.type}
Location: ${manufacturer.location}
Specialty: ${(manufacturer.specialty || []).join(', ')}
Capacity: ${manufacturer.capacity}
Turnaround: ${manufacturer.turnaround} days
Price: ${manufacturer.price}

Vetting Checklist:
□ Review portfolio/Instagram for quality examples
□ Check reviews/testimonials (if available)
□ Send initial inquiry email with F&F requirements
□ Request pricing sheet for different garment types
□ Discuss tech pack format and design specs process
□ Ask about natural fiber experience (linen, wool, silk)
□ Confirm turnaround times and rush order options
□ Place TEST ORDER (1-2 simple garments) to evaluate:
  - Quality of construction
  - Fabric handling (natural fibers)
  - Communication responsiveness
  - Adherence to specs
  - Turnaround accuracy

Next Step: Review portfolio and send initial inquiry`,
            assigned_to: 'henry', // Henry handles manufacturer relationships
            priority: 'high', // Manufacturing is critical for Style Studio
            status: 'pending',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Due in 5 days
            related_entity_type: 'manufacturer',
            related_entity_id: manufacturer.id,
            created_at: new Date().toISOString()
          });

        if (!taskError) {
          vettingTasksCreated++;
          console.log(`[Henry Seamstress Discovery] ✅ Created vetting task for ${manufacturer.business_name}`);
        }

      } catch (error) {
        console.error(`[Henry Seamstress Discovery] Error creating task for ${manufacturer.business_name}:`, error);
      }
    }

    // =====================================================================
    // STEP 6: Return summary
    // =====================================================================

    // Group by type for summary
    const byType = addedManufacturers.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        manufacturers_discovered: manufacturers.length,
        manufacturers_added: addedManufacturers.length,
        vetting_tasks_created: vettingTasksCreated,
        by_type: byType,
        manufacturers: addedManufacturers,
        discovery_source: 'ai_web_search',
        message: `Discovered ${addedManufacturers.length} new custom clothing manufacturers for F&F Style Studio fulfillment`
      }
    });

  } catch (error) {
    console.error('[Henry Seamstress Discovery] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'henry',
        action_type: 'manufacturer_discovery',
        action_description: 'Failed to discover manufacturers',
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
