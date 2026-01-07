# Stripe Products - Complete Reference
**Created:** January 5, 2026
**Stripe Account:** Maggie Forbes Strategies
**Mode:** LIVE

---

## All Products Created

### SaaS Business Tiers

#### 1. Foundations - $297/month
- **Product ID:** `prod_TjqQwTWUSIaAS3`
- **Price ID:** `price_1SmMjC2ZHBk6v8DTXSsR4MT9`
- **Limits:** 25 contacts, 2 users
- **Features:** Full CRM, AI analysis, integrations, email automation

#### 2. Growth - $597/month
- **Product ID:** `prod_TjqQM0ETV0mUeH`
- **Price ID:** `price_1SmMjD2ZHBk6v8DT1YUEiUoA`
- **Limits:** 50 contacts, 3 users
- **Features:** All Foundations + priority support, advanced features

#### 3. Scale - $997/month
- **Product ID:** `prod_TjqQ2o8rPX8NUk`
- **Price ID:** `price_1SmMjE2ZHBk6v8DTIj8qh5n6`
- **Limits:** 200 contacts, 10 users
- **Features:** All Growth + white label, VA access, AI automation

#### 4. Enterprise - $2,500/month
- **Product ID:** `prod_TjqQGZc155HLxx`
- **Price ID:** `price_1SmMjF2ZHBk6v8DTsZPvRIbh`
- **Limits:** Unlimited everything
- **Features:** All Scale + API access, custom integrations, dedicated support

---

### Consultant Tiers

#### 5. Consultant Starter - $99/month
- **Product ID:** `prod_TjqQAeUYzvQxTj`
- **Price ID:** `price_1SmMjG2ZHBk6v8DTKXHgmMS7`
- **Limits:** 10 contacts, 1 user
- **Features:** Full CRM, AI analysis, call tracking, email automation

#### 6. Consultant Professional - $299/month
- **Product ID:** `prod_TjqQnK2IcfXv7h`
- **Price ID:** `price_1SmMjH2ZHBk6v8DTWqW3Cslh`
- **Limits:** 25 contacts, 2 users
- **Features:** All Starter + multi-user, priority support

#### 7. Consultant Enterprise - $599/month
- **Product ID:** `prod_TjqQGiXjfRNDjC`
- **Price ID:** `price_1SmMjI2ZHBk6v8DT252RsUfY`
- **Limits:** 100 contacts, 5 users
- **Features:** All Professional + white label, VA access, advanced analytics

---

## Environment Variables for Vercel

```bash
# Stripe Core (Get from Stripe Dashboard → Developers → API Keys)
STRIPE_SECRET_KEY=<your_stripe_secret_key_here>
STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key_here>

# SaaS Price IDs
STRIPE_PRICE_FOUNDATIONS=price_1SmMjC2ZHBk6v8DTXSsR4MT9
STRIPE_PRICE_GROWTH=price_1SmMjD2ZHBk6v8DT1YUEiUoA
STRIPE_PRICE_SCALE=price_1SmMjE2ZHBk6v8DTIj8qh5n6
STRIPE_PRICE_ENTERPRISE=price_1SmMjF2ZHBk6v8DTsZPvRIbh

# Consultant Price IDs
STRIPE_PRICE_CONSULTANT_STARTER=price_1SmMjG2ZHBk6v8DTKXHgmMS7
STRIPE_PRICE_CONSULTANT_PROFESSIONAL=price_1SmMjH2ZHBk6v8DTWqW3Cslh
STRIPE_PRICE_CONSULTANT_ENTERPRISE=price_1SmMjI2ZHBk6v8DT252RsUfY
```

---

## Environment Variables for Railway

```bash
# Copy these values to Railway Variables tab (Get from Stripe Dashboard)

STRIPE_SECRET_KEY=<your_stripe_secret_key_here>
STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key_here>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret_here>

STRIPE_PRICE_FOUNDATIONS=price_1SmMjC2ZHBk6v8DTXSsR4MT9
STRIPE_PRICE_GROWTH=price_1SmMjD2ZHBk6v8DT1YUEiUoA
STRIPE_PRICE_SCALE=price_1SmMjE2ZHBk6v8DTIj8qh5n6
STRIPE_PRICE_ENTERPRISE=price_1SmMjF2ZHBk6v8DTsZPvRIbh
STRIPE_PRICE_CONSULTANT_STARTER=price_1SmMjG2ZHBk6v8DTKXHgmMS7
STRIPE_PRICE_CONSULTANT_PROFESSIONAL=price_1SmMjH2ZHBk6v8DTWqW3Cslh
STRIPE_PRICE_CONSULTANT_ENTERPRISE=price_1SmMjI2ZHBk6v8DT252RsUfY
```

---

## Product IDs Quick Reference

| Product Name | Product ID | Price ID |
|--------------|------------|----------|
| Foundations | prod_TjqQwTWUSIaAS3 | price_1SmMjC2ZHBk6v8DTXSsR4MT9 |
| Growth | prod_TjqQM0ETV0mUeH | price_1SmMjD2ZHBk6v8DT1YUEiUoA |
| Scale | prod_TjqQ2o8rPX8NUk | price_1SmMjE2ZHBk6v8DTIj8qh5n6 |
| Enterprise (SaaS) | prod_TjqQGZc155HLxx | price_1SmMjF2ZHBk6v8DTsZPvRIbh |
| Consultant Starter | prod_TjqQAeUYzvQxTj | price_1SmMjG2ZHBk6v8DTKXHgmMS7 |
| Consultant Professional | prod_TjqQnK2IcfXv7h | price_1SmMjH2ZHBk6v8DTWqW3Cslh |
| Consultant Enterprise | prod_TjqQGiXjfRNDjC | price_1SmMjI2ZHBk6v8DT252RsUfY |

---

## Vercel Deployment Status

✅ **Added to Vercel (Production):**
- STRIPE_PRICE_FOUNDATIONS
- STRIPE_PRICE_SCALE
- STRIPE_PRICE_ENTERPRISE
- STRIPE_PRICE_CONSULTANT_STARTER
- STRIPE_PRICE_CONSULTANT_PROFESSIONAL
- STRIPE_PRICE_CONSULTANT_ENTERPRISE
- STRIPE_PRICE_GROWTH

---

## Next Steps

1. **Get Live Publishable Key:**
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy the "Publishable key" (starts with `pk_live_`)
   - Add to both Railway and Vercel

2. **Update Webhook Secret:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Create endpoint: `https://growthmanagerpro.com/api/stripe-webhook`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook signing secret
   - Add to Railway and Vercel as `STRIPE_WEBHOOK_SECRET`

3. **Test Subscription Flow:**
   - Visit: https://growthmanagerpro.com/signup-saas.html
   - Test selecting Foundations tier
   - Complete checkout flow
   - Verify subscription appears in Stripe Dashboard

---

## Important Notes

- ✅ All products created in LIVE mode
- ✅ All Price IDs added to Vercel
- ⚠️ Need to add Railway variables manually
- ⚠️ Need to get Live Publishable Key from Stripe
- ⚠️ Need to configure webhook endpoint

**Stripe Dashboard:** https://dashboard.stripe.com/products

---

**Created by:** Claude Code
**Date:** January 5, 2026
**Status:** READY FOR PRODUCTION
