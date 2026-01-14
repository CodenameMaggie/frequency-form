/**
 * FF Style Studio - Custom Designs API
 * Manage user's custom clothing designs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

// GET: Retrieve user's designs
export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // draft, saved, in_cart, ordered, etc.
    const category = searchParams.get('category'); // tops, bottoms, dresses, etc.

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('ff_custom_designs')
      .select(`
        *,
        primary_fabric:ff_fabrics!primary_fabric_id(*),
        base_template:ff_design_templates(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      designs: data || []
    });

  } catch (error: any) {
    console.error('[Designs API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve designs', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new design
export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const body = await request.json();
    const {
      userId,
      designName,
      category,
      baseTemplateId,
      canvasJson,
      silhouette,
      neckline,
      sleeveStyle,
      sleeveLength,
      hemLength,
      fit,
      primaryFabricId,
      primaryColor,
      designElements
    } = body;

    if (!userId || !designName || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, designName, category' },
        { status: 400 }
      );
    }

    // Calculate estimated price (simplified)
    let estimatedPrice = 185.00; // Base price
    if (primaryFabricId) {
      const { data: fabric } = await supabase
        .from('ff_fabrics')
        .select('price_per_yard, estimated_fabric_yards')
        .eq('id', primaryFabricId)
        .single();

      if (fabric) {
        const fabricCost = fabric.price_per_yard * (fabric.estimated_fabric_yards || 2.5);
        const laborCost = 95.00;
        estimatedPrice = fabricCost + laborCost;
      }
    }

    const { data, error } = await supabase
      .from('ff_custom_designs')
      .insert({
        user_id: userId,
        design_name: designName,
        category,
        base_template_id: baseTemplateId,
        canvas_json: canvasJson,
        silhouette,
        neckline,
        sleeve_style: sleeveStyle,
        sleeve_length: sleeveLength,
        hem_length: hemLength,
        fit,
        primary_fabric_id: primaryFabricId,
        primary_color: primaryColor,
        design_elements: designElements,
        estimated_price: estimatedPrice,
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      design: data
    });

  } catch (error: any) {
    console.error('[Designs API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create design', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update existing design
export async function PUT(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const body = await request.json();
    const { designId, ...updates } = body;

    if (!designId) {
      return NextResponse.json(
        { error: 'Missing designId' },
        { status: 400 }
      );
    }

    // Recalculate price if fabric changed
    if (updates.primaryFabricId) {
      const { data: fabric } = await supabase
        .from('ff_fabrics')
        .select('price_per_yard, estimated_fabric_yards')
        .eq('id', updates.primaryFabricId)
        .single();

      if (fabric) {
        const fabricCost = fabric.price_per_yard * (fabric.estimated_fabric_yards || 2.5);
        const laborCost = 95.00;
        updates.estimatedPrice = fabricCost + laborCost;
      }
    }

    const { data, error } = await supabase
      .from('ff_custom_designs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', designId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      design: data
    });

  } catch (error: any) {
    console.error('[Designs API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update design', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a design
export async function DELETE(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');

    if (!designId) {
      return NextResponse.json(
        { error: 'Missing designId parameter' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('ff_custom_designs')
      .delete()
      .eq('id', designId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Design deleted successfully'
    });

  } catch (error: any) {
    console.error('[Designs API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete design', details: error.message },
      { status: 500 }
    );
  }
}
