# 🎯 FORBES COMMAND - Multi-Business Control System

## What Is Forbes Command?

Forbes Command is a unified testing and control system that connects all three of your businesses:
- **Growth Manager Pro (GMP)** - CRM & business management
- **IntroAlignment (IA)** - Personal development platform
- **Frequency & Form (FF)** - Natural fiber wholesale distribution

This allows you to:
- Test connections across all businesses
- Verify bot systems are operational
- Check database health
- Run cross-business queries
- Monitor all systems from one place

---

## 🚀 Quick Setup

### Step 1: Get Your Supabase Credentials

For each business, you need:
1. **Supabase Project URL** (looks like: `https://abc123xyz.supabase.co`)
2. **Anon/Public Key** (starts with `eyJhbGc...`)
3. **Service Role Key** (starts with `eyJhbGc...` but different from anon key)

**Where to find these:**
1. Go to https://supabase.com/dashboard
2. Select your project (GMP, IA, or FF)
3. Click "Settings" → "API"
4. Copy:
   - **Project URL**
   - **anon/public** key
   - **service_role** key (click "Reveal" to see it)

### Step 2: Create .env.local File

```bash
# Copy the template
cp .env.local.template .env.local

# Edit with your actual credentials
nano .env.local
# (or use your preferred editor)
```

### Step 3: Fill In Your Credentials

Open `.env.local` and replace the placeholder values:

```bash
# FREQUENCY & FORM (FF)
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-ff-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# GROWTH MANAGER PRO (GMP)
GMP_SUPABASE_URL=https://your-actual-gmp-url.supabase.co
GMP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GMP_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# INTROALIGNMENT (IA)
IA_SUPABASE_URL=https://your-actual-ia-url.supabase.co
IA_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
IA_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run the Connection Test

```bash
node scripts/forbes-command-test.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
  FORBES COMMAND - BUSINESS CONNECTION TESTS
═══════════════════════════════════════════════════════════

Testing Growth Manager Pro...

  ✓ Connection: PASS
  ✓ Auth:       PASS
  ✓ Tables:     users, bots, contacts, tasks, ...
  ✓ Bots:       6 found
  ✓ Users:      5 found

───────────────────────────────────────────────────────────

Testing IntroAlignment...

  ✓ Connection: PASS
  ✓ Auth:       PASS
  ✓ Tables:     users, sessions, progress, ...
  ✓ Bots:       3 found
  ✓ Users:      12 found

───────────────────────────────────────────────────────────

Testing Frequency & Form...

  ✓ Connection: PASS
  ✓ Auth:       PASS
  ✓ Tables:     contacts, products, brand_partners, ...
  ✓ Bots:       6 found
  ✓ Users:      1 found

═══════════════════════════════════════════════════════════
  SUMMARY
═══════════════════════════════════════════════════════════
  3/3 businesses fully connected
```

---

## 🔍 What The Test Checks

For each business:
1. **Connection Test** - Can we reach the Supabase API?
2. **Auth Test** - Is authentication working?
3. **Tables Discovery** - What tables exist in the database?
4. **Bots Check** - How many bots are deployed?
5. **Users Check** - How many users are in the system?

---

## 🛠️ Troubleshooting

### "Connection: FAIL"
- Check your `SUPABASE_URL` is correct
- Make sure it starts with `https://`
- Verify the URL ends with `.supabase.co`

### "Auth: FAIL"
- Check your `ANON_KEY` is correct
- Make sure you copied the full key (they're very long!)
- Verify you're using the right key for the right project

### "Tables: None found"
- Your anon key might not have read permissions
- Try using the service role key instead
- Check if RLS (Row Level Security) is blocking access

### "Bots: 0 found"
- The `bots` table might not exist yet
- Run the database setup SQL for that business
- Check if the table is named differently (e.g., `bot_actions_log`)

---

## 🎯 Next Steps After Connection Test Passes

Once all 3 businesses show "PASS", you can:

### 1. Set Up Cross-Business Bot Commands

Create bots that can:
- Pull data from GMP
- Process through IntroAlignment
- Update Frequency & Form

### 2. Unified Dashboard

Build a single dashboard showing:
- All business metrics
- Bot activity across all systems
- Combined revenue tracking
- Cross-business analytics

### 3. Cross-Business Automation

Examples:
- When a client signs up in GMP → Create IntroAlignment account
- When IntroAlignment session completes → Log activity in GMP
- When Frequency & Form gets a wholesale order → Update GMP CRM

### 4. Shared Resources

- Use one Anthropic API key across all businesses
- Share email templates
- Unified bot logging
- Cross-business AI memory

---

## 📊 Business Overview

### Growth Manager Pro (GMP)
- **Purpose:** CRM & business operations
- **Bots:** 6 (Henry, Dave, Dan, Jordan, Annie, Alex)
- **Database:** Contacts, tasks, projects, invoices
- **Current Status:** ✅ Operational

### IntroAlignment (IA)
- **Purpose:** Personal development & coaching
- **Bots:** 3-4 (depends on configuration)
- **Database:** Users, sessions, progress tracking
- **Current Status:** ❓ (needs testing)

### Frequency & Form (FF)
- **Purpose:** B2B natural fiber wholesale distribution
- **Bots:** 6 (Henry, Dave, Dan, Jordan, Annie, Alex + Atlas)
- **Database:** Contacts, products, brand_partners, orders
- **Current Status:** ✅ Operational (just pivoted to B2B)

---

## 🔐 Security Notes

### .env.local is Gitignored
Your `.env.local` file is automatically ignored by Git, so your credentials won't be committed to the repository.

### Service Role Keys Are Powerful
- Service role keys bypass Row Level Security (RLS)
- Only use them in trusted server environments
- Never expose them in client-side code
- Rotate them if you suspect they've been compromised

### Anon Keys Are Safe(r)
- Anon keys are meant to be public
- They respect RLS policies
- Safe to use in client-side code
- Still don't commit them to public repos

---

## 💡 Pro Tips

### Use Environment-Specific Configs

```javascript
// Development
const config = process.env.NODE_ENV === 'development'
  ? { url: process.env.DEV_SUPABASE_URL, key: process.env.DEV_SUPABASE_KEY }
  : { url: process.env.PROD_SUPABASE_URL, key: process.env.PROD_SUPABASE_KEY };
```

### Test Individual Businesses

```bash
# Test only GMP
node scripts/forbes-command-test.js --business=GMP

# Test only FF
node scripts/forbes-command-test.js --business=FF
```

### Add Custom Health Checks

Modify `forbes-command-test.js` to check:
- Specific bot status
- Recent activity logs
- Database row counts
- API response times
- Cron job status

---

## 📞 Support

If you run into issues:
1. Check the troubleshooting section above
2. Verify your Supabase credentials at https://supabase.com/dashboard
3. Review the database setup guides for each business
4. Check Railway logs if bots aren't responding

---

## 🎉 You're All Set!

Once your connection test shows `3/3 businesses fully connected`, you have:
- ✅ All three Supabase databases accessible
- ✅ Authentication working across all systems
- ✅ Bot systems operational
- ✅ Ready to build cross-business features

**Next:** Run the test and share the results! 🚀
