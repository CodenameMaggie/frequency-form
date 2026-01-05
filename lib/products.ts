import { Product } from '@/components/product/ProductCard';

export interface ProductWithStripe extends Product {
  stripePriceId: string;
  stripeProductId: string;
}

// Product data with Stripe integration
export const PRODUCTS: ProductWithStripe[] = [
  {
    id: 1,
    name: 'Italian Linen Shirt',
    brand: '100% Capri',
    price: 28500,
    tier: 'healing',
    slug: 'italian-linen-shirt',
    stripePriceId: 'price_1SmMUHPXo2GMOIj5AqSmN8Hb',
    stripeProductId: 'prod_TjqAmQRnpF8GW2',
  },
  {
    id: 2,
    name: 'Linen Wide Leg Trousers',
    brand: '100% Capri',
    price: 32500,
    tier: 'healing',
    slug: 'linen-wide-leg-trousers',
    stripePriceId: 'price_1SmMUIPXo2GMOIj5g6Yw3Q2j',
    stripeProductId: 'prod_TjqA9pNqkFEKkk',
  },
  {
    id: 3,
    name: 'Linen Blazer',
    brand: '100% Capri',
    price: 49500,
    tier: 'healing',
    slug: 'linen-blazer',
    stripePriceId: 'price_1SmMUIPXo2GMOIj5oTM7B1rP',
    stripeProductId: 'prod_TjqAbume0Xwwcy',
  },
  {
    id: 4,
    name: 'Egyptian Cotton Crew Tee',
    brand: 'Kotn',
    price: 5800,
    tier: 'foundation',
    slug: 'egyptian-cotton-crew-tee',
    stripePriceId: 'price_1SmMUIPXo2GMOIj57tAYa9Id',
    stripeProductId: 'prod_TjqAiwoodYThUH',
  },
  {
    id: 5,
    name: 'Organic Cotton Oxford Shirt',
    brand: 'Kotn',
    price: 9800,
    tier: 'foundation',
    slug: 'organic-cotton-oxford-shirt',
    stripePriceId: 'price_1SmMUJPXo2GMOIj5uh02OaNP',
    stripeProductId: 'prod_TjqAj2T4kte4od',
  },
  {
    id: 6,
    name: 'Cashmere Crewneck Sweater',
    brand: 'Brunello Cucinelli',
    price: 129500,
    tier: 'healing',
    slug: 'cashmere-crewneck-sweater',
    stripePriceId: 'price_1SmMUJPXo2GMOIj5Nomoj03M',
    stripeProductId: 'prod_TjqApwZujcZEqG',
  },
  {
    id: 7,
    name: 'Cashmere Cardigan',
    brand: 'Brunello Cucinelli',
    price: 169500,
    tier: 'healing',
    slug: 'cashmere-cardigan',
    stripePriceId: 'price_1SmMUJPXo2GMOIj53gF26SW7',
    stripeProductId: 'prod_TjqAd4k8iFVlLG',
  },
  {
    id: 8,
    name: 'Merino Wool Turtleneck',
    brand: 'Loro Piana',
    price: 74500,
    tier: 'healing',
    slug: 'merino-wool-turtleneck',
    stripePriceId: 'price_1SmMUKPXo2GMOIj5jwExn3tf',
    stripeProductId: 'prod_TjqA7ikVa7Mw8W',
  },
  {
    id: 9,
    name: 'Silk Pocket Square',
    brand: 'Loro Piana',
    price: 29500,
    tier: 'healing',
    slug: 'silk-pocket-square',
    stripePriceId: 'price_1SmMUKPXo2GMOIj5sIzgvK5N',
    stripeProductId: 'prod_TjqAP4bpki0E7I',
  },
  {
    id: 10,
    name: 'Organic Cotton Tank',
    brand: 'Pact',
    price: 2800,
    tier: 'foundation',
    slug: 'organic-cotton-tank',
    stripePriceId: 'price_1SmMULPXo2GMOIj5iCqKQZtf',
    stripeProductId: 'prod_TjqAnWlzbVz7TJ',
  },
  {
    id: 11,
    name: 'Organic Cotton Leggings',
    brand: 'Pact',
    price: 5500,
    tier: 'foundation',
    slug: 'organic-cotton-leggings',
    stripePriceId: 'price_1SmMULPXo2GMOIj5XOvuCAJE',
    stripeProductId: 'prod_TjqA4M4WZcbUAh',
  },
  {
    id: 12,
    name: 'Baby Cashmere Scarf',
    brand: 'Loro Piana',
    price: 89500,
    tier: 'healing',
    slug: 'baby-cashmere-scarf',
    stripePriceId: 'price_1SmMUMPXo2GMOIj5Re2YbDiI',
    stripeProductId: 'prod_TjqAMLDbdUScUs',
  },
];

// Helper function to get product by slug
export function getProductBySlug(slug: string): ProductWithStripe | undefined {
  return PRODUCTS.find(p => p.slug === slug);
}

// Helper function to get product by ID
export function getProductById(id: number | string): ProductWithStripe | undefined {
  return PRODUCTS.find(p => p.id.toString() === id.toString());
}
