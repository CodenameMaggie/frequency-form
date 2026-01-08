# 🚀 QUICK DATABASE SETUP - Frequency & Form

## ⚡ 5-Minute Setup

Your database is **CONNECTED** ✅ but the tables aren't created yet. Follow these 3 steps:

---

## STEP 1: Open Supabase SQL Editor (1 minute)

1. Go to: https://supabase.com/dashboard/project/kzazlevvatuqbslzdjjb
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

---

## STEP 2: Run Bot Schema (2 minutes)

1. Open the file: `database/frequency-form-bot-schema.sql`
2. **Copy ALL the contents** (⌘+A, then ⌘+C)
3. **Paste** into Supabase SQL Editor
4. Click **"Run"** (or press ⌘+Enter)

**What this creates:**
- 22 bot system tables
- system_config, tenants, users, contacts
- bot_actions_log, ai_memory_store, ai_governance_rules
- emails, tickets, annie_conversations
- styling_profiles, product_recommendations
- compliance_logs, system_health_log

**Expected result:**
```
Success. No rows returned
```

---

## STEP 3: Run Marketplace Schema (1 minute)

1. Click **"New Query"** again
2. Open the file: `database/marketplace-schema.sql`
3. **Copy ALL the contents**
4. **Paste** into Supabase SQL Editor
5. Click **"Run"**

**What this creates:**
- brand_partners, brand_applications
- products, sales, payouts
- order_fulfillments, seller_notifications

**Expected result:**
```
Success. No rows returned
```

---

## STEP 4: Verify Setup (1 minute)

Run this query in Supabase SQL Editor:

```sql
-- Check if all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**You should see 28+ tables including:**
- ai_memory_store ✅
- bot_actions_log ✅
- contacts ✅
- emails ✅
- products ✅
- system_config ✅
- users ✅

---

## STEP 5: Run Status Check Again

Back in your terminal:

```bash
node scripts/check-system-status.js
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
  FREQUENCY & FORM - SYSTEM STATUS CHECK
═══════════════════════════════════════════════════════════

📊 Checking database connection...
   ✅ Database: CONNECTED
   Business Code: FF

🤖 Checking bot activity...
   ✅ Bot Logs: 0 recent entries (ready for bot activity)

🧠 Checking Atlas AI memory system...
   ✅ Atlas Memories: 0 entries (ready to learn)

🔍 Checking Dan's wholesale buyer discovery...
   ⚠️  No recent Dan activity found (bots not deployed yet)

📇 Checking contacts database...
   ✅ Total Contacts: 0 (ready for discoveries)

🚀 Checking deployment status...
   ⚠️  Not deployed yet (deploy to Railway for 24/7 automation)
```

---

## ✅ SUCCESS CHECKLIST

After running the SQL files, you should have:
- [x] Database connected
- [x] 28+ tables created
- [x] system_config with business_code = 'FF'
- [x] Ready for bot deployment
- [x] Ready for Dan to discover wholesale buyers

---

## 🎯 WHAT'S NEXT?

Once database is set up:

### Option 1: Test Dan Locally (Quick Test)
```bash
# Start bot server locally
npm run start:bots

# In another terminal, trigger Dan manually
node scripts/test-dan-scraper.sh
```

### Option 2: Deploy to Railway (24/7 Automation)
```bash
# Link Railway project
railway link

# Deploy
railway up

# Bots will run automatically every 10 minutes!
```

---

## 🔧 TROUBLESHOOTING

### "Permission denied" error
**Fix:** Make sure you're using the service role key (not anon key)

### "Table already exists" error
**Fix:** That's okay! It means tables are already created. Skip to Step 4.

### "column does not exist" error
**Fix:** Run the SQL files again - some tables might be missing columns

### Still getting errors?
Run this to see which tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

---

## 📊 CURRENT STATUS

✅ **DONE:**
- Database credentials configured
- .env.local created
- Connection verified

⏳ **NEXT:**
- Run 2 SQL files in Supabase (5 minutes)
- Deploy to Railway (10 minutes)
- Dan will start discovering wholesale buyers automatically!

---

**Ready?** Open Supabase SQL Editor and paste those SQL files! 🚀
