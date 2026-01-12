# 🚨 RAILWAY DEPLOYMENT FIX GUIDE
**Frequency & Form - Critical Issue Resolution**

## Problem
Your Railway service `frequency-form-production.up.railway.app` is deploying **STEADING HOME** instead of **Frequency & Form**.

**Evidence from logs:**
```
╔════════════════════════════════════════════════════════╗
║              🏡 STEADING HOME                          ║
║         Heritage Recipes & Kitchen Arts                ║
║  Business ID: SH                                  ║
╚════════════════════════════════════════════════════════╝
```

**Expected:**
```
╔════════════════════════════════════════════════════════╗
║              👗 FREQUENCY & FORM                       ║
║         Natural Fiber Fashion                          ║
║  Business ID: FF                                  ║
╚════════════════════════════════════════════════════════╝
```

---

## Step-by-Step Fix

### Option 1: Fix Existing Service (RECOMMENDED)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Find project: **"Frequency and Form"**

2. **Find the Broken Service**
   - Look for service with domain: `frequency-form-production.up.railway.app`
   - Click on the service

3. **Check Source Repository**
   - Go to **Settings** tab
   - Under **Source** section, check:
     - Repository: Should be `CodenameMaggie/frequency-form` ✅
     - Branch: Should be `main` ✅
     - If wrong, click "Disconnect" then "Connect to GitHub"

4. **Check Build Configuration**
   - In Settings → **Build**
   - Verify:
     - Builder: NIXPACKS ✅
     - Root Directory: `/` ✅
     - Start Command: `npm run build && npm run start` ✅

5. **Force Redeploy**
   - Go to **Deployments** tab
   - Click "Deploy" → "Deploy Latest Commit"
   - Wait 3-5 minutes for build

6. **Verify Fix**
   - Once deployed, run:
     ```bash
     curl https://frequency-form-production.up.railway.app/health
     ```
   - Should see: `{"status":"healthy","service":"Frequency & Form"}`

---

### Option 2: Delete and Recreate Service

If Option 1 doesn't work:

1. **Delete Broken Service**
   - In Railway dashboard → Select service
   - Settings → Danger Zone → "Delete Service"

2. **Create New Service**
   - Click "New" → "GitHub Repo"
   - Select: `CodenameMaggie/frequency-form`
   - Branch: `main`

3. **Configure Environment Variables**
   Copy these from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FORBES_COMMAND_API_KEY`
   - `FORBES_COMMAND_SENDER_KEY`
   - `PINTEREST_CLIENT_ID`
   - `PINTEREST_CLIENT_SECRET`
   - `PINTEREST_ACCESS_TOKEN`
   - All other F&F specific variables

4. **Set Start Command**
   - Settings → Deploy
   - Start Command: `npm run build && npm run start`

5. **Add Custom Domain**
   - Settings → Domains
   - Add: `frequencyandform.com`
   - Update DNS records as Railway instructs

6. **Deploy**
   - Railway will auto-deploy on save

---

### Option 3: Use Railway CLI (Advanced)

```bash
# Navigate to F&F project
cd /Users/Kristi/frequency-form

# Link to correct service
railway link

# Follow prompts:
# - Project: Frequency and Form
# - Environment: production
# - Service: (select the F&F service)

# Deploy
railway up

# Check logs
railway logs
```

---

## After Fix: Verification Steps

### 1. Run System Test
```bash
cd /Users/Kristi/frequency-form
chmod +x scripts/test-all-systems.sh
./scripts/test-all-systems.sh
```

### 2. Test Key Endpoints

**Health Check:**
```bash
curl https://frequency-form-production.up.railway.app/health
# Expected: {"status":"healthy","service":"Frequency & Form","timestamp":"..."}
```

**Style Studio Page:**
```bash
curl -I https://frequency-form-production.up.railway.app/ff/style-studio
# Expected: HTTP/2 200
```

**Bot Endpoint (with auth):**
```bash
curl -X POST https://frequency-form-production.up.railway.app/api/bots/henry-partner-discovery \
  -H "Authorization: Bearer 77776f3f2567ed7c6a8b9ce28321de52a10730eacc73dbf9d23ea2b792150d67"
# Expected: {"status":"success",...}
```

**Domain:**
```bash
curl -I https://frequencyandform.com
# Expected: HTTP/2 200
```

### 3. Run Database Migrations

Once Railway is fixed, run SQL files in Supabase:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Run in order:
   - `/Users/kristi/Desktop/006_ff_partners_table.sql`
   - `/Users/kristi/Desktop/007_ff_style_studio_schema.sql`
   - `/Users/kristi/Desktop/008_ff_manufacturers_table.sql`
   - `/Users/kristi/Desktop/009_email_duplicate_prevention.sql` ⭐ (Critical for duplicate prevention)

### 4. Verify Duplicate Prevention

```bash
# Test that duplicate prevention is working
psql "postgresql://YOUR_CONNECTION_STRING" -c "SELECT can_send_email('test@example.com', 'invitation', 'invitation:test@example.com');"
# Expected: t (true)

# Send test email twice - second should be blocked
```

---

## Common Issues

### Issue: "Application failed to respond"
**Cause:** Wrong app deployed or build failed
**Fix:** Check Railway logs, verify repository connection

### Issue: "Service: None" in CLI
**Cause:** Local directory not linked
**Fix:** Run `railway link` in project directory

### Issue: Environment variables missing
**Cause:** Not copied to new service
**Fix:** Copy all vars from `.env.local` to Railway dashboard

### Issue: Domain not working
**Cause:** DNS not updated or SSL pending
**Fix:** Wait 5-10 minutes for DNS propagation, check Railway domain settings

---

## Emergency Contact

If Railway fix fails, F&F can be deployed to:
- **Vercel**: `vercel --prod` (Next.js optimized)
- **Netlify**: Supports Next.js with adapter
- **DigitalOcean App Platform**: Docker-based deployment

---

## Current System Status

✅ **Completed:**
- Duplicate email prevention system created
- Email sent log tracking implemented
- 30+ pre-configured email cooldown rules
- SQL migration files on desktop
- Comprehensive test script created

🚨 **Blocked (Requires Railway Fix):**
- Live endpoint testing
- Bot system verification
- Domain functionality confirmation
- Database migration execution (depends on working app)

---

## Next Steps After Railway Fix

1. ✅ Verify Railway deployment shows "FREQUENCY & FORM"
2. ✅ Run system test script
3. ✅ Execute SQL migrations in Supabase
4. ✅ Test duplicate prevention system
5. ✅ Verify all bot endpoints work
6. ✅ Confirm domain points correctly
7. ✅ Test Style Studio interface
8. ✅ Review email sending logs

---

**Created:** 2026-01-12
**Status:** Railway deployment requires manual intervention
**Priority:** CRITICAL - Blocks all F&F live testing
