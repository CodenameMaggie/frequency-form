import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/ff/custom-designs
 * Fetch F&F design catalog
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const bodyType = searchParams.get('body_type');
    const featured = searchParams.get('featured');

    // Return sample data if Supabase not configured
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        designs: getSampleDesigns({ category, collection, bodyType, featured }),
        collections: ['essentials', 'elevated', 'signature']
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('ff_design_catalog')
      .select('*')
      .eq('status', 'active');

    if (category) query = query.eq('category', category);
    if (collection) query = query.eq('collection', collection);
    if (bodyType) query = query.contains('best_for_body_types', [bodyType]);
    if (featured === 'true') query = query.eq('featured', true);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      designs: data || [],
      collections: ['essentials', 'elevated', 'signature']
    });

  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({
      designs: getSampleDesigns({}),
      collections: ['essentials', 'elevated', 'signature']
    });
  }
}

// Sample F&F designs
function getSampleDesigns(filters: { category?: string | null; collection?: string | null; bodyType?: string | null; featured?: string | null }) {
  const designs = [
    {
      id: 'design-1',
      name: 'The Classic Wrap Blouse',
      slug: 'classic-wrap-blouse',
      collection: 'essentials',
      category: 'tops',
      garment_type: 'blouse',
      description: 'A timeless wrap blouse that flatters every figure. The adjustable tie allows for a customized fit at the waist.',
      design_story: 'Inspired by the iconic 1970s wrap silhouette, reimagined in high-frequency natural fabrics for the modern woman.',
      silhouette: 'wrap',
      fit: 'regular',
      best_for_body_types: ['hourglass', 'pear', 'apple', 'rectangle'],
      best_for_torso: 'all',
      best_for_occasions: ['work', 'casual', 'date_night'],
      customizable_options: {
        neckline: { options: ['v_neck', 'crossover'], default: 'v_neck' },
        sleeve_length: { options: ['sleeveless', 'cap', 'short', '3/4', 'long'], default: 'short', price_adj: { long: 20, '3/4': 10 } },
        hem: { options: ['straight', 'curved', 'peplum'], default: 'curved', price_adj: { peplum: 25 } }
      },
      base_price: 145.00,
      complexity: 'moderate',
      featured: true,
      bestseller: true
    },
    {
      id: 'design-2',
      name: 'The Everyday A-Line Dress',
      slug: 'everyday-aline-dress',
      collection: 'essentials',
      category: 'dresses',
      garment_type: 'dress',
      description: 'An effortless A-line silhouette that moves beautifully. Perfect from desk to dinner.',
      design_story: 'Designed for the woman who wants to feel put-together without trying too hard.',
      silhouette: 'a_line',
      fit: 'relaxed',
      best_for_body_types: ['pear', 'apple', 'rectangle'],
      best_for_torso: 'all',
      best_for_occasions: ['work', 'casual', 'travel', 'weekend'],
      customizable_options: {
        neckline: { options: ['crew', 'v_neck', 'boat', 'scoop'], default: 'boat' },
        sleeve_length: { options: ['sleeveless', 'cap', 'short', '3/4'], default: 'cap', price_adj: { '3/4': 15 } },
        length: { options: ['knee', 'midi'], default: 'knee', price_adj: { midi: 30 } },
        pockets: { options: [true, false], default: true, price_adj: { true: 20 } }
      },
      base_price: 195.00,
      complexity: 'moderate',
      featured: true
    },
    {
      id: 'design-3',
      name: 'The Tailored Wide Leg Pant',
      slug: 'tailored-wide-leg',
      collection: 'essentials',
      category: 'bottoms',
      garment_type: 'pants',
      description: 'High-waisted wide leg pants that elongate and flatter. A wardrobe staple.',
      design_story: 'For the woman who knows that great pants are the foundation of great style.',
      silhouette: 'wide_leg',
      fit: 'tailored',
      best_for_body_types: ['inverted_triangle', 'rectangle', 'hourglass'],
      best_for_torso: 'short',
      best_for_occasions: ['work', 'evening', 'travel'],
      customizable_options: {
        rise: { options: ['high', 'mid'], default: 'high' },
        length: { options: ['ankle', 'full'], default: 'full', price_adj: { full: 15 } },
        waistband: { options: ['fitted', 'elastic_back'], default: 'fitted' },
        pockets: { options: ['side_seam', 'none'], default: 'side_seam' }
      },
      base_price: 175.00,
      complexity: 'moderate',
      featured: true
    },
    {
      id: 'design-4',
      name: 'The Silk Slip Dress',
      slug: 'silk-slip-dress',
      collection: 'elevated',
      category: 'dresses',
      garment_type: 'dress',
      description: 'A bias-cut slip dress in luxurious silk. Elegantly simple, endlessly versatile.',
      design_story: 'The dress that launched a thousand outfit combinations. Layer it, accessorize it, make it yours.',
      silhouette: 'bodycon',
      fit: 'fitted',
      best_for_body_types: ['hourglass', 'rectangle'],
      best_for_torso: 'balanced',
      best_for_occasions: ['evening', 'date_night', 'wedding_guest'],
      customizable_options: {
        neckline: { options: ['cowl', 'v_neck', 'straight'], default: 'cowl' },
        back: { options: ['low', 'mid', 'high'], default: 'low' },
        length: { options: ['mini', 'knee', 'midi', 'maxi'], default: 'midi', price_adj: { maxi: 45 } },
        slit: { options: [true, false], default: false, price_adj: { true: 25 } }
      },
      base_price: 285.00,
      complexity: 'complex',
      featured: true
    },
    {
      id: 'design-5',
      name: 'The Structured Blazer',
      slug: 'structured-blazer',
      collection: 'elevated',
      category: 'outerwear',
      garment_type: 'jacket',
      description: 'A perfectly tailored blazer with subtle shoulder structure. The power piece.',
      design_story: 'Because every woman deserves a blazer that makes her feel unstoppable.',
      silhouette: 'structured_shoulder',
      fit: 'tailored',
      best_for_body_types: ['pear', 'rectangle', 'apple'],
      best_for_torso: 'all',
      best_for_occasions: ['work', 'evening', 'formal'],
      customizable_options: {
        lapel: { options: ['notch', 'peak', 'shawl'], default: 'notch', price_adj: { peak: 20, shawl: 25 } },
        length: { options: ['cropped', 'hip', 'long'], default: 'hip', price_adj: { long: 35 } },
        buttons: { options: ['single', 'double'], default: 'single', price_adj: { double: 15 } },
        lining: { options: ['full', 'half', 'unlined'], default: 'half', price_adj: { full: 30 } }
      },
      base_price: 325.00,
      complexity: 'complex',
      featured: true
    },
    {
      id: 'design-6',
      name: 'The Linen Maxi',
      slug: 'linen-maxi',
      collection: 'signature',
      category: 'dresses',
      garment_type: 'dress',
      description: 'Our signature linen maxi dress. Effortless elegance meets high-frequency living.',
      design_story: 'The dress that started it all. Pure linen, pure intention, pure style.',
      silhouette: 'empire_waist',
      fit: 'relaxed',
      best_for_body_types: ['apple', 'pear', 'hourglass'],
      best_for_torso: 'short',
      best_for_occasions: ['resort', 'weekend', 'wedding_guest', 'special_occasion'],
      customizable_options: {
        neckline: { options: ['v_neck', 'square', 'sweetheart'], default: 'v_neck' },
        sleeve: { options: ['sleeveless', 'flutter', 'cap', 'long_bell'], default: 'flutter', price_adj: { long_bell: 30 } },
        back: { options: ['open', 'keyhole', 'closed'], default: 'keyhole' },
        tiered: { options: [true, false], default: true, price_adj: { true: 40 } }
      },
      base_price: 345.00,
      complexity: 'complex',
      featured: true,
      bestseller: true
    },
    {
      id: 'design-7',
      name: 'The Perfect Trench',
      slug: 'perfect-trench',
      collection: 'signature',
      category: 'outerwear',
      garment_type: 'coat',
      description: 'A reimagined trench in natural fibers. The forever coat.',
      design_story: 'We spent two years perfecting this trench. The result speaks for itself.',
      silhouette: 'belted',
      fit: 'regular',
      best_for_body_types: ['hourglass', 'rectangle', 'pear'],
      best_for_torso: 'balanced',
      best_for_occasions: ['work', 'travel', 'everyday'],
      customizable_options: {
        length: { options: ['short', 'classic', 'long'], default: 'classic', price_adj: { long: 65 } },
        collar: { options: ['classic', 'stand', 'hood'], default: 'classic', price_adj: { hood: 45 } },
        cuffs: { options: ['belted', 'button', 'open'], default: 'belted' },
        lining: { options: ['full_silk', 'full_cotton', 'partial'], default: 'full_cotton', price_adj: { full_silk: 85 } }
      },
      base_price: 425.00,
      complexity: 'complex',
      featured: true
    }
  ];

  let filtered = designs;

  if (filters.category) {
    filtered = filtered.filter(d => d.category === filters.category);
  }
  if (filters.collection) {
    filtered = filtered.filter(d => d.collection === filters.collection);
  }
  if (filters.bodyType) {
    filtered = filtered.filter(d => d.best_for_body_types.includes(filters.bodyType!));
  }
  if (filters.featured === 'true') {
    filtered = filtered.filter(d => d.featured);
  }

  return filtered;
}
