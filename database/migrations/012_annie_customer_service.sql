/**
 * Annie Customer Service System
 * Conversation history, customer profiles, and service management
 */

-- Table: annie_conversations
-- Stores all customer conversations with Annie
CREATE TABLE IF NOT EXISTS annie_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id VARCHAR(100) NOT NULL, -- Unique ID for each conversation session
  visitor_id VARCHAR(100) NOT NULL, -- Browser-based visitor tracking
  user_id UUID REFERENCES auth.users(id), -- Linked once customer logs in/signs up
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  started_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active', -- active, resolved, escalated
  source VARCHAR(50) DEFAULT 'website', -- website, email, phone
  page_url TEXT, -- Where conversation started
  sentiment VARCHAR(50), -- positive, neutral, negative (auto-detected)
  tags TEXT[], -- Array of tags (sizing, fabric, custom_order, complaint, etc.)
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, conversation_id)
);

CREATE INDEX idx_annie_conversations_tenant ON annie_conversations(tenant_id);
CREATE INDEX idx_annie_conversations_visitor ON annie_conversations(visitor_id);
CREATE INDEX idx_annie_conversations_user ON annie_conversations(user_id);
CREATE INDEX idx_annie_conversations_status ON annie_conversations(status);
CREATE INDEX idx_annie_conversations_started ON annie_conversations(started_at DESC);

-- Table: annie_messages
-- Individual messages within conversations
CREATE TABLE IF NOT EXISTS annie_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES annie_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'customer' or 'annie'
  message TEXT NOT NULL,
  context JSONB, -- Any relevant context (product viewed, page, etc.)
  intent VARCHAR(100), -- Detected intent (product_inquiry, sizing_help, order_status, etc.)
  response_template VARCHAR(100), -- Which template was used for Annie's response
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_annie_messages_conversation ON annie_messages(conversation_id);
CREATE INDEX idx_annie_messages_created ON annie_messages(created_at DESC);
CREATE INDEX idx_annie_messages_intent ON annie_messages(intent);

-- Table: annie_customer_profiles
-- Enhanced customer profiles for personalized service
CREATE TABLE IF NOT EXISTS annie_customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  visitor_id VARCHAR(100), -- For pre-signup tracking
  email VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(50),

  -- Style Preferences
  preferred_fabrics TEXT[], -- [linen, organic_cotton, silk, etc.]
  preferred_colors TEXT[], -- Color names they like
  size VARCHAR(10), -- XS, S, M, L, XL, etc.
  style_preferences JSONB, -- {casual: true, formal: false, bohemian: true}

  -- Purchase History
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  first_purchase_date TIMESTAMP,
  last_purchase_date TIMESTAMP,
  average_order_value DECIMAL(10,2),

  -- Style Studio Data (quick reference)
  has_body_scan BOOLEAN DEFAULT false,
  has_color_analysis BOOLEAN DEFAULT false,
  body_type VARCHAR(50),
  color_season VARCHAR(50),

  -- Service Quality
  satisfaction_score INTEGER, -- 1-5 rating
  total_conversations INTEGER DEFAULT 0,
  last_conversation_date TIMESTAMP,

  -- Notes
  notes TEXT, -- Staff notes about customer preferences
  tags TEXT[], -- VIP, custom_orders, high_value, etc.

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, user_id),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_annie_customer_profiles_tenant ON annie_customer_profiles(tenant_id);
CREATE INDEX idx_annie_customer_profiles_user ON annie_customer_profiles(user_id);
CREATE INDEX idx_annie_customer_profiles_email ON annie_customer_profiles(email);
CREATE INDEX idx_annie_customer_profiles_visitor ON annie_customer_profiles(visitor_id);

-- Table: annie_response_templates
-- Pre-written response templates for common inquiries (NO AI)
CREATE TABLE IF NOT EXISTS annie_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_key VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- sizing, fabric, ordering, shipping, returns, etc.
  trigger_keywords TEXT[], -- Keywords that trigger this template
  response_text TEXT NOT NULL,
  variables TEXT[], -- Variables to be replaced (like {customer_name}, {fabric_type})
  requires_context BOOLEAN DEFAULT false, -- Needs customer data to respond
  active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, template_key)
);

CREATE INDEX idx_annie_templates_tenant ON annie_response_templates(tenant_id);
CREATE INDEX idx_annie_templates_category ON annie_response_templates(category);
CREATE INDEX idx_annie_templates_active ON annie_response_templates(active);

-- Insert default response templates
INSERT INTO annie_response_templates (tenant_id, template_key, category, trigger_keywords, response_text, variables, requires_context) VALUES
('00000000-0000-0000-0000-000000000001', 'greeting_new', 'greeting', ARRAY['hi', 'hello', 'hey'],
'Hi there! 👋 I''m Annie, your personal stylist at Frequency & Form. I can help you find the perfect natural fiber clothing for your needs. What brings you here today?',
ARRAY[]::TEXT[], false),

('00000000-0000-0000-0000-000000000001', 'greeting_returning', 'greeting', ARRAY['hi', 'hello', 'hey'],
'Welcome back, {customer_name}! 👋 It''s great to see you again. How can I help you today?',
ARRAY['customer_name'], true),

('00000000-0000-0000-0000-000000000001', 'fabric_linen', 'fabric', ARRAY['linen', 'breathable', 'summer'],
'Our linen is absolutely beautiful! It''s 100% European linen from Lithuania, which measures at 5,000 Hz on the healing tier. Linen is incredibly breathable, gets softer with every wash, and is perfect for warm weather. We have it available in Natural, Sage, Terracotta, and Charcoal.

Would you like to see our linen collection?',
ARRAY[]::TEXT[], false),

('00000000-0000-0000-0000-000000000001', 'fabric_organic_cotton', 'fabric', ARRAY['cotton', 'organic', 'everyday'],
'Our organic cotton is GOTS certified and sits at the foundation tier (100 Hz). It''s perfect for everyday essentials - soft, breathable, and easy to care for. Great for t-shirts, underwear, and loungewear.

Would you like to see our cotton collection?',
ARRAY[]::TEXT[], false),

('00000000-0000-0000-0000-000000000001', 'sizing_help', 'sizing', ARRAY['size', 'fit', 'measurements', 'too big', 'too small'],
'I''d love to help you find the perfect size! We offer sizes XS through 3X, and all our pieces are designed to fit beautifully.

Have you taken your measurements recently? I can guide you through it, or if you''d like, you can use our AI Body Scan tool for instant sizing recommendations.',
ARRAY[]::TEXT[], false),

('00000000-0000-0000-0000-000000000001', 'sizing_with_scan', 'sizing', ARRAY['size', 'fit', 'measurements'],
'Based on your body scan, I recommend a size {recommended_size} for most of our pieces. Your measurements are:
• Bust: {bust}"
• Waist: {waist}"
• Hips: {hips}"

Your {body_type} body type looks amazing in {recommended_silhouettes}. Would you like me to show you pieces in your size?',
ARRAY['recommended_size', 'bust', 'waist', 'hips', 'body_type', 'recommended_silhouettes'], true),

('00000000-0000-0000-0000-000000000001', 'color_analysis', 'styling', ARRAY['color', 'what color', 'which color', 'color season'],
'Color is so important for looking your best! We offer personal color analysis where we determine your season (Spring, Summer, Autumn, or Winter) and give you a custom palette of colors that make you glow.

Would you like to try our AI Color Analysis? It only takes a minute with a selfie!',
ARRAY[]::TEXT[], false),

('00000000-0000-0000-0000-000000000001', 'color_with_analysis', 'styling', ARRAY['color', 'what color', 'which color'],
'Perfect question! Based on your color analysis, you''re a {color_season} which means you look absolutely stunning in {best_colors}.

For this piece, I''d recommend {recommended_color_1} or {recommended_color_2} - both are in your perfect palette and will complement your {skin_undertone} undertone beautifully.',
ARRAY['color_season', 'best_colors', 'recommended_color_1', 'recommended_color_2', 'skin_undertone'], true),

('00000000-0000-0000-0000-000000000001', 'custom_order', 'ordering', ARRAY['custom', 'made to order', 'personalized', 'tailored'],
'Yes! We absolutely do custom orders through our Style Studio. You can:

• Design your own piece from scratch
• Modify any existing design
• Choose your perfect fabric (all measured for frequency)
• Get it custom-fitted to your exact measurements

Custom pieces typically take 3-4 weeks and start at $185 for healing-tier fabrics (linen, silk). Would you like to explore the Style Studio?',
ARRAY[]::TEXT[], false),

('00000000-0000-0000-0000-000000000001', 'shipping', 'shipping', ARRAY['shipping', 'delivery', 'how long', 'when will'],
'Great question! Our shipping varies by product:

**Foundation Items** (organic cotton, hemp)
→ Ships within 3-5 business days
→ Free shipping on orders over $100

**Healing Tier Items** (linen, silk)
→ Made to order in 3-4 weeks
→ Handcrafted by our European partners

**Custom Style Studio Pieces**
→ 3-4 weeks production + shipping

We ship via USPS or UPS, and you''ll get tracking info as soon as it ships!',
ARRAY[]::TEXT[], false),

('00000000-0000-0000-0000-000000000001', 'returns', 'returns', ARRAY['return', 'exchange', 'refund', 'don''t like'],
'We want you to love everything! Here''s our return policy:

**Foundation Items:** 30-day returns for full refund
**Healing Tier Items:** 14-day returns (50% restocking fee due to custom nature)
**Custom Style Studio:** No returns (made specifically for you), but we''ll work with you to make adjustments

All returns must be unworn with tags attached. Email us at support@frequencyandform.com to start a return!',
ARRAY[]::TEXT[], false),

('00000000-0000-0000-0000-000000000001', 'price_inquiry', 'pricing', ARRAY['price', 'cost', 'how much', 'expensive'],
'We offer two pricing tiers based on fabric frequency:

**Foundation Tier** (100 Hz)
→ Organic cotton, hemp
→ $45-$120
→ Everyday essentials

**Healing Tier** (5,000 Hz)
→ Linen, silk, cashmere
→ $150-$350
→ Investment pieces, custom-made

All our fabrics are natural fibers - never synthetics! What type of piece are you looking for?',
ARRAY[]::TEXT[], false);

COMMENT ON TABLE annie_conversations IS 'All customer conversations with Annie';
COMMENT ON TABLE annie_messages IS 'Individual messages within Annie conversations';
COMMENT ON TABLE annie_customer_profiles IS 'Enhanced customer profiles for personalized service';
COMMENT ON TABLE annie_response_templates IS 'Pre-written response templates (NO AI)';
