/**
 * F&F Boutique Buyers & Wholesale Contacts
 * Stores boutiques, yoga studios, hotels, and other wholesale buyers
 * For $10K-$100K marketplace revenue generation
 */

-- Create ff_boutique_buyers table
CREATE TABLE IF NOT EXISTS ff_boutique_buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Business Information
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100), -- 'boutique', 'yoga_studio', 'hotel', 'restaurant', 'spa', 'gift_shop'
  website VARCHAR(500),

  -- Location
  city VARCHAR(100),
  state_province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'USA',
  full_address TEXT,

  -- Contact Information
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  instagram_handle VARCHAR(255),

  -- Business Profile
  sustainable_focus BOOLEAN DEFAULT false, -- Do they emphasize sustainability?
  average_order_size VARCHAR(100), -- '$500-1000', '$1000-2500', '$2500+'
  order_frequency VARCHAR(50), -- 'seasonal', 'monthly', 'quarterly'
  preferred_price_tier VARCHAR(50), -- 'healing' ($150-800) or 'foundation' ($50-200)

  -- Lead Status
  status VARCHAR(50) DEFAULT 'prospect', -- prospect, contacted, interested, negotiating, customer, inactive
  lead_source VARCHAR(100), -- 'ai_discovery', 'google_search', 'instagram', 'referral', 'manual'
  lead_quality_score INTEGER, -- 0-100 based on fit

  -- Outreach Tracking
  first_contact_date TIMESTAMP,
  last_contact_date TIMESTAMP,
  last_email_sent_date TIMESTAMP,
  emails_sent_count INTEGER DEFAULT 0,
  emails_opened_count INTEGER DEFAULT 0,
  emails_replied_count INTEGER DEFAULT 0,

  -- Sales Pipeline
  interested_in_products TEXT[], -- ['dresses', 'blouses', 'home_textiles']
  sample_order_sent BOOLEAN DEFAULT false,
  sample_order_date TIMESTAMP,
  first_order_date TIMESTAMP,
  last_order_date TIMESTAMP,

  -- Customer Value
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  average_order_value DECIMAL(10,2),

  -- Notes & Internal
  notes TEXT,
  assigned_to VARCHAR(255), -- Sales person responsible

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tenant_id, business_name)
);

-- Create email_outreach_queue table
CREATE TABLE IF NOT EXISTS email_outreach_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Target
  buyer_id UUID REFERENCES ff_boutique_buyers(id),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  business_name VARCHAR(255),

  -- Email Content
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  template_used VARCHAR(100), -- 'initial_outreach', 'follow_up_1', 'follow_up_2', etc.

  -- Personalization
  personalization_data JSONB, -- Store variables used for personalization

  -- Scheduling
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  scheduled_for TIMESTAMP DEFAULT NOW(),

  -- Status
  status VARCHAR(50) DEFAULT 'queued', -- queued, sending, sent, failed, bounced, opened, replied
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  replied_at TIMESTAMP,

  -- Tracking
  email_provider_id VARCHAR(255), -- ID from SendGrid, Mailgun, etc.
  failure_reason TEXT,
  bounce_reason TEXT,

  -- Campaign
  campaign_name VARCHAR(255), -- 'wholesale_spring_2026', 'follow_up_march'
  bot_generated BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create wholesale_orders table
CREATE TABLE IF NOT EXISTS wholesale_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  buyer_id UUID REFERENCES ff_boutique_buyers(id),
  partner_id UUID REFERENCES ff_partners(id), -- European brand sourcing from

  -- Order Details
  order_number VARCHAR(100) UNIQUE,
  order_date TIMESTAMP DEFAULT NOW(),

  -- Items (simplified - in production would have line items table)
  items_summary JSONB, -- [{"product": "Linen Dress", "qty": 10, "unit_price": 90, "total": 900}]

  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  wholesale_discount_percent DECIMAL(5,2), -- 20% for wholesale
  discount_amount DECIMAL(10,2),
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Payment
  deposit_amount DECIMAL(10,2), -- 50% upfront
  deposit_paid_date TIMESTAMP,
  balance_amount DECIMAL(10,2),
  balance_paid_date TIMESTAMP,
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, deposit_paid, paid_in_full, overdue
  payment_terms VARCHAR(100), -- 'Net 30', '50% deposit, 50% on delivery'

  -- Fulfillment
  fulfillment_status VARCHAR(50) DEFAULT 'pending', -- pending, production, shipped, delivered, cancelled
  estimated_ship_date DATE,
  actual_ship_date DATE,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  tracking_number VARCHAR(255),

  -- Margin Calculation
  supplier_cost DECIMAL(10,2), -- What we pay supplier
  platform_commission DECIMAL(10,2), -- Our 20% margin
  net_profit DECIMAL(10,2),

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_boutique_buyers_tenant ON ff_boutique_buyers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_boutique_buyers_status ON ff_boutique_buyers(status);
CREATE INDEX IF NOT EXISTS idx_boutique_buyers_business_type ON ff_boutique_buyers(business_type);
CREATE INDEX IF NOT EXISTS idx_boutique_buyers_location ON ff_boutique_buyers(city, state_province);
CREATE INDEX IF NOT EXISTS idx_boutique_buyers_lead_quality ON ff_boutique_buyers(lead_quality_score) WHERE lead_quality_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_queue_tenant ON email_outreach_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_outreach_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_outreach_queue(scheduled_for) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_email_queue_buyer ON email_outreach_queue(buyer_id);

CREATE INDEX IF NOT EXISTS idx_wholesale_orders_tenant ON wholesale_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_buyer ON wholesale_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_partner ON wholesale_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_status ON wholesale_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_payment ON wholesale_orders(payment_status);

-- Grant permissions
GRANT ALL ON ff_boutique_buyers TO postgres;
GRANT ALL ON email_outreach_queue TO postgres;
GRANT ALL ON wholesale_orders TO postgres;
