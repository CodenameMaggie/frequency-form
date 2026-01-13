/**
 * Shopify API Client for Frequency & Form
 * Handles all Shopify API interactions
 */

import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
  console.warn('[Shopify Client] Shopify credentials not configured - integration disabled');
}

// Initialize Shopify API client
const shopify = SHOPIFY_API_KEY && SHOPIFY_API_SECRET ? shopifyApi({
  apiKey: SHOPIFY_API_KEY,
  apiSecretKey: SHOPIFY_API_SECRET,
  scopes: [
    'read_products',
    'write_products',
    'read_orders',
    'write_orders',
    'read_customers',
    'write_customers',
    'read_inventory',
    'write_inventory',
    'read_fulfillments',
    'write_fulfillments',
    'read_locations',
    'read_price_rules',
    'write_price_rules'
  ],
  hostName: SHOPIFY_STORE_DOMAIN || '',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
}) : null;

/**
 * Create Shopify REST client for API requests
 */
export function createShopifyClient() {
  if (!shopify || !SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify not configured');
  }

  const session = {
    shop: SHOPIFY_STORE_DOMAIN,
    accessToken: SHOPIFY_ACCESS_TOKEN,
    state: 'active',
    isOnline: false,
    scope: 'read_products,write_products,read_orders,write_orders,read_customers,write_customers',
    expires: undefined,
  };

  return new shopify.clients.Rest({ session });
}

/**
 * Make a direct REST API call to Shopify
 */
export async function shopifyRequest(endpoint: string, method: string = 'GET', data?: any) {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify not configured');
  }

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${LATEST_API_VERSION}/${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify API error: ${response.statusText} - ${error}`);
  }

  return response.json();
}

/**
 * Get all products from Shopify
 */
export async function getProducts(limit: number = 250) {
  return shopifyRequest(`products.json?limit=${limit}`);
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: string) {
  return shopifyRequest(`products/${productId}.json`);
}

/**
 * Create a new product in Shopify
 */
export async function createProduct(productData: any) {
  return shopifyRequest('products.json', 'POST', { product: productData });
}

/**
 * Update a product in Shopify
 */
export async function updateProduct(productId: string, productData: any) {
  return shopifyRequest(`products/${productId}.json`, 'PUT', { product: productData });
}

/**
 * Get all orders from Shopify
 */
export async function getOrders(status: string = 'any', limit: number = 250) {
  return shopifyRequest(`orders.json?status=${status}&limit=${limit}`);
}

/**
 * Get a single order by ID
 */
export async function getOrder(orderId: string) {
  return shopifyRequest(`orders/${orderId}.json`);
}

/**
 * Get all customers from Shopify
 */
export async function getCustomers(limit: number = 250) {
  return shopifyRequest(`customers.json?limit=${limit}`);
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(customerId: string) {
  return shopifyRequest(`customers/${customerId}.json`);
}

/**
 * Create a customer in Shopify
 */
export async function createCustomer(customerData: any) {
  return shopifyRequest('customers.json', 'POST', { customer: customerData });
}

/**
 * Update inventory level for a product variant
 */
export async function updateInventoryLevel(inventoryItemId: string, locationId: string, available: number) {
  return shopifyRequest('inventory_levels/set.json', 'POST', {
    location_id: locationId,
    inventory_item_id: inventoryItemId,
    available,
  });
}

/**
 * Get inventory levels
 */
export async function getInventoryLevels(inventoryItemIds: string[]) {
  const idsParam = inventoryItemIds.join(',');
  return shopifyRequest(`inventory_levels.json?inventory_item_ids=${idsParam}`);
}

/**
 * Get all locations
 */
export async function getLocations() {
  return shopifyRequest('locations.json');
}

/**
 * Create a fulfillment for an order
 */
export async function createFulfillment(orderId: string, fulfillmentData: any) {
  return shopifyRequest(`orders/${orderId}/fulfillments.json`, 'POST', { fulfillment: fulfillmentData });
}

/**
 * Verify webhook authenticity
 */
export function verifyWebhook(hmac: string, body: string, secret: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmac;
}

export const ShopifyClient = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  getOrders,
  getOrder,
  getCustomers,
  getCustomer,
  createCustomer,
  updateInventoryLevel,
  getInventoryLevels,
  getLocations,
  createFulfillment,
  verifyWebhook,
};

export default ShopifyClient;
