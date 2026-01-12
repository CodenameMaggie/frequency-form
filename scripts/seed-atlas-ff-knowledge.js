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
