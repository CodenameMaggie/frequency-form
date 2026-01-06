# 🤖 Frequency & Form Bot System - Deployment Guide

## Overview

This guide will help you deploy the complete 6-bot AI system to Railway. The system consists of:

1. **Henry** - Chief of Staff (Operations & Strategic Goals)
2. **Dave** - Accountant (Financial Tracking & Proposals)
3. **Dan** - Marketing Director (Lead Generation & Outreach)
4. **Jordan** - Legal Counsel (Compliance & Risk Management)
5. **Annie** - Customer Concierge (Support & Personal Styling)
6. **Alex** - Engineering Lead (System Monitoring & Health)
7. **Atlas** - AI Router (Shared Memory & Cross-Bot Coordination)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FREQUENCY & FORM                         │
│                    Full Bot Architecture                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Vercel (Frontend)│◄────────┤  Railway (Bots)  │
│  Next.js App     │   API    │  Express Server  │
│  - Website       │  Calls   │  - 6 Bot APIs    │
│  - Annie Widget  │          │  - Cron Jobs     │
│  - Stripe        │          │  - Atlas Router  │
└────────┬─────────┘          └────────┬─────────┘
         │                             │
         │                             │
         └──────────┬──────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   Supabase (DB)      │
         │   - Bot data         │
         │   - Customers        │
         │   - Leads            │
         │   - Conversations    │
         │   - Email queue      │
         └──────────────────────┘
```

## Step 1: Database Setup

### 1.1 Run the Database Schema

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy the entire contents of `database/frequency-form-bot-schema.sql`
3. Paste into the SQL Editor
4. Click "Run" to create all tables

**Tables Created:**
- `system_config` - Business configuration
- `tenants` - Multi-tenant support
- `users` - Customer accounts
- `contacts` - Leads and prospects
- `emails` / `email_inbound` / `email_queue` - Email system
- `bot_actions_log` - All bot activity tracking
- `ai_governance_rules` - Bot limits and compliance
- `ai_kill_switch` - Emergency stop mechanism
- `ai_memory_store` - Atlas shared memory
- `tickets` - Customer support tickets
- `annie_conversations` - Chat history
- `styling_profiles` - Customer styling preferences (FF-specific)
- `product_recommendations` - Annie's product suggestions
- `compliance_logs` - Jordan's compliance tracking
- `system_health_log` - Alex's monitoring data
- `mainframe_sync_queue` - Sync to Forbes mainframe (optional)

### 1.2 Verify Database Setup

Run this query in Supabase SQL Editor to verify:

```sql
SELECT
  business_code,
  business_name,
  domain,
  created_at
FROM system_config
WHERE business_code = 'FF';
```

You should see:
```
business_code | business_name      | domain              | created_at
FF            | Frequency & Form   | frequencyandform.com | 2026-01-05...
```

## Step 2: Environment Variables

### 2.1 Required Variables for Railway

Go to your Railway project settings and add these environment variables:

#### **Supabase (Required)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Settings → API

#### **Anthropic AI (Required)**
```bash
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

Get from: https://console.anthropic.com/

#### **Email Service (Required)**
```bash
RESEND_API_KEY=re_your-resend-api-key-here
```

Get from: https://resend.com/api-keys

#### **Business Config (Required)**
```bash
BUSINESS_CODE=FF
BUSINESS_NAME=Frequency & Form
BUSINESS_DOMAIN=frequencyandform.com
```

#### **Cron Security (Required)**
```bash
CRON_SECRET=your-secure-random-string
```

Generate with: `openssl rand -hex 32`

#### **Node Environment (Auto-configured by Railway)**
```bash
NODE_ENV=production
PORT=3001
```

### 2.2 Optional Variables

See `.env.railway.example` for optional integrations:
- Gmail API (advanced email features)
- Twitter/LinkedIn/Facebook (social posting)
- Calendly/Google Calendar (booking management)
- Forbes Mainframe (enterprise sync)

## Step 3: Deploy to Railway

### 3.1 Option A: Deploy via Railway CLI

```bash
# Navigate to project directory
cd /Users/Kristi/frequency-and-form

# Link to Railway project (if not already linked)
railway link

# Deploy
railway up
```

### 3.2 Option B: Deploy via Git Push

```bash
# Commit all changes
git add .
git commit -m "Deploy 6-bot system to Railway"
git push

# Railway will auto-deploy from your linked repo
```

### 3.3 Verify Deployment

Once deployed, test the health endpoint:

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-05T...",
  "database": "connected",
  "business": "FF",
  "bots": ["Henry", "Dave", "Dan", "Jordan", "Annie", "Alex", "Atlas"]
}
```

## Step 4: Test the Bot System

### 4.1 Test Annie Chat Widget

1. Visit your Vercel site: https://frequency-and-form.vercel.app
2. Look for the Annie chat widget in the bottom-right corner
3. Click to open and send a message: "Tell me about linen"
4. Annie should respond with information about linen's 5,000 Hz frequency

### 4.2 Test Bot APIs Directly

**Test Henry (Goal Setter):**
```bash
curl -X POST https://your-app.railway.app/api/bots/henry-goal-setter \
  -H "Content-Type: application/json" \
  -H "X-Vercel-Cron-Secret: YOUR_CRON_SECRET"
```

**Test Dan (Lead Generator):**
```bash
curl -X POST https://your-app.railway.app/api/bots/dan-free-scraper \
  -H "Content-Type: application/json" \
  -H "X-Vercel-Cron-Secret: YOUR_CRON_SECRET"
```

**Test Annie (Auto Support):**
```bash
curl -X POST https://your-app.railway.app/api/bots/annie-auto-support \
  -H "Content-Type: application/json" \
  -H "X-Vercel-Cron-Secret: YOUR_CRON_SECRET"
```

### 4.3 Monitor Bot Activity

Check the bot actions log in Supabase:

```sql
SELECT
  bot_name,
  action_type,
  action_description,
  status,
  created_at
FROM bot_actions_log
ORDER BY created_at DESC
LIMIT 20;
```

## Step 5: Cron Scheduler (Automated Tasks)

The cron scheduler runs automatically in production. Here's the schedule:

### **Every 5 Minutes**
- Email Queue Processor - Sends queued emails
- Social Post Publisher - Publishes approved posts

### **Every 10 Minutes**
- Dan Free Scraper - Discovers leads using AI

### **Every 15 Minutes**
- Dan Populate Queue - Moves contacts to outreach queue
- Dan Reply Handler - Handles email replies with AI

### **Every 30 Minutes**
- Dan Social Lead Discovery - Finds leads on LinkedIn/Twitter
- Deal Pipeline Processor - Moves deals through stages
- Annie Auto Onboarding - Onboards new customers

### **Every Hour**
- Henry Goal Setter - Sets strategic goals
- Annie Auto Support - Processes support tickets
- Alex Proactive Monitor - System health checks

### **Every 2 Hours**
- Dan Lead Generator - Creates marketing strategies

### **Every 3 Hours**
- Dave Goal Tracker - Tracks financial metrics
- Henry Ticket Monitor - Monitors support tickets

### **Every 6 Hours**
- Dave Auto Proposal - Generates proposals
- Follow-up Processor - Processes follow-ups

### **Every 8 Hours**
- Auto Follow-up Processor - Sends follow-up emails

### **Daily at 6 AM**
- Goal Coordinator - Coordinates all bot goals

### **Daily at 9 AM**
- Dan Auto Social Posts - Creates social media content

### **Hourly 9am-5pm Mon-Fri**
- Dan Auto Outreach - Sends personalized emails to leads

## Step 6: Monitoring & Maintenance

### 6.1 Check Railway Logs

```bash
railway logs
```

Look for:
- ✅ Server startup success
- ⏰ Cron job executions
- 📊 Bot activity summaries
- ❌ Any errors or failures

### 6.2 Monitor Database Growth

```sql
-- Check total bot actions
SELECT COUNT(*) FROM bot_actions_log;

-- Check Annie conversations
SELECT COUNT(*) FROM annie_conversations;

-- Check email queue size
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';
```

### 6.3 AI Governance Dashboard

Check bot compliance:

```sql
SELECT
  rule_name,
  bot_name,
  limit_value,
  is_active
FROM ai_governance_rules
WHERE is_active = true;
```

### 6.4 Emergency Stop (Kill Switch)

If bots are misbehaving, activate the kill switch:

```bash
curl -X POST https://your-app.railway.app/api/bots/ai-kill-switch \
  -H "Content-Type: application/json" \
  -d '{"action": "activate", "reason": "Emergency stop"}'
```

To deactivate:

```bash
curl -X POST https://your-app.railway.app/api/bots/ai-kill-switch \
  -H "Content-Type: application/json" \
  -d '{"action": "deactivate"}'
```

## Troubleshooting

### Issue: "supabaseUrl is required"
**Solution:** Add NEXT_PUBLIC_SUPABASE_URL to Railway environment variables

### Issue: "Anthropic API error"
**Solution:** Verify ANTHROPIC_API_KEY is correct and has credits

### Issue: Cron jobs not running
**Solution:** Check Railway logs for errors. Ensure CRON_SECRET is set correctly

### Issue: Annie widget not appearing
**Solution:**
1. Check that AnnieWidget is in `/components/AnnieWidget.tsx`
2. Verify it's imported in `app/layout.tsx`
3. Rebuild and redeploy Vercel: `vercel --prod`

### Issue: Database connection errors
**Solution:**
1. Verify Supabase service role key has correct permissions
2. Check that database schema was run successfully
3. Test connection with: `curl https://your-app.railway.app/health`

## Security Best Practices

1. **Never commit `.env` files** - Use Railway environment variables
2. **Rotate CRON_SECRET regularly** - Update every 90 days
3. **Monitor bot activity** - Check logs daily for unusual behavior
4. **Set governance rules** - Limit bot actions per hour/day
5. **Use kill switch if needed** - Don't hesitate to stop bots if issues arise
6. **Review email queue** - Ensure no spam or unwanted outreach

## Next Steps

Once deployed successfully:

1. **Customize Annie's personality** - Edit `api/bots/annie-chat.js` to refine her responses
2. **Configure Dan's lead sources** - Add target industries and keywords
3. **Set up social media** - Add Twitter/LinkedIn credentials for auto-posting
4. **Create governance rules** - Set limits on bot actions in Supabase
5. **Train Atlas** - Add business context to `ai_memory_store` table
6. **Monitor and optimize** - Review bot performance weekly

## Support

For issues with the bot system:
- Check Railway logs: `railway logs`
- Review Supabase errors: Dashboard → Logs
- Test bot endpoints individually
- Check `bot_actions_log` table for failed actions

## Summary

✅ Database schema created with 20+ tables
✅ 6 AI bots deployed (Henry, Dave, Dan, Jordan, Annie, Alex)
✅ Atlas router for shared memory
✅ Cron scheduler for 24/7 automation
✅ Annie chat widget on website
✅ Email system with queue and retry logic
✅ Governance rules and kill switch
✅ Complete bot infrastructure ready

Your Frequency & Form bot system is now live! 🚀
