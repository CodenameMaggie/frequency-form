-- ============================================================================
-- FREQUENCY & FORM - BOT SYSTEM DATABASE SCHEMA
-- Version: 1.0
-- Created: January 5, 2026
-- Business Code: FF
-- ============================================================================

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_code VARCHAR(10) NOT NULL UNIQUE DEFAULT 'FF',
    business_name VARCHAR(255) NOT NULL DEFAULT 'Frequency & Form',
    domain VARCHAR(255) NOT NULL DEFAULT 'frequencyandform.com',

    -- Mainframe connection
    mainframe_url VARCHAR(500) DEFAULT 'https://command.maggieforbesstrategies.com',
    mainframe_api_key VARCHAR(255),
    sync_enabled BOOLEAN DEFAULT TRUE,

    -- Business settings
    timezone VARCHAR(50) DEFAULT 'America/Denver',
    business_hours_start INTEGER DEFAULT 9,
    business_hours_end INTEGER DEFAULT 17,
    weekend_operations BOOLEAN DEFAULT FALSE,

    -- Admin email (NEVER MODIFY)
    admin_email VARCHAR(255) DEFAULT 'maggie@maggieforbesstrategies.com',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO system_config (business_code, business_name, domain) VALUES
('FF', 'Frequency & Form', 'frequencyandform.com')
ON CONFLICT (business_code) DO NOTHING;

-- ============================================================================
-- TENANTS (Multi-tenant support - for future expansion)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tenant
INSERT INTO tenants (id, name, status) VALUES
('00000000-0000-0000-0000-000000000001', 'Frequency & Form', 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- USERS (Customers & Admin)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Identity
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),

    -- Authentication
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50) DEFAULT 'email',

    -- Role & Access
    role VARCHAR(50) DEFAULT 'customer',
    permissions JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(50) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,

    -- Styling preferences (FF-specific)
    fabric_preferences JSONB DEFAULT '{}',
    size_preferences JSONB DEFAULT '{}',
    color_preferences JSONB DEFAULT '{}',
    style_profile JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTACTS (Leads & Prospects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Identity
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),

    -- Source tracking
    source VARCHAR(100),
    source_detail VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- Qualification
    status VARCHAR(50) DEFAULT 'new',
    lead_score INTEGER DEFAULT 0,
    qualified BOOLEAN DEFAULT FALSE,
    qualified_at TIMESTAMPTZ,

    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_bot VARCHAR(50) DEFAULT 'annie',

    -- Email compliance
    do_not_contact BOOLEAN DEFAULT FALSE,
    email_status VARCHAR(50) DEFAULT 'valid',
    unsubscribed_at TIMESTAMPTZ,

    -- Engagement
    last_contact_date TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    total_interactions INTEGER DEFAULT 0,

    -- Tags & Notes
    tags TEXT[] DEFAULT '{}',
    notes TEXT,

    -- Mainframe sync
    synced_to_mainframe BOOLEAN DEFAULT FALSE,
    mainframe_contact_id UUID,
    last_synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, email)
);

-- ============================================================================
-- EMAIL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Email details
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body_html TEXT,
    body_text TEXT,

    -- Bot attribution
    sent_by_bot VARCHAR(50),

    -- Status
    status VARCHAR(50) DEFAULT 'sent',

    -- Provider tracking
    provider VARCHAR(50) DEFAULT 'resend',
    provider_message_id VARCHAR(255),

    -- Engagement
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    complained_at TIMESTAMPTZ,

    -- Threading
    thread_id VARCHAR(255),
    in_reply_to VARCHAR(255),

    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_inbound (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Received at
    to_email VARCHAR(255) NOT NULL,

    -- Sender
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),

    -- Content
    subject VARCHAR(500),
    body_html TEXT,
    body_text TEXT,

    -- Provider metadata
    provider VARCHAR(50) DEFAULT 'resend',
    provider_message_id VARCHAR(255),

    -- Processing
    status VARCHAR(50) DEFAULT 'received',
    classification VARCHAR(100),
    routed_to_bot VARCHAR(50),
    processed_at TIMESTAMPTZ,
    response_sent BOOLEAN DEFAULT FALSE,

    -- Related records
    contact_id UUID REFERENCES contacts(id),
    original_email_id UUID REFERENCES emails(id),

    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BOT OPERATIONS TABLES
-- ============================================================================

-- Bot actions log (ALL bot activity)
CREATE TABLE IF NOT EXISTS bot_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Bot identification
    bot_name VARCHAR(50) NOT NULL,

    -- Action details
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'completed',

    -- Related entities
    contact_id UUID REFERENCES contacts(id),
    user_id UUID REFERENCES users(id),
    order_id UUID,
    email_id UUID REFERENCES emails(id),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Error tracking
    error_message TEXT,

    -- Mainframe sync
    synced_to_mainframe BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI governance rules
CREATE TABLE IF NOT EXISTS ai_governance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Rule definition
    rule_name VARCHAR(255) NOT NULL,
    bot_name VARCHAR(50),
    action_type VARCHAR(100),

    -- Limits
    daily_limit INTEGER,
    hourly_limit INTEGER,

    -- Action
    action VARCHAR(50) DEFAULT 'auto_approve',
    approval_level VARCHAR(50) DEFAULT 'auto',

    -- Priority (higher = checked first)
    priority INTEGER DEFAULT 50,

    -- Conditions (JSON for complex rules)
    conditions JSONB,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kill switch (emergency stop)
CREATE TABLE IF NOT EXISTS ai_kill_switch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) UNIQUE DEFAULT '00000000-0000-0000-0000-000000000001',

    is_active BOOLEAN DEFAULT FALSE,

    activated_by VARCHAR(255),
    activated_at TIMESTAMPTZ,

    deactivated_by VARCHAR(255),
    deactivated_at TIMESTAMPTZ,

    reason TEXT,
    trigger_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI memory store (Atlas brain)
CREATE TABLE IF NOT EXISTS ai_memory_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Scope
    scope VARCHAR(50) NOT NULL,
    scope_id UUID,

    -- Memory content
    memory_type VARCHAR(100) NOT NULL,
    key VARCHAR(255),
    content TEXT NOT NULL,

    -- Importance
    importance_score INTEGER DEFAULT 5,

    -- Access
    accessible_to TEXT[] DEFAULT ARRAY['atlas', 'henry', 'dave', 'dan', 'jordan', 'annie', 'alex'],

    -- Lifecycle
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUPPORT TABLES (Annie's domain)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    contact_id UUID REFERENCES contacts(id),
    user_id UUID REFERENCES users(id),
    order_id UUID,

    -- Ticket details
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',

    -- Status
    status VARCHAR(50) DEFAULT 'open',

    -- Assignment
    assigned_to VARCHAR(50) DEFAULT 'annie',

    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(50),
    satisfaction_score INTEGER,

    -- Escalation
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMPTZ,
    escalation_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANNIE CONVERSATIONS (Styling & Concierge)
-- ============================================================================

CREATE TABLE IF NOT EXISTS annie_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- User identification
    visitor_id VARCHAR(255),
    user_id UUID REFERENCES users(id),
    contact_id UUID REFERENCES contacts(id),
    email VARCHAR(255),

    -- Conversation
    messages JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active',

    -- Context
    page_url VARCHAR(500),
    source VARCHAR(100),

    -- Outcomes
    fabric_guidance_given BOOLEAN DEFAULT FALSE,
    styling_profile_created BOOLEAN DEFAULT FALSE,
    product_recommended BOOLEAN DEFAULT FALSE,
    order_placed BOOLEAN DEFAULT FALSE,

    -- Styling context
    mentioned_fabrics TEXT[],
    style_preferences JSONB,
    size_info JSONB,

    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STYLING PROFILES (FF-Specific)
-- ============================================================================

CREATE TABLE IF NOT EXISTS styling_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    user_id UUID REFERENCES users(id),
    contact_id UUID REFERENCES contacts(id),
    email VARCHAR(255),

    -- Body measurements
    height VARCHAR(50),
    weight VARCHAR(50),
    size_tops VARCHAR(20),
    size_bottoms VARCHAR(20),
    size_dresses VARCHAR(20),

    -- Fabric preferences
    preferred_fabrics TEXT[] DEFAULT '{}',
    avoided_fabrics TEXT[] DEFAULT '{}',
    frequency_tier_preference VARCHAR(50),

    -- Style preferences
    style_aesthetic VARCHAR(100),
    color_preferences TEXT[] DEFAULT '{}',
    budget_range VARCHAR(50),

    -- Lifestyle
    lifestyle VARCHAR(100),
    climate VARCHAR(50),
    wearing_occasions TEXT[] DEFAULT '{}',

    -- Frequency goals
    healing_goals TEXT,
    energy_concerns TEXT,

    -- Status
    profile_completeness DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCT RECOMMENDATIONS (Annie's suggestions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Who & When
    user_id UUID REFERENCES users(id),
    contact_id UUID REFERENCES contacts(id),
    recommended_by VARCHAR(50) DEFAULT 'annie',
    conversation_id UUID REFERENCES annie_conversations(id),

    -- What
    product_id TEXT NOT NULL,
    product_name TEXT,
    product_tier VARCHAR(50),

    -- Why
    recommendation_reason TEXT,
    fabric_match_score INTEGER,
    style_match_score INTEGER,

    -- Outcome
    viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMPTZ,
    added_to_cart BOOLEAN DEFAULT FALSE,
    added_to_cart_at TIMESTAMPTZ,
    purchased BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMPLIANCE LOGS (Jordan's domain)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',

    -- Event
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,

    -- Details
    description TEXT,
    bot_name VARCHAR(50),
    violation_type VARCHAR(100),

    -- Metadata
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HEALTH MONITORING (Alex's domain)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_health_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Check details
    check_type VARCHAR(100) NOT NULL,
    component VARCHAR(100) NOT NULL,

    -- Results
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,

    -- Error details
    error_message TEXT,

    -- Metadata
    metadata JSONB,

    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MAINFRAME SYNC QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS mainframe_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What to sync
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Retry tracking
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    error_message TEXT,

    -- Timestamps
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);

-- Emails
CREATE INDEX IF NOT EXISTS idx_emails_contact ON emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);

-- Bot actions
CREATE INDEX IF NOT EXISTS idx_bot_actions_bot ON bot_actions_log(bot_name);
CREATE INDEX IF NOT EXISTS idx_bot_actions_type ON bot_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_bot_actions_created ON bot_actions_log(created_at);

-- Annie conversations
CREATE INDEX IF NOT EXISTS idx_annie_conv_user ON annie_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_annie_conv_contact ON annie_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_annie_conv_status ON annie_conversations(status);

-- Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);

-- Sync queue
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON mainframe_sync_queue(status);

-- ============================================================================
-- TRIGGERS FOR MAINFRAME SYNC
-- ============================================================================

-- Function to queue sync
CREATE OR REPLACE FUNCTION queue_mainframe_sync()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mainframe_sync_queue (entity_type, entity_id, action)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sync contacts to mainframe
DROP TRIGGER IF EXISTS sync_contacts_to_mainframe ON contacts;
CREATE TRIGGER sync_contacts_to_mainframe
AFTER INSERT OR UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION queue_mainframe_sync();

-- Sync bot actions to mainframe
DROP TRIGGER IF EXISTS sync_bot_actions_to_mainframe ON bot_actions_log;
CREATE TRIGGER sync_bot_actions_to_mainframe
AFTER INSERT ON bot_actions_log
FOR EACH ROW
EXECUTE FUNCTION queue_mainframe_sync();

-- ============================================================================
-- INITIAL GOVERNANCE RULES FOR FF
-- ============================================================================

INSERT INTO ai_governance_rules (tenant_id, rule_name, bot_name, action_type, daily_limit, hourly_limit, priority, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Annie Email Limit', 'annie', 'send_email', 50, 10, 100, TRUE),
('00000000-0000-0000-0000-000000000001', 'Dan Email Limit', 'dan', 'send_email', 30, 5, 100, TRUE),
('00000000-0000-0000-0000-000000000001', 'Annie Conversation Limit', 'annie', 'chat_response', NULL, 100, 90, TRUE),
('00000000-0000-0000-0000-000000000001', 'System Monitor Limit', 'alex', 'system_monitor', NULL, 20, 80, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE system_config IS 'Frequency & Form business configuration and mainframe connection';
COMMENT ON TABLE bot_actions_log IS 'Complete log of all bot activities across the system';
COMMENT ON TABLE ai_memory_store IS 'Atlas shared memory for context and learning across bots';
COMMENT ON TABLE annie_conversations IS 'Annie concierge/styling chat conversations';
COMMENT ON TABLE styling_profiles IS 'Customer style preferences and fabric guidance';
COMMENT ON TABLE product_recommendations IS 'AI-powered product suggestions from Annie';
COMMENT ON TABLE tickets IS 'Customer support tickets handled by Annie';
COMMENT ON TABLE ai_kill_switch IS 'Emergency stop for all bot operations';

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================
