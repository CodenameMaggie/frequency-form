/**
 * Membership Checkout API
 * Creates Stripe Checkout sessions for membership subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase-server';

// Stripe Price IDs - these should be set after running create-stripe-memberships.ts
const MEMBERSHIP_PRICES: Record<string, { monthly: string; annual: string }> = {
  elevated: {
    monthly: process.env.STRIPE_PRICE_ELEVATED_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ELEVATED_ANNUAL || ''
  },
  sovereign: {
    monthly: process.env.STRIPE_PRICE_SOVEREIGN_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_SOVEREIGN_ANNUAL || ''
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, interval, email, successUrl, cancelUrl } = body;

    // Validate tier
    if (!tier || !['elevated', 'sovereign'].includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'Invalid membership tier' },
        { status: 400 }
      );
    }

    // Validate interval
    if (!interval || !['monthly', 'annual'].includes(interval)) {
      return NextResponse.json(
        { success: false, error: 'Invalid billing interval' },
        { status: 400 }
      );
    }

    // Get price ID
    const priceId = MEMBERSHIP_PRICES[tier]?.[interval as 'monthly' | 'annual'];
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: 'Stripe prices not configured. Please set up Stripe products first.' },
        { status: 500 }
      );
    }

    const supabase = createAdminSupabase();

    // Check if customer already exists in Stripe
    let customerId: string | undefined;
    if (email) {
      const { data: existingMembership } = await supabase
        .from('ff_user_memberships')
        .select('stripe_customer_id')
        .eq('email', email)
        .single();

      if (existingMembership?.stripe_customer_id) {
        customerId = existingMembership.stripe_customer_id;
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/membership`,
      metadata: {
        tier,
        interval,
        source: 'ff_membership_checkout'
      },
      subscription_data: {
        metadata: {
          tier,
          interval
        }
      },
      allow_promotion_codes: true
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Membership Checkout] Error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET: Check subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const sessionId = searchParams.get('session_id');

    const supabase = createAdminSupabase();

    // If session_id provided, get session details
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });

      return NextResponse.json({
        success: true,
        data: {
          status: session.status,
          customerEmail: session.customer_email,
          subscription: session.subscription ? {
            id: (session.subscription as any).id,
            status: (session.subscription as any).status,
            currentPeriodEnd: (session.subscription as any).current_period_end
          } : null
        }
      });
    }

    // If email provided, get membership status
    if (email) {
      const { data: membership, error } = await supabase
        .from('ff_user_memberships')
        .select(`
          *,
          ff_membership_tiers (
            name,
            slug,
            price_monthly,
            price_annual
          )
        `)
        .eq('email', email)
        .eq('status', 'active')
        .single();

      if (error || !membership) {
        return NextResponse.json({
          success: true,
          data: {
            hasMembership: false,
            tier: 'aligned'
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          hasMembership: true,
          tier: (membership.ff_membership_tiers as any)?.slug || 'aligned',
          tierName: (membership.ff_membership_tiers as any)?.name || 'Aligned',
          billingInterval: membership.billing_interval,
          currentPeriodEnd: membership.current_period_end,
          cancelAtPeriodEnd: membership.cancel_at_period_end
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Email or session_id required' },
      { status: 400 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Membership Checkout] GET Error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
