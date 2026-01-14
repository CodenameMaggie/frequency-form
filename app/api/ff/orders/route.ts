/**
 * FF Style Studio - Orders API
 * Handle custom clothing orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

// GET: Retrieve user's orders
export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('ff_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      orders: data || [],
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('[Orders API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve orders', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new order
export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const body = await request.json();
    const {
      userId,
      items, // Array of design IDs with quantities
      shippingAddress,
      shippingMethod
    } = body;

    if (!userId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, items' },
        { status: 400 }
      );
    }

    // Get user's measurements snapshot
    const { data: measurements } = await supabase
      .from('ff_body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: design } = await supabase
        .from('ff_custom_designs')
        .select('*, primary_fabric:ff_fabrics(*)')
        .eq('id', item.designId)
        .single();

      if (design) {
        const itemPrice = design.estimated_price || 185.00;
        const quantity = item.quantity || 1;
        subtotal += itemPrice * quantity;

        orderItems.push({
          design_id: design.id,
          quantity,
          price: itemPrice,
          customizations: design
        });

        // Update design status to 'ordered'
        await supabase
          .from('ff_custom_designs')
          .update({ status: 'ordered' })
          .eq('id', design.id);
      }
    }

    const shippingCost = 15.00;
    const tax = subtotal * 0.08; // 8% sales tax
    const total = subtotal + shippingCost + tax;

    // Generate order number
    const orderNumber = `FF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const { data, error } = await supabase
      .from('ff_orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: 'pending',
        items: orderItems,
        measurements_snapshot: measurements,
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        shipping_address: shippingAddress,
        shipping_method: shippingMethod || 'standard',
        payment_status: 'pending',
        manufacturer: 'local_seamstress', // Default
        estimated_delivery: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 3 weeks
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      order: data,
      message: 'Order created successfully! You will receive updates via email.'
    });

  } catch (error: any) {
    console.error('[Orders API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update order status (admin only in production)
export async function PUT(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const body = await request.json();
    const { orderId, status, trackingNumber } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, status' },
        { status: 400 }
      );
    }

    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (trackingNumber) {
      updates.tracking_number = trackingNumber;
    }

    if (status === 'in_production' && !updates.production_started_at) {
      updates.production_started_at = new Date().toISOString();
    }

    if (status === 'shipped' && !updates.production_completed_at) {
      updates.production_completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('ff_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      order: data
    });

  } catch (error: any) {
    console.error('[Orders API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}
