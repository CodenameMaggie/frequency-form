-- ============================================================================
-- FREQUENCY & FORM - MARKETPLACE EXTENSION
-- Adds multi-brand marketplace functionality
-- Run this AFTER frequency-form-bot-schema.sql
-- ============================================================================

-- ============================================================================
-- BRAND PARTNERS (Sellers on the platform)
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Account (links to Supabase Auth)
  auth_user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,

  -- Brand Info
  brand_name TEXT NOT NULL,
  brand_slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  long_description TEXT,
  origin_country TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,

  -- Contact
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Business Details
  business_type TEXT,
  tax_id TEXT,
  business_address JSONB,

  -- Banking for Payouts
  bank_account_name TEXT,
  bank_account_last4 TEXT,
  bank_routing_last4 TEXT,
  payout_email TEXT,
  payout_method TEXT DEFAULT 'bank_transfer',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'inactive')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,

  -- Commission
  commission_rate INTEGER DEFAULT 20,
  is_founding_partner BOOLEAN DEFAULT FALSE,
  founding_partner_number INTEGER,

  -- Settings
  featured BOOLEAN DEFAULT FALSE,

  -- Metrics
  total_sales INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand applications
CREATE TABLE IF NOT EXISTS brand_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  website TEXT,
  instagram TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  product_types TEXT[],
  price_range TEXT,
  uses_synthetic_fibers BOOLEAN DEFAULT FALSE,
  willing_to_comply BOOLEAN DEFAULT TRUE,
  why_join TEXT,
  how_heard TEXT,
  sample_products JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  internal_notes TEXT,
  brand_partner_id UUID REFERENCES brand_partners(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products - add marketplace columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_partner_id UUID REFERENCES brand_partners(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Sales tracking
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID,
  product_id UUID REFERENCES products(id),
  brand_partner_id UUID REFERENCES brand_partners(id),
  sale_amount INTEGER NOT NULL,
  commission_rate INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  brand_payout_amount INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  payout_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_partner_id UUID REFERENCES brand_partners(id),
  amount INTEGER NOT NULL,
  sales_count INTEGER NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order fulfillments by brand
CREATE TABLE IF NOT EXISTS order_fulfillments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID,
  brand_partner_id UUID REFERENCES brand_partners(id),
  products JSONB NOT NULL,
  carrier TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller notifications
CREATE TABLE IF NOT EXISTS seller_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_partner_id UUID REFERENCES brand_partners(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_partners_status ON brand_partners(status);
CREATE INDEX IF NOT EXISTS idx_products_brand_partner ON products(brand_partner_id);
CREATE INDEX IF NOT EXISTS idx_sales_brand_partner ON sales(brand_partner_id);
CREATE INDEX IF NOT EXISTS idx_payouts_brand_partner ON payouts(brand_partner_id);

-- Seed FF as house brand
INSERT INTO brand_partners (
  id,
  email,
  brand_name,
  brand_slug,
  origin_country,
  contact_name,
  contact_email,
  status,
  commission_rate,
  approved_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'concierge@frequencyandform.com',
  'Frequency & Form',
  'frequency-and-form',
  'United States',
  'Maggie Forbes',
  'concierge@frequencyandform.com',
  'approved',
  0,
  NOW()
) ON CONFLICT (id) DO NOTHING;
