/**
 * FF Lookbook System - Database Schema
 * Migration 013: Interactive Lookbooks with Tracking & AI Personalization
 */

-- =====================================================
-- MEMBERSHIP TIERS (Costco TNT style)
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_membership_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly INTEGER DEFAULT 0,
    price_annual INTEGER DEFAULT 0,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ff_membership_tiers (name, slug, description, price_monthly, price_annual, features) VALUES
('Aligned', 'aligned', 'Free access to shop and public lookbooks', 0, 0,
 '{"public_lookbooks": true, "shop_access": true, "personalized_lookbooks": false, "style_studio_full": false, "supplier_tools": false}'::jsonb),
('Elevated', 'elevated', 'Member access with Style Studio basics', 2900, 29000,
 '{"public_lookbooks": true, "shop_access": true, "personalized_lookbooks": false, "style_studio_full": false, "supplier_tools": false, "early_access": true}'::jsonb),
('Sovereign', 'sovereign', 'VIP access with personalized AI styling', 14900, 149000,
 '{"public_lookbooks": true, "shop_access": true, "personalized_lookbooks": true, "style_studio_full": true, "supplier_tools": false, "early_access": true, "ai_stylist": true, "personal_lookbooks": true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- USER MEMBERSHIPS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),
    email TEXT NOT NULL,
    tier_id UUID REFERENCES ff_membership_tiers(id),
    status TEXT DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    total_spend INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOOKBOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_lookbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    season TEXT NOT NULL,
    year INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'public',
    tier_required TEXT DEFAULT 'aligned',
    cover_image_url TEXT,
    description TEXT,
    total_pages INTEGER DEFAULT 0,
    products_featured UUID[],
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    pinterest_board_id TEXT,
    total_views INTEGER DEFAULT 0,
    total_unique_views INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    total_add_to_carts INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    revenue_generated INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOOKBOOK PAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_lookbook_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lookbook_id UUID REFERENCES ff_lookbooks(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    page_type TEXT NOT NULL,
    layout TEXT DEFAULT 'full',
    background_color TEXT DEFAULT '#faf9f7',
    background_image_url TEXT,
    headline TEXT,
    subheadline TEXT,
    body_text TEXT,
    products JSONB,
    interactive_elements JSONB,
    cta_text TEXT,
    cta_link TEXT,
    pinterest_pin_id TEXT,
    views INTEGER DEFAULT 0,
    interactions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRACKING: LOOKBOOK VIEWS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_lookbook_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lookbook_id UUID REFERENCES ff_lookbooks(id),
    user_id UUID,
    session_id TEXT,
    email TEXT,
    source TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT,
    browser TEXT,
    ip_address TEXT,
    country TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRACKING: PAGE INTERACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_lookbook_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lookbook_id UUID REFERENCES ff_lookbooks(id),
    page_id UUID REFERENCES ff_lookbook_pages(id),
    user_id UUID,
    session_id TEXT,
    interaction_type TEXT NOT NULL,
    product_id UUID,
    element_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interaction types: 'page_view', 'product_click', 'add_to_cart', 'hotspot_click',
-- 'video_play', 'quiz_answer', 'share', 'save', 'swipe', 'zoom'

-- =====================================================
-- TRACKING: EMAIL OPENS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_lookbook_email_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lookbook_id UUID REFERENCES ff_lookbooks(id),
    email TEXT NOT NULL,
    user_id UUID,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    device_type TEXT,
    email_client TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI PERSONALIZATION: USER PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_user_ai_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),
    email TEXT,

    -- From Style Studio
    body_type TEXT,
    color_season TEXT,
    color_palette JSONB,
    size_preferences JSONB,

    -- Learned from behavior
    preferred_price_range JSONB,
    favorite_fabrics TEXT[],
    favorite_colors TEXT[],
    style_archetypes TEXT[],
    brands_liked TEXT[],
    brands_disliked TEXT[],

    -- Interaction history
    products_viewed UUID[],
    products_carted UUID[],
    products_purchased UUID[],
    products_saved UUID[],

    -- AI Insights
    predicted_interests JSONB,
    next_purchase_prediction JSONB,
    style_confidence_score DECIMAL(3,2),
    engagement_score DECIMAL(3,2),

    -- Personalization settings
    email_frequency TEXT DEFAULT 'weekly',
    lookbook_style TEXT DEFAULT 'editorial',
    show_prices BOOLEAN DEFAULT true,

    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERSONALIZED LOOKBOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_personalized_lookbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES ff_user_profiles(id),
    base_lookbook_id UUID REFERENCES ff_lookbooks(id),
    season TEXT NOT NULL,

    -- Personalized content
    personalized_products JSONB,
    personalized_colors JSONB,
    personalized_message TEXT,
    ai_recommendations JSONB,

    -- User's color palette applied
    color_palette_applied BOOLEAN DEFAULT false,

    -- Tracking
    viewed BOOLEAN DEFAULT false,
    viewed_at TIMESTAMPTZ,
    interactions INTEGER DEFAULT 0,
    products_added_to_cart UUID[],

    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- =====================================================
-- SUPPLIER LOOKBOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_supplier_lookbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID,
    supplier_name TEXT NOT NULL,
    season TEXT NOT NULL,
    year INTEGER NOT NULL,

    -- Performance data
    products_featured UUID[],
    total_views INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    top_performers JSONB,

    -- Social media kit
    social_kit_enabled BOOLEAN DEFAULT true,
    approved_images JSONB,
    brand_guidelines JSONB,
    hashtags TEXT[],

    -- Tracking supplier downloads
    kit_downloads INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,

    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SOCIAL MEDIA KIT ASSETS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_social_media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_lookbook_id UUID REFERENCES ff_supplier_lookbooks(id),
    product_id UUID,

    -- Asset info
    asset_type TEXT NOT NULL,
    platform TEXT NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,

    -- Dimensions
    width INTEGER,
    height INTEGER,

    -- Caption/copy
    suggested_caption TEXT,
    hashtags TEXT[],

    -- Approval
    approved BOOLEAN DEFAULT false,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,

    -- Tracking
    download_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to increment lookbook views
CREATE OR REPLACE FUNCTION increment_lookbook_views(lookbook_slug TEXT)
RETURNS void AS $$
BEGIN
    UPDATE ff_lookbooks
    SET total_views = total_views + 1,
        updated_at = NOW()
    WHERE slug = lookbook_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to increment lookbook cart additions
CREATE OR REPLACE FUNCTION increment_lookbook_carts(lookbook_slug TEXT)
RETURNS void AS $$
BEGIN
    UPDATE ff_lookbooks
    SET total_add_to_carts = total_add_to_carts + 1,
        total_interactions = total_interactions + 1,
        updated_at = NOW()
    WHERE slug = lookbook_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lookbooks_season ON ff_lookbooks(season, year);
CREATE INDEX IF NOT EXISTS idx_lookbooks_status ON ff_lookbooks(status);
CREATE INDEX IF NOT EXISTS idx_lookbook_views_lookbook ON ff_lookbook_views(lookbook_id);
CREATE INDEX IF NOT EXISTS idx_lookbook_views_user ON ff_lookbook_views(user_id);
CREATE INDEX IF NOT EXISTS idx_lookbook_views_session ON ff_lookbook_views(session_id);
CREATE INDEX IF NOT EXISTS idx_lookbook_interactions_type ON ff_lookbook_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_lookbook_interactions_session ON ff_lookbook_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_profile_user ON ff_user_ai_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_profile_email ON ff_user_ai_profile(email);
CREATE INDEX IF NOT EXISTS idx_personalized_lookbooks_user ON ff_personalized_lookbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_email ON ff_lookbook_email_tracking(email);
CREATE INDEX IF NOT EXISTS idx_email_tracking_lookbook ON ff_lookbook_email_tracking(lookbook_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON ff_user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON ff_user_memberships(email);

-- =====================================================
-- INSERT INITIAL LOOKBOOK
-- =====================================================

INSERT INTO ff_lookbooks (slug, title, subtitle, season, year, type, tier_required, status, total_pages)
VALUES ('spring-2026', 'Spring 2026', 'Investment Pieces', 'spring', 2026, 'public', 'aligned', 'published', 7)
ON CONFLICT (slug) DO NOTHING;
