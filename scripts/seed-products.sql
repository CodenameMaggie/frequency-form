-- =====================================================
-- FREQUENCY & FORM - SAMPLE PRODUCT SEEDING
-- Seeds 20 sample products across different fabric types
-- Run AFTER supabase-schema-clean.sql
-- =====================================================

-- First, ensure Frequency & Form house brand exists
INSERT INTO brand_partners (
  id,
  brand_name,
  contact_email,
  contact_name,
  description,
  status,
  commission_rate
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Frequency & Form',
  'concierge@frequencyandform.com',
  'F&F Team',
  'Curated natural fiber clothing based on fabric frequency science',
  'approved',
  0.00
) ON CONFLICT (id) DO NOTHING;

-- Seed 20 sample products
INSERT INTO products (
  partner_id,
  name,
  slug,
  description,
  brand,
  fabric_type,
  tier,
  frequency_hz,
  price,
  compare_at_price,
  category,
  images,
  inventory_quantity,
  status
) VALUES
-- LINEN PRODUCTS (5,000 Hz - Healing Tier)
(
  '00000000-0000-0000-0000-000000000001',
  'Pure Linen Shirt - Ivory',
  'pure-linen-shirt-ivory',
  'Luxuriously soft linen shirt in timeless ivory. The 5,000 Hz frequency elevates your natural energy while keeping you cool and comfortable.',
  'Frequency & Form',
  'linen',
  'healing',
  5000,
  89.00,
  NULL,
  'tops',
  ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'],
  50,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Linen Wide-Leg Pants - Natural',
  'linen-wide-leg-pants-natural',
  'Flowing wide-leg linen pants in natural undyed fabric. Feel grounded and energized all day.',
  'Frequency & Form',
  'linen',
  'healing',
  5000,
  99.00,
  NULL,
  'bottoms',
  ARRAY['https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800'],
  35,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Linen Duvet Cover - Sage',
  'linen-duvet-cover-sage',
  'Queen-size linen duvet cover in calming sage. Transform your bedroom into a healing sanctuary.',
  'Frequency & Form',
  'linen',
  'healing',
  5000,
  199.00,
  NULL,
  'bedding',
  ARRAY['https://images.unsplash.com/photo-1616627781431-7e9b9891a838?w=800'],
  20,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Linen Summer Dress - Soft Gray',
  'linen-summer-dress-soft-gray',
  'Effortless linen dress perfect for warm days. The healing frequency keeps you balanced and cool.',
  'Frequency & Form',
  'linen',
  'healing',
  5000,
  119.00,
  139.00,
  'dresses',
  ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
  25,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Linen Kitchen Towels - Set of 3',
  'linen-kitchen-towels-set',
  'Premium linen kitchen towels that get softer with every wash. Natural antibacterial properties.',
  'Frequency & Form',
  'linen',
  'healing',
  5000,
  39.00,
  NULL,
  'kitchen',
  ARRAY['https://images.unsplash.com/photo-1587125882763-4fc458b08c9b?w=800'],
  100,
  'approved'
),

-- ORGANIC COTTON (100 Hz - Foundation Tier)
(
  '00000000-0000-0000-0000-000000000001',
  'Organic Cotton T-Shirt - White',
  'organic-cotton-tshirt-white',
  'Classic organic cotton tee that harmonizes perfectly with your body. Soft, breathable, and never depleting.',
  'Frequency & Form',
  'organic cotton',
  'foundation',
  100,
  39.00,
  NULL,
  'tops',
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
  200,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Organic Cotton Joggers - Charcoal',
  'organic-cotton-joggers-charcoal',
  'Comfortable organic cotton joggers for everyday wear. Foundation-tier fabric that never drains your energy.',
  'Frequency & Form',
  'organic cotton',
  'foundation',
  100,
  69.00,
  NULL,
  'bottoms',
  ARRAY['https://images.unsplash.com/photo-1552902875-9ac1f9fe0c3a?w=800'],
  80,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Organic Cotton Sheets - Cloud White',
  'organic-cotton-sheets-cloud-white',
  'Queen-size organic cotton sheet set. Sleep in perfect harmony with 100 Hz foundation frequency.',
  'Frequency & Form',
  'organic cotton',
  'foundation',
  100,
  129.00,
  NULL,
  'bedding',
  ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800'],
  40,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Organic Cotton Hoodie - Stone',
  'organic-cotton-hoodie-stone',
  'Cozy organic cotton hoodie in neutral stone. Your everyday essential that supports your natural frequency.',
  'Frequency & Form',
  'organic cotton',
  'foundation',
  100,
  79.00,
  NULL,
  'outerwear',
  ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
  60,
  'approved'
),

-- WOOL PRODUCTS (5,000 Hz - Healing Tier)
(
  '00000000-0000-0000-0000-000000000001',
  'Merino Wool Base Layer - Black',
  'merino-wool-base-layer-black',
  'Ultra-soft merino wool base layer. Regulates temperature while elevating your energy to 5,000 Hz.',
  'Frequency & Form',
  'wool',
  'healing',
  5000,
  89.00,
  NULL,
  'tops',
  ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'],
  45,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Wool Blanket - Charcoal Gray',
  'wool-blanket-charcoal-gray',
  'Chunky knit wool blanket for cozy evenings. The healing frequency creates a sanctuary wherever you are.',
  'Frequency & Form',
  'wool',
  'healing',
  5000,
  169.00,
  NULL,
  'bedding',
  ARRAY['https://images.unsplash.com/photo-1540843086637-7f3a33e6f11a?w=800'],
  30,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Cashmere Scarf - Camel',
  'cashmere-scarf-camel',
  'Luxurious cashmere scarf in rich camel. Wrap yourself in the highest healing frequency.',
  'Frequency & Form',
  'cashmere',
  'healing',
  5000,
  149.00,
  179.00,
  'accessories',
  ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800'],
  15,
  'approved'
),

-- HEMP PRODUCTS (5,000 Hz - Healing Tier)
(
  '00000000-0000-0000-0000-000000000001',
  'Hemp T-Shirt - Forest Green',
  'hemp-tshirt-forest-green',
  'Durable hemp tee with incredible breathability. Healing frequency meets sustainability.',
  'Frequency & Form',
  'hemp',
  'healing',
  5000,
  49.00,
  NULL,
  'tops',
  ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
  70,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Hemp Tote Bag - Natural',
  'hemp-tote-bag-natural',
  'Sturdy hemp tote for daily errands. Carry the healing frequency with you everywhere.',
  'Frequency & Form',
  'hemp',
  'healing',
  5000,
  29.00,
  NULL,
  'accessories',
  ARRAY['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800'],
  150,
  'approved'
),

-- SILK PRODUCTS (Healing Tier)
(
  '00000000-0000-0000-0000-000000000001',
  'Silk Pillowcase - Pearl',
  'silk-pillowcase-pearl',
  'Luxurious silk pillowcase that is gentle on skin and hair. Sleep in pure elegance.',
  'Frequency & Form',
  'silk',
  'healing',
  5000,
  59.00,
  NULL,
  'bedding',
  ARRAY['https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800'],
  50,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Silk Camisole - Champagne',
  'silk-camisole-champagne',
  'Delicate silk camisole in soft champagne. Perfect layering piece with natural luster.',
  'Frequency & Form',
  'silk',
  'healing',
  5000,
  79.00,
  NULL,
  'tops',
  ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800'],
  35,
  'approved'
),

-- MORE PRODUCTS
(
  '00000000-0000-0000-0000-000000000001',
  'Linen Apron - Warm Sand',
  'linen-apron-warm-sand',
  'Professional chef apron in beautiful linen. Practical meets healing frequency.',
  'Frequency & Form',
  'linen',
  'healing',
  5000,
  59.00,
  NULL,
  'kitchen',
  ARRAY['https://images.unsplash.com/photo-1608528677772-b0a4dfb57ccb?w=800'],
  40,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Organic Cotton Socks - 3 Pack',
  'organic-cotton-socks-3pack',
  'Premium organic cotton socks. Foundation frequency from head to toe.',
  'Frequency & Form',
  'organic cotton',
  'foundation',
  100,
  24.00,
  NULL,
  'accessories',
  ARRAY['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800'],
  200,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Wool Throw Pillow - Cream',
  'wool-throw-pillow-cream',
  'Handwoven wool throw pillow. Add healing energy to any room.',
  'Frequency & Form',
  'wool',
  'healing',
  5000,
  69.00,
  NULL,
  'home',
  ARRAY['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800'],
  55,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000001',
  'Hemp Yoga Mat - Natural',
  'hemp-yoga-mat-natural',
  'Eco-friendly hemp yoga mat. Practice with the support of 5,000 Hz healing frequency.',
  'Frequency & Form',
  'hemp',
  'healing',
  5000,
  89.00,
  NULL,
  'fitness',
  ARRAY['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800'],
  25,
  'approved'
);

-- Verify products were inserted
SELECT 'Product Seeding Complete!' as status, COUNT(*) as products_added FROM products;

-- Show product breakdown by fabric type
SELECT
  fabric_type,
  tier,
  frequency_hz || ' Hz' as frequency,
  COUNT(*) as count
FROM products
GROUP BY fabric_type, tier, frequency_hz
ORDER BY frequency_hz DESC, fabric_type;
