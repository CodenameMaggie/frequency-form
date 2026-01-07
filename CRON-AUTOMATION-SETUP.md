# 🤖 Frequency & Form - Bot Automation Setup

## Railway Cron Configuration

Railway bots are deployed and ready. Now set up automation to run them on schedule.

---

## Option 1: Railway Cron (Built-in) ⭐ RECOMMENDED

Railway has built-in cron support. Add to your `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "cron": [
    {
      "name": "Dan Brand Discovery",
      "schedule": "*/10 * * * *",
      "command": "curl -X POST http://localhost:3001/api/bots/dan-free-scraper -H 'Authorization: Bearer $CRON_SECRET'"
    },
    {
      "name": "Dan Brand Outreach",
      "schedule": "0 9 * * *",
      "command": "curl -X POST http://localhost:3001/api/bots/dan-brand-outreach -H 'Authorization: Bearer $CRON_SECRET'"
    },
    {
      "name": "Email Queue Processor",
      "schedule": "*/5 * * * *",
      "command": "curl -X POST http://localhost:3001/api/email-queue-processor -H 'Authorization: Bearer $CRON_SECRET'"
    }
  ]
}
```

**Schedule Syntax:** Standard cron format
- `*/10 * * * *` = Every 10 minutes
- `0 9 * * *` = Daily at 9 AM
- `*/5 * * * *` = Every 5 minutes

---

## Option 2: External Cron Service (cron-job.org) 🌐

If Railway cron isn't available, use a free external service:

### Setup Steps:

1. **Go to:** https://cron-job.org/en/
2. **Sign up** for free account
3. **Create new cron job:**

#### Job 1: Dan Brand Discovery
- **Title:** FF - Dan Brand Discovery
- **URL:** `https://frequency-form-production.up.railway.app/api/bots/dan-free-scraper`
- **Method:** POST
- **Headers:**
  ```
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
  ```
- **Schedule:** Every 10 minutes
- **Body (JSON):**
  ```json
  {"triggered_by": "cron_job_org"}
  ```

#### Job 2: Dan Brand Outreach
- **Title:** FF - Dan Brand Outreach
- **URL:** `https://frequency-form-production.up.railway.app/api/bots/dan-brand-outreach`
- **Method:** POST
- **Headers:**
  ```
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
  ```
- **Schedule:** Daily at 9:00 AM (0 9 * * *)
- **Body (JSON):**
  ```json
  {"triggered_by": "cron_job_org"}
  ```

#### Job 3: Email Queue Processor
- **Title:** FF - Email Queue
- **URL:** `https://frequency-form-production.up.railway.app/api/email-queue-processor`
- **Method:** POST
- **Headers:**
  ```
  Authorization: Bearer YOUR_CRON_SECRET
  Content-Type: application/json
  ```
- **Schedule:** Every 5 minutes
- **Body (JSON):**
  ```json
  {"triggered_by": "cron_job_org"}
  ```

---

## Bot Schedule Summary

| Bot | Frequency | Purpose | Priority |
|-----|-----------|---------|----------|
| **Dan Brand Discovery** | Every 10 min | Find new brands | 🔥 HIGH |
| **Dan Brand Outreach** | Daily 9 AM | Send partnership emails | 🔥 HIGH |
| **Email Queue** | Every 5 min | Send queued emails | 🔥 HIGH |
| Annie Auto Support | Hourly | Process support tickets | MEDIUM |
| Alex Monitor | Hourly | System health checks | MEDIUM |
| Henry Goal Setter | Daily 6 AM | Strategic planning | LOW |
| Dave Goal Tracker | Every 3 hours | Financial tracking | LOW |

---

## Testing Cron Jobs

### Manual Test (requires CRON_SECRET):

```bash
# Test Dan Brand Discovery
curl -X POST "https://frequency-form-production.up.railway.app/api/bots/dan-free-scraper" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"triggered_by":"manual_test"}'

# Expected response:
# {
#   "success": true,
#   "version": "4.0-natural-fiber-brands",
#   "data": {
#     "brands_discovered": 10,
#     "leads_added": 10,
#     ...
#   }
# }
```

### View Railway Logs:

```bash
railway logs --tail 100
```

Look for:
```
[Dan Free Scraper] Starting free brand discovery for Frequency & Form...
[Dan Free Scraper] Found 10 natural fiber brands via AI search
[Dan Free Scraper] Added 10 new brand leads
```

---

## Monitoring Bot Activity

### 1. Check Database for New Leads

```sql
-- See recently discovered brands
SELECT
    company,
    email,
    lead_source,
    created_at
FROM contacts
WHERE lead_source = 'ai_brand_discovery'
ORDER BY created_at DESC
LIMIT 20;
```

### 2. Check Bot Actions Log

```sql
-- See what Dan has been doing
SELECT
    bot_name,
    action_description,
    status,
    created_at
FROM bot_actions_log
WHERE bot_name = 'dan'
ORDER BY created_at DESC
LIMIT 20;
```

### 3. Check Brand Outreach Queue

```sql
-- See pending outreach
SELECT
    brand_name,
    contact_email,
    priority,
    status,
    created_at
FROM brand_outreach_queue
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC;
```

### 4. Check Sent Emails

```sql
-- See Dan's sent emails
SELECT
    brand_name,
    recipient_email,
    sent_at,
    status
FROM brand_emails
ORDER BY sent_at DESC
LIMIT 20;
```

---

## Expected Bot Behavior

### Dan Brand Discovery (Every 10 min)
- Discovers 10 new natural fiber brands
- Generates partnership email addresses
- Adds to contacts database
- Queues for outreach
- **Cost:** $0 (free AI + email guessing)

### Dan Brand Outreach (Daily 9 AM)
- Pulls from brand_outreach_queue
- Sends up to 10 emails/run
- Respects 100 emails/day limit (Resend)
- Personalizes each email
- Tracks in brand_emails table

### Email Queue (Every 5 min)
- Processes queued emails
- Handles retries on failures
- Updates delivery status
- Manages rate limits

---

## Troubleshooting

### ❌ "Unauthorized: Invalid or missing CRON secret"
**Solution:** Check that `CRON_SECRET` environment variable is set in Railway and matches your cron job header.

### ❌ No brands discovered
**Solution:**
1. Check Railway logs for errors
2. Verify Anthropic API key is set
3. Test Atlas bot endpoint manually

### ❌ Emails not sending
**Solution:**
1. Verify brand outreach tables exist (run SQL files)
2. Check RESEND_API_KEY is set
3. Verify domain is verified in Resend
4. Check daily email limit (100/day)

### ❌ Cron job shows error
**Solution:**
1. Test endpoint manually with curl
2. Check Railway deployment status
3. Verify bot server is healthy: `/health`
4. Check logs for specific error

---

## Success Metrics

### Week 1 Goals:
- ✅ 500+ brands discovered
- ✅ 70 outreach emails sent
- ✅ 10-15 positive replies
- ✅ 2-3 applications submitted

### Month 1 Goals:
- ✅ 2,000+ brands discovered
- ✅ 300 outreach emails sent
- ✅ 50+ positive replies
- ✅ 20 applications submitted
- ✅ 10 Founding Partners approved

---

## Quick Start Checklist

- [ ] Get CRON_SECRET from Railway environment variables
- [ ] Choose automation method (Railway cron or cron-job.org)
- [ ] Set up Dan Brand Discovery (every 10 min)
- [ ] Set up Dan Brand Outreach (daily 9 AM)
- [ ] Set up Email Queue Processor (every 5 min)
- [ ] Test each cron job manually
- [ ] Monitor logs for 24 hours
- [ ] Check database for new brands
- [ ] Verify emails are sending

---

## Next Steps

Once automation is running:

1. **Monitor for 1 week** - Let Dan discover 500+ brands
2. **Verify email domain** - Improve delivery rates
3. **Review first responses** - Adjust messaging if needed
4. **Add follow-up sequences** - 2nd/3rd touch automation
5. **Scale up** - Increase daily email limit as budget allows

---

**🎉 Your bots will now work 24/7 to grow your marketplace!**
