/**
 * Stripe Webhook Handler
 * Handles payment intents, subscriptions, and invoices
 * Records all revenue for Dave's dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase-server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminSupabase();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      // =====================================================
      // SUBSCRIPTION EVENTS
      // =====================================================

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription') {
          // Handle new subscription from checkout
          await handleNewSubscription(supabaseAdmin, session);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscriptionStatus(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await cancelSubscription(supabaseAdmin, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;
        if (subscriptionId) {
          await recordSubscriptionPayment(supabaseAdmin, invoice);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Invoice payment failed: ${invoice.id}`);
        // Could send notification email here
        break;
      }

      // =====================================================
      // ONE-TIME PAYMENT EVENTS (Product Orders)
      // =====================================================

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);

        // Update order status
        const { error } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating order status:', error);
        }

        // Record revenue (if not a subscription - those are handled by invoice.paid)
        if (!(paymentIntent as any).invoice) {
          await recordOneTimePayment(supabaseAdmin, paymentIntent);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);

        const { error } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating order status:', error);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Charge refunded:', charge.id);

        if (charge.payment_intent) {
          const { error } = await supabaseAdmin
            .from('orders')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', charge.payment_intent as string);

          if (error) {
            console.error('Error updating order status:', error);
          }

          // Record refund
          await recordRefund(supabaseAdmin, charge);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function handleNewSubscription(
  supabase: ReturnType<typeof createAdminSupabase>,
  session: Stripe.Checkout.Session
) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const tier = session.metadata?.tier || 'elevated';
  const interval = session.metadata?.interval || 'monthly';

  console.log(`[Stripe Webhook] New subscription: ${subscriptionId} for ${customerEmail}`);

  // Get tier ID
  const { data: tierData } = await supabase
    .from('ff_membership_tiers')
    .select('id')
    .eq('slug', tier)
    .single();

  if (!tierData) {
    console.error(`[Stripe Webhook] Tier not found: ${tier}`);
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

  // Upsert membership
  const { error } = await supabase
    .from('ff_user_memberships')
    .upsert({
      email: customerEmail,
      tier_id: tierData.id,
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      billing_interval: interval,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'email'
    });

  if (error) {
    console.error('[Stripe Webhook] Error creating membership:', error);
  } else {
    console.log(`[Stripe Webhook] Membership created/updated for ${customerEmail}`);
  }
}

async function updateSubscriptionStatus(
  supabase: ReturnType<typeof createAdminSupabase>,
  subscription: Stripe.Subscription
) {
  const sub = subscription as any;
  const customerId = sub.customer as string;

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  const email = (customer as Stripe.Customer).email;

  if (!email) {
    console.error('[Stripe Webhook] No email found for customer:', customerId);
    return;
  }

  const status = sub.status === 'active' ? 'active' :
                 sub.status === 'past_due' ? 'past_due' :
                 sub.status === 'canceled' ? 'cancelled' : 'inactive';

  const { error } = await supabase
    .from('ff_user_memberships')
    .update({
      status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', sub.id);

  if (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error);
  }
}

async function cancelSubscription(
  supabase: ReturnType<typeof createAdminSupabase>,
  subscription: Stripe.Subscription
) {
  // Get the aligned (free) tier ID
  const { data: alignedTier } = await supabase
    .from('ff_membership_tiers')
    .select('id')
    .eq('slug', 'aligned')
    .single();

  const { error } = await supabase
    .from('ff_user_memberships')
    .update({
      status: 'cancelled',
      tier_id: alignedTier?.id, // Downgrade to free tier
      stripe_subscription_id: null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[Stripe Webhook] Error cancelling subscription:', error);
  } else {
    console.log(`[Stripe Webhook] Subscription cancelled: ${subscription.id}`);
  }
}

async function recordSubscriptionPayment(
  supabase: ReturnType<typeof createAdminSupabase>,
  invoice: Stripe.Invoice
) {
  const inv = invoice as any;
  const amountPaid = inv.amount_paid;
  if (amountPaid <= 0) return; // Skip $0 invoices (trials, etc.)

  // Get customer details
  const customer = await stripe.customers.retrieve(inv.customer as string);
  const email = (customer as Stripe.Customer).email;

  // Get subscription to determine tier
  let tier = 'unknown';
  let interval = 'monthly';
  if (inv.subscription) {
    const subscription = await stripe.subscriptions.retrieve(inv.subscription as string) as any;
    tier = subscription.metadata?.tier || 'elevated';
    interval = subscription.metadata?.interval || 'monthly';
  }

  const { error } = await supabase
    .from('ff_revenue')
    .insert({
      type: 'subscription',
      amount_cents: amountPaid,
      currency: inv.currency,
      stripe_invoice_id: inv.id,
      stripe_subscription_id: inv.subscription as string,
      stripe_customer_id: inv.customer as string,
      customer_email: email,
      customer_name: (customer as Stripe.Customer).name,
      membership_tier: tier,
      billing_interval: interval,
      status: 'succeeded',
      period_start: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
      period_end: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null
    });

  if (error) {
    console.error('[Stripe Webhook] Error recording subscription payment:', error);
  } else {
    console.log(`[Stripe Webhook] Recorded subscription payment: $${(amountPaid / 100).toFixed(2)}`);
  }
}

async function recordOneTimePayment(
  supabase: ReturnType<typeof createAdminSupabase>,
  paymentIntent: Stripe.PaymentIntent
) {
  const { error } = await supabase
    .from('ff_revenue')
    .insert({
      type: 'one_time',
      amount_cents: paymentIntent.amount,
      currency: paymentIntent.currency,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: paymentIntent.customer as string || null,
      customer_email: paymentIntent.receipt_email,
      status: 'succeeded'
    });

  if (error) {
    console.error('[Stripe Webhook] Error recording one-time payment:', error);
  } else {
    console.log(`[Stripe Webhook] Recorded one-time payment: $${(paymentIntent.amount / 100).toFixed(2)}`);
  }
}

async function recordRefund(
  supabase: ReturnType<typeof createAdminSupabase>,
  charge: Stripe.Charge
) {
  const refundAmount = charge.amount_refunded;
  if (refundAmount <= 0) return;

  const { error } = await supabase
    .from('ff_revenue')
    .insert({
      type: 'refund',
      amount_cents: -refundAmount, // Negative for refunds
      currency: charge.currency,
      stripe_payment_intent_id: charge.payment_intent as string,
      stripe_customer_id: charge.customer as string || null,
      customer_email: charge.billing_details?.email,
      status: 'refunded'
    });

  if (error) {
    console.error('[Stripe Webhook] Error recording refund:', error);
  } else {
    console.log(`[Stripe Webhook] Recorded refund: -$${(refundAmount / 100).toFixed(2)}`);
  }
}
