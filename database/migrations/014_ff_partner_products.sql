/**
 * FF Partner Products & Affiliate Clothing System
 * Stores clothing from partners, affiliates (Amazon, Shopify stores), and curated Pinterest
 *
 * Supports multiple sources:
 * - Direct partners (wholesale/consignment)
 * - Amazon affiliates
 * - Shopify partner stores
 * - Pinterest curated boards
 * - Manual curation
 */

-- =====================================================
-- PARTNER PRODUCTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_partner_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source Information
    source TEXT NOT NULL, -- 'partner', 'amazon', 'shopify', 'pinterest', 'manual'
    source_partner_id UUID REFERENCES ff_partners(id), -- If from FF partner
    source_url TEXT, -- Original product URL
    affiliate_url TEXT, -- Affiliate link (Amazon, etc.)

    -- External IDs
    external_id TEXT, -- Amazon ASIN, Shopify product ID, Pinterest pin ID
    shopify_store_domain TEXT, -- e.g., 'my-store.myshopify.com'

    -- Product Info
    name TEXT NOT NULL,
    brand TEXT,
    description TEXT,

    -- Category & Type
    category TEXT NOT NULL, -- 'tops', 'dresses', 'bottoms', 'outerwear', 'suits', 'accessories'
    subcategory TEXT, -- 'blouses', 'blazers', 'midi_dresses', etc.
    garment_type TEXT, -- 'blouse', 'dress', 'pants', 'skirt', 'jacket', 'coat'

    -- Pricing & Budget Tier
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2), -- Before discount
    currency TEXT DEFAULT 'USD',
    budget_tier TEXT, -- 'budget' (<$50), 'moderate' ($50-150), 'premium' ($150-300), 'luxury' ($300+)

    -- Commission/Affiliate Info
    commission_rate DECIMAL(5,2), -- Percentage we earn
    commission_type TEXT, -- 'affiliate', 'wholesale_markup', 'consignment'

    -- Style Matching (for body type recommendations)
    silhouettes TEXT[], -- ['wrap', 'fit_and_flare', 'a_line', 'sheath']
    best_for_body_types TEXT[], -- ['hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle']
    torso_fit TEXT, -- 'short_torso_friendly', 'long_torso_friendly', 'balanced'
    rise TEXT, -- 'high', 'mid', 'low' (for bottoms)

    -- Color Information
    primary_color TEXT,
    primary_color_hex TEXT,
    secondary_colors TEXT[],
    color_family TEXT, -- 'neutrals', 'warm', 'cool', 'earth_tones', 'jewel_tones', 'pastels'
    best_for_seasons TEXT[], -- ['spring', 'summer', 'autumn', 'winter']

    -- Fabric & Quality
    fabric_type TEXT, -- 'linen', 'cotton', 'silk', 'wool', 'synthetic', 'blend'
    fabric_composition TEXT, -- '100% linen', '95% cotton 5% spandex'
    frequency_compatible BOOLEAN DEFAULT false, -- True if natural high-frequency fabric

    -- Sizing
    size_range TEXT, -- 'XS-XL', '0-14', 'S-3XL'
    size_inclusive BOOLEAN DEFAULT false, -- True if goes to 3XL+

    -- Images
    image_url TEXT,
    image_urls TEXT[], -- Multiple images
    thumbnail_url TEXT,

    -- Ratings & Reviews
    avg_rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,

    -- Inventory & Availability
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    ships_from TEXT, -- Country
    estimated_shipping_days INTEGER,

    -- Metadata
    tags TEXT[],
    features TEXT[], -- ['machine_washable', 'pockets', 'lined', 'adjustable_straps']

    -- Status & Curation
    status TEXT DEFAULT 'active', -- 'active', 'out_of_stock', 'discontinued', 'pending_review'
    curated BOOLEAN DEFAULT false, -- Manually curated/approved
    featured BOOLEAN DEFAULT false, -- Show in featured sections
    quality_score INTEGER, -- 1-100 internal quality rating

    -- Analytics
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ, -- Last time we synced from source

    -- Unique constraint for external products
    UNIQUE(source, external_id)
);

-- =====================================================
-- PRODUCT COLLECTIONS/BOARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_product_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,

    -- Collection type
    collection_type TEXT, -- 'body_type', 'color_season', 'occasion', 'budget', 'curated', 'seasonal'

    -- Filters for this collection
    filters JSONB,
    -- Example: {
    --   "body_types": ["hourglass", "pear"],
    --   "budget_tiers": ["moderate", "premium"],
    --   "categories": ["dresses", "tops"]
    -- }

    -- Display
    image_url TEXT,
    banner_url TEXT,
    sort_order INTEGER DEFAULT 0,

    -- Status
    active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COLLECTION ITEMS (many-to-many)
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES ff_product_collections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES ff_partner_products(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(collection_id, product_id)
);

-- =====================================================
-- AFFILIATE SOURCES CONFIG
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_affiliate_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    source_type TEXT NOT NULL, -- 'amazon', 'shopify', 'pinterest'
    name TEXT NOT NULL,

    -- API Configuration
    api_key TEXT,
    api_secret TEXT,
    store_domain TEXT, -- For Shopify
    affiliate_tag TEXT, -- For Amazon

    -- Sync Settings
    auto_sync BOOLEAN DEFAULT false,
    sync_interval_hours INTEGER DEFAULT 24,
    last_synced_at TIMESTAMPTZ,

    -- Filters for what to import
    import_filters JSONB,
    -- Example: {
    --   "categories": ["Clothing", "Dresses"],
    --   "price_min": 30,
    --   "price_max": 500,
    --   "keywords": ["linen", "cotton", "natural fiber"]
    -- }

    -- Status
    active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_partner_products_source ON ff_partner_products(source);
CREATE INDEX IF NOT EXISTS idx_partner_products_category ON ff_partner_products(category);
CREATE INDEX IF NOT EXISTS idx_partner_products_budget ON ff_partner_products(budget_tier);
CREATE INDEX IF NOT EXISTS idx_partner_products_body_types ON ff_partner_products USING GIN(best_for_body_types);
CREATE INDEX IF NOT EXISTS idx_partner_products_silhouettes ON ff_partner_products USING GIN(silhouettes);
CREATE INDEX IF NOT EXISTS idx_partner_products_seasons ON ff_partner_products USING GIN(best_for_seasons);
CREATE INDEX IF NOT EXISTS idx_partner_products_status ON ff_partner_products(status);
CREATE INDEX IF NOT EXISTS idx_partner_products_price ON ff_partner_products(price);
CREATE INDEX IF NOT EXISTS idx_partner_products_featured ON ff_partner_products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_partner_products_curated ON ff_partner_products(curated) WHERE curated = true;

CREATE INDEX IF NOT EXISTS idx_collections_slug ON ff_product_collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_type ON ff_product_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON ff_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_product ON ff_collection_items(product_id);

-- =====================================================
-- SEED DATA: Initial curated products
-- =====================================================

-- Insert budget tier collections
INSERT INTO ff_product_collections (name, slug, collection_type, description, filters) VALUES
('Budget Friendly ($50 & Under)', 'budget-friendly', 'budget', 'Stylish pieces that won''t break the bank', '{"budget_tiers": ["budget"]}'),
('Moderate ($50-150)', 'moderate-budget', 'budget', 'Quality pieces at accessible prices', '{"budget_tiers": ["moderate"]}'),
('Premium ($150-300)', 'premium', 'budget', 'Investment pieces built to last', '{"budget_tiers": ["premium"]}'),
('Luxury ($300+)', 'luxury', 'budget', 'Designer and artisan pieces', '{"budget_tiers": ["luxury"]}')
ON CONFLICT (slug) DO NOTHING;

-- Insert body type collections
INSERT INTO ff_product_collections (name, slug, collection_type, description, filters) VALUES
('Perfect for Hourglass', 'hourglass-picks', 'body_type', 'Pieces that celebrate your curves', '{"body_types": ["hourglass"]}'),
('Perfect for Pear', 'pear-picks', 'body_type', 'Balance and flatter your proportions', '{"body_types": ["pear"]}'),
('Perfect for Apple', 'apple-picks', 'body_type', 'Elongate and define your silhouette', '{"body_types": ["apple"]}'),
('Perfect for Rectangle', 'rectangle-picks', 'body_type', 'Create curves and definition', '{"body_types": ["rectangle"]}'),
('Perfect for Inverted Triangle', 'inverted-triangle-picks', 'body_type', 'Balance shoulders with volume below', '{"body_types": ["inverted_triangle"]}'),
('Short Torso / Long Legs', 'short-torso', 'body_type', 'High-rise and crop styles for your proportions', '{"torso_fit": "short_torso_friendly"}'),
('Long Torso / Short Legs', 'long-torso', 'body_type', 'Low-rise and longer tops for balance', '{"torso_fit": "long_torso_friendly"}')
ON CONFLICT (slug) DO NOTHING;

-- Insert color season collections
INSERT INTO ff_product_collections (name, slug, collection_type, description, filters) VALUES
('Spring Palette', 'spring-colors', 'color_season', 'Warm, bright, and fresh colors', '{"color_seasons": ["spring"]}'),
('Summer Palette', 'summer-colors', 'color_season', 'Cool, soft, and muted colors', '{"color_seasons": ["summer"]}'),
('Autumn Palette', 'autumn-colors', 'color_season', 'Warm, muted, and earthy colors', '{"color_seasons": ["autumn"]}'),
('Winter Palette', 'winter-colors', 'color_season', 'Cool, clear, and bold colors', '{"color_seasons": ["winter"]}')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample curated products (these would be replaced by real API data)
INSERT INTO ff_partner_products (
    source, name, brand, category, subcategory, price, budget_tier,
    silhouettes, best_for_body_types, torso_fit, primary_color, color_family,
    fabric_type, frequency_compatible, size_range, description, tags, features
) VALUES
-- BUDGET TIER ($50 & under)
('manual', 'Linen Blend Wrap Top', 'Amazon Essentials', 'tops', 'blouses', 34.99, 'budget',
 ARRAY['wrap'], ARRAY['hourglass', 'pear', 'apple'], 'balanced', 'white', 'neutrals',
 'blend', false, 'XS-XXL', 'Flattering wrap style in breathable linen blend',
 ARRAY['casual', 'work', 'summer'], ARRAY['machine_washable', 'wrinkle_resistant']),

('manual', 'High-Rise Wide Leg Pants', 'Amazon Essentials', 'bottoms', 'pants', 39.99, 'budget',
 ARRAY['wide_leg'], ARRAY['inverted_triangle', 'rectangle'], 'short_torso_friendly', 'black', 'neutrals',
 'blend', false, 'XS-XXL', 'Elongating high-rise wide leg in stretch fabric',
 ARRAY['work', 'casual'], ARRAY['pockets', 'elastic_waist']),

('manual', 'A-Line Midi Skirt', 'Daily Ritual', 'bottoms', 'skirts', 45.00, 'budget',
 ARRAY['a_line'], ARRAY['pear', 'apple', 'hourglass'], 'balanced', 'navy', 'neutrals',
 'cotton', true, 'XS-XXL', 'Classic A-line midi in soft cotton',
 ARRAY['work', 'casual', 'weekend'], ARRAY['pockets', 'elastic_waist']),

-- MODERATE TIER ($50-150)
('manual', 'Silk Blend Camisole', 'Quince', 'tops', 'camisoles', 59.90, 'moderate',
 ARRAY['fitted'], ARRAY['hourglass', 'rectangle'], 'balanced', 'champagne', 'neutrals',
 'silk', true, 'XS-XL', 'Luxurious silk blend camisole for layering or solo',
 ARRAY['work', 'date_night', 'layering'], ARRAY['adjustable_straps']),

('manual', 'Linen Blazer', 'Quince', 'outerwear', 'blazers', 99.90, 'moderate',
 ARRAY['structured_shoulder'], ARRAY['pear', 'rectangle'], 'balanced', 'oatmeal', 'neutrals',
 'linen', true, 'XS-XL', '100% European linen blazer with relaxed fit',
 ARRAY['work', 'smart_casual'], ARRAY['lined', 'pockets']),

('manual', 'Fit & Flare Midi Dress', 'Reformation', 'dresses', 'midi_dresses', 128.00, 'moderate',
 ARRAY['fit_and_flare'], ARRAY['hourglass', 'pear'], 'balanced', 'sage', 'earth_tones',
 'linen', true, 'XS-XL', 'Sustainable linen dress with figure-flattering silhouette',
 ARRAY['wedding_guest', 'brunch', 'date_night'], ARRAY['pockets', 'back_zip']),

('manual', 'Wrap Dress', 'Diane von Furstenberg', 'dresses', 'wrap_dresses', 149.00, 'moderate',
 ARRAY['wrap'], ARRAY['hourglass', 'pear', 'apple'], 'balanced', 'forest', 'jewel_tones',
 'blend', false, 'XS-XL', 'The iconic wrap dress in a flattering print',
 ARRAY['work', 'date_night', 'event'], ARRAY['tie_waist', 'v_neck']),

-- PREMIUM TIER ($150-300)
('manual', 'Cashmere V-Neck Sweater', 'Naadam', 'tops', 'sweaters', 175.00, 'premium',
 ARRAY['v_neck'], ARRAY['apple', 'hourglass'], 'balanced', 'camel', 'earth_tones',
 'wool', true, 'XS-XL', 'Grade-A Mongolian cashmere in a flattering V-neck',
 ARRAY['work', 'weekend', 'fall', 'winter'], ARRAY['hand_wash']),

('manual', 'Tailored Wool Trousers', 'Theory', 'bottoms', 'pants', 265.00, 'premium',
 ARRAY['tailored'], ARRAY['rectangle', 'hourglass'], 'balanced', 'charcoal', 'neutrals',
 'wool', true, '00-14', 'Impeccably tailored wool trousers for the office and beyond',
 ARRAY['work', 'formal'], ARRAY['lined', 'pockets', 'dry_clean']),

('manual', 'Silk Charmeuse Blouse', 'Equipment', 'tops', 'blouses', 230.00, 'premium',
 ARRAY['relaxed'], ARRAY['rectangle', 'inverted_triangle'], 'long_torso_friendly', 'ivory', 'neutrals',
 'silk', true, 'XS-L', 'Signature silk blouse with modern relaxed fit',
 ARRAY['work', 'evening'], ARRAY['hand_wash', 'button_front']),

-- LUXURY TIER ($300+)
('manual', 'Linen Maxi Dress', 'Loro Piana', 'dresses', 'maxi_dresses', 1850.00, 'luxury',
 ARRAY['empire_waist', 'a_line'], ARRAY['apple', 'pear'], 'short_torso_friendly', 'natural', 'neutrals',
 'linen', true, 'XS-L', 'Exquisite Italian linen in an effortless silhouette',
 ARRAY['resort', 'special_occasion'], ARRAY['dry_clean', 'made_in_italy']),

('manual', 'Structured Wool Coat', 'Max Mara', 'outerwear', 'coats', 2490.00, 'luxury',
 ARRAY['structured_shoulder', 'belted'], ARRAY['pear', 'rectangle', 'hourglass'], 'balanced', 'camel', 'neutrals',
 'wool', true, 'XS-L', 'The iconic camel coat in double-faced wool',
 ARRAY['investment', 'fall', 'winter'], ARRAY['lined', 'belt_included', 'made_in_italy']),

('manual', 'Silk Slip Dress', 'The Row', 'dresses', 'slip_dresses', 1290.00, 'luxury',
 ARRAY['bodycon'], ARRAY['hourglass', 'rectangle'], 'balanced', 'black', 'neutrals',
 'silk', true, 'XS-L', 'Minimalist silk slip in a figure-skimming cut',
 ARRAY['evening', 'special_occasion'], ARRAY['dry_clean', 'bias_cut'])

ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON ff_partner_products TO postgres;
GRANT ALL ON ff_product_collections TO postgres;
GRANT ALL ON ff_collection_items TO postgres;
GRANT ALL ON ff_affiliate_sources TO postgres;
