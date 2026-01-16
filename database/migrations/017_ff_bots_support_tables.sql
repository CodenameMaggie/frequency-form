/**
 * FF Bots Support Tables
 * Migration 017: Tables needed for social posts and mainframe sync
 */

-- =====================================================
-- SOCIAL POSTS TABLE
-- Used by Dan Auto Social Posts bot
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Post details
    platform TEXT NOT NULL,  -- twitter, linkedin, facebook, pinterest
    category TEXT NOT NULL,  -- new_partner, fabric_education, style_studio, seasonal, client_model
    content TEXT NOT NULL,

    -- Related entities
    partner_id UUID REFERENCES ff_partners(id),
    product_id UUID,
    lookbook_id UUID REFERENCES ff_lookbooks(id),

    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    -- Status tracking
    status TEXT DEFAULT 'pending',  -- pending, published, failed, cancelled
    error_message TEXT,

    -- Platform-specific data
    platform_post_id TEXT,  -- ID returned from platform after posting
    engagement_data JSONB,   -- likes, shares, comments, etc.

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BOT ACTIONS TABLE
-- Logs all bot activity for monitoring and MFS sync
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_bot_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Bot identification
    bot_name TEXT NOT NULL,
    action_type TEXT NOT NULL,

    -- Status and results
    status TEXT DEFAULT 'running',  -- running, completed, failed, completed_with_errors
    details JSONB,
    error_message TEXT,

    -- Cost tracking
    cost DECIMAL(10, 4) DEFAULT 0,  -- AI/API costs in USD

    -- MFS sync tracking
    synced_to_mfs TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYNC LOG TABLE
-- Tracks sync operations to MFS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Sync details
    sync_type TEXT NOT NULL,  -- partners_to_mfs, emails_to_mfs, deals_to_mfs
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    errors TEXT[],

    -- Timestamps
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYNC QUEUE TABLE
-- Queue for records pending sync when MFS is unavailable
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Queue item details
    sync_type TEXT NOT NULL,
    record_id UUID,
    payload JSONB NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending',  -- pending, synced, failed
    attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD synced_to_mfs TO email_sent_log IF NOT EXISTS
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'email_sent_log' AND column_name = 'synced_to_mfs'
    ) THEN
        ALTER TABLE email_sent_log ADD COLUMN synced_to_mfs TIMESTAMPTZ;
    END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON ff_social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON ff_social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON ff_social_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_posts_category ON ff_social_posts(category);

CREATE INDEX IF NOT EXISTS idx_bot_actions_bot ON ff_bot_actions(bot_name);
CREATE INDEX IF NOT EXISTS idx_bot_actions_status ON ff_bot_actions(status);
CREATE INDEX IF NOT EXISTS idx_bot_actions_created ON ff_bot_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_bot_actions_synced ON ff_bot_actions(synced_to_mfs);

CREATE INDEX IF NOT EXISTS idx_sync_log_type ON ff_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON ff_sync_log(synced_at);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON ff_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON ff_sync_queue(sync_type);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ff_social_posts IS 'Social media posts created by Dan Auto Social Posts bot';
COMMENT ON TABLE ff_bot_actions IS 'Log of all bot actions for monitoring and MFS sync';
COMMENT ON TABLE ff_sync_log IS 'Track sync operations to MFS Command Center';
COMMENT ON TABLE ff_sync_queue IS 'Queue for pending MFS sync when API unavailable';
