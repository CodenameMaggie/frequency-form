import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { CartItem } from '@/lib/cart-store';

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await request.json();

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Calculate total server-side to prevent client-side tampering
    const subtotal = items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    // Calculate shipping (free over $20000 cents = $200)
    const shipping = subtotal >= 20000 ? 0 : 1500; // $15 shipping

    const total = subtotal + shipping;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        subtotal: subtotal.toString(),
        shipping: shipping.toString(),
        itemCount: items.length.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subtotal,
      shipping,
      total,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
