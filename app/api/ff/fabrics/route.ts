/**
 * FF Style Studio - Fabrics API
 * Browse available natural fiber fabrics with healing frequencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // linen, cotton, wool, silk, hemp
    const frequencyTier = searchParams.get('frequencyTier'); // highest, high, medium
    const inStockOnly = searchParams.get('inStockOnly') === 'true';

    let query = supabase
      .from('ff_fabrics')
      .select('*')
      .eq('active', true)
      .order('frequency_hz', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (frequencyTier) {
      query = query.eq('frequency_tier', frequencyTier);
    }

    if (inStockOnly) {
      query = query.eq('in_stock', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      fabrics: data || [],
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('[Fabrics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve fabrics', details: error.message },
      { status: 500 }
    );
  }
}
