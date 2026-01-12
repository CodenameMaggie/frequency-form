/**
 * FF Manufacturers & Seamstresses Table
 * Stores custom clothing makers for Style Studio order fulfillment
 *
 * Manufacturer Types:
 * - seamstress: Single piece custom makers
 * - production_facility: Small batch 10-100 pieces
 * - pattern_maker: Create patterns from design specs
 */

-- =====================================================
-- MANUFACTURERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Business info
    business_name VARCHAR(255) NOT NULL,
    manufacturer_type VARCHAR(50) NOT NULL, -- 'seamstress', 'production_facility', 'pattern_maker'

    -- Location
    location VARCHAR(255), -- "Portland, OR, USA" or "Barcelona, Spain"
    country VARCHAR(100),
    city VARCHAR(100),
    state_province VARCHAR(100),

    -- Specialization
    specialty TEXT[], -- ['dresses', 'blouses', 'pants', 'outerwear', 'menswear']
    natural_fiber_experience BOOLEAN DEFAULT false,
    fibers_experienced TEXT[], -- ['linen', 'wool', 'silk', 'organic_cotton', 'hemp']

    -- Capabilities
    order_capacity VARCHAR(50), -- 'single_piece', 'small_batch_10_50', 'medium_batch_50_100', 'large_batch_100_plus'
    min_order_quantity INTEGER DEFAULT 1,
    turnaround_days INTEGER, -- Typical production time in days

    -- Pricing
    price_range VARCHAR(100), -- "$150-$400 per piece" or "$80-$250 per piece (10+ qty)"
    pricing_structure JSONB, -- Detailed pricing by garment type
    -- Example: {
    --   "simple_top": {"single": 180, "batch_10": 120, "batch_50": 95},
    --   "dress": {"single": 280, "batch_10": 200, "batch_50": 165},
    --   "pants": {"single": 220, "batch_10": 165, "batch_50": 140}
    -- }

    -- Contact info
    website VARCHAR(500),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    etsy_shop VARCHAR(255),
    instagram_handle VARCHAR(255),
    portfolio_url VARCHAR(500),

    -- Requirements
    accepts_tech_packs BOOLEAN DEFAULT true, -- Can work from technical design specs
    requires_samples BOOLEAN DEFAULT false, -- Needs physical samples to work from
    accepts_digital_patterns BOOLEAN DEFAULT true,
    minimum_lead_time_days INTEGER DEFAULT 14,

    -- Quality & Vetting
    status VARCHAR(50) DEFAULT 'prospect', -- 'prospect', 'vetting', 'test_order', 'approved', 'active', 'inactive'
    quality_rating DECIMAL(3,2), -- 0.00 to 5.00 based on test orders
    communication_rating DECIMAL(3,2), -- 0.00 to 5.00
    on_time_delivery_rate DECIMAL(3,2), -- 0.00 to 1.00 (percentage as decimal)

    -- Test order tracking
    test_order_placed DATE,
    test_order_completed DATE,
    test_order_notes TEXT,

    -- Active use
    total_orders_placed INTEGER DEFAULT 0,
    total_garments_produced INTEGER DEFAULT 0,
    first_order_date DATE,
    last_order_date DATE,
    average_actual_turnaround_days DECIMAL(5,2),

    -- Payment terms
    payment_terms VARCHAR(100), -- '50% upfront, 50% on completion', 'Net 30', etc.
    accepts_credit_card BOOLEAN DEFAULT false,
    accepts_paypal BOOLEAN DEFAULT false,
    accepts_wire_transfer BOOLEAN DEFAULT false,

    -- Internal notes
    notes TEXT,
    discovery_source VARCHAR(100), -- 'ai_web_search', 'referral', 'manual_add', 'etsy', 'instagram'
    assigned_contact_person VARCHAR(255), -- Who at F&F manages this relationship

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, business_name)
);

-- =====================================================
-- UPDATE ORDERS TABLE
-- =====================================================

-- Add manufacturer_id foreign key to ff_orders
ALTER TABLE ff_orders
ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES ff_manufacturers(id);

-- Add fulfillment tracking fields
ALTER TABLE ff_orders
ADD COLUMN IF NOT EXISTS tech_pack_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tech_pack_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fabric_shipped_to_maker_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS production_photos JSONB; -- Progress photos from maker

-- =====================================================
-- MANUFACTURER ORDER HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_manufacturer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    manufacturer_id UUID REFERENCES ff_manufacturers(id),
    order_id UUID REFERENCES ff_orders(id),

    -- Order details
    garment_type VARCHAR(100), -- 'dress', 'blouse', 'pants', etc.
    quantity INTEGER DEFAULT 1,
    design_complexity VARCHAR(50), -- 'simple', 'moderate', 'complex'

    -- Pricing
    quoted_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),

    -- Timeline
    order_placed_at TIMESTAMPTZ,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    turnaround_days INTEGER, -- Actual days taken

    -- Quality tracking
    quality_rating DECIMAL(3,2), -- 0.00 to 5.00 for this specific order
    quality_issues TEXT,
    revisions_needed INTEGER DEFAULT 0,

    -- Communication
    communication_quality DECIMAL(3,2), -- 0.00 to 5.00
    response_time_hours DECIMAL(5,1), -- Average response time

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_production', 'completed', 'shipped', 'delivered', 'cancelled'

    -- Notes
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_manufacturers_tenant ON ff_manufacturers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_manufacturers_type ON ff_manufacturers(manufacturer_type);
CREATE INDEX IF NOT EXISTS idx_manufacturers_status ON ff_manufacturers(status);
CREATE INDEX IF NOT EXISTS idx_manufacturers_location ON ff_manufacturers(location);
CREATE INDEX IF NOT EXISTS idx_manufacturers_capacity ON ff_manufacturers(order_capacity);
CREATE INDEX IF NOT EXISTS idx_manufacturers_quality ON ff_manufacturers(quality_rating) WHERE quality_rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_manufacturer ON ff_orders(manufacturer_id);

CREATE INDEX IF NOT EXISTS idx_manufacturer_orders_tenant ON ff_manufacturer_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_orders_manufacturer ON ff_manufacturer_orders(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_orders_order ON ff_manufacturer_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_orders_status ON ff_manufacturer_orders(status);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ff_manufacturers TO postgres;
GRANT ALL ON ff_manufacturer_orders TO postgres;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert a few sample manufacturers to demonstrate the system
INSERT INTO ff_manufacturers (
    tenant_id,
    business_name,
    manufacturer_type,
    location,
    specialty,
    natural_fiber_experience,
    fibers_experienced,
    order_capacity,
    turnaround_days,
    price_range,
    status,
    notes
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Portland Linen Co. (Sample)',
    'seamstress',
    'Portland, OR, USA',
    ARRAY['dresses', 'blouses', 'pants'],
    true,
    ARRAY['linen', 'organic_cotton', 'hemp'],
    'single_piece',
    21,
    '$180-$350 per piece',
    'prospect',
    'Sample manufacturer - Replace with real discoveries from Henry bot'
),
(
    '00000000-0000-0000-0000-000000000001',
    'Artisan Garment Workshop (Sample)',
    'production_facility',
    'Los Angeles, CA, USA',
    ARRAY['dresses', 'outerwear', 'blouses'],
    true,
    ARRAY['linen', 'wool', 'silk'],
    'small_batch_10_50',
    28,
    '$95-$220 per piece (10+ qty)',
    'prospect',
    'Sample manufacturer - Small batch specialist for volume orders'
),
(
    '00000000-0000-0000-0000-000000000001',
    'Modern Pattern Studio (Sample)',
    'pattern_maker',
    'Brooklyn, NY, USA',
    ARRAY['all_garment_types'],
    true,
    ARRAY['linen', 'wool', 'silk', 'organic_cotton'],
    'pattern_service',
    10,
    '$250-$500 per pattern set',
    'prospect',
    'Sample pattern maker - Can create graded patterns from F&F design specs'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View for approved, active manufacturers
CREATE OR REPLACE VIEW ff_active_manufacturers AS
SELECT
    m.*,
    COALESCE(COUNT(mo.id), 0) as total_orders,
    AVG(mo.quality_rating) as avg_quality,
    AVG(mo.turnaround_days) as avg_turnaround
FROM ff_manufacturers m
LEFT JOIN ff_manufacturer_orders mo ON m.id = mo.manufacturer_id
WHERE m.status IN ('approved', 'active')
GROUP BY m.id;

-- View for manufacturer performance metrics
CREATE OR REPLACE VIEW ff_manufacturer_performance AS
SELECT
    m.id,
    m.business_name,
    m.manufacturer_type,
    m.location,
    COUNT(mo.id) as total_orders,
    AVG(mo.quality_rating) as avg_quality_rating,
    AVG(mo.communication_quality) as avg_communication_rating,
    AVG(mo.turnaround_days) as avg_turnaround_days,
    SUM(CASE WHEN mo.revisions_needed > 0 THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(mo.id), 0) as revision_rate,
    SUM(CASE WHEN mo.actual_completion_date <= mo.estimated_completion_date THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(mo.id), 0) as on_time_rate
FROM ff_manufacturers m
LEFT JOIN ff_manufacturer_orders mo ON m.id = mo.manufacturer_id
GROUP BY m.id, m.business_name, m.manufacturer_type, m.location;
