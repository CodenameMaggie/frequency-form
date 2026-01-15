/**
 * Shopify Integration for Frequency & Form
 * Handles product sync, orders, and inventory management
 * Supports OAuth token storage/retrieval
 */

import { createAdminSupabase } from './supabase-server';

const SHOPIFY_API_VERSION = '2024-01';
const DEFAULT_SHOP = 'frequency-and-form.myshopify.com';

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  tags: string;
  status: 'active' | 'draft' | 'archived';
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  option1?: string;
  option2?: string;
  option3?: string;
}

interface ShopifyImage {
  id: number;
  product_id: number;
  src: string;
  position: number;
  alt?: string;
}

interface ShopifyOrder {
  id: number;
  email: string;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  line_items: ShopifyLineItem[];
  shipping_address: ShopifyAddress;
  financial_status: string;
  fulfillment_status: string | null;
}

interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
}

interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
}

/**
 * Get access token from database or environment
 */
async function getAccessToken(shop: string = DEFAULT_SHOP): Promise<string | null> {
  // First check environment variable
  if (process.env.SHOPIFY_ACCESS_TOKEN) {
    return process.env.SHOPIFY_ACCESS_TOKEN;
  }

  // Then check database for OAuth token
  try {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('shopify_tokens')
      .select('access_token')
      .eq('shop_domain', shop)
      .single();

    if (error || !data) {
      console.warn('[Shopify] No token found for shop:', shop);
      return null;
    }

    return data.access_token;
  } catch (error) {
    console.error('[Shopify] Error retrieving token:', error);
    return null;
  }
}

/**
 * Make authenticated request to Shopify Admin API
 */
async function shopifyRequest(endpoint: string, options: RequestInit = {}, shop: string = DEFAULT_SHOP) {
  const accessToken = await getAccessToken(shop);

  if (!accessToken) {
    throw new Error(`Shopify not connected. Please authorize at /api/shopify/oauth?shop=${shop}`);
  }

  const url = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Check if Shopify is connected
 */
export async function isShopifyConnected(shop: string = DEFAULT_SHOP): Promise<boolean> {
  const token = await getAccessToken(shop);
  return !!token;
}

/**
 * Get all products from Shopify
 */
export async function getShopifyProducts(): Promise<ShopifyProduct[]> {
  try {
    const data = await shopifyRequest('products.json?limit=250');
    return data.products || [];
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    return [];
  }
}

/**
 * Create product in Shopify
 */
export async function createShopifyProduct(productData: {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: Array<{
    option1?: string;
    option2?: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images?: Array<{ src: string; alt?: string }>;
}): Promise<ShopifyProduct> {
  const data = await shopifyRequest('products.json', {
    method: 'POST',
    body: JSON.stringify({
      product: {
        ...productData,
        tags: productData.tags.join(', '),
        status: 'active',
      },
    }),
  });

  return data.product;
}

/**
 * Update product inventory in Shopify
 */
export async function updateShopifyInventory(
  inventoryItemId: number,
  locationId: number,
  available: number
): Promise<void> {
  await shopifyRequest('inventory_levels/set.json', {
    method: 'POST',
    body: JSON.stringify({
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available,
    }),
  });
}

/**
 * Get recent orders from Shopify
 */
export async function getShopifyOrders(status: string = 'any'): Promise<ShopifyOrder[]> {
  try {
    const data = await shopifyRequest(`orders.json?status=${status}&limit=250`);
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching Shopify orders:', error);
    return [];
  }
}

/**
 * Create fulfillment for an order
 */
export async function fulfillShopifyOrder(
  orderId: number,
  trackingNumber?: string,
  trackingCompany?: string
): Promise<void> {
  const fulfillment: any = {
    location_id: process.env.SHOPIFY_LOCATION_ID,
    tracking_number: trackingNumber,
  };

  if (trackingCompany) {
    fulfillment.tracking_company = trackingCompany;
  }

  await shopifyRequest(`orders/${orderId}/fulfillments.json`, {
    method: 'POST',
    body: JSON.stringify({ fulfillment }),
  });
}

/**
 * Get Shopify inventory locations
 */
export async function getShopifyLocations() {
  const data = await shopifyRequest('locations.json');
  return data.locations || [];
}

/**
 * Sync F&F product to Shopify
 */
export async function syncProductToShopify(ffProduct: {
  name: string;
  description: string;
  fabric_type: string;
  price_tier: string;
  base_price: number;
  partner_name?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  sku_prefix: string;
}): Promise<ShopifyProduct> {
  const productType = ffProduct.fabric_type === 'linen' || ffProduct.fabric_type === 'silk'
    ? 'Healing Tier'
    : 'Foundation';

  const variants = [];
  for (const size of ffProduct.sizes) {
    for (const color of ffProduct.colors) {
      variants.push({
        option1: size,
        option2: color,
        option3: ffProduct.fabric_type,
        price: ffProduct.base_price.toFixed(2),
        sku: `${ffProduct.sku_prefix}-${size.toUpperCase()}-${color.toUpperCase()}`,
        inventory_quantity: 10,
      });
    }
  }

  const images = ffProduct.images.map((src, index) => ({
    src,
    alt: `${ffProduct.name} - ${index + 1}`,
    position: index + 1,
  }));

  const tags = [
    'natural-fiber',
    ffProduct.fabric_type,
    ffProduct.price_tier,
    'sustainable',
    'frequency-aligned',
  ];

  return createShopifyProduct({
    title: ffProduct.name,
    body_html: ffProduct.description,
    vendor: ffProduct.partner_name || 'Frequency & Form',
    product_type: productType,
    tags,
    variants,
    images,
  });
}

export type { ShopifyProduct, ShopifyVariant, ShopifyOrder, ShopifyLineItem };
