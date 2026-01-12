/**
 * F&F Partners Table Migration
 * Stores European natural fiber designer/brand partnerships
 * For Frequency & Form marketplace partner management
 */

-- Create ff_partners table
CREATE TABLE IF NOT EXISTS ff_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Brand Information
  brand_name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  country VARCHAR(100), -- European country

  -- Product Details
  primary_fabric VARCHAR(100), -- linen, wool, silk, cotton, hemp
  product_types TEXT[], -- ["dresses", "shirts", "home_textiles", "accessories"]
  price_tier VARCHAR(50), -- 'healing' ($150-800) or 'foundation' ($50-200)

  -- Partnership Status
  status VARCHAR(50) DEFAULT 'prospect', -- prospect, contacted, negotiating, active, paused, inactive
  partnership_type VARCHAR(50), -- commission, wholesale, consignment
  commission_rate DECIMAL(5,2), -- e.g., 15.00 for 15%

  -- Contact Information
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  instagram_handle VARCHAR(255),

  -- Partnership Details
  contract_start_date TIMESTAMP,
  contract_end_date TIMESTAMP,
  minimum_order_quantity INTEGER,
  lead_time_days INTEGER, -- Production lead time

  -- Business Details
  notes TEXT,
  discovery_source VARCHAR(100), -- ai_web_search, manual_research, referral, trade_show
  outreach_date TIMESTAMP,
  last_contact_date TIMESTAMP,

  -- Product Catalog
  products_count INTEGER DEFAULT 0,
  total_sales DECIMAL(12,2) DEFAULT 0,
  avg_product_rating DECIMAL(3,2),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tenant_id, brand_name)
);

-- Create indexes for performance
CREATE INDEX idx_ff_partners_tenant ON ff_partners(tenant_id);
CREATE INDEX idx_ff_partners_status ON ff_partners(status);
CREATE INDEX idx_ff_partners_country ON ff_partners(country);
CREATE INDEX idx_ff_partners_fabric ON ff_partners(primary_fabric);
CREATE INDEX idx_ff_partners_price_tier ON ff_partners(price_tier);

-- Create tasks table if it doesn't exist (for partner outreach tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  title VARCHAR(500) NOT NULL,
  description TEXT,

  assigned_to VARCHAR(100), -- bot name or user email
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled

  due_date TIMESTAMP,
  completed_at TIMESTAMP,

  related_entity_type VARCHAR(100), -- partner, contact, deal, etc.
  related_entity_id UUID,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Create social_posts table if missing (for Pinterest and other social platforms)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'pinterest')),
  post_type TEXT DEFAULT 'ai_generated',
  title VARCHAR(255), -- For Pinterest pins
  content TEXT NOT NULL,
  media_urls TEXT[],
  hashtags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'needs_revision', 'scheduled', 'published', 'failed')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  approved_by VARCHAR,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  brand_compliance_notes TEXT,
  utm_params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add title column to existing social_posts table if missing (for Pinterest pins)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'social_posts'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_posts' AND column_name = 'title'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN title VARCHAR(255);
  END IF;
END $$;

-- Add Pinterest to platform check if table exists but doesn't support it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'social_posts'
  ) THEN
    -- Drop old constraint
    ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_platform_check;
    -- Add new constraint with Pinterest
    ALTER TABLE social_posts ADD CONSTRAINT social_posts_platform_check
      CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'pinterest'));
  END IF;
END $$;

-- Create index for social_posts
CREATE INDEX IF NOT EXISTS idx_social_posts_tenant ON social_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);

-- Grant permissions
GRANT ALL ON ff_partners TO postgres;
GRANT ALL ON tasks TO postgres;
GRANT ALL ON social_posts TO postgres;
