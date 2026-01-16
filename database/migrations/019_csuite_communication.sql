/**
 * C-Suite Communication & Goal Tracking
 * Enables bots to behave like a real executive team
 *
 * - Shared company goals with accountability
 * - Inter-bot messaging and coordination
 * - Meeting notes and decisions
 * - Revenue responsibility assignments
 */

-- =====================================================
-- COMPANY GOALS (Shared across C-Suite)
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_company_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Goal Definition
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL, -- 'revenue', 'growth', 'operational', 'product'

    -- Target & Timeline
    target_value DECIMAL(15,2) NOT NULL, -- e.g., 100000000 for $100M
    target_unit VARCHAR(50) DEFAULT 'usd', -- 'usd', 'users', 'orders', 'partners'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Current Progress
    current_value DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),

    -- Accountability
    owner_bot VARCHAR(50) NOT NULL, -- 'atlas', 'dave', 'maggie', etc.
    supporting_bots TEXT[], -- ['dave', 'maggie', 'jordan']

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'achieved', 'at_risk', 'missed'
    health VARCHAR(50) DEFAULT 'on_track', -- 'on_track', 'behind', 'ahead', 'critical'

    -- Milestones (JSON array of checkpoints)
    milestones JSONB DEFAULT '[]',
    -- Example: [{"year": 1, "target": 5000000, "achieved": null}, {"year": 2, "target": 15000000}]

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BOT COMMUNICATIONS (C-Suite Messaging)
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_bot_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Sender & Recipients
    from_bot VARCHAR(50) NOT NULL,
    to_bot VARCHAR(50), -- NULL means broadcast to all
    to_bots TEXT[], -- For multi-recipient messages

    -- Message Content
    subject VARCHAR(255),
    message TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    -- Types: 'update', 'request', 'alert', 'decision', 'question', 'report', 'escalation'

    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

    -- Context
    related_goal_id UUID REFERENCES ff_company_goals(id),
    related_entity_type VARCHAR(50), -- 'partner', 'order', 'member', 'lead'
    related_entity_id UUID,

    -- Response Tracking
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_message_id UUID REFERENCES ff_bot_communications(id),

    -- Status
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'read', 'actioned', 'archived'
    read_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- C-SUITE MEETINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_csuite_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Meeting Details
    meeting_type VARCHAR(50) NOT NULL, -- 'daily_standup', 'weekly_review', 'monthly_strategy', 'emergency'
    title VARCHAR(255),

    -- Participants
    attendees TEXT[] NOT NULL, -- ['atlas', 'dave', 'maggie', 'jordan', 'annie']
    facilitator VARCHAR(50), -- Usually 'atlas'

    -- Timing
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Content
    agenda JSONB, -- [{topic: "Revenue Review", presenter: "dave", duration_mins: 10}]
    discussion_notes TEXT,
    decisions_made JSONB, -- [{decision: "Increase partner outreach", owner: "maggie", deadline: "2026-02-01"}]
    action_items JSONB, -- [{action: "Send 50 partner emails", assignee: "maggie", due: "2026-01-20"}]

    -- Goal Review
    goals_reviewed UUID[], -- Array of ff_company_goals IDs discussed

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REVENUE RESPONSIBILITY MATRIX
-- =====================================================

CREATE TABLE IF NOT EXISTS ff_revenue_responsibilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    bot_name VARCHAR(50) NOT NULL,

    -- Revenue Streams This Bot Owns
    revenue_stream VARCHAR(100) NOT NULL,
    -- Streams: 'memberships', 'wholesale_orders', 'direct_sales', 'partner_commissions', 'custom_designs'

    -- Targets
    monthly_target_cents BIGINT,
    quarterly_target_cents BIGINT,
    annual_target_cents BIGINT,

    -- Current Performance
    mtd_actual_cents BIGINT DEFAULT 0, -- Month to date
    qtd_actual_cents BIGINT DEFAULT 0, -- Quarter to date
    ytd_actual_cents BIGINT DEFAULT 0, -- Year to date

    -- Accountability
    reports_to VARCHAR(50), -- Which bot they report revenue to
    kpis JSONB, -- Key metrics this bot tracks for this stream

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(bot_name, revenue_stream)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_company_goals_owner ON ff_company_goals(owner_bot);
CREATE INDEX IF NOT EXISTS idx_company_goals_status ON ff_company_goals(status);
CREATE INDEX IF NOT EXISTS idx_company_goals_type ON ff_company_goals(goal_type);

CREATE INDEX IF NOT EXISTS idx_bot_comms_from ON ff_bot_communications(from_bot);
CREATE INDEX IF NOT EXISTS idx_bot_comms_to ON ff_bot_communications(to_bot);
CREATE INDEX IF NOT EXISTS idx_bot_comms_type ON ff_bot_communications(message_type);
CREATE INDEX IF NOT EXISTS idx_bot_comms_status ON ff_bot_communications(status) WHERE status != 'archived';
CREATE INDEX IF NOT EXISTS idx_bot_comms_created ON ff_bot_communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_comms_goal ON ff_bot_communications(related_goal_id) WHERE related_goal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meetings_type ON ff_csuite_meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON ff_csuite_meetings(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON ff_csuite_meetings(status);

CREATE INDEX IF NOT EXISTS idx_revenue_resp_bot ON ff_revenue_responsibilities(bot_name);
CREATE INDEX IF NOT EXISTS idx_revenue_resp_stream ON ff_revenue_responsibilities(revenue_stream);

-- =====================================================
-- INSERT MASTER REVENUE GOAL
-- =====================================================

INSERT INTO ff_company_goals (
    name,
    description,
    goal_type,
    target_value,
    target_unit,
    start_date,
    end_date,
    current_value,
    owner_bot,
    supporting_bots,
    status,
    health,
    milestones
) VALUES (
    '$100M Revenue Goal',
    'Achieve $100 million in total revenue over 5 years (2025-2030). This is the primary company objective that all C-suite activities support.',
    'revenue',
    100000000,
    'usd',
    '2025-01-01',
    '2030-01-01',
    0,
    'atlas',
    ARRAY['dave', 'maggie', 'jordan', 'annie'],
    'active',
    'on_track',
    '[
        {"year": 1, "target": 2000000, "label": "Year 1: Foundation", "focus": "Build membership base, establish partnerships"},
        {"year": 2, "target": 8000000, "label": "Year 2: Growth", "focus": "Scale wholesale, expand memberships"},
        {"year": 3, "target": 20000000, "label": "Year 3: Expansion", "focus": "International partners, premium tier growth"},
        {"year": 4, "target": 35000000, "label": "Year 4: Acceleration", "focus": "Multiple revenue streams at scale"},
        {"year": 5, "target": 35000000, "label": "Year 5: Maturity", "focus": "Optimize margins, maximize LTV"}
    ]'::jsonb
) ON CONFLICT DO NOTHING;

-- =====================================================
-- INSERT REVENUE RESPONSIBILITIES
-- =====================================================

-- Dave: Operations Overseer - Owns overall revenue tracking
INSERT INTO ff_revenue_responsibilities (bot_name, revenue_stream, reports_to, kpis)
VALUES
    ('dave', 'total_revenue', 'atlas', '{"metrics": ["mrr", "arr", "goal_progress", "runway"]}'),
    ('dave', 'memberships', 'atlas', '{"metrics": ["active_subscribers", "churn_rate", "ltv", "conversion_rate"]}')
ON CONFLICT (bot_name, revenue_stream) DO NOTHING;

-- Henry: VP Partnerships & Sales - Owns sales, wholesale, and partner revenue
INSERT INTO ff_revenue_responsibilities (bot_name, revenue_stream, reports_to, kpis)
VALUES
    ('henry', 'wholesale_orders', 'dave', '{"metrics": ["orders_this_month", "average_order_value", "pipeline_value"]}'),
    ('henry', 'direct_sales', 'dave', '{"metrics": ["daily_sales", "cart_conversion", "repeat_customers"]}'),
    ('henry', 'partner_commissions', 'dave', '{"metrics": ["active_partners", "commission_rate", "partner_gmv"]}')
ON CONFLICT (bot_name, revenue_stream) DO NOTHING;

-- Dan: Sales & Outreach - Reports to Henry, owns lead generation
INSERT INTO ff_revenue_responsibilities (bot_name, revenue_stream, reports_to, kpis)
VALUES
    ('dan', 'lead_generation', 'henry', '{"metrics": ["leads_generated", "outreach_response_rate", "qualified_leads"]}')
ON CONFLICT (bot_name, revenue_stream) DO NOTHING;

-- Maggie: Community & Styling - Owns upsells and community engagement
INSERT INTO ff_revenue_responsibilities (bot_name, revenue_stream, reports_to, kpis)
VALUES
    ('maggie', 'style_studio_upsells', 'dave', '{"metrics": ["custom_designs_ordered", "upsell_rate", "styling_consultations"]}')
ON CONFLICT (bot_name, revenue_stream) DO NOTHING;

-- Jordan: Legal & Compliance - Tracks partner agreements
INSERT INTO ff_revenue_responsibilities (bot_name, revenue_stream, reports_to, kpis)
VALUES
    ('jordan', 'contracts', 'atlas', '{"metrics": ["contracts_processed", "compliance_score", "legal_issues_resolved"]}')
ON CONFLICT (bot_name, revenue_stream) DO NOTHING;

-- Annie: Support - Owns retention (indirect revenue impact)
INSERT INTO ff_revenue_responsibilities (bot_name, revenue_stream, reports_to, kpis)
VALUES
    ('annie', 'retention', 'dave', '{"metrics": ["support_satisfaction", "churn_prevented", "upgrade_assists"]}')
ON CONFLICT (bot_name, revenue_stream) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ff_company_goals TO postgres;
GRANT ALL ON ff_bot_communications TO postgres;
GRANT ALL ON ff_csuite_meetings TO postgres;
GRANT ALL ON ff_revenue_responsibilities TO postgres;
