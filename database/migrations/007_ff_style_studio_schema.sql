/**
 * FF AI Style Studio Database Schema
 * Complete schema for personal styling platform
 *
 * Features:
 * - Body scanning & measurements
 * - Color analysis & personal palettes
 * - Custom garment design
 * - Virtual closet management
 * - Outfit builder
 * - Custom clothing orders
 */

-- =====================================================
-- USER PROFILES & MEASUREMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ff_body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),

    -- Core measurements (inches)
    bust DECIMAL(5,2),
    waist DECIMAL(5,2),
    hips DECIMAL(5,2),
    shoulder_width DECIMAL(5,2),
    arm_length DECIMAL(5,2),
    inseam DECIMAL(5,2),
    torso_length DECIMAL(5,2),
    neck DECIMAL(5,2),
    wrist DECIMAL(5,2),

    -- Derived measurements
    height_inches DECIMAL(5,2),
    weight_lbs DECIMAL(5,2),

    -- AI-determined body type
    body_type TEXT, -- 'hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle'
    body_type_confidence DECIMAL(3,2),

    -- Best silhouettes for this body type
    recommended_silhouettes JSONB,
    -- Example: ["a-line", "wrap", "empire_waist", "fit_and_flare"]

    -- Avoid these
    silhouettes_to_avoid JSONB,
    -- Example: ["boxy", "drop_waist", "low_rise"]

    -- Source of measurements
    source TEXT, -- 'manual_input', 'photo_scan', 'professional'
    scan_photo_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SKIN TONE & COLOR PALETTE
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_color_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),

    -- Skin analysis
    skin_undertone TEXT, -- 'warm', 'cool', 'neutral'
    skin_depth TEXT, -- 'fair', 'light', 'medium', 'tan', 'deep'

    -- Detected colors from photo
    skin_hex TEXT, -- Primary skin color detected
    hair_hex TEXT, -- Hair color detected
    eye_hex TEXT, -- Eye color detected

    -- Season (color theory)
    color_season TEXT, -- 'spring', 'summer', 'autumn', 'winter'
    color_season_subtype TEXT, -- 'light_spring', 'soft_summer', 'deep_autumn', etc.

    -- Personal color palette (12-16 colors)
    best_colors JSONB,
    -- Example: [
    --   {"name": "champagne", "hex": "#F7E7CE", "category": "neutral"},
    --   {"name": "navy", "hex": "#1B2951", "category": "dark"},
    --   {"name": "coral", "hex": "#FF6F61", "category": "accent"}
    -- ]

    -- Colors to avoid
    avoid_colors JSONB,
    -- Example: [
    --   {"name": "neon_yellow", "hex": "#FFFF00", "reason": "washes out skin"},
    --   {"name": "orange", "hex": "#FF6600", "reason": "clashes with undertone"}
    -- ]

    -- Metals that complement
    best_metals TEXT[], -- ['gold', 'rose_gold', 'brass']
    avoid_metals TEXT[], -- ['silver', 'platinum']

    -- Source photo
    analysis_photo_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DESIGN TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_design_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,

    -- Base pattern/template
    template_svg TEXT, -- SVG path data
    template_3d_model_url TEXT, -- GLTF/GLB file

    -- Customizable elements
    customizable_elements JSONB,
    -- Example: {
    --   "neckline": ["v-neck", "crew", "boat", "scoop", "mandarin"],
    --   "sleeve_length": ["sleeveless", "cap", "short", "3/4", "long"],
    --   "sleeve_style": ["fitted", "bell", "puff", "raglan"],
    --   "length": ["cropped", "regular", "tunic", "midi", "maxi"]
    -- }

    -- Default values
    default_settings JSONB,

    -- Pricing
    base_price DECIMAL(10,2),
    estimated_fabric_yards DECIMAL(4,2),
    difficulty_level TEXT, -- 'simple', 'moderate', 'complex'
    production_time_days INTEGER,

    -- Body type recommendations
    best_for_body_types TEXT[],
    avoid_for_body_types TEXT[],

    -- Preview
    preview_image_url TEXT,

    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FABRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_fabrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'linen', 'cotton', 'wool', 'silk', 'hemp', 'bamboo'

    -- Frequency & Form unique selling point
    frequency_hz INTEGER, -- Measured frequency in Hz
    frequency_tier TEXT, -- 'highest' (5000+), 'high' (2000-5000), 'medium' (1000-2000)

    -- Details
    description TEXT,
    origin_country TEXT,
    certifications TEXT[], -- 'organic', 'fair_trade', 'gots', 'oeko_tex'
    care_instructions TEXT,

    -- Physical properties
    weight_gsm INTEGER, -- Grams per square meter
    drape TEXT, -- 'stiff', 'medium', 'fluid'
    stretch TEXT, -- 'none', 'low', '2-way', '4-way'
    opacity TEXT, -- 'sheer', 'semi-sheer', 'opaque'
    texture TEXT,

    -- Available colors
    available_colors JSONB,
    -- Example: [
    --   {"name": "natural", "hex": "#E8DCC8"},
    --   {"name": "white", "hex": "#FFFFFF"},
    --   {"name": "navy", "hex": "#1B2951"},
    --   {"name": "champagne", "hex": "#F7E7CE"}
    -- ]

    -- Pricing
    price_per_yard DECIMAL(10,2),
    min_order_yards DECIMAL(4,2) DEFAULT 1.0,

    -- Inventory
    in_stock BOOLEAN DEFAULT true,
    stock_yards DECIMAL(10,2),

    -- Media
    swatch_image_url TEXT,
    texture_image_url TEXT, -- For 3D rendering

    -- Best for
    best_for_categories TEXT[], -- ['dresses', 'blouses', 'pants']
    best_for_seasons TEXT[], -- ['spring', 'summer', 'fall', 'winter']

    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial fabrics with frequency data
INSERT INTO ff_fabrics (name, type, frequency_hz, frequency_tier, price_per_yard, available_colors, best_for_categories) VALUES
('Irish Linen Premium', 'linen', 5000, 'highest', 45.00,
 '[{"name":"natural","hex":"#E8DCC8"},{"name":"white","hex":"#FFFFFF"},{"name":"navy","hex":"#1B2951"},{"name":"champagne","hex":"#F7E7CE"}]'::jsonb,
 ARRAY['dresses', 'blouses', 'pants', 'blazers']),

('Organic Cotton Sateen', 'cotton', 3500, 'high', 28.00,
 '[{"name":"white","hex":"#FFFFFF"},{"name":"cream","hex":"#FFFDD0"},{"name":"sage","hex":"#9CAF88"},{"name":"blush","hex":"#E8C4C4"}]'::jsonb,
 ARRAY['dresses', 'blouses', 'skirts']),

('Merino Wool Fine', 'wool', 4800, 'highest', 65.00,
 '[{"name":"charcoal","hex":"#36454F"},{"name":"navy","hex":"#1B2951"},{"name":"forest","hex":"#1E3D33"},{"name":"burgundy","hex":"#722F37"}]'::jsonb,
 ARRAY['blazers', 'pants', 'coats', 'dresses']),

('Mulberry Silk Charmeuse', 'silk', 4500, 'highest', 85.00,
 '[{"name":"champagne","hex":"#F7E7CE"},{"name":"ivory","hex":"#FFFFF0"},{"name":"black","hex":"#000000"},{"name":"rose","hex":"#E8B4B8"}]'::jsonb,
 ARRAY['blouses', 'dresses', 'skirts', 'scarves']),

('Hemp Canvas', 'hemp', 4200, 'high', 32.00,
 '[{"name":"natural","hex":"#C9B896"},{"name":"olive","hex":"#556B2F"},{"name":"slate","hex":"#5D6D7E"}]'::jsonb,
 ARRAY['jackets', 'pants', 'bags'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- DESIGN CANVAS & CUSTOM DESIGNS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_custom_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),

    -- Design info
    design_name TEXT,
    category TEXT, -- 'tops', 'bottoms', 'dresses', 'outerwear', 'accessories'

    -- Base template used
    base_template_id UUID REFERENCES ff_design_templates(id),

    -- Canvas data (Fabric.js JSON)
    canvas_json JSONB,

    -- Design specifications
    silhouette TEXT, -- 'a-line', 'sheath', 'fit_and_flare', etc.
    neckline TEXT,
    sleeve_style TEXT,
    sleeve_length TEXT,
    hem_length TEXT,
    fit TEXT, -- 'relaxed', 'regular', 'fitted'

    -- Fabric selection
    primary_fabric_id UUID REFERENCES ff_fabrics(id),
    secondary_fabric_id UUID,
    lining_fabric_id UUID,

    -- Colors
    primary_color TEXT, -- Hex
    secondary_color TEXT,
    accent_color TEXT,

    -- Design elements
    design_elements JSONB,
    -- Example: {
    --   "pockets": true,
    --   "pocket_style": "side_seam",
    --   "buttons": false,
    --   "zipper": "invisible_back",
    --   "belt_loops": false,
    --   "pleats": "front_pleats"
    -- }

    -- Preview images
    preview_2d_url TEXT,
    preview_3d_url TEXT,

    -- AI suggestions applied
    ai_suggestions_applied JSONB,

    -- Pricing
    estimated_price DECIMAL(10,2),
    fabric_cost DECIMAL(10,2),
    labor_cost DECIMAL(10,2),

    -- Status
    status TEXT DEFAULT 'draft', -- 'draft', 'saved', 'in_cart', 'ordered', 'in_production', 'shipped', 'delivered'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- OUTFIT BUILDER
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_outfits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),

    name TEXT,
    occasion TEXT, -- 'work', 'casual', 'formal', 'date_night', 'travel'
    season TEXT, -- 'spring', 'summer', 'fall', 'winter', 'all_season'

    -- Pieces in this outfit
    pieces JSONB,
    -- Example: [
    --   {"type": "top", "design_id": "uuid", "from_closet": true},
    --   {"type": "bottom", "design_id": "uuid", "from_closet": true},
    --   {"type": "outerwear", "design_id": "uuid", "from_closet": false},
    --   {"type": "accessory", "item": "gold_necklace", "external": true}
    -- ]

    -- Preview
    outfit_preview_url TEXT,

    -- AI suggestions
    ai_completion_suggestions JSONB,

    -- Status
    is_favorite BOOLEAN DEFAULT false,
    times_worn INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VIRTUAL CLOSET
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_closet_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),

    -- Item source
    source TEXT, -- 'ff_custom' (from FF), 'external' (uploaded by user)
    design_id UUID REFERENCES ff_custom_designs(id), -- If FF custom

    -- Item details (for external items)
    name TEXT,
    category TEXT,
    color_primary TEXT,
    color_secondary TEXT,
    fabric_type TEXT,
    brand TEXT,

    -- Image
    image_url TEXT,

    -- AI-extracted data
    ai_detected_colors JSONB,
    ai_detected_style TEXT,
    ai_suggested_pairings JSONB,

    -- Usage tracking
    times_worn INTEGER DEFAULT 0,
    last_worn DATE,
    is_favorite BOOLEAN DEFAULT false,

    -- Status
    status TEXT DEFAULT 'active', -- 'active', 'archived', 'donated'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),

    -- Order details
    order_number TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    -- 'pending', 'confirmed', 'in_production', 'quality_check', 'shipped', 'delivered', 'completed'

    -- Items
    items JSONB,
    -- Example: [
    --   {"design_id": "uuid", "quantity": 1, "price": 185.00, "customizations": {...}},
    --   {"design_id": "uuid", "quantity": 1, "price": 245.00, "customizations": {...}}
    -- ]

    -- Measurements snapshot (in case user updates later)
    measurements_snapshot JSONB,

    -- Pricing
    subtotal DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    tax DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2),

    -- Shipping
    shipping_address JSONB,
    shipping_method TEXT,
    tracking_number TEXT,
    estimated_delivery DATE,

    -- Production
    manufacturer TEXT, -- 'printful', 'local_seamstress', 'custom_shop'
    manufacturer_order_id TEXT,
    production_started_at TIMESTAMPTZ,
    production_completed_at TIMESTAMPTZ,

    -- Payment
    payment_status TEXT, -- 'pending', 'paid', 'refunded'
    stripe_payment_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_measurements_user ON ff_body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_color_profiles_user ON ff_color_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_user ON ff_custom_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON ff_custom_designs(status);
CREATE INDEX IF NOT EXISTS idx_closet_user ON ff_closet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON ff_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON ff_orders(status);
CREATE INDEX IF NOT EXISTS idx_fabrics_type ON ff_fabrics(type);
CREATE INDEX IF NOT EXISTS idx_fabrics_frequency ON ff_fabrics(frequency_tier);
CREATE INDEX IF NOT EXISTS idx_outfits_user ON ff_outfits(user_id);

-- Grant permissions
GRANT ALL ON ff_user_profiles TO postgres;
GRANT ALL ON ff_body_measurements TO postgres;
GRANT ALL ON ff_color_profiles TO postgres;
GRANT ALL ON ff_design_templates TO postgres;
GRANT ALL ON ff_fabrics TO postgres;
GRANT ALL ON ff_custom_designs TO postgres;
GRANT ALL ON ff_outfits TO postgres;
GRANT ALL ON ff_closet_items TO postgres;
GRANT ALL ON ff_orders TO postgres;
