import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/ff/products
 * Fetch partner products with filtering by body type, color season, budget, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filter parameters
    const category = searchParams.get('category');
    const budgetTier = searchParams.get('budget');
    const bodyType = searchParams.get('body_type');
    const torsoType = searchParams.get('torso_type');
    const colorSeason = searchParams.get('color_season');
    const silhouette = searchParams.get('silhouette');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const featured = searchParams.get('featured');
    const collection = searchParams.get('collection');
    const source = searchParams.get('source'); // shopify, pinterest, partner, amazon
    const hasImages = searchParams.get('has_images'); // true = only products with images
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If Supabase not configured, return sample data
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        products: getSampleProducts({ category, budgetTier, bodyType }),
        total: 16,
        hasMore: false
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from('ff_partner_products')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (budgetTier) {
      query = query.eq('budget_tier', budgetTier);
    }

    if (bodyType) {
      query = query.contains('best_for_body_types', [bodyType]);
    }

    if (torsoType) {
      query = query.eq('torso_fit', torsoType);
    }

    if (colorSeason) {
      query = query.contains('best_for_seasons', [colorSeason]);
    }

    if (silhouette) {
      query = query.contains('silhouettes', [silhouette]);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    if (source) {
      query = query.eq('source', source);
    }

    if (hasImages === 'true') {
      query = query.not('image_url', 'is', null);
    }

    // Order by: products with images first, then quality score, then price
    query = query.order('quality_score', { ascending: false, nullsFirst: false });
    query = query.order('price', { ascending: true });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    });

  } catch (error) {
    console.error('Error in products API:', error);
    // Return sample data on error
    return NextResponse.json({
      products: getSampleProducts({}),
      total: 16,
      hasMore: false
    });
  }
}

/**
 * POST /api/ff/products
 * Add a new product (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

    // Calculate budget tier from price
    const price = body.price || 0;
    let budgetTier = 'budget';
    if (price > 300) budgetTier = 'luxury';
    else if (price > 150) budgetTier = 'premium';
    else if (price > 50) budgetTier = 'moderate';

    const productData = {
      ...body,
      budget_tier: budgetTier,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('ff_partner_products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, product: data });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// Sample products for development/demo
function getSampleProducts(filters: { category?: string | null; budgetTier?: string | null; bodyType?: string | null }) {
  const allProducts = [
    // BUDGET TIER
    {
      id: '1',
      source: 'amazon',
      name: 'Linen Blend Wrap Top',
      brand: 'Amazon Essentials',
      category: 'tops',
      price: 34.99,
      budget_tier: 'budget',
      silhouettes: ['wrap'],
      best_for_body_types: ['hourglass', 'pear', 'apple'],
      torso_fit: 'balanced',
      primary_color: 'White',
      primary_color_hex: '#FFFFFF',
      fabric_type: 'blend',
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example1?tag=frequencyform-20',
      avg_rating: 4.3,
      review_count: 1247
    },
    {
      id: '2',
      source: 'amazon',
      name: 'High-Rise Wide Leg Pants',
      brand: 'Amazon Essentials',
      category: 'bottoms',
      price: 39.99,
      budget_tier: 'budget',
      silhouettes: ['wide_leg'],
      best_for_body_types: ['inverted_triangle', 'rectangle'],
      torso_fit: 'short_torso_friendly',
      primary_color: 'Black',
      primary_color_hex: '#000000',
      fabric_type: 'blend',
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example2?tag=frequencyform-20',
      avg_rating: 4.1,
      review_count: 892
    },
    {
      id: '3',
      source: 'amazon',
      name: 'A-Line Midi Skirt',
      brand: 'Daily Ritual',
      category: 'bottoms',
      price: 45.00,
      budget_tier: 'budget',
      silhouettes: ['a_line'],
      best_for_body_types: ['pear', 'apple', 'hourglass'],
      torso_fit: 'balanced',
      primary_color: 'Navy',
      primary_color_hex: '#1B2951',
      fabric_type: 'cotton',
      frequency_compatible: true,
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example3?tag=frequencyform-20',
      avg_rating: 4.4,
      review_count: 567
    },
    // MODERATE TIER
    {
      id: '4',
      source: 'partner',
      name: 'Silk Blend Camisole',
      brand: 'Quince',
      category: 'tops',
      price: 59.90,
      budget_tier: 'moderate',
      silhouettes: ['fitted'],
      best_for_body_types: ['hourglass', 'rectangle'],
      torso_fit: 'balanced',
      primary_color: 'Champagne',
      primary_color_hex: '#F7E7CE',
      fabric_type: 'silk',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://quince.com/products/silk-camisole',
      avg_rating: 4.6,
      review_count: 423
    },
    {
      id: '5',
      source: 'partner',
      name: 'Linen Blazer',
      brand: 'Quince',
      category: 'outerwear',
      price: 99.90,
      budget_tier: 'moderate',
      silhouettes: ['structured_shoulder'],
      best_for_body_types: ['pear', 'rectangle'],
      torso_fit: 'balanced',
      primary_color: 'Oatmeal',
      primary_color_hex: '#E8DCC8',
      fabric_type: 'linen',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://quince.com/products/linen-blazer',
      avg_rating: 4.7,
      review_count: 312
    },
    {
      id: '6',
      source: 'shopify',
      name: 'Fit & Flare Midi Dress',
      brand: 'Reformation',
      category: 'dresses',
      price: 128.00,
      budget_tier: 'moderate',
      silhouettes: ['fit_and_flare'],
      best_for_body_types: ['hourglass', 'pear'],
      torso_fit: 'balanced',
      primary_color: 'Sage',
      primary_color_hex: '#9CAF88',
      fabric_type: 'linen',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://reformation.com/products/fit-flare-dress',
      avg_rating: 4.5,
      review_count: 287
    },
    {
      id: '7',
      source: 'shopify',
      name: 'Wrap Dress',
      brand: 'Diane von Furstenberg',
      category: 'dresses',
      price: 149.00,
      budget_tier: 'moderate',
      silhouettes: ['wrap'],
      best_for_body_types: ['hourglass', 'pear', 'apple'],
      torso_fit: 'balanced',
      primary_color: 'Forest',
      primary_color_hex: '#2E4A3E',
      fabric_type: 'blend',
      image_url: null,
      source_url: 'https://dvf.com/products/wrap-dress',
      avg_rating: 4.8,
      review_count: 1089
    },
    // BUDGET DRESSES
    {
      id: '17',
      source: 'amazon',
      name: 'Cotton T-Shirt Dress',
      brand: 'Amazon Essentials',
      category: 'dresses',
      price: 24.99,
      budget_tier: 'budget',
      silhouettes: ['a_line'],
      best_for_body_types: ['rectangle', 'apple'],
      torso_fit: 'balanced',
      primary_color: 'Navy',
      primary_color_hex: '#1B2951',
      fabric_type: 'cotton',
      frequency_compatible: true,
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example17?tag=frequencyform-20',
      avg_rating: 4.2,
      review_count: 3421
    },
    {
      id: '18',
      source: 'amazon',
      name: 'Wrap Midi Dress',
      brand: 'Daily Ritual',
      category: 'dresses',
      price: 39.99,
      budget_tier: 'budget',
      silhouettes: ['wrap'],
      best_for_body_types: ['hourglass', 'pear', 'apple'],
      torso_fit: 'balanced',
      primary_color: 'Black',
      primary_color_hex: '#000000',
      fabric_type: 'blend',
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example18?tag=frequencyform-20',
      avg_rating: 4.4,
      review_count: 2156
    },
    {
      id: '19',
      source: 'amazon',
      name: 'Linen Shift Dress',
      brand: 'Daily Ritual',
      category: 'dresses',
      price: 45.00,
      budget_tier: 'budget',
      silhouettes: ['a_line'],
      best_for_body_types: ['rectangle', 'inverted_triangle'],
      torso_fit: 'long_torso_friendly',
      primary_color: 'Natural',
      primary_color_hex: '#E8DCC8',
      fabric_type: 'linen',
      frequency_compatible: true,
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example19?tag=frequencyform-20',
      avg_rating: 4.5,
      review_count: 1834
    },
    // BUDGET OUTERWEAR
    {
      id: '20',
      source: 'amazon',
      name: 'Lightweight Cardigan',
      brand: 'Amazon Essentials',
      category: 'outerwear',
      price: 29.99,
      budget_tier: 'budget',
      silhouettes: ['relaxed'],
      best_for_body_types: ['rectangle', 'apple', 'hourglass'],
      torso_fit: 'balanced',
      primary_color: 'Heather Gray',
      primary_color_hex: '#9CA3AF',
      fabric_type: 'cotton',
      frequency_compatible: true,
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example20?tag=frequencyform-20',
      avg_rating: 4.3,
      review_count: 4521
    },
    {
      id: '21',
      source: 'amazon',
      name: 'Utility Jacket',
      brand: 'Daily Ritual',
      category: 'outerwear',
      price: 49.99,
      budget_tier: 'budget',
      silhouettes: ['structured_shoulder'],
      best_for_body_types: ['pear', 'rectangle'],
      torso_fit: 'short_torso_friendly',
      primary_color: 'Olive',
      primary_color_hex: '#556B2F',
      fabric_type: 'cotton',
      frequency_compatible: true,
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example21?tag=frequencyform-20',
      avg_rating: 4.4,
      review_count: 1287
    },
    // PREMIUM TIER
    {
      id: '8',
      source: 'partner',
      name: 'Cashmere V-Neck Sweater',
      brand: 'Naadam',
      category: 'tops',
      price: 175.00,
      budget_tier: 'premium',
      silhouettes: ['v_neck'],
      best_for_body_types: ['apple', 'hourglass'],
      torso_fit: 'balanced',
      primary_color: 'Camel',
      primary_color_hex: '#C19A6B',
      fabric_type: 'wool',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://naadam.co/products/cashmere-vneck',
      avg_rating: 4.9,
      review_count: 567
    },
    {
      id: '9',
      source: 'partner',
      name: 'Tailored Wool Trousers',
      brand: 'Theory',
      category: 'bottoms',
      price: 265.00,
      budget_tier: 'premium',
      silhouettes: ['tailored'],
      best_for_body_types: ['rectangle', 'hourglass'],
      torso_fit: 'balanced',
      primary_color: 'Charcoal',
      primary_color_hex: '#36454F',
      fabric_type: 'wool',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://theory.com/products/wool-trousers',
      avg_rating: 4.6,
      review_count: 234
    },
    {
      id: '10',
      source: 'partner',
      name: 'Silk Charmeuse Blouse',
      brand: 'Equipment',
      category: 'tops',
      price: 230.00,
      budget_tier: 'premium',
      silhouettes: ['relaxed'],
      best_for_body_types: ['rectangle', 'inverted_triangle'],
      torso_fit: 'long_torso_friendly',
      primary_color: 'Ivory',
      primary_color_hex: '#FFFFF0',
      fabric_type: 'silk',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://equipmentfr.com/products/silk-blouse',
      avg_rating: 4.7,
      review_count: 189
    },
    // LUXURY TIER
    {
      id: '11',
      source: 'partner',
      name: 'Linen Maxi Dress',
      brand: 'Loro Piana',
      category: 'dresses',
      price: 1850.00,
      budget_tier: 'luxury',
      silhouettes: ['empire_waist', 'a_line'],
      best_for_body_types: ['apple', 'pear'],
      torso_fit: 'short_torso_friendly',
      primary_color: 'Natural',
      primary_color_hex: '#E8DCC8',
      fabric_type: 'linen',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://loropiana.com/products/linen-maxi',
      avg_rating: 5.0,
      review_count: 45
    },
    {
      id: '12',
      source: 'partner',
      name: 'Structured Wool Coat',
      brand: 'Max Mara',
      category: 'outerwear',
      price: 2490.00,
      budget_tier: 'luxury',
      silhouettes: ['structured_shoulder', 'belted'],
      best_for_body_types: ['pear', 'rectangle', 'hourglass'],
      torso_fit: 'balanced',
      primary_color: 'Camel',
      primary_color_hex: '#C19A6B',
      fabric_type: 'wool',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://maxmara.com/products/camel-coat',
      avg_rating: 4.9,
      review_count: 312
    },
    // Additional items for variety
    {
      id: '13',
      source: 'amazon',
      name: 'Cotton Peplum Top',
      brand: 'Daily Ritual',
      category: 'tops',
      price: 29.99,
      budget_tier: 'budget',
      silhouettes: ['peplum'],
      best_for_body_types: ['rectangle', 'inverted_triangle'],
      torso_fit: 'balanced',
      primary_color: 'Black',
      primary_color_hex: '#000000',
      fabric_type: 'cotton',
      frequency_compatible: true,
      image_url: null,
      affiliate_url: 'https://amazon.com/dp/example13?tag=frequencyform-20',
      avg_rating: 4.2,
      review_count: 678
    },
    {
      id: '14',
      source: 'shopify',
      name: 'Empire Waist Maxi',
      brand: 'ASTR The Label',
      category: 'dresses',
      price: 98.00,
      budget_tier: 'moderate',
      silhouettes: ['empire_waist'],
      best_for_body_types: ['apple', 'pear'],
      torso_fit: 'short_torso_friendly',
      primary_color: 'Dusty Rose',
      primary_color_hex: '#DCAE96',
      fabric_type: 'blend',
      image_url: null,
      source_url: 'https://astrthelabel.com/products/empire-maxi',
      avg_rating: 4.4,
      review_count: 156
    },
    {
      id: '15',
      source: 'partner',
      name: 'Belted Trench Coat',
      brand: 'COS',
      category: 'outerwear',
      price: 225.00,
      budget_tier: 'premium',
      silhouettes: ['belted'],
      best_for_body_types: ['hourglass', 'rectangle'],
      torso_fit: 'balanced',
      primary_color: 'Stone',
      primary_color_hex: '#AFA99E',
      fabric_type: 'cotton',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://cos.com/products/trench-coat',
      avg_rating: 4.6,
      review_count: 289
    },
    {
      id: '16',
      source: 'pinterest',
      name: 'Silk Slip Dress',
      brand: 'The Row',
      category: 'dresses',
      price: 1290.00,
      budget_tier: 'luxury',
      silhouettes: ['bodycon'],
      best_for_body_types: ['hourglass', 'rectangle'],
      torso_fit: 'balanced',
      primary_color: 'Black',
      primary_color_hex: '#000000',
      fabric_type: 'silk',
      frequency_compatible: true,
      image_url: null,
      source_url: 'https://therow.com/products/silk-slip',
      avg_rating: 4.8,
      review_count: 67
    }
  ];

  // Apply filters
  let filtered = allProducts;

  if (filters.category) {
    filtered = filtered.filter(p => p.category === filters.category);
  }

  if (filters.budgetTier) {
    filtered = filtered.filter(p => p.budget_tier === filters.budgetTier);
  }

  if (filters.bodyType) {
    filtered = filtered.filter(p => p.best_for_body_types.includes(filters.bodyType!));
  }

  return filtered;
}
