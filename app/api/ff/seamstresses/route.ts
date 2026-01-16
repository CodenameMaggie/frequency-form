import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * GET /api/ff/seamstresses
 * Fetch seamstress network (for admin/matching purposes)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const specialty = searchParams.get('specialty');
    const state = searchParams.get('state');
    const priceTier = searchParams.get('price_tier');

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        seamstresses: getSampleSeamstresses({ specialty, state, priceTier })
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('ff_seamstresses')
      .select('*')
      .eq('partnership_status', 'active');

    if (specialty) query = query.contains('specialties', [specialty]);
    if (state) query = query.eq('state', state);
    if (priceTier) query = query.eq('price_tier', priceTier);

    const { data, error } = await query.order('avg_rating', { ascending: false, nullsFirst: false });

    if (error) throw error;

    return NextResponse.json({ seamstresses: data || [] });

  } catch (error) {
    console.error('Error fetching seamstresses:', error);
    return NextResponse.json({ seamstresses: getSampleSeamstresses({}) });
  }
}

function getSampleSeamstresses(filters: { specialty?: string | null; state?: string | null; priceTier?: string | null }) {
  const seamstresses = [
    {
      id: 'seam-1',
      business_name: 'Stitch & Story Atelier',
      owner_name: 'Maria Santos',
      city: 'Los Angeles',
      state: 'CA',
      specialties: ['dresses', 'blouses', 'bridal'],
      fabric_expertise: ['silk', 'linen', 'cotton'],
      price_tier: 'premium',
      quality_tier: 'atelier',
      lead_time_simple: 10,
      lead_time_moderate: 18,
      lead_time_complex: 28,
      avg_rating: 4.9,
      total_orders: 156,
      verified: true,
      capacity_per_month: 8,
      current_queue: 3
    },
    {
      id: 'seam-2',
      business_name: 'Modern Maker Studio',
      owner_name: 'Jennifer Chen',
      city: 'Brooklyn',
      state: 'NY',
      specialties: ['tailoring', 'coats', 'pants'],
      fabric_expertise: ['wool', 'cotton', 'linen'],
      price_tier: 'moderate',
      quality_tier: 'premium',
      lead_time_simple: 12,
      lead_time_moderate: 21,
      lead_time_complex: 35,
      avg_rating: 4.8,
      total_orders: 234,
      verified: true,
      capacity_per_month: 12,
      current_queue: 7
    },
    {
      id: 'seam-3',
      business_name: 'Southern Seams',
      owner_name: 'Ashley Williams',
      city: 'Nashville',
      state: 'TN',
      specialties: ['dresses', 'skirts', 'alterations'],
      fabric_expertise: ['cotton', 'linen', 'blend'],
      price_tier: 'moderate',
      quality_tier: 'standard',
      lead_time_simple: 14,
      lead_time_moderate: 24,
      lead_time_complex: 38,
      avg_rating: 4.6,
      total_orders: 312,
      verified: true,
      capacity_per_month: 15,
      current_queue: 9
    },
    {
      id: 'seam-4',
      business_name: 'Pacific Patterns',
      owner_name: 'Yuki Tanaka',
      city: 'Portland',
      state: 'OR',
      specialties: ['minimalist', 'sustainable', 'dresses', 'tops'],
      fabric_expertise: ['linen', 'hemp', 'organic_cotton'],
      price_tier: 'premium',
      quality_tier: 'premium',
      lead_time_simple: 14,
      lead_time_moderate: 21,
      lead_time_complex: 30,
      avg_rating: 4.9,
      total_orders: 98,
      verified: true,
      capacity_per_month: 10,
      current_queue: 5
    }
  ];

  let filtered = seamstresses;

  if (filters.specialty) {
    filtered = filtered.filter(s => s.specialties.includes(filters.specialty!));
  }
  if (filters.state) {
    filtered = filtered.filter(s => s.state === filters.state);
  }
  if (filters.priceTier) {
    filtered = filtered.filter(s => s.price_tier === filters.priceTier);
  }

  return filtered;
}
