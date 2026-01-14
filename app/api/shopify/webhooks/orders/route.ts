import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import crypto from 'crypto';

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // F&F tenant

/**
 * Verify Shopify webhook signature
 */
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const shopifySecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!shopifySecret) return false;

  const hash = crypto
    .createHmac('sha256', shopifySecret)
    .update(body, 'utf8')
    .digest('base64');

  return hash === hmacHeader;
}

/**
 * POST /api/shopify/webhooks/orders
 * Handles Shopify order webhooks (order/create, order/paid)
 */
export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');
    const shopDomain = request.headers.get('x-shopify-shop-domain');

    const body = await request.text();

    // Verify webhook authenticity
    if (!hmacHeader || !verifyShopifyWebhook(body, hmacHeader)) {
      console.error('[Shopify Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const orderData = JSON.parse(body);
    console.log(`[Shopify Webhook] Received ${topic} from ${shopDomain}`);
    console.log(`[Shopify Webhook] Order #${orderData.order_number}`);

    // Process based on topic
    if (topic === 'orders/create' || topic === 'orders/paid') {
      await processNewOrder(orderData, supabase);
    } else if (topic === 'orders/fulfilled') {
      await processOrderFulfillment(orderData, supabase);
    } else if (topic === 'orders/cancelled') {
      await processOrderCancellation(orderData, supabase);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Shopify Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process new Shopify order
 */
async function processNewOrder(order: any, supabase: ReturnType<typeof createAdminSupabase>) {
  try {
    // Check if order already exists
    const { data: existing } = await supabase
      .from('shopify_orders')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('shopify_order_id', order.id.toString())
      .single();

    if (existing) {
      console.log(`[Shopify Webhook] Order ${order.order_number} already exists, skipping`);
      return;
    }

    // Extract line items
    const lineItems = order.line_items.map((item: any) => ({
      product_id: item.product_id?.toString(),
      variant_id: item.variant_id?.toString(),
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku,
    }));

    // Store order in database
    const { error } = await supabase.from('shopify_orders').insert({
      tenant_id: TENANT_ID,
      shopify_order_id: order.id.toString(),
      order_number: order.order_number.toString(),
      customer_email: order.email,
      customer_name: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
      subtotal: parseFloat(order.subtotal_price),
      tax: parseFloat(order.total_tax || 0),
      shipping: parseFloat(order.total_shipping_price_set?.shop_money?.amount || 0),
      total_amount: parseFloat(order.total_price),
      currency: order.currency,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status || 'unfulfilled',
      line_items: lineItems,
      shipping_address: order.shipping_address,
      order_created_at: order.created_at,
      payment_method: order.payment_gateway_names?.[0] || 'unknown',
    });

    if (error) throw error;

    console.log(`[Shopify Webhook] Stored order ${order.order_number}`);

    // Send notification email to admin
    await notifyAdminNewOrder(order, supabase);

    // If order contains custom-made items (linen, silk), trigger manufacturer notification
    const hasCustomItems = lineItems.some((item: any) =>
      item.sku?.includes('LD-') || item.sku?.includes('SD-') // Linen Dress or Silk Dress
    );

    if (hasCustomItems) {
      await notifyManufacturerNewOrder(order, lineItems, supabase);
    }

  } catch (error) {
    console.error('[Shopify Webhook] Error processing new order:', error);
    throw error;
  }
}

/**
 * Process order fulfillment
 */
async function processOrderFulfillment(order: any, supabase: ReturnType<typeof createAdminSupabase>) {
  try {
    await supabase
      .from('shopify_orders')
      .update({
        fulfillment_status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('tenant_id', TENANT_ID)
      .eq('shopify_order_id', order.id.toString());

    console.log(`[Shopify Webhook] Order ${order.order_number} marked as fulfilled`);
  } catch (error) {
    console.error('[Shopify Webhook] Error processing fulfillment:', error);
  }
}

/**
 * Process order cancellation
 */
async function processOrderCancellation(order: any, supabase: ReturnType<typeof createAdminSupabase>) {
  try {
    await supabase
      .from('shopify_orders')
      .update({
        financial_status: 'refunded',
        fulfillment_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('tenant_id', TENANT_ID)
      .eq('shopify_order_id', order.id.toString());

    console.log(`[Shopify Webhook] Order ${order.order_number} cancelled`);
  } catch (error) {
    console.error('[Shopify Webhook] Error processing cancellation:', error);
  }
}

/**
 * Notify admin of new order
 */
async function notifyAdminNewOrder(order: any, supabase: ReturnType<typeof createAdminSupabase>) {
  // Add to email queue for admin notification
  try {
    await supabase.from('email_outreach_queue').insert({
      tenant_id: TENANT_ID,
      recipient_email: 'maggie@frequencyandform.com',
      subject: `New Order #${order.order_number} - $${order.total_price}`,
      body: `
New Shopify order received!

Order: #${order.order_number}
Customer: ${order.email}
Total: $${order.total_price} ${order.currency}
Payment Status: ${order.financial_status}

Items:
${order.line_items.map((item: any) => `- ${item.quantity}x ${item.title} ($${item.price})`).join('\n')}

Shipping Address:
${order.shipping_address?.address1}
${order.shipping_address?.city}, ${order.shipping_address?.province} ${order.shipping_address?.zip}
${order.shipping_address?.country}

View in Shopify: https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/orders/${order.id}
      `.trim(),
      template_used: 'admin_order_notification',
      status: 'queued',
      priority: 1, // High priority
    });
  } catch (error) {
    console.error('[Shopify Webhook] Error queuing admin notification:', error);
  }
}

/**
 * Notify manufacturer of custom order
 */
async function notifyManufacturerNewOrder(order: any, customItems: any[], supabase: ReturnType<typeof createAdminSupabase>) {
  try {
    // Get manufacturer contact from partners table
    const { data: partner } = await supabase
      .from('ff_partners')
      .select('contact_email, brand_name')
      .eq('tenant_id', TENANT_ID)
      .eq('primary_fabric', 'linen')
      .single();

    if (!partner?.contact_email) return;

    await supabase.from('email_outreach_queue').insert({
      tenant_id: TENANT_ID,
      recipient_email: partner.contact_email,
      subject: `New Custom Order - ${customItems.length} items`,
      body: `
Hello ${partner.brand_name},

We have a new custom order that requires your craftsmanship:

Order Number: #${order.order_number}
Due Date: ${new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString()} (3 weeks)

Items to produce:
${customItems.map((item: any) => `
- ${item.title}
  SKU: ${item.sku}
  Quantity: ${item.quantity}
`).join('\n')}

Shipping Address:
${order.shipping_address?.first_name} ${order.shipping_address?.last_name}
${order.shipping_address?.address1}
${order.shipping_address?.city}, ${order.shipping_address?.province} ${order.shipping_address?.zip}

Please confirm receipt and expected completion date.

Best regards,
Frequency & Form Team
      `.trim(),
      template_used: 'manufacturer_order_notification',
      status: 'queued',
      priority: 2,
    });

    console.log(`[Shopify Webhook] Notified manufacturer ${partner.brand_name}`);
  } catch (error) {
    console.error('[Shopify Webhook] Error notifying manufacturer:', error);
  }
}
