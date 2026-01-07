# FREQUENCY & FORM - AI STYLE STUDIO
## Technical Implementation Document for Claude Code
### Build the Future of Personal Fashion

---

## OVERVIEW

Build an AI-powered personal styling platform that:
1. Scans your body and determines your best silhouettes
2. Analyzes skin tone and generates your personal color palette
3. Lets you draw/design custom clothing on an interactive canvas
4. Shows real-time 3D preview on YOUR body type
5. Builds complete outfits with AI suggestions
6. One-click orders to seamstress/manufacturer
7. Saves everything in your virtual closet

**NO BIG TECH DEPENDENCIES** - All self-hosted, open-source stack.

---

## TECH STACK

| Component | Technology | Why |
|-----------|------------|-----|
| Frontend | Next.js + React | Already using |
| 3D Engine | Three.js | Open source, browser-based |
| Body Detection | TensorFlow.js + PoseNet | Open source, runs in browser |
| Color Analysis | Custom ML model + Color Thief | Open source |
| Drawing Canvas | Fabric.js | Open source, feature-rich |
| 3D Models | MakeHuman exports | Open source body models |
| Backend | Node.js (existing MFS server) | Already running |
| Database | Supabase (FF instance) | Already have |
| File Storage | Supabase Storage | Already have |
| AI | Groq/Gemini (free tier) | No OpenAI dependency |

---

## DATABASE SCHEMA

```sql
-- Run on FF Supabase: https://kzazlevvatuqbslzdjjb.supabase.co

-- =====================================================
-- USER PROFILES & MEASUREMENTS
-- =====================================================

CREATE TABLE ff_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ff_body_measurements (
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

CREATE TABLE ff_color_profiles (
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
-- DESIGN CANVAS & CUSTOM DESIGNS
-- =====================================================

CREATE TABLE ff_custom_designs (
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

CREATE TABLE ff_design_templates (
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

CREATE TABLE ff_fabrics (
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
 '[{"name":"natural","hex":"#E8DCC8"},{"name":"white","hex":"#FFFFFF"},{"name":"navy","hex":"#1B2951"},{"name":"champagne","hex":"#F7E7CE"}]',
 ARRAY['dresses', 'blouses', 'pants', 'blazers']),
 
('Organic Cotton Sateen', 'cotton', 3500, 'high', 28.00,
 '[{"name":"white","hex":"#FFFFFF"},{"name":"cream","hex":"#FFFDD0"},{"name":"sage","hex":"#9CAF88"},{"name":"blush","hex":"#E8C4C4"}]',
 ARRAY['dresses', 'blouses', 'skirts']),
 
('Merino Wool Fine', 'wool', 4800, 'highest', 65.00,
 '[{"name":"charcoal","hex":"#36454F"},{"name":"navy","hex":"#1B2951"},{"name":"forest","hex":"#1E3D33"},{"name":"burgundy","hex":"#722F37"}]',
 ARRAY['blazers', 'pants', 'coats', 'dresses']),
 
('Mulberry Silk Charmeuse', 'silk', 4500, 'highest', 85.00,
 '[{"name":"champagne","hex":"#F7E7CE"},{"name":"ivory","hex":"#FFFFF0"},{"name":"black","hex":"#000000"},{"name":"rose","hex":"#E8B4B8"}]',
 ARRAY['blouses', 'dresses', 'skirts', 'scarves']),
 
('Hemp Canvas', 'hemp', 4200, 'high', 32.00,
 '[{"name":"natural","hex":"#C9B896"},{"name":"olive","hex":"#556B2F"},{"name":"slate","hex":"#5D6D7E"}]',
 ARRAY['jackets', 'pants', 'bags']);

-- =====================================================
-- OUTFIT BUILDER
-- =====================================================

CREATE TABLE ff_outfits (
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

CREATE TABLE ff_closet_items (
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

CREATE TABLE ff_orders (
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

CREATE INDEX idx_measurements_user ON ff_body_measurements(user_id);
CREATE INDEX idx_color_profiles_user ON ff_color_profiles(user_id);
CREATE INDEX idx_designs_user ON ff_custom_designs(user_id);
CREATE INDEX idx_designs_status ON ff_custom_designs(status);
CREATE INDEX idx_closet_user ON ff_closet_items(user_id);
CREATE INDEX idx_orders_user ON ff_orders(user_id);
CREATE INDEX idx_orders_status ON ff_orders(status);
CREATE INDEX idx_fabrics_type ON ff_fabrics(type);
CREATE INDEX idx_fabrics_frequency ON ff_fabrics(frequency_tier);
```

---

## COMPONENT 1: BODY SCAN & ANALYSIS

### File: `/unbound/backend/agents/ff/body-analyzer.js`

```javascript
/**
 * FF Body Analyzer Agent
 * 
 * Uses TensorFlow.js + PoseNet to:
 * 1. Detect body landmarks from photo
 * 2. Calculate proportions
 * 3. Determine body type
 * 4. Recommend silhouettes
 */

const tf = require('@tensorflow/tfjs-node');
const { createClient } = require('@supabase/supabase-js');

class BodyAnalyzer {
    constructor() {
        this.supabase = createClient(
            process.env.FF_SUPABASE_URL || 'https://kzazlevvatuqbslzdjjb.supabase.co',
            process.env.FF_SUPABASE_SERVICE_KEY
        );
        this.model = null;
    }
    
    async initialize() {
        // Load PoseNet model for body landmark detection
        // Self-hosted model, no external API calls
        this.model = await this.loadPoseNetModel();
    }
    
    async analyzeFromPhoto(imageBuffer, userId) {
        // Detect body landmarks
        const landmarks = await this.detectLandmarks(imageBuffer);
        
        // Calculate measurements from landmarks
        const measurements = this.calculateMeasurements(landmarks);
        
        // Determine body type
        const bodyType = this.determineBodyType(measurements);
        
        // Get silhouette recommendations
        const recommendations = this.getSilhouetteRecommendations(bodyType);
        
        // Save to database
        await this.saveMeasurements(userId, measurements, bodyType, recommendations);
        
        return {
            measurements,
            bodyType,
            recommendations
        };
    }
    
    async analyzeFromManualInput(measurements, userId) {
        // Calculate ratios from manual measurements
        const bodyType = this.determineBodyType(measurements);
        const recommendations = this.getSilhouetteRecommendations(bodyType);
        
        await this.saveMeasurements(userId, measurements, bodyType, recommendations);
        
        return {
            measurements,
            bodyType,
            recommendations
        };
    }
    
    determineBodyType(measurements) {
        const { bust, waist, hips, shoulder_width } = measurements;
        
        // Calculate ratios
        const bustToHips = bust / hips;
        const waistToHips = waist / hips;
        const shoulderToHips = shoulder_width / hips;
        
        // Body type classification
        if (Math.abs(bust - hips) <= 2 && waist < bust * 0.75) {
            return {
                type: 'hourglass',
                confidence: 0.9,
                description: 'Balanced bust and hips with defined waist'
            };
        }
        
        if (hips > bust + 2 && waist < hips * 0.8) {
            return {
                type: 'pear',
                confidence: 0.85,
                description: 'Hips wider than bust, defined waist'
            };
        }
        
        if (bust > hips + 2 || shoulder_width > hips * 1.1) {
            return {
                type: 'inverted_triangle',
                confidence: 0.85,
                description: 'Broader shoulders/bust, narrower hips'
            };
        }
        
        if (waist > bust * 0.8 && waist > hips * 0.8) {
            return {
                type: 'apple',
                confidence: 0.85,
                description: 'Fuller midsection, slimmer legs'
            };
        }
        
        return {
            type: 'rectangle',
            confidence: 0.8,
            description: 'Balanced proportions throughout'
        };
    }
    
    getSilhouetteRecommendations(bodyType) {
        const recommendations = {
            hourglass: {
                best: ['wrap_dress', 'fit_and_flare', 'pencil_skirt', 'belted_styles', 'v_neck'],
                avoid: ['boxy_cuts', 'drop_waist', 'shapeless_styles'],
                tips: [
                    'Emphasize your natural waist',
                    'V-necks and wrap styles complement your proportions',
                    'Fitted styles work beautifully'
                ]
            },
            pear: {
                best: ['a_line_skirt', 'wide_leg_pants', 'boat_neck', 'statement_tops', 'empire_waist'],
                avoid: ['skinny_pants', 'pencil_skirts', 'hip_details'],
                tips: [
                    'Draw attention upward with interesting necklines',
                    'A-line silhouettes balance proportions',
                    'Dark colors on bottom, lighter on top'
                ]
            },
            inverted_triangle: {
                best: ['full_skirts', 'wide_leg_pants', 'v_neck', 'wrap_tops', 'peplum'],
                avoid: ['shoulder_pads', 'boat_necks', 'horizontal_stripes_top'],
                tips: [
                    'Add volume to hips with full skirts',
                    'V-necks narrow the shoulder line',
                    'Avoid embellishments at shoulders'
                ]
            },
            apple: {
                best: ['empire_waist', 'a_line', 'wrap_dress', 'v_neck', 'straight_leg_pants'],
                avoid: ['clingy_fabrics', 'belted_at_waist', 'horizontal_stripes'],
                tips: [
                    'Empire waists are most flattering',
                    'Show off legs with shorter hemlines',
                    'Structured fabrics work better than clingy'
                ]
            },
            rectangle: {
                best: ['belted_styles', 'peplum', 'ruffles', 'layering', 'asymmetric'],
                avoid: ['boxy_cuts', 'shapeless_dresses'],
                tips: [
                    'Create curves with belts and peplums',
                    'Layering adds dimension',
                    'Ruffles and details create shape'
                ]
            }
        };
        
        return recommendations[bodyType.type] || recommendations.rectangle;
    }
    
    async saveMeasurements(userId, measurements, bodyType, recommendations) {
        await this.supabase.from('ff_body_measurements').upsert({
            user_id: userId,
            ...measurements,
            body_type: bodyType.type,
            body_type_confidence: bodyType.confidence,
            recommended_silhouettes: recommendations.best,
            silhouettes_to_avoid: recommendations.avoid,
            updated_at: new Date().toISOString()
        });
    }
}

module.exports = BodyAnalyzer;
```

---

## COMPONENT 2: SKIN TONE & COLOR ANALYSIS

### File: `/unbound/backend/agents/ff/color-analyzer.js`

```javascript
/**
 * FF Color Analyzer Agent
 * 
 * Analyzes face photo to:
 * 1. Detect skin undertone
 * 2. Determine color season
 * 3. Generate personal color palette
 * 4. Recommend fabric colors
 */

const ColorThief = require('colorthief');
const { createClient } = require('@supabase/supabase-js');

class ColorAnalyzer {
    constructor() {
        this.supabase = createClient(
            process.env.FF_SUPABASE_URL,
            process.env.FF_SUPABASE_SERVICE_KEY
        );
    }
    
    async analyzeFromPhoto(imageBuffer, userId) {
        // Extract dominant colors from face area
        const dominantColors = await this.extractColors(imageBuffer);
        
        // Separate skin, hair, eye colors
        const colorBreakdown = this.classifyColors(dominantColors);
        
        // Determine undertone
        const undertone = this.determineUndertone(colorBreakdown.skin);
        
        // Determine color season
        const colorSeason = this.determineColorSeason(colorBreakdown, undertone);
        
        // Generate personal palette
        const personalPalette = this.generatePalette(colorSeason, undertone);
        
        // Colors to avoid
        const avoidColors = this.getColorsToAvoid(colorSeason, undertone);
        
        // Best metals
        const metals = this.recommendMetals(undertone);
        
        // Save to database
        await this.saveColorProfile(userId, {
            ...colorBreakdown,
            undertone,
            colorSeason,
            personalPalette,
            avoidColors,
            metals
        });
        
        return {
            undertone,
            colorSeason,
            personalPalette,
            avoidColors,
            metals
        };
    }
    
    determineUndertone(skinHex) {
        const rgb = this.hexToRgb(skinHex);
        
        // Calculate warmth based on red-yellow vs blue-pink
        const warmth = (rgb.r * 0.5 + rgb.g * 0.3) / (rgb.b + 1);
        
        if (warmth > 1.5) {
            return { type: 'warm', confidence: 0.85 };
        } else if (warmth < 1.2) {
            return { type: 'cool', confidence: 0.85 };
        } else {
            return { type: 'neutral', confidence: 0.75 };
        }
    }
    
    determineColorSeason(colors, undertone) {
        const depth = this.calculateColorDepth(colors.skin);
        const contrast = this.calculateContrast(colors.skin, colors.hair, colors.eyes);
        
        if (undertone.type === 'warm') {
            if (depth === 'light' && contrast === 'low') {
                return { season: 'spring', subtype: 'light_spring' };
            } else if (depth === 'deep') {
                return { season: 'autumn', subtype: 'deep_autumn' };
            }
            return { season: 'autumn', subtype: 'warm_autumn' };
        }
        
        if (undertone.type === 'cool') {
            if (depth === 'light') {
                return { season: 'summer', subtype: 'light_summer' };
            } else if (contrast === 'high') {
                return { season: 'winter', subtype: 'clear_winter' };
            }
            return { season: 'winter', subtype: 'cool_winter' };
        }
        
        // Neutral
        if (depth === 'light') {
            return { season: 'summer', subtype: 'soft_summer' };
        }
        return { season: 'autumn', subtype: 'soft_autumn' };
    }
    
    generatePalette(colorSeason, undertone) {
        const palettes = {
            spring: {
                light_spring: [
                    { name: 'peach', hex: '#FFCBA4', category: 'warm' },
                    { name: 'coral', hex: '#FF6F61', category: 'accent' },
                    { name: 'warm_ivory', hex: '#FFFFF0', category: 'neutral' },
                    { name: 'light_turquoise', hex: '#40E0D0', category: 'cool' },
                    { name: 'golden_yellow', hex: '#FFDF00', category: 'bright' },
                    { name: 'warm_pink', hex: '#FF69B4', category: 'accent' },
                    { name: 'apple_green', hex: '#8DB600', category: 'nature' },
                    { name: 'light_navy', hex: '#4169E1', category: 'dark' }
                ]
            },
            summer: {
                light_summer: [
                    { name: 'powder_blue', hex: '#B0E0E6', category: 'cool' },
                    { name: 'soft_pink', hex: '#E8C4C4', category: 'warm' },
                    { name: 'lavender', hex: '#E6E6FA', category: 'accent' },
                    { name: 'dusty_rose', hex: '#C4A4A4', category: 'neutral' },
                    { name: 'sage', hex: '#9CAF88', category: 'nature' },
                    { name: 'soft_navy', hex: '#3B5998', category: 'dark' },
                    { name: 'mauve', hex: '#E0B0FF', category: 'accent' },
                    { name: 'silver_gray', hex: '#C0C0C0', category: 'neutral' }
                ],
                soft_summer: [
                    { name: 'dusty_blue', hex: '#7393B3', category: 'cool' },
                    { name: 'soft_white', hex: '#FAF9F6', category: 'neutral' },
                    { name: 'rose', hex: '#E8B4B8', category: 'warm' },
                    { name: 'sage', hex: '#9CAF88', category: 'nature' }
                ]
            },
            autumn: {
                warm_autumn: [
                    { name: 'terracotta', hex: '#C76B4A', category: 'warm' },
                    { name: 'olive', hex: '#556B2F', category: 'nature' },
                    { name: 'champagne', hex: '#F7E7CE', category: 'neutral' },
                    { name: 'burnt_orange', hex: '#CC5500', category: 'accent' },
                    { name: 'forest_green', hex: '#1E3D33', category: 'dark' },
                    { name: 'gold', hex: '#D4AF37', category: 'metal' },
                    { name: 'rust', hex: '#B7410E', category: 'warm' },
                    { name: 'cream', hex: '#FFFDD0', category: 'neutral' }
                ],
                deep_autumn: [
                    { name: 'chocolate', hex: '#3C1414', category: 'dark' },
                    { name: 'deep_teal', hex: '#014D4E', category: 'cool' },
                    { name: 'burgundy', hex: '#722F37', category: 'warm' },
                    { name: 'bronze', hex: '#CD7F32', category: 'metal' }
                ]
            },
            winter: {
                clear_winter: [
                    { name: 'true_white', hex: '#FFFFFF', category: 'neutral' },
                    { name: 'black', hex: '#000000', category: 'dark' },
                    { name: 'true_red', hex: '#FF0000', category: 'accent' },
                    { name: 'royal_blue', hex: '#4169E1', category: 'cool' },
                    { name: 'emerald', hex: '#50C878', category: 'nature' },
                    { name: 'hot_pink', hex: '#FF69B4', category: 'accent' },
                    { name: 'navy', hex: '#1B2951', category: 'dark' },
                    { name: 'silver', hex: '#C0C0C0', category: 'metal' }
                ],
                cool_winter: [
                    { name: 'charcoal', hex: '#36454F', category: 'dark' },
                    { name: 'icy_pink', hex: '#F5D5E0', category: 'cool' },
                    { name: 'deep_purple', hex: '#4B0082', category: 'accent' },
                    { name: 'platinum', hex: '#E5E4E2', category: 'metal' }
                ]
            }
        };
        
        return palettes[colorSeason.season]?.[colorSeason.subtype] || 
               palettes[colorSeason.season]?.[Object.keys(palettes[colorSeason.season])[0]];
    }
    
    getColorsToAvoid(colorSeason, undertone) {
        const avoidMap = {
            warm: [
                { name: 'cool_pink', hex: '#FF00FF', reason: 'Too cool for warm undertones' },
                { name: 'blue_red', hex: '#8B0000', reason: 'Clashes with warm undertones' },
                { name: 'silver', hex: '#C0C0C0', reason: 'Cool metal washes out warm skin' }
            ],
            cool: [
                { name: 'orange', hex: '#FF6600', reason: 'Too warm for cool undertones' },
                { name: 'golden_yellow', hex: '#FFD700', reason: 'Clashes with cool undertones' },
                { name: 'gold', hex: '#D4AF37', reason: 'Warm metal clashes with cool skin' }
            ],
            neutral: [
                { name: 'neon_yellow', hex: '#FFFF00', reason: 'Too harsh for most neutrals' }
            ]
        };
        
        return avoidMap[undertone.type] || [];
    }
    
    recommendMetals(undertone) {
        const metalMap = {
            warm: {
                best: ['gold', 'rose_gold', 'brass', 'copper'],
                avoid: ['silver', 'platinum', 'chrome']
            },
            cool: {
                best: ['silver', 'platinum', 'white_gold', 'chrome'],
                avoid: ['gold', 'brass', 'copper']
            },
            neutral: {
                best: ['gold', 'silver', 'rose_gold', 'platinum'],
                avoid: []
            }
        };
        
        return metalMap[undertone.type];
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

module.exports = ColorAnalyzer;
```

---

## COMPONENT 3: INTERACTIVE DESIGN CANVAS

### File: `/public/ff/design-studio.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FF Design Studio</title>
    
    <!-- Fabric.js for canvas -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
    
    <!-- Three.js for 3D preview -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <style>
        :root {
            --ff-champagne: #F7E7CE;
            --ff-navy: #1B2951;
            --ff-gold: #D4AF37;
            --ff-cream: #FAF9F6;
            --ff-forest: #1E3D33;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cormorant Garamond', serif;
            background: var(--ff-cream);
            color: var(--ff-navy);
        }
        
        .studio-container {
            display: grid;
            grid-template-columns: 280px 1fr 320px;
            height: 100vh;
        }
        
        /* Left Panel - Tools */
        .tools-panel {
            background: white;
            border-right: 1px solid #eee;
            padding: 20px;
            overflow-y: auto;
        }
        
        .tool-section {
            margin-bottom: 24px;
        }
        
        .tool-section h3 {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--ff-gold);
            margin-bottom: 12px;
        }
        
        /* Center - Canvas */
        .canvas-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            padding: 20px;
        }
        
        #design-canvas {
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        
        /* Right Panel - Preview & Options */
        .preview-panel {
            background: white;
            border-left: 1px solid #eee;
            padding: 20px;
            overflow-y: auto;
        }
        
        #preview-3d {
            width: 100%;
            height: 400px;
            background: #f9f9f9;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        /* Fabric Swatches */
        .fabric-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        
        .fabric-swatch {
            aspect-ratio: 1;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .fabric-swatch:hover {
            transform: scale(1.05);
        }
        
        .fabric-swatch.selected {
            border-color: var(--ff-gold);
        }
        
        /* Color Palette */
        .color-palette {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .color-dot {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .color-dot:hover {
            transform: scale(1.1);
        }
        
        .color-dot.selected {
            border-color: var(--ff-navy);
            box-shadow: 0 0 0 2px white, 0 0 0 4px var(--ff-navy);
        }
        
        /* Buttons */
        .btn-primary {
            width: 100%;
            padding: 16px;
            background: var(--ff-navy);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .btn-primary:hover {
            background: var(--ff-forest);
        }
        
        .btn-gold {
            background: var(--ff-gold);
            color: var(--ff-navy);
        }
        
        /* Price Display */
        .price-display {
            background: var(--ff-champagne);
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        
        .price-display .price {
            font-size: 32px;
            font-weight: bold;
            color: var(--ff-navy);
        }
        
        .price-display .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--ff-gold);
        }
    </style>
</head>
<body>
    <div class="studio-container">
        <!-- Left Panel: Tools -->
        <div class="tools-panel">
            <div class="tool-section">
                <h3>Silhouette</h3>
                <select id="silhouette-select">
                    <option value="a_line">A-Line</option>
                    <option value="sheath">Sheath</option>
                    <option value="fit_flare">Fit & Flare</option>
                    <option value="wrap">Wrap</option>
                    <option value="shift">Shift</option>
                </select>
            </div>
            
            <div class="tool-section">
                <h3>Neckline</h3>
                <select id="neckline-select">
                    <option value="v_neck">V-Neck</option>
                    <option value="crew">Crew</option>
                    <option value="boat">Boat Neck</option>
                    <option value="scoop">Scoop</option>
                    <option value="square">Square</option>
                </select>
            </div>
            
            <div class="tool-section">
                <h3>Sleeves</h3>
                <select id="sleeve-select">
                    <option value="sleeveless">Sleeveless</option>
                    <option value="cap">Cap Sleeve</option>
                    <option value="short">Short Sleeve</option>
                    <option value="3_4">3/4 Sleeve</option>
                    <option value="long">Long Sleeve</option>
                </select>
            </div>
            
            <div class="tool-section">
                <h3>Length</h3>
                <select id="length-select">
                    <option value="mini">Mini</option>
                    <option value="knee">Knee</option>
                    <option value="midi">Midi</option>
                    <option value="maxi">Maxi</option>
                </select>
            </div>
            
            <div class="tool-section">
                <h3>Drawing Tools</h3>
                <button onclick="setDrawingMode('pencil')">✏️ Draw</button>
                <button onclick="setDrawingMode('line')">📏 Line</button>
                <button onclick="setDrawingMode('select')">👆 Select</button>
                <button onclick="undoLast()">↩️ Undo</button>
            </div>
        </div>
        
        <!-- Center: Canvas -->
        <div class="canvas-area">
            <canvas id="design-canvas" width="600" height="800"></canvas>
        </div>
        
        <!-- Right Panel: Preview & Options -->
        <div class="preview-panel">
            <div id="preview-3d"></div>
            
            <div class="tool-section">
                <h3>Your Color Palette</h3>
                <div class="color-palette" id="user-colors">
                    <!-- Populated from user's color profile -->
                </div>
            </div>
            
            <div class="tool-section">
                <h3>Fabric</h3>
                <div class="fabric-grid" id="fabric-options">
                    <!-- Populated from ff_fabrics -->
                </div>
            </div>
            
            <div class="price-display">
                <div class="label">Estimated Price</div>
                <div class="price" id="price-estimate">$185</div>
                <div class="label">Includes fabric + custom tailoring</div>
            </div>
            
            <button class="btn-primary" onclick="addToOutfit()">
                Add to Outfit
            </button>
            
            <button class="btn-primary btn-gold" style="margin-top: 10px" onclick="addToOrder()">
                Add to Order
            </button>
        </div>
    </div>
    
    <script>
        // Initialize Fabric.js canvas
        const canvas = new fabric.Canvas('design-canvas', {
            isDrawingMode: false,
            backgroundColor: '#ffffff'
        });
        
        // Load base template
        async function loadTemplate(templateId) {
            const response = await fetch(`/api/ff/templates/${templateId}`);
            const template = await response.json();
            
            // Load SVG template onto canvas
            fabric.loadSVGFromString(template.svg, (objects, options) => {
                const group = fabric.util.groupSVGElements(objects, options);
                canvas.add(group);
                canvas.renderAll();
            });
        }
        
        // Load user's color palette
        async function loadUserColors() {
            const response = await fetch('/api/ff/user/color-profile');
            const colors = await response.json();
            
            const container = document.getElementById('user-colors');
            colors.personalPalette.forEach(color => {
                const dot = document.createElement('div');
                dot.className = 'color-dot';
                dot.style.backgroundColor = color.hex;
                dot.title = color.name;
                dot.onclick = () => selectColor(color.hex);
                container.appendChild(dot);
            });
        }
        
        // Load fabrics
        async function loadFabrics() {
            const response = await fetch('/api/ff/fabrics');
            const fabrics = await response.json();
            
            const container = document.getElementById('fabric-options');
            fabrics.forEach(fabric => {
                const swatch = document.createElement('div');
                swatch.className = 'fabric-swatch';
                swatch.style.backgroundImage = `url(${fabric.swatch_image_url})`;
                swatch.title = `${fabric.name} (${fabric.frequency_hz}Hz)`;
                swatch.onclick = () => selectFabric(fabric);
                container.appendChild(swatch);
            });
        }
        
        // Drawing mode
        function setDrawingMode(mode) {
            if (mode === 'pencil') {
                canvas.isDrawingMode = true;
                canvas.freeDrawingBrush.width = 2;
                canvas.freeDrawingBrush.color = '#1B2951';
            } else {
                canvas.isDrawingMode = false;
            }
        }
        
        // Price calculation
        function calculatePrice() {
            const fabric = selectedFabric;
            const template = selectedTemplate;
            
            const fabricCost = fabric.price_per_yard * template.estimated_fabric_yards;
            const laborCost = template.difficulty_level === 'complex' ? 75 : 
                             template.difficulty_level === 'moderate' ? 50 : 35;
            const basePrice = template.base_price;
            
            const total = fabricCost + laborCost + basePrice;
            const withMargin = Math.ceil(total / (1 - 0.55) / 5) * 5;
            
            document.getElementById('price-estimate').textContent = `$${withMargin}`;
        }
        
        // Add to order
        async function addToOrder() {
            const designData = {
                canvas_json: JSON.stringify(canvas.toJSON()),
                template_id: selectedTemplate.id,
                fabric_id: selectedFabric.id,
                primary_color: selectedColor,
                customizations: {
                    silhouette: document.getElementById('silhouette-select').value,
                    neckline: document.getElementById('neckline-select').value,
                    sleeve: document.getElementById('sleeve-select').value,
                    length: document.getElementById('length-select').value
                }
            };
            
            const response = await fetch('/api/ff/designs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(designData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Add to cart
                await fetch('/api/ff/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ design_id: result.design_id })
                });
                
                alert('Added to your order!');
            }
        }
        
        // Initialize
        loadUserColors();
        loadFabrics();
        loadTemplate('basic_dress');
    </script>
</body>
</html>
```

---

## COMPONENT 4: 3D PREVIEW ENGINE

### File: `/public/ff/preview-engine.js`

```javascript
/**
 * FF 3D Preview Engine
 * 
 * Uses Three.js to show real-time 3D preview
 * of the garment on user's body type
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class PreviewEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.mannequin = null;
        this.garment = null;
        
        this.init();
    }
    
    init() {
        // Setup renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0xf9f9f9, 1);
        this.container.appendChild(this.renderer.domElement);
        
        // Camera position
        this.camera.position.set(0, 1.5, 3);
        this.camera.lookAt(0, 1, 0);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
        
        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 5;
        
        // Start animation loop
        this.animate();
    }
    
    async loadMannequin(bodyType, measurements) {
        const loader = new GLTFLoader();
        
        // Load base mannequin model based on body type
        const modelPath = `/models/mannequin_${bodyType}.glb`;
        
        return new Promise((resolve, reject) => {
            loader.load(
                modelPath,
                (gltf) => {
                    this.mannequin = gltf.scene;
                    
                    // Scale mannequin based on measurements
                    this.scaleMannequin(measurements);
                    
                    this.scene.add(this.mannequin);
                    resolve(this.mannequin);
                },
                undefined,
                reject
            );
        });
    }
    
    scaleMannequin(measurements) {
        if (!this.mannequin) return;
        
        // Adjust mannequin proportions based on measurements
        const bust = measurements.bust / 36; // Normalize to base size
        const waist = measurements.waist / 28;
        const hips = measurements.hips / 38;
        
        // Apply scaling to specific body parts
        // This would need bone/mesh manipulation based on model structure
    }
    
    async loadGarment(templateId, customizations) {
        const loader = new GLTFLoader();
        
        // Load garment model
        const modelPath = `/models/garments/${templateId}.glb`;
        
        return new Promise((resolve, reject) => {
            loader.load(
                modelPath,
                (gltf) => {
                    // Remove previous garment
                    if (this.garment) {
                        this.scene.remove(this.garment);
                    }
                    
                    this.garment = gltf.scene;
                    
                    // Apply customizations
                    this.applyCustomizations(customizations);
                    
                    this.scene.add(this.garment);
                    resolve(this.garment);
                },
                undefined,
                reject
            );
        });
    }
    
    applyCustomizations(customizations) {
        if (!this.garment) return;
        
        // Apply fabric texture
        if (customizations.fabricTexture) {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load(customizations.fabricTexture);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            this.garment.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        color: new THREE.Color(customizations.color || '#FFFFFF')
                    });
                }
            });
        }
        
        // Apply color
        if (customizations.color && !customizations.fabricTexture) {
            this.garment.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: new THREE.Color(customizations.color)
                    });
                }
            });
        }
    }
    
    updateColor(hexColor) {
        if (!this.garment) return;
        
        this.garment.traverse((child) => {
            if (child.isMesh) {
                child.material.color.set(hexColor);
            }
        });
    }
    
    updateFabric(textureUrl) {
        if (!this.garment) return;
        
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(textureUrl, (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);
            
            this.garment.traverse((child) => {
                if (child.isMesh) {
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
            });
        });
    }
    
    rotate(angle) {
        if (this.mannequin) {
            this.mannequin.rotation.y = angle;
        }
        if (this.garment) {
            this.garment.rotation.y = angle;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    captureScreenshot() {
        return this.renderer.domElement.toDataURL('image/png');
    }
    
    dispose() {
        this.renderer.dispose();
        this.controls.dispose();
    }
}

export default PreviewEngine;
```

---

## COMPONENT 5: API ENDPOINTS

### File: `/api/ff/body-scan.js`

```javascript
const BodyAnalyzer = require('../../unbound/backend/agents/ff/body-analyzer');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    const supabase = createClient(
        process.env.FF_SUPABASE_URL,
        process.env.FF_SUPABASE_SERVICE_KEY
    );
    
    const { action, measurements, imageBase64, userId } = req.body || {};
    
    const analyzer = new BodyAnalyzer();
    await analyzer.initialize();
    
    try {
        switch (action) {
            case 'analyze_photo':
                const photoBuffer = Buffer.from(imageBase64, 'base64');
                const photoResult = await analyzer.analyzeFromPhoto(photoBuffer, userId);
                return res.json({ success: true, ...photoResult });
                
            case 'analyze_measurements':
                const measurementResult = await analyzer.analyzeFromManualInput(measurements, userId);
                return res.json({ success: true, ...measurementResult });
                
            case 'get_profile':
                const { data: profile } = await supabase
                    .from('ff_body_measurements')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                return res.json({ success: true, profile });
                
            default:
                return res.json({
                    agent: 'BodyAnalyzer',
                    actions: ['analyze_photo', 'analyze_measurements', 'get_profile']
                });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
```

### File: `/api/ff/color-analysis.js`

```javascript
const ColorAnalyzer = require('../../unbound/backend/agents/ff/color-analyzer');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    const supabase = createClient(
        process.env.FF_SUPABASE_URL,
        process.env.FF_SUPABASE_SERVICE_KEY
    );
    
    const { action, imageBase64, userId } = req.body || {};
    
    const analyzer = new ColorAnalyzer();
    
    try {
        switch (action) {
            case 'analyze':
                const buffer = Buffer.from(imageBase64, 'base64');
                const result = await analyzer.analyzeFromPhoto(buffer, userId);
                return res.json({ success: true, ...result });
                
            case 'get_palette':
                const { data: profile } = await supabase
                    .from('ff_color_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                return res.json({ success: true, profile });
                
            case 'match_to_fabric':
                const { fabricId } = req.body;
                // Check if fabric color complements user's palette
                const match = await analyzer.checkFabricMatch(userId, fabricId);
                return res.json({ success: true, match });
                
            default:
                return res.json({
                    agent: 'ColorAnalyzer',
                    actions: ['analyze', 'get_palette', 'match_to_fabric']
                });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
```

### File: `/api/ff/designs.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    const supabase = createClient(
        process.env.FF_SUPABASE_URL,
        process.env.FF_SUPABASE_SERVICE_KEY
    );
    
    const { action } = req.body || req.query || {};
    
    try {
        switch (action) {
            case 'create':
                const { userId, canvas_json, template_id, fabric_id, primary_color, customizations } = req.body;
                
                // Calculate price
                const { data: template } = await supabase
                    .from('ff_design_templates')
                    .select('*')
                    .eq('id', template_id)
                    .single();
                    
                const { data: fabric } = await supabase
                    .from('ff_fabrics')
                    .select('*')
                    .eq('id', fabric_id)
                    .single();
                
                const fabricCost = fabric.price_per_yard * template.estimated_fabric_yards;
                const laborCost = template.difficulty_level === 'complex' ? 75 : 
                                 template.difficulty_level === 'moderate' ? 50 : 35;
                const estimatedPrice = Math.ceil((fabricCost + laborCost + template.base_price) / (1 - 0.55) / 5) * 5;
                
                const { data: design, error } = await supabase
                    .from('ff_custom_designs')
                    .insert({
                        user_id: userId,
                        canvas_json,
                        base_template_id: template_id,
                        primary_fabric_id: fabric_id,
                        primary_color,
                        ...customizations,
                        fabric_cost: fabricCost,
                        labor_cost: laborCost,
                        estimated_price: estimatedPrice,
                        status: 'draft'
                    })
                    .select()
                    .single();
                
                return res.json({ success: true, design_id: design.id, estimated_price: estimatedPrice });
                
            case 'list':
                const { userId: listUserId, status } = req.body;
                let query = supabase
                    .from('ff_custom_designs')
                    .select('*')
                    .eq('user_id', listUserId);
                    
                if (status) {
                    query = query.eq('status', status);
                }
                
                const { data: designs } = await query.order('created_at', { ascending: false });
                return res.json({ success: true, designs });
                
            case 'get':
                const { designId } = req.body;
                const { data: singleDesign } = await supabase
                    .from('ff_custom_designs')
                    .select('*, ff_design_templates(*), ff_fabrics(*)')
                    .eq('id', designId)
                    .single();
                return res.json({ success: true, design: singleDesign });
                
            default:
                return res.json({
                    agent: 'DesignManager',
                    actions: ['create', 'list', 'get', 'update', 'delete']
                });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
```

### File: `/api/ff/orders.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    const supabase = createClient(
        process.env.FF_SUPABASE_URL,
        process.env.FF_SUPABASE_SERVICE_KEY
    );
    
    const { action } = req.body || req.query || {};
    
    try {
        switch (action) {
            case 'create':
                const { userId, items, shippingAddress, shippingMethod } = req.body;
                
                // Get user measurements for snapshot
                const { data: measurements } = await supabase
                    .from('ff_body_measurements')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                
                // Calculate totals
                let subtotal = 0;
                for (const item of items) {
                    const { data: design } = await supabase
                        .from('ff_custom_designs')
                        .select('estimated_price')
                        .eq('id', item.design_id)
                        .single();
                    subtotal += design.estimated_price * item.quantity;
                }
                
                const shippingCost = shippingMethod === 'express' ? 25 : 12;
                const tax = subtotal * 0.08;
                const total = subtotal + shippingCost + tax;
                
                // Generate order number
                const orderNumber = `FF-${Date.now().toString(36).toUpperCase()}`;
                
                // Create order
                const { data: order, error } = await supabase
                    .from('ff_orders')
                    .insert({
                        user_id: userId,
                        order_number: orderNumber,
                        items,
                        measurements_snapshot: measurements,
                        subtotal,
                        shipping_cost: shippingCost,
                        tax,
                        total,
                        shipping_address: shippingAddress,
                        shipping_method: shippingMethod,
                        status: 'pending',
                        payment_status: 'pending'
                    })
                    .select()
                    .single();
                
                // Update design statuses
                for (const item of items) {
                    await supabase
                        .from('ff_custom_designs')
                        .update({ status: 'ordered' })
                        .eq('id', item.design_id);
                }
                
                return res.json({ 
                    success: true, 
                    order_id: order.id,
                    order_number: orderNumber,
                    total 
                });
                
            case 'route_to_manufacturer':
                // Called after payment confirmed
                const { orderId } = req.body;
                
                // Analyze order and route to best manufacturer
                const { data: orderData } = await supabase
                    .from('ff_orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();
                
                // For custom designs, route to local seamstress
                // For simple items, route to Printful
                const manufacturer = await routeToManufacturer(orderData);
                
                await supabase
                    .from('ff_orders')
                    .update({
                        manufacturer: manufacturer.name,
                        manufacturer_order_id: manufacturer.orderId,
                        status: 'in_production',
                        production_started_at: new Date().toISOString()
                    })
                    .eq('id', orderId);
                
                return res.json({ success: true, manufacturer });
                
            default:
                return res.json({
                    agent: 'OrderManager',
                    actions: ['create', 'list', 'get', 'route_to_manufacturer', 'update_status']
                });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

async function routeToManufacturer(order) {
    // Logic to select best manufacturer based on:
    // - Item complexity
    // - Fabric type
    // - Location
    // - Urgency
    // - Cost
    
    // For now, return local seamstress for custom designs
    return {
        name: 'local_seamstress',
        orderId: `LS-${Date.now()}`
    };
}
```

---

## COMPONENT 6: VIRTUAL CLOSET

### File: `/api/ff/closet.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    const supabase = createClient(
        process.env.FF_SUPABASE_URL,
        process.env.FF_SUPABASE_SERVICE_KEY
    );
    
    const { action, userId } = req.body || req.query || {};
    
    try {
        switch (action) {
            case 'get_all':
                const { data: items } = await supabase
                    .from('ff_closet_items')
                    .select('*, ff_custom_designs(*)')
                    .eq('user_id', userId)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                return res.json({ success: true, items });
                
            case 'add_external':
                // User uploads a photo of clothing they own
                const { imageBase64, name, category } = req.body;
                
                // Analyze image to extract colors, style
                const analyzedData = await analyzeClothingImage(imageBase64);
                
                const { data: newItem } = await supabase
                    .from('ff_closet_items')
                    .insert({
                        user_id: userId,
                        source: 'external',
                        name,
                        category,
                        image_url: await uploadImage(imageBase64),
                        ai_detected_colors: analyzedData.colors,
                        ai_detected_style: analyzedData.style,
                        ai_suggested_pairings: analyzedData.pairings
                    })
                    .select()
                    .single();
                    
                return res.json({ success: true, item: newItem });
                
            case 'suggest_pairings':
                const { itemId } = req.body;
                
                // Get the item
                const { data: item } = await supabase
                    .from('ff_closet_items')
                    .select('*')
                    .eq('id', itemId)
                    .single();
                
                // Find complementary items in closet
                const { data: closet } = await supabase
                    .from('ff_closet_items')
                    .select('*')
                    .eq('user_id', userId)
                    .neq('id', itemId);
                
                const suggestions = await generatePairingSuggestions(item, closet);
                return res.json({ success: true, suggestions });
                
            case 'complete_look':
                // AI suggests items to complete an outfit
                const { outfitPieces } = req.body;
                
                // Analyze what's missing
                const missing = analyzeMissingPieces(outfitPieces);
                
                // Suggest from closet or new designs
                const completions = await suggestCompletions(userId, outfitPieces, missing);
                return res.json({ success: true, completions });
                
            default:
                return res.json({
                    agent: 'VirtualCloset',
                    actions: ['get_all', 'add_external', 'suggest_pairings', 'complete_look']
                });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
```

---

## BOT INTEGRATION

### FF Bots for Style Studio:

| Bot | Purpose | Schedule |
|-----|---------|----------|
| **FF-StyleAdvisor** | Generates personalized style recommendations | On demand |
| **FF-ColorMatcher** | Matches fabrics to user color palette | On demand |
| **FF-DesignSuggester** | Suggests designs based on body type | On demand |
| **FF-OutfitBuilder** | Creates complete outfit combinations | On demand |
| **FF-ClosetOrganizer** | Analyzes and organizes virtual closet | Daily |
| **FF-TrendSpotter** | Identifies trends to inspire designs | Weekly |

---

## CRON SCHEDULE FOR FF

```javascript
// Add to cron-scheduler.js

// FF Style Studio Bots
cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] 👗 FF Closet Organizer...');
    await callEndpoint('/api/ff/closet', 'POST', { action: 'organize_all' });
});

cron.schedule('0 8 * * 1', async () => {
    console.log('[CRON] 📈 FF Trend Spotter...');
    await callEndpoint('/api/ff/trends', 'POST', { action: 'analyze' });
});

cron.schedule('0 9,15 * * *', async () => {
    console.log('[CRON] 🎨 FF Design Suggester...');
    await callEndpoint('/api/ff/suggestions', 'POST', { action: 'generate_daily' });
});
```

---

## TESTING CHECKLIST

After implementation, test each component:

```bash
# 1. Body Analysis
curl -X POST http://localhost:3000/api/ff/body-scan -H "Content-Type: application/json" -d '{"action":"status"}'

# 2. Color Analysis
curl -X POST http://localhost:3000/api/ff/color-analysis -H "Content-Type: application/json" -d '{"action":"status"}'

# 3. Designs
curl -X POST http://localhost:3000/api/ff/designs -H "Content-Type: application/json" -d '{"action":"status"}'

# 4. Orders
curl -X POST http://localhost:3000/api/ff/orders -H "Content-Type: application/json" -d '{"action":"status"}'

# 5. Closet
curl -X POST http://localhost:3000/api/ff/closet -H "Content-Type: application/json" -d '{"action":"status"}'

# 6. Fabrics
curl -X GET http://localhost:3000/api/ff/fabrics
```

---

## SUMMARY

This document provides:

1. **Complete database schema** for FF Style Studio
2. **Body Analyzer** - AI body type detection
3. **Color Analyzer** - Skin tone & color palette
4. **Design Canvas** - Interactive Fabric.js implementation
5. **3D Preview** - Three.js real-time preview
6. **API Endpoints** - All backend routes
7. **Virtual Closet** - Save & organize pieces
8. **Order System** - One-click to seamstress
9. **Bot Integration** - Automated assistance
10. **Testing Checklist** - Verify everything works

**Total: 6 major components, 12+ API endpoints, 6 bots**

No Big Tech dependencies. All self-hosted. All open source.

---

*FF AI Style Studio - Technical Implementation*
*For Claude Code Terminal*
*Build the future of personal fashion*
