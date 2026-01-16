/**
 * FF AI Usage Tracking & Budget System
 * Migration 016: Member-based AI budget allocation and tracking
 *
 * "Behind the scenes" AI for matching and styling - budget tied to membership tier
 */

-- =====================================================
-- UPDATE MEMBERSHIP TIERS WITH AI BUDGETS
-- =====================================================

-- Add AI budget columns to membership tiers
ALTER TABLE ff_membership_tiers
ADD COLUMN IF NOT EXISTS ai_calls_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_body_scans_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_color_analyses_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_style_recommendations_monthly INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_cost_budget_cents INTEGER DEFAULT 0;

-- Update tier budgets
-- Aligned (Free): Limited AI access
-- Elevated ($29/mo): Basic AI styling
-- Sovereign ($149/mo): Full AI access

UPDATE ff_membership_tiers SET
    ai_calls_monthly = 5,
    ai_body_scans_monthly = 1,
    ai_color_analyses_monthly = 1,
    ai_style_recommendations_monthly = 3,
    ai_cost_budget_cents = 50  -- $0.50 in AI costs
WHERE slug = 'aligned';

UPDATE ff_membership_tiers SET
    ai_calls_monthly = 25,
    ai_body_scans_monthly = 3,
    ai_color_analyses_monthly = 3,
    ai_style_recommendations_monthly = 20,
    ai_cost_budget_cents = 500  -- $5 in AI costs
WHERE slug = 'elevated';

UPDATE ff_membership_tiers SET
    ai_calls_monthly = 100,
    ai_body_scans_monthly = 10,
    ai_color_analyses_monthly = 10,
    ai_style_recommendations_monthly = 80,
    ai_cost_budget_cents = 2500  -- $25 in AI costs
WHERE slug = 'sovereign';

-- =====================================================
-- AI USAGE TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User identification
    user_id UUID REFERENCES ff_user_profiles(id),
    email TEXT,
    session_id TEXT,
    membership_tier TEXT,

    -- API call details
    feature_type TEXT NOT NULL,  -- 'body_scan', 'color_analysis', 'style_recommendation', 'outfit_match'
    api_provider TEXT DEFAULT 'anthropic',  -- For future multi-provider support
    model_used TEXT,

    -- Token tracking
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,

    -- Cost tracking (in cents)
    cost_cents INTEGER DEFAULT 0,

    -- Request metadata
    request_duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MONTHLY USAGE AGGREGATION TABLE
-- For quick budget checks without scanning all usage records
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_ai_usage_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User identification
    user_id UUID REFERENCES ff_user_profiles(id),
    email TEXT NOT NULL,

    -- Billing period
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,

    -- Aggregated usage counts
    total_ai_calls INTEGER DEFAULT 0,
    body_scan_calls INTEGER DEFAULT 0,
    color_analysis_calls INTEGER DEFAULT 0,
    style_recommendation_calls INTEGER DEFAULT 0,
    outfit_match_calls INTEGER DEFAULT 0,

    -- Token totals
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,

    -- Cost totals (in cents)
    total_cost_cents INTEGER DEFAULT 0,

    -- Budget status
    budget_exhausted BOOLEAN DEFAULT false,
    budget_warning_sent BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint for one record per user per month
    UNIQUE(email, year, month)
);

-- =====================================================
-- HELPER FUNCTION: Check AI Budget
-- Returns remaining budget and whether user can make call
-- =====================================================

CREATE OR REPLACE FUNCTION check_ai_budget(
    p_email TEXT,
    p_feature_type TEXT
) RETURNS TABLE(
    can_proceed BOOLEAN,
    remaining_calls INTEGER,
    tier_name TEXT,
    message TEXT
) AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM NOW());
    v_month INTEGER := EXTRACT(MONTH FROM NOW());
    v_tier_slug TEXT;
    v_tier_limit INTEGER;
    v_current_usage INTEGER;
BEGIN
    -- Get user's membership tier
    SELECT t.slug INTO v_tier_slug
    FROM ff_user_memberships m
    JOIN ff_membership_tiers t ON m.tier_id = t.id
    WHERE m.email = p_email AND m.status = 'active'
    LIMIT 1;

    -- Default to 'aligned' (free) if no membership found
    IF v_tier_slug IS NULL THEN
        v_tier_slug := 'aligned';
    END IF;

    -- Get tier limit for this feature
    SELECT
        CASE p_feature_type
            WHEN 'body_scan' THEN ai_body_scans_monthly
            WHEN 'color_analysis' THEN ai_color_analyses_monthly
            WHEN 'style_recommendation' THEN ai_style_recommendations_monthly
            ELSE ai_calls_monthly
        END INTO v_tier_limit
    FROM ff_membership_tiers
    WHERE slug = v_tier_slug;

    -- Get current month's usage
    SELECT
        CASE p_feature_type
            WHEN 'body_scan' THEN body_scan_calls
            WHEN 'color_analysis' THEN color_analysis_calls
            WHEN 'style_recommendation' THEN style_recommendation_calls
            ELSE total_ai_calls
        END INTO v_current_usage
    FROM ff_ai_usage_monthly
    WHERE email = p_email AND year = v_year AND month = v_month;

    -- Default to 0 if no usage record exists
    IF v_current_usage IS NULL THEN
        v_current_usage := 0;
    END IF;

    -- Return results
    RETURN QUERY SELECT
        v_current_usage < v_tier_limit AS can_proceed,
        v_tier_limit - v_current_usage AS remaining_calls,
        v_tier_slug AS tier_name,
        CASE
            WHEN v_current_usage >= v_tier_limit THEN
                'AI budget exhausted for this month. Upgrade to continue.'
            WHEN v_current_usage >= (v_tier_limit * 0.8) THEN
                'Approaching AI budget limit. Consider upgrading.'
            ELSE
                'OK'
        END AS message;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER FUNCTION: Record AI Usage
-- Call after each AI API call to track usage
-- =====================================================

CREATE OR REPLACE FUNCTION record_ai_usage(
    p_user_id UUID,
    p_email TEXT,
    p_session_id TEXT,
    p_feature_type TEXT,
    p_model TEXT,
    p_input_tokens INTEGER,
    p_output_tokens INTEGER,
    p_cost_cents INTEGER,
    p_duration_ms INTEGER,
    p_success BOOLEAN,
    p_error TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM NOW());
    v_month INTEGER := EXTRACT(MONTH FROM NOW());
    v_tier_slug TEXT;
BEGIN
    -- Get membership tier
    SELECT t.slug INTO v_tier_slug
    FROM ff_user_memberships m
    JOIN ff_membership_tiers t ON m.tier_id = t.id
    WHERE m.email = p_email AND m.status = 'active'
    LIMIT 1;

    IF v_tier_slug IS NULL THEN
        v_tier_slug := 'aligned';
    END IF;

    -- Insert detailed usage record
    INSERT INTO ff_ai_usage (
        user_id, email, session_id, membership_tier, feature_type,
        model_used, input_tokens, output_tokens, total_tokens,
        cost_cents, request_duration_ms, success, error_message
    ) VALUES (
        p_user_id, p_email, p_session_id, v_tier_slug, p_feature_type,
        p_model, p_input_tokens, p_output_tokens, p_input_tokens + p_output_tokens,
        p_cost_cents, p_duration_ms, p_success, p_error
    );

    -- Update or insert monthly aggregation
    INSERT INTO ff_ai_usage_monthly (
        user_id, email, year, month,
        total_ai_calls, body_scan_calls, color_analysis_calls,
        style_recommendation_calls, outfit_match_calls,
        total_input_tokens, total_output_tokens, total_cost_cents
    ) VALUES (
        p_user_id, p_email, v_year, v_month,
        1,
        CASE WHEN p_feature_type = 'body_scan' THEN 1 ELSE 0 END,
        CASE WHEN p_feature_type = 'color_analysis' THEN 1 ELSE 0 END,
        CASE WHEN p_feature_type = 'style_recommendation' THEN 1 ELSE 0 END,
        CASE WHEN p_feature_type = 'outfit_match' THEN 1 ELSE 0 END,
        p_input_tokens, p_output_tokens, p_cost_cents
    )
    ON CONFLICT (email, year, month) DO UPDATE SET
        total_ai_calls = ff_ai_usage_monthly.total_ai_calls + 1,
        body_scan_calls = ff_ai_usage_monthly.body_scan_calls +
            CASE WHEN p_feature_type = 'body_scan' THEN 1 ELSE 0 END,
        color_analysis_calls = ff_ai_usage_monthly.color_analysis_calls +
            CASE WHEN p_feature_type = 'color_analysis' THEN 1 ELSE 0 END,
        style_recommendation_calls = ff_ai_usage_monthly.style_recommendation_calls +
            CASE WHEN p_feature_type = 'style_recommendation' THEN 1 ELSE 0 END,
        outfit_match_calls = ff_ai_usage_monthly.outfit_match_calls +
            CASE WHEN p_feature_type = 'outfit_match' THEN 1 ELSE 0 END,
        total_input_tokens = ff_ai_usage_monthly.total_input_tokens + p_input_tokens,
        total_output_tokens = ff_ai_usage_monthly.total_output_tokens + p_output_tokens,
        total_cost_cents = ff_ai_usage_monthly.total_cost_cents + p_cost_cents,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ff_ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_email ON ff_ai_usage(email);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ff_ai_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ff_ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_email ON ff_ai_usage_monthly(email);
CREATE INDEX IF NOT EXISTS idx_ai_usage_monthly_period ON ff_ai_usage_monthly(year, month);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ff_ai_usage IS 'Detailed log of every AI API call made by users';
COMMENT ON TABLE ff_ai_usage_monthly IS 'Monthly aggregated AI usage for quick budget checks';
COMMENT ON FUNCTION check_ai_budget IS 'Check if user has remaining AI budget for a feature';
COMMENT ON FUNCTION record_ai_usage IS 'Record AI API usage and update monthly aggregation';
