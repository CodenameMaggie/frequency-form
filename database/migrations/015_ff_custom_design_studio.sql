/**
 * FF Custom Design Studio & Seamstress Network
 *
 * Features:
 * - Custom garment designer with options
 * - Seamstress/manufacturer network
 * - F&F branded collections
 * - Made-to-measure orders
 */

-- =====================================================
-- SEAMSTRESS/MANUFACTURER NETWORK
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_seamstresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Business Info
    business_name TEXT NOT NULL,
    owner_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,

    -- Location
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    timezone TEXT,

    -- Capabilities
    specialties TEXT[], -- ['dresses', 'tailoring', 'bridal', 'alterations', 'coats']
    fabric_expertise TEXT[], -- ['linen', 'silk', 'wool', 'cotton', 'leather']
    style_expertise TEXT[], -- ['minimalist', 'romantic', 'classic', 'avant_garde']

    -- Capacity & Pricing
    capacity_per_month INTEGER DEFAULT 10, -- Number of garments
    current_queue INTEGER DEFAULT 0,
    base_hourly_rate DECIMAL(10,2),
    price_tier TEXT, -- 'budget', 'moderate', 'premium', 'luxury'

    -- Lead Times (in days)
    lead_time_simple INTEGER DEFAULT 14,
    lead_time_moderate INTEGER DEFAULT 21,
    lead_time_complex INTEGER DEFAULT 35,
    rush_available BOOLEAN DEFAULT false,
    rush_fee_percent DECIMAL(5,2) DEFAULT 50.00,

    -- Quality & Ratings
    quality_tier TEXT DEFAULT 'standard', -- 'standard', 'premium', 'atelier'
    avg_rating DECIMAL(3,2),
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,

    -- Portfolio
    portfolio_images TEXT[],
    instagram_handle TEXT,

    -- Partnership Details
    partnership_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'paused', 'inactive'
    commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Our cut
    joined_at TIMESTAMPTZ,

    -- Verification
    verified BOOLEAN DEFAULT false,
    background_checked BOOLEAN DEFAULT false,
    insurance_verified BOOLEAN DEFAULT false,

    -- Preferences
    accepts_rush BOOLEAN DEFAULT true,
    accepts_alterations BOOLEAN DEFAULT true,
    ships_direct BOOLEAN DEFAULT false, -- Ships to customer or to F&F first

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- F&F BRANDED DESIGN TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_design_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Design Identity
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    collection TEXT, -- 'essentials', 'elevated', 'signature', 'bridal'
    season TEXT, -- 'spring_2024', 'fall_2024', 'timeless'

    -- Category & Type
    category TEXT NOT NULL, -- 'tops', 'dresses', 'bottoms', 'outerwear', 'suits'
    garment_type TEXT, -- 'blouse', 'shirt', 'dress', 'skirt', 'pants', 'jacket'

    -- Base Design
    description TEXT,
    design_story TEXT, -- Marketing copy

    -- Silhouette & Fit
    silhouette TEXT, -- 'a_line', 'sheath', 'fit_and_flare', 'wrap', 'relaxed'
    fit TEXT, -- 'relaxed', 'regular', 'fitted', 'tailored'

    -- Best For
    best_for_body_types TEXT[],
    best_for_torso TEXT, -- 'short', 'long', 'balanced', 'all'
    best_for_occasions TEXT[], -- ['work', 'casual', 'evening', 'wedding', 'travel']

    -- Customizable Options
    customizable_options JSONB,
    -- Example: {
    --   "neckline": {
    --     "options": ["v_neck", "crew", "boat", "scoop", "mandarin"],
    --     "default": "v_neck",
    --     "affects_price": false
    --   },
    --   "sleeve_length": {
    --     "options": ["sleeveless", "cap", "short", "3/4", "long"],
    --     "default": "short",
    --     "affects_price": true,
    --     "price_adjustments": {"long": 25, "3/4": 15}
    --   },
    --   "length": {
    --     "options": ["mini", "knee", "midi", "maxi"],
    --     "default": "midi",
    --     "affects_price": true,
    --     "price_adjustments": {"maxi": 35}
    --   },
    --   "pockets": {
    --     "options": [true, false],
    --     "default": true,
    --     "affects_price": true,
    --     "price_adjustments": {"true": 20}
    --   }
    -- }

    -- Available Fabrics
    available_fabrics UUID[], -- References ff_fabrics
    recommended_fabrics UUID[],

    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    fabric_multiplier DECIMAL(4,2) DEFAULT 1.0, -- Multiply by fabric price
    complexity TEXT DEFAULT 'moderate', -- 'simple', 'moderate', 'complex'
    estimated_hours DECIMAL(4,1),

    -- Production
    pattern_file_url TEXT, -- Digital pattern file
    tech_pack_url TEXT, -- Technical specifications
    construction_notes TEXT,

    -- Media
    preview_images JSONB, -- Different views and options
    -- Example: {
    --   "front": "url",
    --   "back": "url",
    --   "detail": "url",
    --   "on_model": ["url1", "url2"]
    -- }
    sketch_svg TEXT, -- Line drawing SVG

    -- Status
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'seasonal', 'archived'
    featured BOOLEAN DEFAULT false,
    new_arrival BOOLEAN DEFAULT false,
    bestseller BOOLEAN DEFAULT false,

    -- Analytics
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CUSTOM ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_custom_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,

    -- Customer
    user_id UUID REFERENCES ff_user_profiles(id),
    customer_email TEXT,
    customer_name TEXT,

    -- Design Selection
    design_id UUID REFERENCES ff_design_catalog(id),
    design_name TEXT, -- Snapshot

    -- Customizations Made
    customizations JSONB,
    -- Example: {
    --   "neckline": "boat",
    --   "sleeve_length": "3/4",
    --   "length": "midi",
    --   "pockets": true,
    --   "fabric_id": "uuid",
    --   "fabric_color": "navy"
    -- }

    -- Measurements (snapshot at time of order)
    measurements JSONB,

    -- Color Profile (for fabric recommendations)
    color_profile JSONB,

    -- Fabric Selected
    fabric_id UUID REFERENCES ff_fabrics(id),
    fabric_name TEXT,
    fabric_color TEXT,
    fabric_yards_needed DECIMAL(4,2),

    -- Assigned Seamstress
    seamstress_id UUID REFERENCES ff_seamstresses(id),
    seamstress_name TEXT,
    seamstress_assigned_at TIMESTAMPTZ,

    -- Pricing Breakdown
    base_price DECIMAL(10,2),
    customization_fees DECIMAL(10,2) DEFAULT 0,
    fabric_cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2),
    rush_fee DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    shipping DECIMAL(10,2),
    total DECIMAL(10,2),

    -- F&F Revenue
    seamstress_payout DECIMAL(10,2),
    ff_commission DECIMAL(10,2),

    -- Timeline
    is_rush BOOLEAN DEFAULT false,
    estimated_completion DATE,
    actual_completion DATE,

    -- Status Tracking
    status TEXT DEFAULT 'pending',
    -- 'pending', 'confirmed', 'fabric_ordered', 'in_production',
    -- 'quality_check', 'shipped', 'delivered', 'completed'

    status_history JSONB DEFAULT '[]',
    -- Example: [
    --   {"status": "confirmed", "at": "2024-01-15T10:00:00Z", "note": "Payment received"},
    --   {"status": "in_production", "at": "2024-01-18T14:00:00Z", "note": "Started by seamstress"}
    -- ]

    -- Production Notes
    customer_notes TEXT,
    seamstress_notes TEXT,
    internal_notes TEXT,

    -- Shipping
    shipping_address JSONB,
    shipping_method TEXT,
    tracking_number TEXT,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    -- Payment
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded', 'partial'
    stripe_payment_id TEXT,
    paid_at TIMESTAMPTZ,

    -- Quality & Feedback
    quality_photos TEXT[],
    customer_rating INTEGER,
    customer_review TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_seamstresses_status ON ff_seamstresses(partnership_status);
CREATE INDEX IF NOT EXISTS idx_seamstresses_location ON ff_seamstresses(state, city);
CREATE INDEX IF NOT EXISTS idx_seamstresses_specialties ON ff_seamstresses USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_seamstresses_tier ON ff_seamstresses(price_tier);

CREATE INDEX IF NOT EXISTS idx_design_catalog_category ON ff_design_catalog(category);
CREATE INDEX IF NOT EXISTS idx_design_catalog_collection ON ff_design_catalog(collection);
CREATE INDEX IF NOT EXISTS idx_design_catalog_status ON ff_design_catalog(status);
CREATE INDEX IF NOT EXISTS idx_design_catalog_body_types ON ff_design_catalog USING GIN(best_for_body_types);

CREATE INDEX IF NOT EXISTS idx_custom_orders_user ON ff_custom_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON ff_custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_seamstress ON ff_custom_orders(seamstress_id);

-- =====================================================
-- SEED DATA: F&F Design Catalog
-- =====================================================

INSERT INTO ff_design_catalog (
    name, slug, collection, category, garment_type, description, design_story,
    silhouette, fit, best_for_body_types, best_for_torso, best_for_occasions,
    customizable_options, base_price, complexity, status, featured
) VALUES
-- ESSENTIALS COLLECTION
(
    'The Classic Wrap Blouse',
    'classic-wrap-blouse',
    'essentials',
    'tops',
    'blouse',
    'A timeless wrap blouse that flatters every figure. The adjustable tie allows for a customized fit at the waist.',
    'Inspired by the iconic 1970s wrap silhouette, reimagined in high-frequency natural fabrics for the modern woman.',
    'wrap',
    'regular',
    ARRAY['hourglass', 'pear', 'apple', 'rectangle'],
    'all',
    ARRAY['work', 'casual', 'date_night'],
    '{
        "neckline": {"options": ["v_neck", "crossover"], "default": "v_neck"},
        "sleeve_length": {"options": ["sleeveless", "cap", "short", "3/4", "long"], "default": "short", "price_adj": {"long": 20, "3/4": 10}},
        "hem": {"options": ["straight", "curved", "peplum"], "default": "curved", "price_adj": {"peplum": 25}}
    }'::jsonb,
    145.00,
    'moderate',
    'active',
    true
),
(
    'The Everyday A-Line Dress',
    'everyday-aline-dress',
    'essentials',
    'dresses',
    'dress',
    'An effortless A-line silhouette that moves beautifully. Perfect from desk to dinner.',
    'Designed for the woman who wants to feel put-together without trying too hard.',
    'a_line',
    'relaxed',
    ARRAY['pear', 'apple', 'rectangle'],
    'all',
    ARRAY['work', 'casual', 'travel', 'weekend'],
    '{
        "neckline": {"options": ["crew", "v_neck", "boat", "scoop"], "default": "boat"},
        "sleeve_length": {"options": ["sleeveless", "cap", "short", "3/4"], "default": "cap", "price_adj": {"3/4": 15}},
        "length": {"options": ["knee", "midi"], "default": "knee", "price_adj": {"midi": 30}},
        "pockets": {"options": [true, false], "default": true, "price_adj": {"true": 20}}
    }'::jsonb,
    195.00,
    'moderate',
    'active',
    true
),
(
    'The Tailored Wide Leg Pant',
    'tailored-wide-leg',
    'essentials',
    'bottoms',
    'pants',
    'High-waisted wide leg pants that elongate and flatter. A wardrobe staple.',
    'For the woman who knows that great pants are the foundation of great style.',
    'wide_leg',
    'tailored',
    ARRAY['inverted_triangle', 'rectangle', 'hourglass'],
    'short',
    ARRAY['work', 'evening', 'travel'],
    '{
        "rise": {"options": ["high", "mid"], "default": "high"},
        "length": {"options": ["ankle", "full"], "default": "full", "price_adj": {"full": 15}},
        "waistband": {"options": ["fitted", "elastic_back"], "default": "fitted"},
        "pockets": {"options": ["side_seam", "none"], "default": "side_seam"}
    }'::jsonb,
    175.00,
    'moderate',
    'active',
    true
),

-- ELEVATED COLLECTION
(
    'The Silk Slip Dress',
    'silk-slip-dress',
    'elevated',
    'dresses',
    'dress',
    'A bias-cut slip dress in luxurious silk. Elegantly simple, endlessly versatile.',
    'The dress that launched a thousand outfit combinations. Layer it, accessorize it, make it yours.',
    'bodycon',
    'fitted',
    ARRAY['hourglass', 'rectangle'],
    'balanced',
    ARRAY['evening', 'date_night', 'wedding_guest'],
    '{
        "neckline": {"options": ["cowl", "v_neck", "straight"], "default": "cowl"},
        "back": {"options": ["low", "mid", "high"], "default": "low", "price_adj": {"low": 0, "mid": 0, "high": 0}},
        "length": {"options": ["mini", "knee", "midi", "maxi"], "default": "midi", "price_adj": {"maxi": 45}},
        "slit": {"options": [true, false], "default": false, "price_adj": {"true": 25}}
    }'::jsonb,
    285.00,
    'complex',
    'active',
    true
),
(
    'The Structured Blazer',
    'structured-blazer',
    'elevated',
    'outerwear',
    'jacket',
    'A perfectly tailored blazer with subtle shoulder structure. The power piece.',
    'Because every woman deserves a blazer that makes her feel unstoppable.',
    'structured_shoulder',
    'tailored',
    ARRAY['pear', 'rectangle', 'apple'],
    'all',
    ARRAY['work', 'evening', 'formal'],
    '{
        "lapel": {"options": ["notch", "peak", "shawl"], "default": "notch", "price_adj": {"peak": 20, "shawl": 25}},
        "length": {"options": ["cropped", "hip", "long"], "default": "hip", "price_adj": {"long": 35}},
        "buttons": {"options": ["single", "double"], "default": "single", "price_adj": {"double": 15}},
        "lining": {"options": ["full", "half", "unlined"], "default": "half", "price_adj": {"full": 30}}
    }'::jsonb,
    325.00,
    'complex',
    'active',
    true
),

-- SIGNATURE COLLECTION
(
    'The Linen Maxi',
    'linen-maxi',
    'signature',
    'dresses',
    'dress',
    'Our signature linen maxi dress. Effortless elegance meets high-frequency living.',
    'The dress that started it all. Pure linen, pure intention, pure style.',
    'empire_waist',
    'relaxed',
    ARRAY['apple', 'pear', 'hourglass'],
    'short',
    ARRAY['resort', 'weekend', 'wedding_guest', 'special_occasion'],
    '{
        "neckline": {"options": ["v_neck", "square", "sweetheart"], "default": "v_neck"},
        "sleeve": {"options": ["sleeveless", "flutter", "cap", "long_bell"], "default": "flutter", "price_adj": {"long_bell": 30}},
        "back": {"options": ["open", "keyhole", "closed"], "default": "keyhole"},
        "tiered": {"options": [true, false], "default": true, "price_adj": {"true": 40}}
    }'::jsonb,
    345.00,
    'complex',
    'active',
    true
),
(
    'The Perfect Trench',
    'perfect-trench',
    'signature',
    'outerwear',
    'coat',
    'A reimagined trench in natural fibers. The forever coat.',
    'We spent two years perfecting this trench. The result speaks for itself.',
    'belted',
    'regular',
    ARRAY['hourglass', 'rectangle', 'pear'],
    'balanced',
    ARRAY['work', 'travel', 'everyday'],
    '{
        "length": {"options": ["short", "classic", "long"], "default": "classic", "price_adj": {"long": 65}},
        "collar": {"options": ["classic", "stand", "hood"], "default": "classic", "price_adj": {"hood": 45}},
        "cuffs": {"options": ["belted", "button", "open"], "default": "belted"},
        "lining": {"options": ["full_silk", "full_cotton", "partial"], "default": "full_cotton", "price_adj": {"full_silk": 85}}
    }'::jsonb,
    425.00,
    'complex',
    'active',
    true
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED DATA: Sample Seamstresses
-- =====================================================

INSERT INTO ff_seamstresses (
    business_name, owner_name, city, state, specialties, fabric_expertise,
    price_tier, quality_tier, lead_time_simple, lead_time_moderate, lead_time_complex,
    partnership_status, verified, capacity_per_month
) VALUES
(
    'Stitch & Story Atelier',
    'Maria Santos',
    'Los Angeles',
    'CA',
    ARRAY['dresses', 'blouses', 'bridal'],
    ARRAY['silk', 'linen', 'cotton'],
    'premium',
    'atelier',
    10, 18, 28,
    'active',
    true,
    8
),
(
    'Modern Maker Studio',
    'Jennifer Chen',
    'Brooklyn',
    'NY',
    ARRAY['tailoring', 'coats', 'pants'],
    ARRAY['wool', 'cotton', 'linen'],
    'moderate',
    'premium',
    12, 21, 35,
    'active',
    true,
    12
),
(
    'Southern Seams',
    'Ashley Williams',
    'Nashville',
    'TN',
    ARRAY['dresses', 'skirts', 'alterations'],
    ARRAY['cotton', 'linen', 'blend'],
    'moderate',
    'standard',
    14, 24, 38,
    'active',
    true,
    15
),
(
    'Pacific Patterns',
    'Yuki Tanaka',
    'Portland',
    'OR',
    ARRAY['minimalist', 'sustainable', 'dresses', 'tops'],
    ARRAY['linen', 'hemp', 'organic_cotton'],
    'premium',
    'premium',
    14, 21, 30,
    'active',
    true,
    10
)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON ff_seamstresses TO postgres;
GRANT ALL ON ff_design_catalog TO postgres;
GRANT ALL ON ff_custom_orders TO postgres;
