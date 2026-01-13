# Shopify Integration Setup Guide

This guide walks through setting up Shopify integration for Frequency & Form marketplace.

## Overview

The Shopify integration provides:
- **Product Sync**: Automatically sync F&F products to Shopify store
- **Order Management**: Receive orders via webhooks and process fulfillment
- **Inventory Sync**: Keep inventory in sync between systems
- **Manufacturer Notifications**: Auto-notify European suppliers of custom orders

## Architecture

```
┌─────────────────┐
│   Shopify Store │ (Consumer-facing e-commerce)
│                 │
│ - Product catalog
│ - Checkout/payments
│ - Customer accounts
└────────┬────────┘
         │
         │ Webhooks (orders)
         │ Admin API (products, inventory)
         ▼
┌─────────────────┐
│  F&F Next.js    │ (Backend automation)
│  App (Railway)  │
│                 │
│ - Bot automation
│ - B2B wholesale
│ - Email outreach
│ - Order routing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB    │ (Central data)
│                 │
│ - Partners (suppliers)
│ - Buyers (boutiques)
│ - Orders (all channels)
└─────────────────┘
```

## Step 1: Create Shopify Store

1. Go to https://www.shopify.com/
2. Click "Start free trial"
3. Set up your store:
   - Store name: `frequency-and-form` (or your preference)
   - URL: `frequency-and-form.myshopify.com`
4. Complete basic store setup:
   - Add business info
   - Configure payment providers (Shopify Payments, PayPal, etc.)
   - Set up shipping zones and rates
   - Configure tax settings

## Step 2: Create Private App for API Access

1. In Shopify Admin, go to **Settings → Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Name: `F&F Backend Integration`
4. Click **Configure Admin API scopes** and enable:
   - `read_products`, `write_products`
   - `read_orders`, `write_orders`
   - `read_inventory`, `write_inventory`
   - `read_locations`
   - `read_fulfillments`, `write_fulfillments`
5. Click **Save**
6. Click **Install app**
7. Copy the **Admin API access token** (starts with `shpat_...`)

## Step 3: Get Your Store Domain

Your store domain is in format: `your-store-name.myshopify.com`

Example: `frequency-and-form.myshopify.com`

## Step 4: Set Up Environment Variables

Add these to your `.env.local` file:

```bash
# Shopify Integration
SHOPIFY_STORE_DOMAIN=frequency-and-form.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret-here
SHOPIFY_LOCATION_ID=your-primary-location-id
```

To get `SHOPIFY_LOCATION_ID`:
```bash
curl -X GET "https://frequency-and-form.myshopify.com/admin/api/2024-01/locations.json" \
  -H "X-Shopify-Access-Token: YOUR_ACCESS_TOKEN"
```

## Step 5: Configure Webhooks in Shopify

1. In Shopify Admin, go to **Settings → Notifications → Webhooks**
2. Click **Create webhook** for each:

### Order Creation Webhook
- **Event**: `Order creation`
- **Format**: `JSON`
- **URL**: `https://frequencyandform.com/api/shopify/webhooks/orders`
- **API version**: `2024-01`

### Order Payment Webhook
- **Event**: `Order payment`
- **Format**: `JSON`
- **URL**: `https://frequencyandform.com/api/shopify/webhooks/orders`

### Order Fulfillment Webhook
- **Event**: `Order fulfillment`
- **Format**: `JSON`
- **URL**: `https://frequencyandform.com/api/shopify/webhooks/orders`

### Order Cancellation Webhook
- **Event**: `Order cancellation`
- **Format**: `JSON`
- **URL**: `https://frequencyandform.com/api/shopify/webhooks/orders`

3. Copy the **Webhook signing secret** and add it to `.env.local` as `SHOPIFY_WEBHOOK_SECRET`

## Step 6: Run Database Migration

```bash
# Copy migration SQL to clipboard
cat database/migrations/011_shopify_integration.sql

# Go to Supabase dashboard → SQL Editor
# Paste and run the migration
```

This creates:
- `shopify_products` - Track synced products
- `shopify_orders` - Store incoming orders
- `shopify_sync_log` - Audit trail

## Step 7: Test the Integration

### Test Product Sync

```bash
# Sync F&F products to Shopify
curl -X POST "http://localhost:3000/api/shopify/sync-products?secret=YOUR_CRON_SECRET"

# Check status
curl "http://localhost:3000/api/shopify/sync-products"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "products_created": 3,
    "products_skipped": 0
  }
}
```

### Verify in Shopify

1. Go to Shopify Admin → **Products**
2. You should see:
   - Classic Linen Dress (Healing Tier)
   - Organic Cotton Tee (Foundation)
   - Hemp Lounge Pants (Foundation)

### Test Order Webhook (Manual)

1. Create a test order in Shopify:
   - Go to **Orders → Create order**
   - Add a product
   - Enter customer email and shipping info
   - Click **Create order**
   - Mark as **Paid**

2. Check if order arrived:
```bash
# Query database
SELECT * FROM shopify_orders ORDER BY created_at DESC LIMIT 1;
```

## Step 8: Add Cron Job for Product Sync

Update `scripts/cron-scheduler.js`:

```javascript
// Sync products to Shopify daily at 3am
cron.schedule('0 3 * * *', async () => {
  await callEndpoint('/api/shopify/sync-products', 'Shopify Product Sync');
});
```

Restart the cron scheduler after changes.

## Product Management Workflow

### Adding New Products

1. **Option A: Manual in Shopify**
   - Create product in Shopify Admin
   - Product will be available immediately

2. **Option B: Via F&F Bot System**
   - Add product to `sampleProducts` array in `app/api/shopify/sync-products/route.ts`
   - Run sync endpoint
   - Product appears in Shopify

### Product Variants

Each F&F product is created with variants for:
- **Option 1**: Size (XS, S, M, L, XL, 2X, 3X)
- **Option 2**: Color (Natural, Sage, Terracotta, etc.)
- **Option 3**: Fabric (linen, organic_cotton, hemp, silk, etc.)

### Pricing Tiers

- **Healing Tier** (5,000 Hz): $150-300
  - Linen, silk, cashmere
  - Custom made, 3-week lead time

- **Foundation Tier** (100 Hz): $40-100
  - Organic cotton, hemp
  - In-stock, ships in 3-5 days

## Order Fulfillment Workflow

### When Order is Placed

1. **Webhook triggers** → Order saved to database
2. **Admin email sent** → maggie@frequencyandform.com
3. **If custom item** → Manufacturer notified (linen supplier in Lithuania)

### Fulfillment Process

**For Foundation items (cotton/hemp):**
1. Pick and pack from inventory
2. Create shipping label
3. Mark order as fulfilled in Shopify
4. Webhook updates database

**For Healing items (linen/silk):**
1. Manufacturer receives order notification
2. Manufacturer produces item (3 weeks)
3. Manufacturer ships to customer
4. F&F marks as fulfilled in Shopify

## Inventory Management

### Syncing Inventory

Create endpoint: `/api/shopify/sync-inventory`

```typescript
// Update inventory for a product variant
await updateShopifyInventory(
  inventoryItemId,
  locationId,
  newQuantity
);
```

### Automatic Restock Alerts

When inventory drops below threshold, bot can:
- Email supplier to reorder
- Update Shopify to "Made to Order"
- Adjust lead time on product page

## Revenue Tracking

All Shopify orders are stored in `shopify_orders` table:

```sql
-- Total revenue this month
SELECT
  SUM(total_amount) as total_revenue,
  COUNT(*) as order_count
FROM shopify_orders
WHERE order_created_at >= date_trunc('month', NOW());

-- Revenue by product
SELECT
  line_items->>'title' as product,
  SUM((line_items->>'price')::numeric * (line_items->>'quantity')::numeric) as revenue
FROM shopify_orders,
     jsonb_array_elements(line_items) as line_items
GROUP BY product
ORDER BY revenue DESC;
```

## Troubleshooting

### Webhook not receiving data

1. Check webhook URL is publicly accessible
2. Verify `SHOPIFY_WEBHOOK_SECRET` matches Shopify dashboard
3. Check Railway logs: `railway logs`
4. Test webhook manually:
   ```bash
   curl -X POST https://frequencyandform.com/api/shopify/webhooks/orders \
     -H "X-Shopify-Topic: orders/create" \
     -H "X-Shopify-Shop-Domain: frequency-and-form.myshopify.com" \
     -H "X-Shopify-Hmac-SHA256: test" \
     -d '{"id": 123, "order_number": 1001}'
   ```

### Products not syncing

1. Check `SHOPIFY_ACCESS_TOKEN` is valid
2. Verify API scopes include `write_products`
3. Check Railway logs for errors
4. Test GET endpoint: `/api/shopify/sync-products`

### Orders not appearing in database

1. Check migration was run successfully
2. Verify webhook endpoint is receiving POST requests
3. Check Supabase logs for insert errors
4. Ensure `shopify_orders` table exists

## Security Notes

- Never commit `.env.local` to git
- Rotate Shopify access tokens periodically
- Use webhook signature verification (already implemented)
- Restrict admin API scopes to minimum required

## Next Steps

1. **Connect Shopify Store to Domain**: Point `frequencyandform.com` to Shopify (or use subdomain `shop.frequencyandform.com`)
2. **Theme Customization**: Customize Shopify theme with F&F branding
3. **Marketing Pixels**: Add Pinterest, Google Analytics, Meta Pixel
4. **Email Marketing**: Connect Klaviyo or Mailchimp
5. **Review Apps**: Install Yotpo or Loox for customer reviews

## Support

For Shopify integration issues:
- Shopify Help Docs: https://help.shopify.com/
- F&F Bot Dashboard: https://frequencyandform.com/bots-dashboard
- Supabase Dashboard: Check `shopify_sync_log` table for errors
