-- =====================================================
-- FREQUENCY & FORM - SAMPLE PRODUCT SEEDING
-- Seeds 20 sample products across different fabric types
-- Run AFTER marketplace-schema.sql
-- =====================================================

-- First, ensure Frequency & Form house brand exists
INSERT INTO brand_partners (
  id,
  email,
  brand_name,
  brand_slug,
  description,
  origin_country,
  contact_name,
  contact_email,
  status,
  commission_rate,
  is_founding_partner,
  approved_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'concierge@frequencyandform.com',
  'Frequency & Form',
  'frequency-and-form',
  'Curated natural fiber clothing based on fabric frequency science',
  'United States',
  'Frequency & Form Team',
  'concierge@frequencyandform.com',
  'approved',
  0, -- House brand pays no commission
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Seed 20 sample products
INSERT INTO products (
  brand_partner_id,
  name,
  description,
  fabric_type,
  fabric_frequency,
  price,
  compare_at_price,
  category,
  subcategory,
  images,
  stock,
  approval_status,
  is_active,
  approved_at
) VALUES
-- LINEN PRODUCTS (5,000 Hz - Healing Tier)
(
  '00000000-0000-0000-0000-000000000002',
  'Pure Linen Shirt - Ivory',
  'Luxuriously soft linen shirt in timeless ivory. The 5,000 Hz frequency elevates your natural energy while keeping you cool and comfortable.',
  'linen',
  5000,
  8900, -- $89
  NULL,
  'clothing',
  'tops',
  ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c'],
  50,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Linen Wide-Leg Pants - Natural',
  'Flowing wide-leg linen pants in natural undyed fabric. Feel grounded and energized all day.',
  'linen',
  5000,
  9900,
  NULL,
  'clothing',
  'bottoms',
  ARRAY['https://images.unsplash.com/photo-1594633313593-bab3825d0caf'],
  35,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Linen Duvet Cover - Sage',
  'Queen-size linen duvet cover in calming sage. Transform your bedroom into a healing sanctuary.',
  'linen',
  5000,
  19900,
  NULL,
  'home',
  'bedding',
  ARRAY['https://images.unsplash.com/photo-1616627781431-7e9b9891a838'],
  20,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Linen Summer Dress - Soft Gray',
  'Effortless linen dress perfect for warm days. The healing frequency keeps you balanced and cool.',
  'linen',
  5000,
  11900,
  13900,
  'clothing',
  'dresses',
  ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8'],
  25,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Linen Kitchen Towels - Set of 3',
  'Premium linen kitchen towels that get softer with every wash. Natural antibacterial properties.',
  'linen',
  5000,
  3900,
  NULL,
  'home',
  'kitchen',
  ARRAY['https://images.unsplash.com/photo-1587125882763-4fc458b08c9b'],
  100,
  'approved',
  true,
  NOW()
),

-- ORGANIC COTTON (100 Hz - Foundation Tier)
(
  '00000000-0000-0000-0000-000000000002',
  'Organic Cotton T-Shirt - White',
  'Classic organic cotton tee that harmonizes perfectly with your body. Soft, breathable, and never depleting.',
  'organic_cotton',
  100,
  3900,
  NULL,
  'clothing',
  'tops',
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'],
  200,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Organic Cotton Joggers - Charcoal',
  'Comfortable organic cotton joggers for everyday wear. Foundation-tier fabric that never drains your energy.',
  'organic_cotton',
  100,
  6900,
  NULL,
  'clothing',
  'bottoms',
  ARRAY['https://images.unsplash.com/photo-1552902875-9ac1f9fe0c3a'],
  80,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Organic Cotton Sheets - Cloud White',
  'Queen-size organic cotton sheet set. Sleep in perfect harmony with 100 Hz foundation frequency.',
  'organic_cotton',
  100,
  12900,
  NULL,
  'home',
  'bedding',
  ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8'],
  40,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Organic Cotton Hoodie - Stone',
  'Cozy organic cotton hoodie in neutral stone. Your everyday essential that supports your natural frequency.',
  'organic_cotton',
  100,
  7900,
  NULL,
  'clothing',
  'outerwear',
  ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7'],
  60,
  'approved',
  true,
  NOW()
),

-- WOOL PRODUCTS (5,000 Hz - Healing Tier)
(
  '00000000-0000-0000-0000-000000000002',
  'Merino Wool Base Layer - Black',
  'Ultra-soft merino wool base layer. Regulates temperature while elevating your energy to 5,000 Hz.',
  'wool',
  5000,
  8900,
  NULL,
  'clothing',
  'tops',
  ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27'],
  45,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Wool Blanket - Charcoal Gray',
  'Chunky knit wool blanket for cozy evenings. The healing frequency creates a sanctuary wherever you are.',
  'wool',
  5000,
  16900,
  NULL,
  'home',
  'bedding',
  ARRAY['https://images.unsplash.com/photo-1540843086637-7f3a33e6f11a'],
  30,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Cashmere Scarf - Camel',
  'Luxurious cashmere scarf in rich camel. Wrap yourself in the highest healing frequency.',
  'cashmere',
  5000,
  14900,
  17900,
  'accessories',
  'scarves',
  ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9'],
  15,
  'approved',
  true,
  NOW()
),

-- HEMP PRODUCTS (5,000 Hz - Healing Tier)
(
  '00000000-0000-0000-0000-000000000002',
  'Hemp T-Shirt - Forest Green',
  'Durable hemp tee with incredible breathability. Healing frequency meets sustainability.',
  'hemp',
  5000,
  4900,
  NULL,
  'clothing',
  'tops',
  ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a'],
  70,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Hemp Tote Bag - Natural',
  'Sturdy hemp tote for daily errands. Carry the healing frequency with you everywhere.',
  'hemp',
  5000,
  2900,
  NULL,
  'accessories',
  'bags',
  ARRAY['https://images.unsplash.com/photo-1590874103328-eac38a683ce7'],
  150,
  'approved',
  true,
  NOW()
),

-- SILK PRODUCTS (15 Hz - Special)
(
  '00000000-0000-0000-0000-000000000002',
  'Silk Pillowcase - Pearl',
  'Luxurious silk pillowcase that's gentle on skin and hair. Sleep in pure elegance.',
  'silk',
  15,
  5900,
  NULL,
  'home',
  'bedding',
  ARRAY['https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae'],
  50,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Silk Camisole - Champagne',
  'Delicate silk camisole in soft champagne. Perfect layering piece with natural luster.',
  'silk',
  15,
  7900,
  NULL,
  'clothing',
  'tops',
  ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1'],
  35,
  'approved',
  true,
  NOW()
),

-- MIXED NATURAL FIBER PRODUCTS
(
  '00000000-0000-0000-0000-000000000002',
  'Linen Apron - Warm Sand',
  'Professional chef''s apron in beautiful linen. Practical meets healing frequency.',
  'linen',
  5000,
  5900,
  NULL,
  'home',
  'kitchen',
  ARRAY['https://images.unsplash.com/photo-1608528677772-b0a4dfb57ccb'],
  40,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Organic Cotton Socks - 3 Pack',
  'Premium organic cotton socks. Foundation frequency from head to toe.',
  'organic_cotton',
  100,
  2400,
  NULL,
  'accessories',
  'socks',
  ARRAY['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82'],
  200,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Wool Throw Pillow - Cream',
  'Handwoven wool throw pillow. Add healing energy to any room.',
  'wool',
  5000,
  6900,
  NULL,
  'home',
  'decor',
  ARRAY['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2'],
  55,
  'approved',
  true,
  NOW()
),
(
  '00000000-0000-0000-0000-000000000002',
  'Hemp Yoga Mat - Natural',
  'Eco-friendly hemp yoga mat. Practice with the support of 5,000 Hz healing frequency.',
  'hemp',
  5000,
  8900,
  NULL,
  'accessories',
  'fitness',
  ARRAY['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f'],
  25,
  'approved',
  true,
  NOW()
);

-- Verify products were inserted
SELECT
    'Product Seeding Complete' as status,
    COUNT(*) as products_added,
    '✅ Ready to launch marketplace' as next_step
FROM products
WHERE brand_partner_id = '00000000-0000-0000-0000-000000000002';

-- Show product breakdown by fabric type
SELECT
    fabric_type,
    fabric_frequency || ' Hz' as frequency,
    COUNT(*) as product_count,
    '$' || (SUM(price) / 100.0) as total_value
FROM products
WHERE brand_partner_id = '00000000-0000-0000-0000-000000000002'
GROUP BY fabric_type, fabric_frequency
ORDER BY fabric_frequency DESC, fabric_type;
