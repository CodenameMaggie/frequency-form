/**
 * Stripe Membership Products Setup
 * ONE-TIME USE: Creates membership products and prices in Stripe
 *
 * Call POST /api/setup/stripe-memberships?secret=YOUR_CRON_SECRET
 * This will create the products and return the price IDs to add to Railway
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminSupabase } from '@/lib/supabase-server';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

const MEMBERSHIPS = [
  {
    name: 'Elevated Membership',
    slug: 'elevated',
    description: 'Member access with Style Studio basics, early access to drops, and AI styling assistance.',
    priceMonthly: 2900,
    priceAnnual: 29000,
  },
  {
    name: 'Sovereign Membership',
    slug: 'sovereign',
    description: 'VIP access with unlimited AI styling, personal lookbooks, and concierge service.',
    priceMonthly: 14900,
    priceAnnual: 149000,
  }
];

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we have a real Stripe key
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      return NextResponse.json({
        success: false,
        error: 'STRIPE_SECRET_KEY not configured in environment'
      }, { status: 500 });
    }

    console.log('[Stripe Setup] Creating membership products...');

    const results: Record<string, any> = {};
    const envVars: string[] = [];

    for (const membership of MEMBERSHIPS) {
      try {
        // Check if product already exists
        const existingProducts = await stripe.products.search({
          query: `metadata['slug']:'${membership.slug}' AND metadata['type']:'membership'`
        });

        let product;
        if (existingProducts.data.length > 0) {
          product = existingProducts.data[0];
          console.log(`[Stripe Setup] Found existing product: ${product.id}`);
        } else {
          // Create new product
          product = await stripe.products.create({
            name: membership.name,
            description: membership.description,
            metadata: {
              slug: membership.slug,
              type: 'membership'
            }
          });
          console.log(`[Stripe Setup] Created product: ${product.id}`);
        }

        // Check for existing prices
        const existingPrices = await stripe.prices.list({
          product: product.id,
          active: true
        });

        let monthlyPrice = existingPrices.data.find(p =>
          p.recurring?.interval === 'month' && p.unit_amount === membership.priceMonthly
        );
        let annualPrice = existingPrices.data.find(p =>
          p.recurring?.interval === 'year' && p.unit_amount === membership.priceAnnual
        );

        // Create monthly price if needed
        if (!monthlyPrice) {
          monthlyPrice = await stripe.prices.create({
            product: product.id,
            currency: 'usd',
            unit_amount: membership.priceMonthly,
            recurring: { interval: 'month' },
            metadata: { tier: membership.slug, interval: 'monthly' }
          });
          console.log(`[Stripe Setup] Created monthly price: ${monthlyPrice.id}`);
        }

        // Create annual price if needed
        if (!annualPrice) {
          annualPrice = await stripe.prices.create({
            product: product.id,
            currency: 'usd',
            unit_amount: membership.priceAnnual,
            recurring: { interval: 'year' },
            metadata: { tier: membership.slug, interval: 'annual' }
          });
          console.log(`[Stripe Setup] Created annual price: ${annualPrice.id}`);
        }

        results[membership.slug] = {
          productId: product.id,
          monthlyPriceId: monthlyPrice.id,
          annualPriceId: annualPrice.id,
          monthlyAmount: `$${(membership.priceMonthly / 100).toFixed(2)}/mo`,
          annualAmount: `$${(membership.priceAnnual / 100).toFixed(2)}/yr`
        };

        // Build env var strings
        const slugUpper = membership.slug.toUpperCase();
        envVars.push(`STRIPE_PRICE_${slugUpper}_MONTHLY=${monthlyPrice.id}`);
        envVars.push(`STRIPE_PRICE_${slugUpper}_ANNUAL=${annualPrice.id}`);

        // Update database with Stripe IDs
        const supabase = createAdminSupabase();
        await supabase
          .from('ff_membership_tiers')
          .update({
            stripe_product_id: product.id,
            stripe_price_monthly_id: monthlyPrice.id,
            stripe_price_annual_id: annualPrice.id
          })
          .eq('slug', membership.slug);

      } catch (err: any) {
        results[membership.slug] = { error: err.message };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe membership products created/verified',
      data: {
        products: results,
        environmentVariables: envVars,
        instructions: 'Add these environment variables to Railway, then redeploy'
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stripe Setup] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check current configuration
    const config = {
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder'),
      webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      pricesConfigured: {
        elevatedMonthly: !!process.env.STRIPE_PRICE_ELEVATED_MONTHLY,
        elevatedAnnual: !!process.env.STRIPE_PRICE_ELEVATED_ANNUAL,
        sovereignMonthly: !!process.env.STRIPE_PRICE_SOVEREIGN_MONTHLY,
        sovereignAnnual: !!process.env.STRIPE_PRICE_SOVEREIGN_ANNUAL
      }
    };

    const allPricesConfigured = Object.values(config.pricesConfigured).every(v => v);

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        ready: config.stripeConfigured && config.webhookConfigured && allPricesConfigured,
        message: allPricesConfigured
          ? 'All Stripe membership prices configured'
          : 'Run POST to this endpoint to create Stripe products'
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
