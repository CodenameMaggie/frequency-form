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

-- Add title column to social_posts if missing (for Pinterest pins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_posts' AND column_name = 'title'
  ) THEN
    ALTER TABLE social_posts ADD COLUMN title VARCHAR(255);
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON ff_partners TO postgres;
GRANT ALL ON tasks TO postgres;
