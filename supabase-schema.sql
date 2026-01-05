-- Frequency & Form Database Schema
-- Run this in your Supabase SQL Editor

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'failed')),
  subtotal INTEGER NOT NULL,
  shipping INTEGER DEFAULT 0,
  tax INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  shipping_address JSONB NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_brand TEXT,
  fabric_type TEXT,
  frequency_hz INTEGER,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE orders IS 'Stores customer orders with payment and shipping information';
COMMENT ON TABLE order_items IS 'Stores individual items within each order';
COMMENT ON COLUMN orders.status IS 'Order status: pending, paid, shipped, delivered, cancelled, failed';
COMMENT ON COLUMN orders.subtotal IS 'Order subtotal in cents';
COMMENT ON COLUMN orders.shipping IS 'Shipping cost in cents';
COMMENT ON COLUMN orders.tax IS 'Tax amount in cents';
COMMENT ON COLUMN orders.total IS 'Total order amount in cents';
COMMENT ON COLUMN orders.shipping_address IS 'JSON object containing shipping address fields';
COMMENT ON COLUMN order_items.price IS 'Item price in cents at time of purchase';
COMMENT ON COLUMN order_items.frequency_hz IS 'Fabric frequency in Hz (e.g., 5000 for healing tier, 100 for foundation)';
