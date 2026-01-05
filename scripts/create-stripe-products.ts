/**
 * Script to create all products in Stripe
 * Run with: npx tsx scripts/create-stripe-products.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

interface ProductData {
  id: number;
  name: string;
  brand: string;
  price: number;
  tier: 'healing' | 'foundation';
  slug: string;
}

const PRODUCTS: ProductData[] = [
  {
    id: 1,
    name: 'Italian Linen Shirt',
    brand: '100% Capri',
    price: 28500,
    tier: 'healing',
    slug: 'italian-linen-shirt'
  },
  {
    id: 2,
    name: 'Linen Wide Leg Trousers',
    brand: '100% Capri',
    price: 32500,
    tier: 'healing',
    slug: 'linen-wide-leg-trousers'
  },
  {
    id: 3,
    name: 'Linen Blazer',
    brand: '100% Capri',
    price: 49500,
    tier: 'healing',
    slug: 'linen-blazer'
  },
  {
    id: 4,
    name: 'Egyptian Cotton Crew Tee',
    brand: 'Kotn',
    price: 5800,
    tier: 'foundation',
    slug: 'egyptian-cotton-crew-tee'
  },
  {
    id: 5,
    name: 'Organic Cotton Oxford Shirt',
    brand: 'Kotn',
    price: 9800,
    tier: 'foundation',
    slug: 'organic-cotton-oxford-shirt'
  },
  {
    id: 6,
    name: 'Cashmere Crewneck Sweater',
    brand: 'Brunello Cucinelli',
    price: 129500,
    tier: 'healing',
    slug: 'cashmere-crewneck-sweater'
  },
  {
    id: 7,
    name: 'Cashmere Cardigan',
    brand: 'Brunello Cucinelli',
    price: 169500,
    tier: 'healing',
    slug: 'cashmere-cardigan'
  },
  {
    id: 8,
    name: 'Merino Wool Turtleneck',
    brand: 'Loro Piana',
    price: 74500,
    tier: 'healing',
    slug: 'merino-wool-turtleneck'
  },
  {
    id: 9,
    name: 'Silk Pocket Square',
    brand: 'Loro Piana',
    price: 29500,
    tier: 'healing',
    slug: 'silk-pocket-square'
  },
  {
    id: 10,
    name: 'Organic Cotton Tank',
    brand: 'Pact',
    price: 2800,
    tier: 'foundation',
    slug: 'organic-cotton-tank'
  },
  {
    id: 11,
    name: 'Organic Cotton Leggings',
    brand: 'Pact',
    price: 5500,
    tier: 'foundation',
    slug: 'organic-cotton-leggings'
  },
  {
    id: 12,
    name: 'Baby Cashmere Scarf',
    brand: 'Loro Piana',
    price: 89500,
    tier: 'healing',
    slug: 'baby-cashmere-scarf'
  },
];

async function createStripeProducts() {
  console.log('Creating products in Stripe...\n');

  const productMapping: Record<string, { productId: string; priceId: string }> = {};

  for (const product of PRODUCTS) {
    try {
      console.log(`Creating: ${product.name} (${product.brand})`);

      // Create the product
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: `${product.brand} - ${product.tier === 'healing' ? 'Healing (5,000 Hz)' : 'Foundation (100 Hz)'}`,
        metadata: {
          brand: product.brand,
          tier: product.tier,
          slug: product.slug,
          app_id: product.id.toString(),
        },
      });

      // Create the price
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        currency: 'usd',
        unit_amount: product.price,
      });

      productMapping[product.slug] = {
        productId: stripeProduct.id,
        priceId: stripePrice.id,
      };

      console.log(`  ✓ Product ID: ${stripeProduct.id}`);
      console.log(`  ✓ Price ID: ${stripePrice.id}`);
      console.log(`  ✓ Price: $${(product.price / 100).toFixed(2)}\n`);
    } catch (error: any) {
      console.error(`  ✗ Error creating ${product.name}:`, error.message);
    }
  }

  console.log('\n=== Product Mapping (save this) ===\n');
  console.log(JSON.stringify(productMapping, null, 2));

  return productMapping;
}

createStripeProducts()
  .then(() => {
    console.log('\n✓ All products created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error:', error);
    process.exit(1);
  });
