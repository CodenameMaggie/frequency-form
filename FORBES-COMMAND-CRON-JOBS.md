# Forbes Command Cron Jobs for Frequency & Form

Configure these jobs on the Forbes Command server (5.78.139.9) to automate the partner outreach pipeline.

## Required Environment Variable

Set `FORBES_COMMAND_CRON` in both:
1. Forbes Command server (for making requests)
2. Vercel/Frequency & Form (for validating requests)

---

## Cron Jobs to Configure

### 1. Henry Partner Discovery
**Discovers new natural fiber brands for partnership**

```bash
# Schedule: Daily at 6:00 AM
0 6 * * *

# Command:
curl -X POST "https://frequencyandform.com/api/bots/henry-partner-discovery?secret=$FORBES_COMMAND_CRON" \
  -H "Content-Type: application/json"
```

**What it does:**
- Seeds 20 verified natural fiber brands (100% Capri, Loro Piana, MagicLinen, etc.)
- Scrapes DuckDuckGo for additional brands (free, no API key)
- Adds prospects to `ff_partners` table with status "prospect"
- Creates task for review

---

### 2. Dan Partner Outreach
**Sends partnership invitation emails to discovered brands**

```bash
# Schedule: Daily at 10:00 AM
0 10 * * *

# Command:
curl -X POST "https://frequencyandform.com/api/bots/dan-partner-outreach?secret=$FORBES_COMMAND_CRON" \
  -H "Content-Type: application/json"
```

**What it does:**
- Sends 5 partnership emails per run
- Uses Forbes Command email (Port 25)
- Includes digital lookbook link
- Invites client model program
- Offers real-time user feedback collaboration
- Updates partner status to "contacted"
- Creates follow-up task

---

### 3. Email Queue Processor
**Processes any queued emails**

```bash
# Schedule: Every 5 minutes
*/5 * * * *

# Command:
curl -X POST "https://frequencyandform.com/api/email-queue-processor?secret=$FORBES_COMMAND_CRON" \
  -H "Content-Type: application/json"
```

**What it does:**
- Processes up to 10 queued emails per run
- Handles retries (3 max)
- Uses Forbes Command email (Port 25)
- Logs sent emails for dedup

---

### 4. Dan Lead Generator (B2B Wholesale)
**Finds boutique buyers for wholesale**

```bash
# Schedule: Daily at 8:00 AM
0 8 * * *

# Command:
curl -X POST "https://frequencyandform.com/api/bots/dan-lead-generator?secret=$FORBES_COMMAND_CRON" \
  -H "Content-Type: application/json"
```

---

### 5. Dan Auto Social Posts
**Generates social media content**

```bash
# Schedule: Daily at 9:00 AM
0 9 * * *

# Command:
curl -X POST "https://frequencyandform.com/api/bots/dan-auto-social-posts?secret=$FORBES_COMMAND_CRON" \
  -H "Content-Type: application/json"
```

---

### 6. Social Post Publisher
**Publishes scheduled social posts**

```bash
# Schedule: Every 30 minutes
*/30 * * * *

# Command:
curl -X POST "https://frequencyandform.com/api/social-post-publisher?secret=$FORBES_COMMAND_CRON" \
  -H "Content-Type: application/json"
```

---

## Quick Copy-Paste Crontab

```crontab
# Frequency & Form Bot Automation
# All times in server timezone

# Henry Partner Discovery - Daily 6am
0 6 * * * curl -X POST "https://frequencyandform.com/api/bots/henry-partner-discovery?secret=YOUR_SECRET" -H "Content-Type: application/json"

# Dan Partner Outreach - Daily 10am
0 10 * * * curl -X POST "https://frequencyandform.com/api/bots/dan-partner-outreach?secret=YOUR_SECRET" -H "Content-Type: application/json"

# Email Queue Processor - Every 5 minutes
*/5 * * * * curl -X POST "https://frequencyandform.com/api/email-queue-processor?secret=YOUR_SECRET" -H "Content-Type: application/json"

# Dan Lead Generator - Daily 8am
0 8 * * * curl -X POST "https://frequencyandform.com/api/bots/dan-lead-generator?secret=YOUR_SECRET" -H "Content-Type: application/json"

# Dan Social Posts - Daily 9am
0 9 * * * curl -X POST "https://frequencyandform.com/api/bots/dan-auto-social-posts?secret=YOUR_SECRET" -H "Content-Type: application/json"

# Social Publisher - Every 30 minutes
*/30 * * * * curl -X POST "https://frequencyandform.com/api/social-post-publisher?secret=YOUR_SECRET" -H "Content-Type: application/json"
```

---

## Manual Testing

Test each endpoint before setting up cron:

```bash
# Set your secret
export SECRET="your_forbes_command_cron_secret"

# Test Henry Discovery
curl -X POST "https://frequencyandform.com/api/bots/henry-partner-discovery?secret=$SECRET"

# Test Dan Outreach (check status first)
curl "https://frequencyandform.com/api/bots/dan-partner-outreach"

# Then send outreach
curl -X POST "https://frequencyandform.com/api/bots/dan-partner-outreach?secret=$SECRET"

# Check email queue
curl "https://frequencyandform.com/api/email-queue-processor"
```

---

## Expected Pipeline Flow

```
6:00 AM  → Henry discovers brands → adds to ff_partners (status: prospect)
          ↓
10:00 AM → Dan sends outreach emails → updates status to "contacted"
          ↓
          → Includes lookbook link, client model invitation
          ↓
          → Partner clicks "Apply" link → goes to /partners/apply
          ↓
          → Application submitted → status becomes "negotiating"
          ↓
          → Approved → status becomes "active"
          ↓
          → Sync their products via Shopify/manual → display in Style Studio
```

---

## Monitoring

Check the Supabase tables:
- `ff_partners` - Partner prospects and status
- `email_sent_log` - Email delivery tracking
- `email_outreach_queue` - Queued emails
- `tasks` - Follow-up tasks created by bots

---

## Troubleshooting

### "Unauthorized" error
- Check `FORBES_COMMAND_CRON` matches between Forbes Command and Vercel

### No emails sending
- Check Forbes Command email API at `5.78.139.9:3000`
- Verify `EMAIL_API_KEY` is set

### No brands discovered
- Henry seeds 20 verified brands on first run
- DuckDuckGo scraping may be rate-limited

### Partner status not updating
- Check Supabase connection (`SUPABASE_SERVICE_ROLE_KEY`)
- View Vercel logs for errors
