import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CartItem } from '@/lib/cart-store';

// Use service role key for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CreateOrderRequest {
  email: string;
  shippingAddress: ShippingAddress;
  items: CartItem[];
  paymentIntentId: string;
  subtotal: number;
  shipping: number;
  total: number;
}

// Generate order number: FF-YYYYMMDD-XXXX
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FF-${year}${month}${day}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      shippingAddress,
      items,
      paymentIntentId,
      subtotal,
      shipping,
      total,
    }: CreateOrderRequest = await request.json();

    // Validate required fields
    if (!email || !shippingAddress || !items || items.length === 0 || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        email,
        status: 'paid',
        subtotal,
        shipping,
        tax: 0,
        total,
        shipping_address: shippingAddress,
        stripe_payment_intent_id: paymentIntentId,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_brand: item.product.brand,
      fabric_type: item.product.tier, // We'll use tier as fabric type for now
      frequency_hz: item.product.tier === 'healing' ? 5000 : 100,
      quantity: item.quantity,
      price: item.product.price,
      size: item.size || null,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Order was created but items failed - we should handle this better in production
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error: any) {
    console.error('Error in create-order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
