/**
 * Shopify Integration Tables
 * Tracks synced products and incoming orders from Shopify store
 */

-- Table: shopify_products
-- Tracks which F&F products are synced to Shopify
CREATE TABLE IF NOT EXISTS shopify_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shopify_product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  sku_prefix VARCHAR(50),
  sync_status VARCHAR(50) DEFAULT 'active', -- active, paused, archived
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, shopify_product_id)
);

CREATE INDEX idx_shopify_products_tenant ON shopify_products(tenant_id);
CREATE INDEX idx_shopify_products_status ON shopify_products(sync_status);

-- Table: shopify_orders
-- Stores orders received from Shopify webhooks
CREATE TABLE IF NOT EXISTS shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shopify_order_id VARCHAR(50) NOT NULL,
  order_number VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  financial_status VARCHAR(50), -- pending, paid, refunded, etc.
  fulfillment_status VARCHAR(50), -- unfulfilled, fulfilled, partial, etc.
  payment_method VARCHAR(100),
  line_items JSONB, -- Array of order items
  shipping_address JSONB, -- Customer shipping details
  order_created_at TIMESTAMP,
  fulfilled_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, shopify_order_id)
);

CREATE INDEX idx_shopify_orders_tenant ON shopify_orders(tenant_id);
CREATE INDEX idx_shopify_orders_status ON shopify_orders(financial_status);
CREATE INDEX idx_shopify_orders_fulfillment ON shopify_orders(fulfillment_status);
CREATE INDEX idx_shopify_orders_created ON shopify_orders(order_created_at DESC);
CREATE INDEX idx_shopify_orders_customer ON shopify_orders(customer_email);

-- Table: shopify_sync_log
-- Audit trail for sync operations
CREATE TABLE IF NOT EXISTS shopify_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- product_sync, order_webhook, inventory_update
  status VARCHAR(50) NOT NULL, -- success, error, warning
  message TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopify_sync_log_tenant ON shopify_sync_log(tenant_id);
CREATE INDEX idx_shopify_sync_log_created ON shopify_sync_log(created_at DESC);

COMMENT ON TABLE shopify_products IS 'Tracks F&F products synced to Shopify store';
COMMENT ON TABLE shopify_orders IS 'Orders received from Shopify via webhooks';
COMMENT ON TABLE shopify_sync_log IS 'Audit log for Shopify sync operations';
