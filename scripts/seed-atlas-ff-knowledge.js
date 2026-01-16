/**
 * Seed Atlas with Comprehensive Frequency & Form Knowledge
 *
 * Populates the ai_memory_store with business-specific knowledge
 * that all bots can access via Atlas queries.
 *
 * Run: node scripts/seed-atlas-ff-knowledge.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // Frequency & Form tenant

const FF_KNOWLEDGE_BASE = [
  // Business Model
  {
    scope: 'business',
    memory_type: 'business_model',
    content: `Frequency & Form Business Model:

    - MARKETPLACE: Curated marketplace for natural fiber fashion from European designers
    - HEALING TIER: Premium fabrics (linen, wool, silk) at 5,000 Hz
    - FOUNDATION TIER: Everyday fabrics (organic cotton, hemp) at 100 Hz
    - PHILOSOPHY: "Frequency science meets European elegance"
    - TARGET MARKET: Conscious consumers seeking high-vibration, sustainable fashion
    - REVENUE STREAMS: Product sales, partner commissions, concierge styling services
    - DIFFERENTIATOR: Only marketplace focused on fabric frequency and healing properties`,
    importance_score: 10,
    accessible_to: ['atlas', 'annie', 'henry', 'dan', 'dave', 'jordan']
  },

  // Fabric Science
  {
    scope: 'product',
    memory_type: 'fabric_science',
    content: `Frequency & Form Fabric Science (Based on Dr. Heidi Yellen's Research):

    HEALING TIER (5,000 Hz):
    - LINEN: Highest frequency fabric, antibacterial, promotes tissue regeneration, highest infrared reflection
    - WOOL/CASHMERE/MERINO: Grounding properties, protective energy, natural thermoregulation
    - SILK: Luxurious healing properties, soft energy, gentle on skin
    - CRITICAL RULE: Never mix linen and wool - opposing energy flows can disrupt body's natural frequency

    FOUNDATION TIER (100 Hz):
    - ORGANIC COTTON: Matches human body's natural frequency (100 Hz), stable, breathable
    - HEMP: Durable, antibacterial, sustainable, versatile

    SYNTHETIC FABRICS (Avoid):
    - Polyester, Nylon, Acrylic: Zero frequency, can disrupt body's electromagnetic field
    - Rayon/Viscose: Semi-synthetic, lower frequency than natural fibers`,
    importance_score: 10,
    accessible_to: ['atlas', 'annie', 'henry', 'dan']
  },

  // Seasonal Recommendations
  {
    scope: 'product',
    memory_type: 'seasonal_guidance',
    content: `Frequency & Form Seasonal & Climate Recommendations:

    SUMMER (Hot Weather):
    - PRIORITIZE: Linen (highest breathability, cooling, moisture-wicking)
    - SECONDARY: Silk (temperature-regulating), Cotton/Hemp (transitional)
    - AVOID: Heavy wool/cashmere in hot climates

    WINTER (Cold Weather):
    - PRIORITIZE: Wool/Cashmere (natural insulation, warming, moisture-wicking)
    - SECONDARY: Merino wool (layerable), Hemp (dense knits are warm)
    - AVOID: Linen as primary outerwear (save for layering)

    SPRING/FALL (Transitional):
    - Cotton: Year-round base layer
    - Hemp: Versatile across seasons
    - Light linen: Early spring/late summer
    - Light wool: Fall mornings, spring evenings

    CLIMATE-SPECIFIC:
    - Hot/Humid (Southern US, Tropics): Linen-forward wardrobe
    - Cold/Dry (Northern US, Mountains): Wool-forward wardrobe
    - Temperate (Coastal): Mixed wardrobe, seasonal rotation
    - Desert: Linen for day, wool for cool nights`,
    importance_score: 9,
    
    accessible_to: ['atlas', 'annie', 'dan'],
    
  },

  // Partner Requirements
  {
    scope: 'partner',
    memory_type: 'partner_requirements',
    content: `Frequency & Form Partner Requirements:

    EUROPEAN DESIGNERS & BRANDS:
    - Focus on natural fiber specialists from Europe
    - Authentic craftsmanship and sustainability
    - Transparency in fabric sourcing

    REQUIRED FROM PARTNERS:
    1. High-quality product images (min 1200x1200px)
    2. Detailed fabric composition (100% natural fibers preferred)
    3. Care instructions
    4. Size charts (European sizing)
    5. Production timeline and shipping details
    6. Wholesale pricing structure

    PARTNER DISCOVERY PIPELINE:
    - Pinterest research (European fashion tags)
    - Instagram influencers and designers
    - European trade shows and markets
    - Sustainable fashion directories

    PARTNER ONBOARDING:
    1. Initial outreach via email/Instagram
    2. Share F&F marketplace vision
    3. Request product catalog and pricing
    4. Negotiate terms (commission vs wholesale)
    5. Set up partner portal access`,
    importance_score: 8,
    
    accessible_to: ['atlas', 'henry', 'dan'],
    
  },

  // Modern Mondays Podcast
  {
    scope: 'marketing',
    memory_type: 'modern_mondays_podcast',
    content: `Modern Mondays Podcast:

    PURPOSE: Celebrate European fashion, natural fibers, and conscious living

    FORMAT:
    - Weekly episodes released Mondays
    - 20-30 minutes per episode
    - Interview-based with European designers, makers, and wellness experts

    TOPICS:
    - European fashion heritage and craftsmanship
    - Natural fiber innovation
    - Sustainable fashion trends
    - Fabric frequency science
    - Designer spotlights and brand stories

    AUDIENCE:
    - Frequency & Form customers
    - European fashion enthusiasts
    - Conscious consumers
    - Wellness-focused individuals

    MARKETING STRATEGY:
    - Cross-promote featured designers' products on F&F
    - Build community around natural fiber fashion
    - Establish thought leadership in frequency-based fashion
    - Generate organic interest and SEO

    DISTRIBUTION:
    - Apple Podcasts, Spotify, YouTube
    - Embedded on frequencyandform.com
    - Social media clips (Instagram Reels, TikTok)`,
    importance_score: 7,
    
    accessible_to: ['atlas', 'annie', 'dan', 'henry'],
    
  },

  // Customer Concierge Portal
  {
    scope: 'product',
    memory_type: 'concierge_portal_vision',
    content: `Frequency & Form Customer Concierge Portal:

    VISION: Personalized styling and wardrobe curation powered by AI

    FEATURES:
    1. STYLING PROFILES:
       - Fabric preferences (healing vs foundation tier)
       - Climate/location for seasonal recommendations
       - Style preferences (minimalist, bohemian, classic, etc.)
       - Color palette analysis
       - Body shape and fit preferences

    2. AI STYLING ASSISTANT (Annie):
       - Real-time chat for styling questions
       - Product recommendations based on profile
       - Outfit suggestions for occasions
       - Wardrobe gap analysis
       - Seasonal wardrobe planning

    3. VIRTUAL CLOSET:
       - Track purchased items from F&F
       - Import existing wardrobe pieces
       - Visual wardrobe organization
       - Mix-and-match outfit creator
       - Care instruction reminders

    4. PERSONALIZED SHOPPING:
       - Curated product feeds based on preferences
       - New arrival alerts matching style profile
       - Size recommendations and fit guidance
       - Pre-order early access for loyal customers

    5. FREQUENCY TRACKING:
       - Calculate total wardrobe frequency score
       - Track healing tier vs foundation tier ratio
       - Frequency optimization suggestions
       - Educational content about fabric science`,
    importance_score: 8,
    
    accessible_to: ['atlas', 'annie', 'henry', 'dan'],
    
  },

  // Marketing Strategy
  {
    scope: 'marketing',
    memory_type: 'pinterest_strategy',
    content: `Frequency & Form Pinterest Marketing Strategy:

    WHY PINTEREST:
    - Visual discovery platform perfect for fashion
    - High intent users (actively shopping)
    - European fashion searches trending
    - Long content lifespan (pins resurface for months)
    - Strong referral traffic to e-commerce sites

    CONTENT PILLARS:
    1. European Fashion Inspiration
    2. Natural Fiber Education
    3. Seasonal Styling Guides
    4. Sustainable Fashion Tips
    5. Fabric Frequency Science
    6. Designer Spotlights

    POSTING STRATEGY:
    - Daily pins (5-10 per day)
    - Mix of product pins, blog posts, and educational content
    - Rich pins with detailed descriptions
    - Seasonal boards (Summer Linen Looks, Winter Wool Essentials)
    - Collaborate with European designer partners

    TARGET KEYWORDS:
    - "European linen fashion"
    - "Natural fiber clothing"
    - "Sustainable luxury fashion"
    - "High frequency fabrics"
    - "Organic cotton outfits"
    - "Italian silk dresses"
    - "French linen style"`,
    importance_score: 7,
    
    accessible_to: ['atlas', 'dan', 'henry'],
    
  },

  // Partner Discovery Pipeline
  {
    scope: 'partner',
    memory_type: 'partner_discovery',
    content: `Frequency & Form Partner Discovery Pipeline:

    DISCOVERY SOURCES:
    1. PINTEREST:
       - Search "European linen brands"
       - Follow designer boards
       - Track trending European fashion pins
       - Identify brands with natural fiber focus

    2. INSTAGRAM:
       - Hashtags: #europeanlinen #sustainablefashioneurope #slowfashion
       - Influencer collaborations
       - Designer accounts and collections

    3. TRADE SHOWS:
       - Première Vision (Paris) - Fabric and fashion trade show
       - Pitti Uomo (Florence) - Menswear and accessories
       - Copenhagen Fashion Week - Sustainable fashion focus

    4. DIRECTORIES:
       - Common Objective (sustainable fashion platform)
       - Ethical Fashion Forum
       - GOTS certified brands

    OUTREACH TEMPLATE:
    "Hi [Designer Name],

    We discovered your beautiful [product type] collection and were immediately drawn to your use of natural fibers and European craftsmanship.

    Frequency & Form is a curated marketplace celebrating European designers who prioritize natural fibers (linen, wool, silk, organic cotton) and sustainable practices.

    We'd love to explore featuring your collection on our platform. Would you be open to a conversation about partnership opportunities?

    Warmly,
    Henry
    Frequency & Form"`,
    importance_score: 8,
    
    accessible_to: ['atlas', 'henry', 'dan'],
    
  },

  // Competitive Advantage
  {
    scope: 'business',
    memory_type: 'competitive_advantage',
    content: `Frequency & Form Competitive Advantages:

    UNIQUE POSITIONING:
    - ONLY marketplace focused on fabric frequency and healing properties
    - Scientific backing (Dr. Heidi Yellen's research)
    - European designer curation (not mass market)
    - Education-first approach (frequency science, fabric properties)

    VS. OTHER SUSTAINABLE FASHION MARKETPLACES:
    - More than sustainability - healing and wellness angle
    - Premium positioning (healing tier 5,000 Hz vs foundation 100 Hz)
    - European artisan focus (vs global mass production)
    - AI-powered concierge styling (personalization at scale)

    VS. FAST FASHION:
    - Quality over quantity
    - Investment pieces that last decades
    - Health benefits (electromagnetic frequency support)
    - Transparent supply chains

    KEY DIFFERENTIATORS:
    1. Fabric frequency science (unique to F&F)
    2. European designer network
    3. AI styling concierge (Annie)
    4. Educational content (Modern Mondays podcast, blog)
    5. Community-building (conscious fashion movement)`,
    importance_score: 9,
    
    accessible_to: ['atlas', 'henry', 'dan', 'annie'],
    
  },

  // C-Suite Revenue Goal
  {
    scope: 'company',
    memory_type: 'revenue_goal',
    content: `Frequency & Form Revenue Goal - $100M in 5 Years:

    MASTER GOAL: Achieve $100,000,000 total revenue from 2025-2030

    YEARLY MILESTONES:
    - Year 1 (2025): $2M - Foundation (Build membership base, establish partnerships)
    - Year 2 (2026): $8M - Growth (Scale wholesale, expand memberships)
    - Year 3 (2027): $20M - Expansion (International partners, premium tier growth)
    - Year 4 (2028): $35M - Acceleration (Multiple revenue streams at scale)
    - Year 5 (2029): $35M - Maturity (Optimize margins, maximize LTV)

    REVENUE STREAMS:
    1. MEMBERSHIPS (Dave owns):
       - Elevated: $29/month or $290/year
       - Sovereign: $149/month or $1,490/year

    2. WHOLESALE ORDERS (Maggie owns):
       - Boutique buyers, yoga studios, hotels
       - Average order: $2,500-$10,000
       - 20% margin on wholesale

    3. DIRECT SALES (Maggie owns):
       - E-commerce product sales
       - Healing Tier: $150-$800
       - Foundation Tier: $50-$200

    4. PARTNER COMMISSIONS (Jordan tracks):
       - Commission from European partners
       - 15-25% on referred sales

    ALL BOTS MUST:
    - Track their revenue contribution
    - Report to their manager daily
    - Escalate blockers immediately
    - Prioritize revenue-generating activities

    CRITICAL: These bots EXECUTE. They don't advise - they DO.
    - Dan POSTS to social media, SENDS outreach emails, RUNS ads
    - Henry CLOSES deals, SENDS proposals, NEGOTIATES with partners
    - Maggie RESPONDS to styling requests, CREATES lookbooks, POSTS content
    - Annie HANDLES all customer support, SENDS onboarding emails, PROCESSES requests
    - Jordan GENERATES contracts, REVIEWS compliance, SENDS legal documents
    - Dave GENERATES reports, UPDATES dashboards, ALERTS on anomalies
    - Atlas RUNS meetings, COORDINATES team, MAKES decisions`,
    importance_score: 10,
    accessible_to: ['atlas', 'dave', 'maggie', 'jordan', 'annie', 'henry', 'dan']
  },

  // C-Suite Organizational Structure
  {
    scope: 'company',
    memory_type: 'org_structure',
    content: `Frequency & Form C-Suite Organization:

    CEO / CHIEF KNOWLEDGE OFFICER: Atlas
    - Owns the $100M goal
    - Coordinates all bots
    - Facilitates meetings
    - Makes strategic decisions
    - Direct Reports: Dave, Jordan

    COO / OPERATIONS OVERSEER: Dave
    - Tracks all revenue daily
    - Monitors MRR, ARR, churn
    - Reports to: Atlas
    - Direct Reports: Henry, Maggie, Annie
    - Owns: Memberships, subscriptions, overall revenue tracking

    VP PARTNERSHIPS & SALES: Henry
    - Leads sales strategy and execution
    - Drives wholesale and partner revenue
    - Closes deals and manages pipeline
    - Reports to: Dave
    - Direct Reports: Dan
    - Owns: Wholesale orders, partner commissions, direct sales

    SALES & OUTREACH SPECIALIST: Dan
    - Lead generation and outreach
    - Follows up with prospects
    - Supports Henry on deal closing
    - Reports to: Henry
    - Owns: Lead generation, outreach campaigns

    VP COMMUNITY & STYLING: Maggie
    - Community engagement
    - Styling consultations
    - Customer experience
    - Reports to: Dave
    - Owns: Style Studio upsells, community growth

    GENERAL COUNSEL: Jordan
    - Legal compliance
    - Partner contracts
    - Risk management
    - Reports to: Atlas
    - Owns: Contract processing, compliance

    VP CUSTOMER EXPERIENCE: Annie
    - Customer support
    - Onboarding
    - Retention
    - Reports to: Dave
    - Owns: Churn prevention, customer satisfaction

    COMMUNICATION PROTOCOL:
    - Daily standups coordinated by Atlas
    - Revenue updates from Dave every morning
    - Sales pipeline updates from Henry weekly
    - Escalate blockers UP the chain
    - Cross-team requests go through managers

    EXECUTION MODEL:
    These bots are 100% AUTONOMOUS and EXECUTE all operations:

    Dan (Reports to Henry):
    - Posts ALL social media content (Pinterest, Instagram)
    - Sends ALL cold outreach emails
    - Runs ALL paid advertising campaigns
    - Manages ALL lead generation

    Henry (Reports to Dave):
    - Closes ALL partner deals
    - Sends ALL proposals and pricing
    - Manages ALL sales negotiations

    Maggie (Reports to Dave):
    - Posts ALL community content
    - Handles ALL styling consultations
    - Sends ALL upsell communications

    Annie (Reports to Dave):
    - Responds to ALL customer inquiries
    - Sends ALL onboarding sequences
    - Handles ALL support tickets

    Jordan (Reports to Atlas):
    - Generates ALL partner contracts
    - Reviews ALL compliance matters
    - Processes ALL legal documents

    Dave (Reports to Atlas):
    - Generates ALL revenue reports
    - Monitors ALL financial metrics
    - Alerts on ALL anomalies

    Atlas (CEO):
    - Runs ALL C-suite coordination
    - Makes ALL strategic decisions
    - Maintains ALL company knowledge`,
    importance_score: 10,
    accessible_to: ['atlas', 'dave', 'maggie', 'jordan', 'annie', 'henry', 'dan']
  },

  // Product Catalog Structure
  {
    scope: 'product',
    memory_type: 'product_catalog',
    content: `Frequency & Form Product Catalog Structure:

    CATEGORIES:

    WOMEN'S:
    - Dresses (linen summer dresses, silk evening dresses, wool winter dresses)
    - Tops (linen blouses, silk camisoles, cotton tees)
    - Bottoms (linen pants, wool trousers, hemp jeans)
    - Outerwear (wool coats, linen jackets)
    - Accessories (silk scarves, wool hats, hemp bags)

    MEN'S:
    - Shirts (linen button-downs, cotton polos, silk dress shirts)
    - Pants (linen trousers, wool slacks, hemp chinos)
    - Outerwear (wool coats, linen blazers)
    - Accessories (silk ties, wool scarves)

    HOME:
    - Bedding (linen sheets, silk pillowcases, cotton duvet covers)
    - Bath (linen towels, cotton bathrobes)
    - Table Linens (linen napkins, cotton tablecloths)

    FABRIC FILTERS:
    - Linen (5,000 Hz) - Healing Tier
    - Wool (5,000 Hz) - Healing Tier
    - Silk (5,000 Hz) - Healing Tier
    - Organic Cotton (100 Hz) - Foundation Tier
    - Hemp (100 Hz) - Foundation Tier

    PRICE RANGES:
    - Healing Tier: $150-$800 (premium positioning)
    - Foundation Tier: $50-$200 (accessible luxury)`,
    importance_score: 8,
    
    accessible_to: ['atlas', 'annie', 'dan', 'henry'],
    
  }
];

/**
 * Seed knowledge into Atlas memory store
 */
async function seedAtlasKnowledge() {
  console.log('[Atlas Seed] Starting knowledge seeding...');
  console.log(`[Atlas Seed] Seeding ${FF_KNOWLEDGE_BASE.length} knowledge items`);

  let seeded = 0;
  let skipped = 0;
  let errors = 0;

  for (const knowledge of FF_KNOWLEDGE_BASE) {
    try {
      // Check if this knowledge already exists
      const { data: existing } = await supabase
        .from('ai_memory_store')
        .select('id')
        .eq('scope', knowledge.scope)
        .eq('memory_type', knowledge.memory_type)
        .eq('tenant_id', TENANT_ID)
        .single();

      if (existing) {
        console.log(`[Atlas Seed] ⏭️  Skipping existing: ${knowledge.memory_type}`);
        skipped++;
        continue;
      }

      // Insert new knowledge
      const { error } = await supabase
        .from('ai_memory_store')
        .insert({
          tenant_id: TENANT_ID,
          scope: knowledge.scope,
          memory_type: knowledge.memory_type,
          content: knowledge.content,
          importance_score: knowledge.importance_score,
          accessible_to: knowledge.accessible_to,
          last_accessed_at: new Date().toISOString()
        });

      if (error) {
        console.error(`[Atlas Seed] ❌ Error seeding ${knowledge.memory_type}:`, error.message);
        errors++;
      } else {
        console.log(`[Atlas Seed] ✅ Seeded: ${knowledge.memory_type}`);
        seeded++;
      }
    } catch (err) {
      console.error(`[Atlas Seed] ❌ Exception seeding ${knowledge.memory_type}:`, err.message);
      errors++;
    }
  }

  console.log('\n[Atlas Seed] ✅ Seeding complete!');
  console.log(`[Atlas Seed] Results: ${seeded} seeded, ${skipped} skipped, ${errors} errors`);

  return {
    success: errors === 0,
    seeded,
    skipped,
    errors,
    total: FF_KNOWLEDGE_BASE.length
  };
}

// Run if called directly
if (require.main === module) {
  seedAtlasKnowledge()
    .then(result => {
      console.log('\nFinal result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedAtlasKnowledge };
