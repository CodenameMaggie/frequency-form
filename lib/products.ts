import { Product } from '@/components/product/ProductCard';

export interface ProductWithStripe extends Product {
  stripePriceId: string;
  stripeProductId: string;
}

// Product data with Stripe integration
// Images: Using representative stock photos until brand partnerships confirmed
export const PRODUCTS: ProductWithStripe[] = [
  {
    id: 1,
    name: 'Italian Linen Shirt',
    brand: '100% Capri',
    price: 28500,
    tier: 'healing',
    slug: 'italian-linen-shirt',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1598522325074-042db73aa4e6?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80',
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
