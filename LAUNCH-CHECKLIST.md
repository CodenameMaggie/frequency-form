# 🚀 Frequency & Form - Complete Launch Checklist

## Your Step-by-Step Guide to Going Live

---

## ✅ PHASE 1: DATABASE SETUP (15 minutes)

### Step 1: Run SQL Files in Supabase

**Go to:** https://supabase.com/dashboard → Your Project → SQL Editor

**Run these files in order:**

- [ ] **1. Bot System Schema**
  - File: `database/frequency-form-bot-schema.sql`
  - Creates: 22 bot system tables
  - Verify: `SELECT COUNT(*) FROM bot_actions_log;` should work

- [ ] **2. Marketplace Schema**
  - File: `database/marketplace-schema.sql`
  - Creates: Brand partners, products, sales tables
  - Verify: `SELECT * FROM brand_partners WHERE brand_slug = 'frequency-and-form';` should return 1 row

- [ ] **3. Brand Outreach Tables** ⚠️ CRITICAL
  - File: `/Users/kristi/Desktop/frequency-form-brand-outreach-setup.sql`
  - Creates: brand_prospects, brand_outreach_queue, brand_emails
  - Verify: `SELECT COUNT(*) FROM brand_prospects;` should return 20 brands

- [ ] **4. Seed Products** (Optional but recommended)
  - File: `scripts/seed-products.sql`
  - Creates: 20 sample products across all fabric types
  - Verify: `SELECT COUNT(*) FROM products;` should return 20

### Step 2: Verify Database Health

Run: `scripts/verify-database.sql` in Supabase SQL Editor

Expected output:
```
✅ 35+ tables found
✅ Brand Outreach Tables: COMPLETE
✅ Bot System Tables: COMPLETE
✅ Marketplace Tables: COMPLETE
✅ 20 brand prospects seeded
```

---

## ✅ PHASE 2: EMAIL SETUP (30 minutes)

### Step 1: Verify Domain in Resend

- [ ] **Login to Resend:** https://resend.com/
- [ ] **Add Domain:** frequencyandform.com
- [ ] **Copy DNS Records:**
  - SPF record
  - DKIM record
  - DMARC record
- [ ] **Add to your DNS provider** (where you bought the domain)
- [ ] **Wait for verification** (can take up to 48 hours)
- [ ] **Test send** from henry@frequencyandform.com

### Step 2: Confirm Environment Variables

Check Railway → Your Project → Variables:
- [ ] `RESEND_API_KEY` is set
- [ ] `CRON_SECRET` is set
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] `ANTHROPIC_API_KEY` is set (for Dan's AI)
- [ ] `BUSINESS_CODE=FF` is set

---

## ✅ PHASE 3: BOT AUTOMATION (30 minutes)

### Step 1: Test Dan's Brand Discovery

**Run this command** (replace YOUR_CRON_SECRET):
```bash
export CRON_SECRET="your-secret-from-railway"
bash scripts/test-dan-scraper.sh
```

**Expected Result:**
```json
{
  "success": true,
  "version": "4.0-natural-fiber-brands",
  "data": {
    "brands_discovered": 10,
    "leads_added": 10,
    ...
  }
}
```

### Step 2: Set Up Cron Automation

**Choose one method:**

#### Option A: Railway Cron (Recommended)
- [ ] Add cron jobs to `railway.json`
- [ ] Deploy changes
- [ ] Verify in Railway dashboard

#### Option B: Cron-job.org (External)
- [ ] Sign up: https://cron-job.org/
- [ ] Create 3 jobs:
  - Dan Brand Discovery (every 10 min)
  - Dan Brand Outreach (daily 9 AM)
  - Email Queue Processor (every 5 min)
- [ ] Test each job
- [ ] Enable all jobs

**Full instructions:** See `CRON-AUTOMATION-SETUP.md`

### Step 3: Monitor First 24 Hours

- [ ] Check Railway logs: `railway logs --tail 100`
- [ ] Verify brands being discovered:
  ```sql
  SELECT company, email, created_at
  FROM contacts
  WHERE lead_source = 'ai_brand_discovery'
  ORDER BY created_at DESC
  LIMIT 10;
  ```
- [ ] Check bot actions:
  ```sql
  SELECT bot_name, action_description, created_at
  FROM bot_actions_log
  WHERE bot_name = 'dan'
  ORDER BY created_at DESC
  LIMIT 10;
  ```

---

## ✅ PHASE 4: SALES CHANNELS (1-2 days)

### Step 1: Set Up Shopify (2-3 hours)

- [ ] **Sign up:** https://www.shopify.com/ (14-day free trial)
- [ ] **Choose plan:** Basic ($39/month)
- [ ] **Install theme:** Dawn (free)
- [ ] **Customize brand colors** to match your site
- [ ] **Add 10-20 products:**
  - Use seed data from database
  - Or manually create flagship products
  - Include high-quality images
- [ ] **Set up payments:** Shopify Payments or Stripe
- [ ] **Configure shipping:** Flat rate or brand-partner based
- [ ] **Add policies:** Return, Privacy, Terms (use Shopify templates)
- [ ] **Test checkout:** Place a test order
- [ ] **Remove password protection**
- [ ] **Go live!**

### Step 2: Connect Pinterest Shop (1 hour)

- [ ] **Create Pinterest Business Account:** https://business.pinterest.com/
- [ ] **Claim website:** frequencyandform.com
- [ ] **Apply for Shopping Features** (approval takes 3-7 days)
- [ ] **Install Pinterest Sales Channel** in Shopify
- [ ] **Sync product catalog**
- [ ] **Create 20-50 pins** from your products
- [ ] **Optimize for Pinterest SEO:**
  - Use keywords: linen bedding, organic cotton, natural fiber
  - Vertical images (1000x1500px)
  - Rich descriptions with benefits
- [ ] **Optional:** Start Pinterest ads ($5-10/day)

### Step 3: Connect Instagram & Facebook (15 minutes)

- [ ] **Connect Instagram Business** to Facebook Page
- [ ] **Install Facebook/Instagram Sales Channel** in Shopify
- [ ] **Enable Instagram Shopping**
- [ ] **Tag products** in 5-10 posts
- [ ] **Create Stories** with product tags
- [ ] **Post content:**
  - Product styling shots
  - Fabric close-ups
  - Educational content about frequencies
  - Brand partner spotlights

### Step 4: Google Shopping (30 minutes)

- [ ] **Create Google Merchant Center:** https://merchants.google.com/
- [ ] **Claim website**
- [ ] **Connect Shopify**
- [ ] **Approve products** in Merchant Center
- [ ] **Optional:** Create Smart Shopping campaign ($10-20/day)

**Full instructions:** See `SALES-CHANNELS-GUIDE.md`

---

## ✅ PHASE 5: CONTENT & MARKETING (Ongoing)

### Week 1: Foundation Content

- [ ] **Write 5 blog posts:**
  - "The Science of Fabric Frequency"
  - "Why Linen Resonates at 5,000 Hz"
  - "Natural Fibers vs Synthetic: Energy Comparison"
  - "Building Your Healing Wardrobe"
  - "Founding Partner Program: Join the Movement"

- [ ] **Create 50 Pinterest Pins:**
  - 20 product pins
  - 15 educational infographics
  - 10 quote graphics about natural fibers
  - 5 brand partner spotlights

- [ ] **Instagram Content Calendar:**
  - 3 feed posts per week
  - Daily stories
  - 2 Reels per week
  - Educational carousels

### Week 2: Brand Partner Outreach

Dan is now discovering brands automatically! But you can also:

- [ ] **Manual research:** Find 10-20 additional brands
- [ ] **Personalize outreach:** Review Dan's discoveries, add custom notes
- [ ] **Follow up:** Reply to interested brands within 2 hours
- [ ] **Process applications:** Approve first 5-10 Founding Partners
- [ ] **Onboard partners:** Help them list first products

### Ongoing: Community Building

- [ ] **Email list:** Collect emails on homepage
- [ ] **Newsletter:** Weekly tips about natural fibers
- [ ] **Facebook Group:** "Natural Fiber Living Community"
- [ ] **Pinterest Boards:** Create 10-15 themed boards
- [ ] **Engage:** Comment on sustainable fashion posts
- [ ] **Collaborate:** Partner with wellness influencers

---

## ✅ PHASE 6: ANALYTICS & OPTIMIZATION (Week 2+)

### Set Up Tracking

- [ ] **Google Analytics 4:** Add to website
- [ ] **Facebook Pixel:** Track conversions
- [ ] **Pinterest Tag:** Track pins and purchases
- [ ] **Shopify Analytics:** Review daily
- [ ] **Supabase Analytics:** Monitor database growth

### Key Metrics to Track

**Traffic:**
- [ ] Unique visitors per channel
- [ ] Bounce rate (<60% good)
- [ ] Time on site (>2 min good)
- [ ] Pages per session (>3 good)

**Conversion:**
- [ ] Overall conversion rate (1-3% typical)
- [ ] Add-to-cart rate
- [ ] Checkout completion rate
- [ ] Average order value ($80-150 target)

**Bot Performance:**
- [ ] Brands discovered per day (target: 50+)
- [ ] Outreach emails sent (target: 10/day)
- [ ] Email reply rate (target: 5-10%)
- [ ] Applications received (target: 2-3/week)
- [ ] Founding Partners approved (target: 10/month)

**Revenue:**
- [ ] Total sales
- [ ] Sales by channel
- [ ] Commission earned (15-20%)
- [ ] Average order value
- [ ] Customer lifetime value

### Weekly Review (Every Monday)

- [ ] Review sales by channel
- [ ] Check bot activity logs
- [ ] Process new brand applications
- [ ] Approve pending products
- [ ] Adjust what's not working
- [ ] Double down on what works

---

## ✅ PHASE 7: SCALE (Month 2+)

### Once You Have Momentum:

- [ ] **Increase bot frequency:**
  - Dan scrapes every 5 min (was 10)
  - Send 20 emails/day (was 10)

- [ ] **Upgrade Resend plan:**
  - $20/month = 50,000 emails/month
  - Remove daily limit

- [ ] **Hire VA for brand outreach:**
  - Manual email personalization
  - Application review
  - Partner onboarding

- [ ] **Paid advertising:**
  - Pinterest ads: $50-100/day
  - Google Shopping: $30-50/day
  - Instagram ads: $20-30/day

- [ ] **Content creator partnerships:**
  - Send free products to micro-influencers
  - Sustainable fashion bloggers
  - Wellness YouTubers

- [ ] **PR & Media:**
  - Pitch to sustainable fashion publications
  - "Fabric frequency science" angle
  - Local news stories

- [ ] **Wholesale program:**
  - B2B portal on your marketplace
  - Sell to boutiques and wellness centers
  - Volume discounts

- [ ] **Subscription box:**
  - "Healing Tier Box" - monthly curated items
  - $79-99/month
  - Builds recurring revenue

---

## 📊 SUCCESS MILESTONES

### Week 1:
- [ ] All systems operational
- [ ] Database fully set up
- [ ] Bots running automatically
- [ ] Shopify store live
- [ ] 10-20 products listed
- [ ] First Pinterest pins created

### Week 2:
- [ ] 100+ brands discovered by Dan
- [ ] 20 outreach emails sent
- [ ] 2-3 brand responses
- [ ] First brand application
- [ ] 50+ Pinterest pins
- [ ] Instagram shop active

### Month 1:
- [ ] 500+ brands discovered
- [ ] 100 outreach emails sent
- [ ] 10-15 positive replies
- [ ] 5 Founding Partners approved
- [ ] 50-100 products live
- [ ] First sales!

### Month 3:
- [ ] 2,000+ brands discovered
- [ ] 20 Founding Partners
- [ ] 200+ products
- [ ] $10K-30K in sales
- [ ] All sales channels active
- [ ] Profitable!

### Month 6:
- [ ] 50 brand partners
- [ ] 500+ products
- [ ] $50K-100K/month sales
- [ ] Team of 2-3 people
- [ ] Sustainable growth

---

## 🚨 TROUBLESHOOTING

### Dan Not Discovering Brands
- [ ] Check Railway logs for errors
- [ ] Verify ANTHROPIC_API_KEY is set
- [ ] Test Atlas bot endpoint
- [ ] Check database for new contacts

### Emails Not Sending
- [ ] Verify brand outreach tables exist
- [ ] Check RESEND_API_KEY is set
- [ ] Confirm domain is verified
- [ ] Check daily limit (100 on free plan)

### No Traffic to Marketplace
- [ ] Check if pages are indexed by Google
- [ ] Verify Pinterest pins are live
- [ ] Ensure Instagram shop is active
- [ ] Create more content
- [ ] Consider paid ads

### Products Not Showing
- [ ] Verify products are approved
- [ ] Check is_active = true
- [ ] Ensure stock > 0
- [ ] Verify brand_partner is approved

### Low Conversion Rate
- [ ] Improve product photos
- [ ] Add more product descriptions
- [ ] Include size guides
- [ ] Add customer reviews
- [ ] Reduce friction in checkout
- [ ] Offer free shipping threshold

---

## 💰 BUDGET SUMMARY

### Required (Month 1):
- **Shopify:** $39/month
- **Domain:** $12/year (if not owned)
- **TOTAL:** ~$50/month

### Recommended (Month 2+):
- **Resend Pro:** $20/month (50K emails)
- **Pinterest Ads:** $150-300/month
- **Google Shopping:** $300-600/month
- **Content Creator Gifts:** $200-500/month
- **TOTAL:** ~$700-1,500/month

### Revenue Potential:
- **Month 1:** $1K-5K
- **Month 3:** $10K-30K
- **Month 6:** $50K-100K
- **Your Commission:** 15-20% = $10K-20K/month by Month 6

**ROI:** Very positive! Low upfront cost, high revenue potential.

---

## 🎯 YOUR NEXT 3 ACTIONS

### Today (Right Now):
1. [ ] **Run SQL files** in Supabase (15 min)
2. [ ] **Test Dan scraper** with your CRON_SECRET (5 min)
3. [ ] **Sign up for Shopify** free trial (10 min)

### This Week:
1. [ ] **Set up Shopify** completely with 10-20 products
2. [ ] **Apply for Pinterest Shopping**
3. [ ] **Configure cron automation** for bots

### This Month:
1. [ ] **Get 10 Founding Partners** approved
2. [ ] **Launch Pinterest + Instagram** shops
3. [ ] **Hit $5K in sales**

---

## 📚 DOCUMENTATION REFERENCE

All detailed guides available in your repo:

- **Bot Automation:** `CRON-AUTOMATION-SETUP.md`
- **Sales Channels:** `SALES-CHANNELS-GUIDE.md`
- **Database:** `DATABASE-SCHEMA-SUMMARY.md`
- **Bot Deployment:** `BOT-DEPLOYMENT-GUIDE.md`
- **Brand Outreach:** `BRAND-OUTREACH-SETUP.md`
- **System Audit:** `SYSTEM-AUDIT-2026-01-07.md`

---

## 🎉 YOU'RE READY TO LAUNCH!

Everything is built. Your bots are deployed. Dan is ready to find brands.

**All that's left is to:**
1. Run the SQL files
2. Set up your sales channels
3. Let the system work

**You've got this! 🚀**

---

**Questions or issues?** Check the troubleshooting section or review the detailed guides.

**Ready to go?** Start with "Your Next 3 Actions" above!
