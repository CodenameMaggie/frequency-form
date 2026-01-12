-- Email Preferences & Unsubscribe System for Frequency & Form
-- Run this in your Supabase SQL Editor
-- CAN-SPAM Act Compliance

-- Email preferences table (stores user email preferences)
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  unsubscribe_token TEXT UNIQUE NOT NULL,

  -- Email preference categories
  marketing_emails BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  partner_updates BOOLEAN DEFAULT true,
  podcast_updates BOOLEAN DEFAULT true,

  -- Unsubscribe tracking
  unsubscribed_all BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email unsubscribe log (compliance & audit trail)
CREATE TABLE IF NOT EXISTS email_unsubscribe_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  category TEXT NOT NULL, -- 'all', 'marketing', 'product_updates', etc.
  action TEXT NOT NULL CHECK (action IN ('unsubscribe', 'resubscribe')),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email);
CREATE INDEX IF NOT EXISTS idx_email_preferences_token ON email_preferences(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_log_email ON email_unsubscribe_log(email);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_log_created_at ON email_unsubscribe_log(created_at);

-- Create updated_at trigger for email_preferences
DROP TRIGGER IF EXISTS update_email_preferences_updated_at ON email_preferences;
CREATE TRIGGER update_email_preferences_updated_at
    BEFORE UPDATE ON email_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE email_preferences IS 'Stores email subscription preferences for customers';
COMMENT ON TABLE email_unsubscribe_log IS 'Audit log for unsubscribe/resubscribe actions (CAN-SPAM compliance)';

COMMENT ON COLUMN email_preferences.unsubscribe_token IS 'Unique token for secure unsubscribe links (no login required)';
COMMENT ON COLUMN email_preferences.marketing_emails IS 'Promotional emails, sales, special offers';
COMMENT ON COLUMN email_preferences.product_updates IS 'New product announcements, collection launches';
COMMENT ON COLUMN email_preferences.order_updates IS 'Order confirmations, shipping notifications (critical - always enabled)';
COMMENT ON COLUMN email_preferences.partner_updates IS 'New partner brands, featured designers';
COMMENT ON COLUMN email_preferences.podcast_updates IS 'Modern Mondays podcast episodes, guest announcements';
COMMENT ON COLUMN email_preferences.unsubscribed_all IS 'Unsubscribed from all non-transactional emails';

COMMENT ON COLUMN email_unsubscribe_log.category IS 'Which category was affected: all, marketing, product_updates, order_updates, partner_updates, podcast_updates';
COMMENT ON COLUMN email_unsubscribe_log.action IS 'User action: unsubscribe or resubscribe';
COMMENT ON COLUMN email_unsubscribe_log.ip_address IS 'IP address of user (for fraud detection)';
COMMENT ON COLUMN email_unsubscribe_log.user_agent IS 'Browser user agent string';

-- Insert default preferences for existing customers (if orders table exists)
-- This ensures all customers who've ordered have unsubscribe tokens
INSERT INTO email_preferences (email, unsubscribe_token)
SELECT DISTINCT email, md5(random()::text || email || clock_timestamp()::text)
FROM orders
WHERE email NOT IN (SELECT email FROM email_preferences)
ON CONFLICT (email) DO NOTHING;
