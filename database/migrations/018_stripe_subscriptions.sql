/**
 * Stripe Subscription Integration
 * Migration 018: Add Stripe fields for membership subscriptions
 */

-- =====================================================
-- ADD STRIPE FIELDS TO MEMBERSHIP TIERS
-- =====================================================

ALTER TABLE ff_membership_tiers
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_monthly_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_annual_id TEXT;

-- =====================================================
-- ADD STRIPE FIELDS TO USER MEMBERSHIPS
-- =====================================================

ALTER TABLE ff_user_memberships
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly',  -- monthly, annual
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- =====================================================
-- REVENUE TRACKING TABLE
-- For Dave's Dashboard
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Transaction details
    type TEXT NOT NULL,  -- subscription, one_time, refund
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',

    -- Stripe references
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,

    -- Customer info
    customer_email TEXT,
    customer_name TEXT,

    -- Membership info (for subscriptions)
    membership_tier TEXT,
    billing_interval TEXT,

    -- Product info (for one-time purchases)
    product_ids TEXT[],
    order_id UUID,

    -- Status
    status TEXT DEFAULT 'succeeded',  -- succeeded, pending, failed, refunded

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
);

-- =====================================================
-- REVENUE SUMMARY VIEW
-- Aggregated view for dashboard
-- =====================================================

CREATE OR REPLACE VIEW ff_revenue_summary AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    SUM(CASE WHEN status = 'succeeded' THEN amount_cents ELSE 0 END) as revenue_cents,
    SUM(CASE WHEN status = 'refunded' THEN amount_cents ELSE 0 END) as refunds_cents,
    COUNT(CASE WHEN type = 'subscription' THEN 1 END) as subscription_payments,
    COUNT(CASE WHEN type = 'one_time' THEN 1 END) as one_time_payments,
    COUNT(DISTINCT customer_email) as unique_customers
FROM ff_revenue
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_revenue_created ON ff_revenue(created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON ff_revenue(type);
CREATE INDEX IF NOT EXISTS idx_revenue_status ON ff_revenue(status);
CREATE INDEX IF NOT EXISTS idx_revenue_customer ON ff_revenue(customer_email);
CREATE INDEX IF NOT EXISTS idx_revenue_stripe_sub ON ff_revenue(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_memberships_stripe_customer ON ff_user_memberships(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_stripe_sub ON ff_user_memberships(stripe_subscription_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ff_revenue IS 'All revenue transactions for Dave dashboard tracking';
COMMENT ON VIEW ff_revenue_summary IS 'Monthly revenue aggregations for $100M goal tracking';
