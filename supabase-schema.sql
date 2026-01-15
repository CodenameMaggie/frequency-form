-- Frequency & Form Database Schema
-- Run this in your Supabase SQL Editor

-- =============================================
-- CORE TABLES
-- =============================================

-- Brand Partners (Sellers)
CREATE TABLE IF NOT EXISTS brand_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),
  brand_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  website TEXT,
  description TEXT,
  primary_fabric TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand Applications (Partner applications before approval)
CREATE TABLE IF NOT EXISTS brand_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  description TEXT,
  fabric_types TEXT[],
  product_types TEXT[],
  price_range TEXT,
  production_location TEXT,
  certifications TEXT[],
  why_frequency_form TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES brand_partners(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  brand TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  fabric_type TEXT NOT NULL,
  tier TEXT DEFAULT 'foundation' CHECK (tier IN ('healing', 'foundation')),
  frequency_hz INTEGER DEFAULT 100,
  images TEXT[],
  sizes TEXT[],
  colors TEXT[],
  sku TEXT,
  inventory_quantity INTEGER DEFAULT 0,
  weight DECIMAL(10,2),
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
  shopify_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  customer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  stripe_payment_intent_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  partner_id UUID REFERENCES brand_partners(id),
  product_name TEXT NOT NULL,
  product_brand TEXT,
  fabric_type TEXT,
  frequency_hz INTEGER,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  size TEXT,
  color TEXT,
  sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales (for commission tracking)
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  partner_id UUID REFERENCES brand_partners(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  sale_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  partner_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payout_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES brand_partners(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id TEXT,
  period_start DATE,
  period_end DATE,
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SHOPIFY INTEGRATION
-- =============================================

-- Shopify OAuth Tokens
CREATE TABLE IF NOT EXISTS shopify_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopify Products Sync
CREATE TABLE IF NOT EXISTS shopify_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  shopify_product_id TEXT NOT NULL,
  product_name TEXT,
  sku_prefix TEXT,
  sync_status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, shopify_product_id)
);

-- Shopify Orders Sync
CREATE TABLE IF NOT EXISTS shopify_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  shopify_order_id TEXT NOT NULL,
  order_number TEXT,
  customer_email TEXT,
  customer_name TEXT,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  shipping DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  financial_status TEXT,
  fulfillment_status TEXT,
  line_items JSONB,
  shipping_address JSONB,
  order_created_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, shopify_order_id)
);

-- Shopify Sync Log
CREATE TABLE IF NOT EXISTS shopify_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EMAIL & NOTIFICATIONS
-- =============================================

-- Email Queue
CREATE TABLE IF NOT EXISTS email_outreach_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_used TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  priority INTEGER DEFAULT 5,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_brand_partners_auth_user ON brand_partners(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_brand_partners_status ON brand_partners(status);
CREATE INDEX IF NOT EXISTS idx_brand_applications_status ON brand_applications(status);
CREATE INDEX IF NOT EXISTS idx_brand_applications_email ON brand_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_products_partner ON products(partner_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_partner_id ON order_items(partner_id);
CREATE INDEX IF NOT EXISTS idx_sales_partner_id ON sales(partner_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_id ON sales(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_payouts_partner_id ON payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_shopify_tokens_shop ON shopify_tokens(shop_domain);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_outreach_queue(status);

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_brand_partners_updated_at ON brand_partners;
CREATE TRIGGER update_brand_partners_updated_at
    BEFORE UPDATE ON brand_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brand_applications_updated_at ON brand_applications;
CREATE TRIGGER update_brand_applications_updated_at
    BEFORE UPDATE ON brand_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopify_tokens_updated_at ON shopify_tokens;
CREATE TRIGGER update_shopify_tokens_updated_at
    BEFORE UPDATE ON shopify_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on sensitive tables
ALTER TABLE brand_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Policies for brand_partners
CREATE POLICY "Partners can view own profile" ON brand_partners
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Partners can update own profile" ON brand_partners
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Policies for products
CREATE POLICY "Anyone can view approved products" ON products
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Partners can manage own products" ON products
    FOR ALL USING (partner_id IN (
        SELECT id FROM brand_partners WHERE auth_user_id = auth.uid()
    ));

-- Policies for orders (service role bypasses RLS)
CREATE POLICY "Service role full access to orders" ON orders
    FOR ALL USING (true);

-- Policies for sales
CREATE POLICY "Partners can view own sales" ON sales
    FOR SELECT USING (partner_id IN (
        SELECT id FROM brand_partners WHERE auth_user_id = auth.uid()
    ));

-- Policies for payouts
CREATE POLICY "Partners can view own payouts" ON payouts
    FOR SELECT USING (partner_id IN (
        SELECT id FROM brand_partners WHERE auth_user_id = auth.uid()
    ));

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE brand_partners IS 'Approved sellers/brands on the platform';
COMMENT ON TABLE brand_applications IS 'Pending partner applications awaiting review';
COMMENT ON TABLE products IS 'Product catalog from all partners';
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON TABLE order_items IS 'Individual items within orders';
COMMENT ON TABLE sales IS 'Sales records for commission tracking';
COMMENT ON TABLE payouts IS 'Partner payout records';
COMMENT ON TABLE shopify_tokens IS 'OAuth tokens for Shopify integration';
COMMENT ON TABLE email_outreach_queue IS 'Email queue for notifications';
