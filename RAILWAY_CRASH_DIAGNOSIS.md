# Railway Crash Diagnosis
**Date:** 2026-01-12
**Status:** 502 Application Failed to Respond

---

## Current Symptoms

✅ Local server: Working (tested successfully)
✅ Database: All migrations complete
✅ Supabase: Connected and verified
🚨 Railway: **502 errors - not responding**
🚨 Domain: **502 errors (points to broken Railway)**

---

## Root Cause Analysis

### Most Likely Issue: Wrong Application Deployed

Railway logs from earlier showed:
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

### Secondary Issue (If F&F is Deployed): Health Check Timeout

The `/api/health` endpoint:
- Connects to Supabase database
- Has 8-second timeout
- Railway may be killing the container before health check completes
- Database cold starts can be slow

---

## Solution Steps

### Option 1: Fix Railway Service Configuration (RECOMMENDED)

1. **Go to Railway Dashboard**
   ```
   https://railway.app/dashboard
   ```

2. **Find Project:**
   - Project name: "Frequency and Form"
   - Look for service with domain: `frequency-form-production.up.railway.app`

3. **Check Settings → Source:**
   - Should show: `CodenameMaggie/frequency-form`
   - Branch: `main`
   - If wrong → Disconnect and reconnect to correct repo

4. **Check Environment Variables:**
   Required variables (copy from `.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   FORBES_COMMAND_API_KEY
   FORBES_COMMAND_SENDER_KEY
   NODE_ENV=production
   ```

5. **Force Redeploy:**
   - Go to Deployments tab
   - Click "Deploy" → "Deploy Latest Commit"
   - Wait 3-5 minutes for build

6. **Monitor Logs:**
   - Watch for "Frequency & Form" startup message
   - Should see: "👗 FREQUENCY & FORM" not "🏡 STEADING HOME"

### Option 2: Use Quick Health Check (If F&F is Deployed but Timing Out)

Railway may be using the slow `/api/health` endpoint. Tell Railway to use the fast `/api/ping` endpoint instead:

**In Railway Dashboard:**
1. Settings → Deploy
2. Health Check Path: `/api/ping` (instead of `/api/health`)
3. Health Check Timeout: 30 seconds
4. Redeploy

**Note:** This app has 2 health endpoints:
- `/api/health` - Full health check with database test (slow, 8s timeout)
- `/api/ping` - Quick health check, no database (fast, instant)

---

## Verification After Fix

### Test 1: Health Endpoint
```bash
curl https://frequency-form-production.up.railway.app/api/health?quick=true
```
Expected:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123.45,
  "database": "skipped"
}
```

### Test 2: Check Application Identity
```bash
curl https://frequency-form-production.up.railway.app/ | grep -i "frequency\|steading"
```
Should see: "Frequency" or "Frequency & Form"
Should NOT see: "Steading" or "Steading Home"

### Test 3: Full System Test
```bash
cd /Users/Kristi/frequency-form
./scripts/test-all-systems.sh
```

---

## Common Railway Issues

### Issue: "Application failed to respond"
**Causes:**
- Wrong application deployed
- Health check timeout
- Missing environment variables
- Database connection issues
- Port binding issues

**Fixes:**
1. Verify correct repo connected
2. Check all environment variables set
3. Use quick health check endpoint
4. Increase health check timeout
5. Check Railway logs for errors

### Issue: "Build succeeded but deploy failed"
**Causes:**
- Missing dependencies in `package.json`
- Wrong start command
- Port not binding to $PORT variable

**Fixes:**
1. Verify `package.json` scripts section:
   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "next start -p ${PORT:-3000}"
     }
   }
   ```
2. Check railway.json has correct start command
3. Ensure app binds to `process.env.PORT`

### Issue: "Container keeps restarting"
**Causes:**
- Application crashing on startup
- OOM (out of memory)
- Uncaught exceptions

**Fixes:**
1. Check Railway logs for crash errors
2. Increase memory allocation
3. Add error handling to startup code

---

## Environment Variables Checklist

### Required for F&F:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `FORBES_COMMAND_API_KEY`
- ✅ `FORBES_COMMAND_SENDER_KEY`
- ✅ `NODE_ENV=production`

### Optional but Recommended:
- `PINTEREST_CLIENT_ID`
- `PINTEREST_CLIENT_SECRET`
- `PINTEREST_ACCESS_TOKEN`
- `DAN_AUTO_OUTREACH=disabled` (cost saving)

### Verify Variables in Railway:
1. Railway Dashboard → Your Service
2. Variables tab
3. Compare with `.env.local`
4. Add any missing variables

---

## Alternative Deployment (If Railway Won't Fix)

### Deploy to Vercel (Next.js Optimized):
```bash
npm install -g vercel
vercel login
vercel --prod
```

Advantages:
- Built for Next.js
- Automatic deployments on git push
- Better Next.js optimizations
- Free tier available

### Deploy to Netlify:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## Contact Support

If none of these solutions work:

**Railway Support:**
- Discord: https://discord.gg/railway
- Email: team@railway.app
- Docs: https://docs.railway.app

**Provide Them:**
- Project ID (from Railway dashboard URL)
- Service name: frequency-form-production
- Error: "Application failed to respond - 502"
- Logs showing wrong application deployed

---

## Summary

**Primary Issue:** Railway deploying wrong repository (STEADING HOME vs Frequency & Form)

**Solution:** Fix repository connection in Railway dashboard, force redeploy

**Secondary Issue:** Health check may timeout on database connection

**Solution:** Use `/api/ping` endpoint for health checks instead of `/api/health`

**Status:** All F&F code is ready, database is configured, local testing works perfectly - just need Railway deployment fixed!

---

**Created:** 2026-01-12
**Priority:** CRITICAL
**Blocking:** All live testing and production use
