/**
 * FF Style Studio - Virtual Closet API
 * Manage virtual closet items
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

// GET: Retrieve closet items
export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('ff_closet_items')
      .select(`
        *,
        design:ff_custom_designs(*)
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      items: data || [],
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('[Closet API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve closet items', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Add item to closet
export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const body = await request.json();
    const {
      userId,
      source, // 'ff_custom' or 'external'
      designId, // If FF custom design
      name,
      category,
      colorPrimary,
      fabricType,
      imageUrl
    } = body;

    if (!userId || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, source' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ff_closet_items')
      .insert({
        user_id: userId,
        source,
        design_id: designId,
        name,
        category,
        color_primary: colorPrimary,
        fabric_type: fabricType,
        image_url: imageUrl,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      item: data
    });

  } catch (error: any) {
    console.error('[Closet API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to closet', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update closet item
export async function PUT(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const body = await request.json();
    const { itemId, ...updates } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ff_closet_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      item: data
    });

  } catch (error: any) {
    console.error('[Closet API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update closet item', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Archive closet item
export async function DELETE(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId parameter' },
        { status: 400 }
      );
    }

    // Archive instead of delete
    const { error } = await supabase
      .from('ff_closet_items')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Item archived successfully'
    });

  } catch (error: any) {
    console.error('[Closet API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to archive item', details: error.message },
      { status: 500 }
    );
  }
}
