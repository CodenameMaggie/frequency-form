# Stripe Setup Guide for IntroAlignment

## Part 1: Create Stripe Products & Prices

### Step 1: Log into Stripe Dashboard
Go to https://dashboard.stripe.com/

### Step 2: Create Subscription Products

Navigate to **Products** → **Add Product**

#### Product 1: Seeker Plan
- **Name:** Seeker
- **Description:** Start meeting aligned matches - 2 introductions per month
- **Pricing:**
  - Monthly: $49.00 USD (recurring)
  - Yearly: $470.00 USD (recurring)
- **Save Product** → Copy the Price IDs

#### Product 2: Aligned Plan (Most Popular)
- **Name:** Aligned
- **Description:** Our most popular plan for serious seekers - 5 introductions per month
- **Pricing:**
  - Monthly: $149.00 USD (recurring)
  - Yearly: $1,430.00 USD (recurring)
- **Save Product** → Copy the Price IDs

#### Product 3: Founder Plan (Premium)
- **Name:** Founder
- **Description:** Premium concierge matchmaking experience - Unlimited introductions
- **Pricing:**
  - Monthly: $499.00 USD (recurring)
  - Yearly: $4,790.00 USD (recurring)
- **Save Product** → Copy the Price IDs

### Step 3: Create One-Time Products

#### Product 4: Extra Introduction
- **Name:** Extra Introduction
- **Description:** One additional introduction to a matched member
- **Pricing:** $29.00 USD (one-time)

#### Product 5: 3-Pack Introductions
- **Name:** 3-Pack Introductions
- **Description:** Three additional introductions at a discount
- **Pricing:** $69.00 USD (one-time)

#### Product 6: Compatibility Deep Dive
- **Name:** Compatibility Deep Dive
- **Description:** Detailed 10-page compatibility analysis for any match
- **Pricing:** $19.00 USD (one-time)

#### Product 7: Profile Review
- **Name:** Profile Review
- **Description:** Professional review and optimization of your profile by our team
- **Pricing:** $99.00 USD (one-time)

---

## Part 2: Update Database with Stripe IDs

After creating products in Stripe, update the database with the Stripe Product and Price IDs.

### SQL to Update subscription_plans Table:

```sql
-- Update Seeker Plan
UPDATE subscription_plans
SET
    stripe_product_id = 'prod_XXXXXXXXXXXXX',  -- Replace with actual Stripe Product ID
    stripe_price_monthly = 'price_XXXXXXXXXXXXX',  -- Replace with monthly Price ID
    stripe_price_yearly = 'price_XXXXXXXXXXXXX'    -- Replace with yearly Price ID
WHERE slug = 'seeker';

-- Update Aligned Plan
UPDATE subscription_plans
SET
    stripe_product_id = 'prod_XXXXXXXXXXXXX',
    stripe_price_monthly = 'price_XXXXXXXXXXXXX',
    stripe_price_yearly = 'price_XXXXXXXXXXXXX'
WHERE slug = 'aligned';

-- Update Founder Plan
UPDATE subscription_plans
SET
    stripe_product_id = 'prod_XXXXXXXXXXXXX',
    stripe_price_monthly = 'price_XXXXXXXXXXXXX',
    stripe_price_yearly = 'price_XXXXXXXXXXXXX'
WHERE slug = 'founder';
```

### SQL to Update one_time_products Table:

```sql
-- Update Extra Introduction
UPDATE one_time_products
SET
    stripe_product_id = 'prod_XXXXXXXXXXXXX',
    stripe_price_id = 'price_XXXXXXXXXXXXX'
WHERE slug = 'extra-intro';

-- Update 3-Pack Introductions
UPDATE one_time_products
SET
    stripe_product_id = 'prod_XXXXXXXXXXXXX',
    stripe_price_id = 'price_XXXXXXXXXXXXX'
WHERE slug = 'intro-3-pack';

-- Update Compatibility Deep Dive
UPDATE one_time_products
SET
    stripe_product_id = 'prod_XXXXXXXXXXXXX',
    stripe_price_id = 'price_XXXXXXXXXXXXX'
WHERE slug = 'compatibility-report';

-- Update Profile Review
UPDATE one_time_products
SET
    stripe_product_id = 'prod_XXXXXXXXXXXXX',
    stripe_price_id = 'price_XXXXXXXXXXXXX'
WHERE slug = 'profile-review';
```

---

## Part 3: Add Environment Variables to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your **introalignment** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_XXXXX` or `sk_test_XXXXX` | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | `whsec_XXXXX` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_XXXXX` or `pk_test_XXXXX` | Production, Preview, Development |

5. Click **Save**
6. **Redeploy** your application for changes to take effect

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Add environment variables
vercel env add STRIPE_SECRET_KEY
# Paste your Stripe Secret Key when prompted
# Select: Production, Preview, Development

vercel env add STRIPE_WEBHOOK_SECRET
# Paste your Webhook Secret when prompted

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Paste your Publishable Key when prompted

# Redeploy
vercel --prod
```

---

## Part 4: Set Up Stripe Webhook

### Step 1: Get Your Webhook URL
Your webhook endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`

### Step 2: Configure in Stripe Dashboard

1. Go to **Developers** → **Webhooks** → **Add Endpoint**
2. Enter your webhook URL: `https://introalignment.vercel.app/api/webhooks/stripe`
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Click **Add Endpoint**
5. **Copy the Signing Secret** (starts with `whsec_`)
6. Add this as `STRIPE_WEBHOOK_SECRET` in Vercel (see Part 3)

---

## Part 5: Test the Integration

### Test Subscription Flow:
1. Visit `/pricing` on your deployed app
2. Click "Subscribe" on a plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Verify subscription is created in Stripe Dashboard
5. Check `user_subscriptions` table in Supabase

### Test One-Time Purchase:
1. Visit a page with one-time products
2. Purchase an item
3. Check `purchases` table in Supabase

---

## Checklist

- [ ] Create all 7 products in Stripe Dashboard
- [ ] Copy Product IDs and Price IDs
- [ ] Update `subscription_plans` table with Stripe IDs
- [ ] Update `one_time_products` table with Stripe IDs
- [ ] Add STRIPE_SECRET_KEY to Vercel
- [ ] Add STRIPE_WEBHOOK_SECRET to Vercel
- [ ] Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to Vercel
- [ ] Configure webhook endpoint in Stripe
- [ ] Redeploy application
- [ ] Test subscription purchase
- [ ] Test one-time purchase

---

## Where to Find Stripe Keys

**Secret Key:**
Stripe Dashboard → Developers → API Keys → Secret Key (starts with `sk_`)

**Publishable Key:**
Stripe Dashboard → Developers → API Keys → Publishable Key (starts with `pk_`)

**Webhook Secret:**
Stripe Dashboard → Developers → Webhooks → Your Endpoint → Signing Secret (starts with `whsec_`)

---

## Notes

- Use **test mode** keys for development/testing
- Use **live mode** keys for production
- Keep webhook secret secure
- Never commit API keys to git
- The Free plan doesn't need Stripe (it's $0)
