/**
 * Email Duplicate Prevention System
 * Tracks all sent emails and prevents duplicate sends
 *
 * Protection Rules:
 * - No duplicate emails of same type within cooldown period
 * - Invitation emails: Once per email address
 * - Welcome emails: Once per user
 * - Outreach emails: Respects contact cadence rules
 * - Transactional emails: Allowed (order confirmations, receipts)
 */

-- =====================================================
-- EMAIL SENT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS email_sent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Recipient info
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),

    -- Email details
    email_type VARCHAR(100) NOT NULL,
    -- Types: 'invitation', 'welcome', 'onboarding', 'marketing', 'outreach',
    --        'follow_up', 'proposal', 'order_confirmation', 'shipping_notification',
    --        'partner_inquiry', 'style_studio_invite'

    email_category VARCHAR(50) NOT NULL DEFAULT 'marketing',
    -- Categories: 'transactional', 'marketing', 'operational'

    subject VARCHAR(500) NOT NULL,

    -- Sender info
    sent_from VARCHAR(255), -- From email address
    sent_by VARCHAR(100), -- Bot name or 'manual' or user email

    -- Deduplication key (unique identifier for this specific email type + recipient combo)
    dedup_key VARCHAR(500) NOT NULL,
    -- Example: "invitation:user@example.com" or "welcome:user-id-123"

    -- Related entities
    related_entity_type VARCHAR(100), -- 'contact', 'lead', 'order', 'partner', etc.
    related_entity_id UUID,

    -- Delivery tracking
    message_id VARCHAR(255), -- Email provider message ID
    provider VARCHAR(50), -- 'forbes_command', 'sendgrid', 'manual'
    delivery_status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'

    -- Timestamps
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EMAIL COOLDOWN RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS email_cooldown_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email_type VARCHAR(100) NOT NULL UNIQUE,
    cooldown_hours INTEGER NOT NULL DEFAULT 24,
    -- How many hours before same email type can be sent again

    max_per_day INTEGER, -- Optional: Max emails of this type per day to same recipient
    max_per_week INTEGER, -- Optional: Max emails of this type per week
    max_per_month INTEGER, -- Optional: Max emails of this type per month

    allow_duplicates BOOLEAN DEFAULT false,
    -- If true, duplicate prevention is skipped (for transactional emails)

    category VARCHAR(50) DEFAULT 'marketing',
    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default cooldown rules
INSERT INTO email_cooldown_rules (email_type, cooldown_hours, max_per_day, max_per_week, category, allow_duplicates, description) VALUES

-- Invitations & Welcome (NEVER duplicate)
('invitation', 87600, 1, 1, 'marketing', false, 'Initial invitation to join platform - sent only once per email address'),
('invitation_reminder', 168, 1, 2, 'marketing', false, 'Reminder for pending invitation - max 2 per week'),
('welcome', 87600, 1, 1, 'operational', false, 'Welcome email after signup - sent only once per user'),
('onboarding_start', 168, 1, 1, 'operational', false, 'First onboarding email - once per week max'),
('onboarding_step', 48, 1, 3, 'operational', false, 'Onboarding sequence emails - max 3 per week'),

-- Style Studio (Maggie-only feature)
('style_studio_invite', 87600, 1, 1, 'marketing', false, 'Style Studio access invitation - once only'),
('body_scan_complete', 168, 1, 2, 'operational', false, 'Body scan results notification'),
('color_analysis_complete', 168, 1, 2, 'operational', false, 'Color analysis results notification'),
('custom_design_saved', 24, 3, 10, 'operational', false, 'Custom design saved notification'),

-- Marketing & Outreach
('marketing_campaign', 72, 1, 2, 'marketing', false, 'Marketing campaign email - max 2 per week'),
('newsletter', 168, 1, 1, 'marketing', false, 'Newsletter - max once per week'),
('product_announcement', 168, 1, 2, 'marketing', false, 'New product announcement'),
('seasonal_collection', 168, 1, 2, 'marketing', false, 'Seasonal collection launch'),

-- Lead Nurturing (Before they become clients)
('initial_outreach', 168, 1, 1, 'marketing', false, 'First contact with lead - once per week'),
('follow_up_1', 72, 1, 2, 'marketing', false, 'First follow-up email'),
('follow_up_2', 96, 1, 1, 'marketing', false, 'Second follow-up email'),
('follow_up_3', 168, 1, 1, 'marketing', false, 'Third follow-up email'),
('consultation_invite', 168, 1, 2, 'marketing', false, 'Invitation to consultation'),

-- Partner Outreach
('partner_inquiry', 168, 1, 1, 'marketing', false, 'Initial partner inquiry'),
('partner_follow_up', 120, 1, 2, 'marketing', false, 'Partner follow-up email'),

-- Proposals & Quotes
('proposal_sent', 48, 1, 3, 'operational', false, 'Proposal sent notification'),
('proposal_reminder', 96, 1, 2, 'operational', false, 'Proposal follow-up reminder'),
('quote_sent', 48, 1, 3, 'operational', false, 'Price quote sent'),

-- Transactional (Allow duplicates if needed)
('order_confirmation', 1, 10, NULL, 'transactional', true, 'Order confirmation - allow duplicates'),
('shipping_notification', 1, 10, NULL, 'transactional', true, 'Shipping notification'),
('delivery_confirmation', 1, 10, NULL, 'transactional', true, 'Delivery confirmation'),
('receipt', 1, 10, NULL, 'transactional', true, 'Payment receipt'),
('password_reset', 1, 5, NULL, 'transactional', true, 'Password reset link'),
('account_verification', 1, 3, NULL, 'transactional', true, 'Email verification'),

-- Support & Service
('support_response', 1, 20, NULL, 'operational', true, 'Support ticket response - allow multiples'),
('support_resolution', 24, 3, NULL, 'operational', false, 'Support issue resolved notification'),

-- Abandoned Cart & Re-engagement
('cart_abandoned', 24, 1, 2, 'marketing', false, 'Abandoned cart reminder'),
('win_back', 168, 1, 1, 'marketing', false, 'Win-back email for inactive users'),
('re_engagement', 336, 1, 1, 'marketing', false, 'Re-engagement campaign')

ON CONFLICT (email_type) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_email_log_recipient ON email_sent_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_sent_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_dedup ON email_sent_log(dedup_key);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_sent_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_tenant ON email_sent_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_log_related_entity ON email_sent_log(related_entity_type, related_entity_id);

-- Composite index for duplicate checking
CREATE INDEX IF NOT EXISTS idx_email_log_duplicate_check
ON email_sent_log(recipient_email, email_type, sent_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if email can be sent (duplicate prevention)
CREATE OR REPLACE FUNCTION can_send_email(
    p_recipient_email VARCHAR(255),
    p_email_type VARCHAR(100),
    p_dedup_key VARCHAR(500)
) RETURNS BOOLEAN AS $$
DECLARE
    v_cooldown_hours INTEGER;
    v_allow_duplicates BOOLEAN;
    v_max_per_day INTEGER;
    v_last_sent TIMESTAMPTZ;
    v_sent_today INTEGER;
BEGIN
    -- Get cooldown rules for this email type
    SELECT cooldown_hours, allow_duplicates, max_per_day
    INTO v_cooldown_hours, v_allow_duplicates, v_max_per_day
    FROM email_cooldown_rules
    WHERE email_type = p_email_type;

    -- If no rule found, use default 24 hour cooldown
    IF NOT FOUND THEN
        v_cooldown_hours := 24;
        v_allow_duplicates := false;
        v_max_per_day := NULL;
    END IF;

    -- If duplicates are allowed (transactional emails), always allow
    IF v_allow_duplicates THEN
        RETURN TRUE;
    END IF;

    -- Check for exact duplicate by dedup_key
    SELECT sent_at INTO v_last_sent
    FROM email_sent_log
    WHERE dedup_key = p_dedup_key
    ORDER BY sent_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- Check if outside cooldown period
        IF v_last_sent + (v_cooldown_hours || ' hours')::INTERVAL > NOW() THEN
            -- Still in cooldown period
            RETURN FALSE;
        END IF;
    END IF;

    -- Check daily limit if specified
    IF v_max_per_day IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_sent_today
        FROM email_sent_log
        WHERE recipient_email = p_recipient_email
          AND email_type = p_email_type
          AND sent_at >= DATE_TRUNC('day', NOW());

        IF v_sent_today >= v_max_per_day THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- All checks passed
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View for recent email activity
CREATE OR REPLACE VIEW recent_email_activity AS
SELECT
    recipient_email,
    email_type,
    subject,
    sent_from,
    sent_by,
    delivery_status,
    sent_at,
    EXTRACT(EPOCH FROM (NOW() - sent_at)) / 3600 AS hours_since_sent
FROM email_sent_log
WHERE sent_at >= NOW() - INTERVAL '7 days'
ORDER BY sent_at DESC;

-- View for email volume by type
CREATE OR REPLACE VIEW email_volume_by_type AS
SELECT
    email_type,
    COUNT(*) as total_sent,
    COUNT(DISTINCT recipient_email) as unique_recipients,
    MAX(sent_at) as last_sent,
    COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '24 hours') as sent_last_24h,
    COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '7 days') as sent_last_7d
FROM email_sent_log
GROUP BY email_type
ORDER BY total_sent DESC;

-- View for recipients receiving too many emails
CREATE OR REPLACE VIEW high_email_recipients AS
SELECT
    recipient_email,
    COUNT(*) as emails_last_7d,
    COUNT(DISTINCT email_type) as unique_email_types,
    MAX(sent_at) as last_email_sent,
    ARRAY_AGG(DISTINCT email_type) as email_types_received
FROM email_sent_log
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY recipient_email
HAVING COUNT(*) > 5
ORDER BY emails_last_7d DESC;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON email_sent_log TO postgres;
GRANT ALL ON email_cooldown_rules TO postgres;
