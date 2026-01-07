# Brand Outreach System - Setup Complete ✅

## What's Been Set Up

### 1. Database Tables (SQL files on Desktop)

**Files to run in Supabase:**

1. **`017_bot_system.sql`** - Creates bot health tracking tables
2. **`frequency-form-brand-outreach-setup.sql`** - Creates:
   - `brand_prospects` - Stores brand information (20 brands pre-seeded)
   - `brand_outreach_queue` - Dan's work queue
   - `brand_emails` - Tracks sent emails
   - Auto-populate function to move qualified brands to queue
   - Dashboard view for tracking progress

**To run:** Copy/paste each SQL file into Supabase SQL Editor and execute.

---

### 2. Email System (Deployed to Railway)

**Email Template:** `/lib/email-templates/emails/brand-partnership.js`
- Professional Founding Partner invitation email
- Personalized with brand name, product, and story elements
- Includes 15% commission offer, urgency messaging
- Sends from: henry@frequencyandform.com

**Dan Bot Endpoint:** `/api/bots/dan-brand-outreach.js`
- Pulls from `brand_outreach_queue`
- Sends up to 10 emails per run
- Respects 100 emails/day Resend limit
- Tracks all emails in database
- Updates brand prospect status automatically

---

### 3. Email Strategy Documents (Already Created)

**In `/email-templates/` directory:**
- `QUICK-START-OUTREACH.md` - One-page action plan
- `founding-partner-outreach.md` - Full email templates and brand list
- `brand-research-process.md` - How to find and qualify brands

---

## How to Activate Dan

### Step 1: Run SQL Files (You need to do this)
```sql
-- In Supabase SQL Editor:
-- 1. Run 017_bot_system.sql
-- 2. Run frequency-form-brand-outreach-setup.sql
```

### Step 2: Trigger Dan Manually (Test)
```bash
curl -X POST "https://frequency-form-production.up.railway.app/api/bots/dan-brand-outreach" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or call from browser/Postman:
```
https://frequency-form-production.up.railway.app/api/bots/dan-brand-outreach?cron_secret=YOUR_CRON_SECRET
```

### Step 3: Set Up Automated Schedule (Optional)

Add to Railway cron scheduler or use external service (Cron-job.org):
- **Frequency:** Daily at 9am
- **Endpoint:** `https://frequency-form-production.up.railway.app/api/bots/dan-brand-outreach`
- **Method:** POST
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

---

## Current Brand Queue (20 Pre-Seeded Brands)

### Linen Specialists (5)
1. MagicLinen - partnerships@magiclinen.com
2. LinenMe - info@linenme.com
3. Rough Linen - info@roughlinen.com
4. Cultiver - hello@cultiver.com
5. In Bed Store - info@inbedstore.com

### Organic Cotton (5)
6. PACT - wholesale@wearpact.com
7. Groceries Apparel - hello@groceriesapparel.com
8. Krochet Kids - info@krochetkids.org
9. Harvest & Mill - info@harvestandmill.com
10. Organique - contact@organiquebyrd.com

### Wool & Cashmere (5)
11. Woolly - hello@woolly.clothing
12. Duckworth - info@duckworthco.com
13. Smartwool - customerservice@smartwool.com
14. Minus33 - info@minus33.com
15. Naadam - info@naadam.co

### Hemp (3)
16. Jungmaven - wholesale@jungmaven.com
17. Hemp Black - info@hempblack.com
18. Afends - wholesale@afends.com

### Natural Bedding (2)
19. Coyuchi - customerservice@coyuchi.com
20. Boll & Branch - care@bollandbranch.com

---

## Email Flow

1. **Database:** Brand added to `brand_prospects` table
2. **Auto-Populate:** Function moves to `brand_outreach_queue` with priority
3. **Dan Sends:** Pulls highest priority brands, sends personalized emails
4. **Tracking:** Logs in `brand_emails`, updates `brand_prospects.outreach_status`
5. **Follow-up:** Manual or automated follow-up emails (to be built)

---

## Database Queries for Monitoring

### Check outreach queue
```sql
SELECT brand_name, contact_email, priority, status
FROM brand_outreach_queue
ORDER BY priority DESC, created_at ASC;
```

### Check sent emails
```sql
SELECT bp.brand_name, be.recipient_email, be.sent_at, be.status
FROM brand_emails be
JOIN brand_prospects bp ON be.brand_prospect_id = bp.id
ORDER BY be.sent_at DESC;
```

### Check dashboard
```sql
SELECT * FROM brand_outreach_dashboard;
```

---

## Next Steps

### Immediate (After Running SQL)
1. ✅ Run SQL files in Supabase
2. ✅ Test Dan endpoint manually with 1-2 brands
3. ✅ Verify emails arrive correctly

### Short Term (This Week)
1. Set up daily automated cron job
2. Monitor first batch of emails
3. Track reply rates
4. Add more brand prospects as needed

### Medium Term (This Month)
1. Build follow-up email sequences
2. Create partner application review flow
3. Track conversion to approved partners
4. Build partner dashboard

---

## Troubleshooting

**Dan not sending emails?**
- Check Supabase: Are brands in `brand_outreach_queue` with `status='pending'`?
- Check Railway logs: `railway logs | grep "Dan Brand Outreach"`
- Verify CRON_SECRET in request

**Emails not arriving?**
- Check Resend dashboard for delivery status
- Verify henry@frequencyandform.com domain is verified in Resend
- Check spam folder

**Database errors?**
- Ensure both SQL files were run successfully
- Check RLS policies allow service role access
- Verify tenant_id matches (default: 00000000-0000-0000-0000-000000000001)

---

## Environment Variables Required

These should already be set in Railway:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET`
- `BUSINESS_CODE=FF`

---

**Status:** System ready, pending SQL execution in Supabase.

**Next Action:** Run the 2 SQL files on your Desktop in Supabase SQL Editor.
