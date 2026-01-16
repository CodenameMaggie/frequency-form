/**
 * Create Stripe Membership Products
 * Run with: npx tsx scripts/create-stripe-memberships.ts
 *
 * This creates the subscription products and prices in Stripe.
 * After running, add the price IDs to your Railway environment variables.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

const MEMBERSHIPS = [
  {
    name: 'Elevated Membership',
    slug: 'elevated',
    description: 'Member access with Style Studio basics, early access to drops, and AI styling assistance.',
    priceMonthly: 2900, // $29.00
    priceAnnual: 29000, // $290.00 (2 months free)
    features: [
      'Style Studio access',
      'Early access to drops',
      '3 body scans/month',
      '3 color analyses/month',
      '20 AI style recommendations/month',
      'Member-only pricing'
    ]
  },
  {
    name: 'Sovereign Membership',
    slug: 'sovereign',
    description: 'VIP access with unlimited AI styling, personal lookbooks, and concierge service.',
    priceMonthly: 14900, // $149.00
    priceAnnual: 149000, // $1,490.00 (2 months free)
    features: [
      'Everything in Elevated',
      '10 body scans/month',
      '10 color analyses/month',
      '80 AI style recommendations/month',
      'Personal AI lookbooks',
      'Priority concierge service',
      'Exclusive member events'
    ]
  }
];

async function createMembershipProducts() {
  console.log('Creating membership products in Stripe...\n');
  console.log('====================================================\n');

  const priceMapping: Record<string, { productId: string; monthlyPriceId: string; annualPriceId: string }> = {};

  for (const membership of MEMBERSHIPS) {
    try {
      console.log(`Creating: ${membership.name}`);
      console.log(`  Monthly: $${(membership.priceMonthly / 100).toFixed(2)}`);
      console.log(`  Annual: $${(membership.priceAnnual / 100).toFixed(2)}`);

      // Create the product
      const product = await stripe.products.create({
        name: membership.name,
        description: membership.description,
        metadata: {
          slug: membership.slug,
          type: 'membership',
          features: JSON.stringify(membership.features)
        }
      });

      console.log(`  Product ID: ${product.id}`);

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: membership.priceMonthly,
        recurring: {
          interval: 'month'
        },
        metadata: {
          tier: membership.slug,
          interval: 'monthly'
        }
      });

      console.log(`  Monthly Price ID: ${monthlyPrice.id}`);

      // Create annual price
      const annualPrice = await stripe.prices.create({
        product: product.id,
        currency: 'usd',
        unit_amount: membership.priceAnnual,
        recurring: {
          interval: 'year'
        },
        metadata: {
          tier: membership.slug,
          interval: 'annual'
        }
      });

      console.log(`  Annual Price ID: ${annualPrice.id}`);

      priceMapping[membership.slug] = {
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        annualPriceId: annualPrice.id
      };

      console.log('');
    } catch (error: any) {
      console.error(`Error creating ${membership.name}:`, error.message);
    }
  }

  console.log('\n====================================================');
  console.log('ENVIRONMENT VARIABLES TO ADD TO RAILWAY:');
  console.log('====================================================\n');

  if (priceMapping.elevated) {
    console.log(`STRIPE_PRICE_ELEVATED_MONTHLY=${priceMapping.elevated.monthlyPriceId}`);
    console.log(`STRIPE_PRICE_ELEVATED_ANNUAL=${priceMapping.elevated.annualPriceId}`);
  }

  if (priceMapping.sovereign) {
    console.log(`STRIPE_PRICE_SOVEREIGN_MONTHLY=${priceMapping.sovereign.monthlyPriceId}`);
    console.log(`STRIPE_PRICE_SOVEREIGN_ANNUAL=${priceMapping.sovereign.annualPriceId}`);
  }

  console.log('\n====================================================');
  console.log('WEBHOOK EVENTS TO ENABLE IN STRIPE DASHBOARD:');
  console.log('====================================================\n');
  console.log('Go to: https://dashboard.stripe.com/webhooks');
  console.log('Add endpoint: https://your-domain.com/api/webhooks/stripe');
  console.log('Select events:');
  console.log('  - checkout.session.completed');
  console.log('  - customer.subscription.created');
  console.log('  - customer.subscription.updated');
  console.log('  - customer.subscription.deleted');
  console.log('  - invoice.paid');
  console.log('  - invoice.payment_failed');
  console.log('  - payment_intent.succeeded');
  console.log('  - payment_intent.payment_failed');
  console.log('  - charge.refunded');

  console.log('\n====================================================\n');
  console.log(JSON.stringify(priceMapping, null, 2));

  return priceMapping;
}

createMembershipProducts()
  .then(() => {
    console.log('\nDone! Add the environment variables to Railway.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError:', error);
    process.exit(1);
  });
