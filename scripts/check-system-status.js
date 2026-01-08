/**
 * Frequency & Form - Complete System Status Check
 * Checks: Bots, Atlas, Dan activity, Contacts, Deployment
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.FF_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.FF_SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function checkSystemStatus() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FREQUENCY & FORM - SYSTEM STATUS CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    database: false,
    bots: { active: 0, recent: [] },
    atlas: { memories: 0, recent: [] },
    dan: { discoveries: 0, recent: [] },
    contacts: { total: 0, wholesalers: 0, recent: [] },
    deployment: { status: 'unknown', url: null },
    errors: [],
  };

  try {
    // ===================================================================
    // 1. CHECK DATABASE CONNECTION
    // ===================================================================
    console.log('📊 Checking database connection...');
    const { data: configData, error: configError } = await supabase
      .from('system_config')
      .select('business_code')
      .eq('business_code', 'FF')
      .single();

    if (configError && configError.code !== 'PGRST116') {
      results.errors.push(`Database connection failed: ${configError.message}`);
      console.log('   ❌ Database: NOT CONNECTED');
      console.log(`   Error: ${configError.message}\n`);
    } else {
      results.database = true;
      console.log('   ✅ Database: CONNECTED');
      console.log(`   Business Code: ${configData?.business_code || 'FF (default)'}\n`);
    }

    // ===================================================================
    // 2. CHECK BOT ACTIVITY
    // ===================================================================
    console.log('🤖 Checking bot activity...');
    const { data: botLogs, error: botError } = await supabase
      .from('bot_actions_log')
      .select('id, bot_name, action_type, action_description, status, created_at')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(20);

    if (botError) {
      results.errors.push(`Bot logs query failed: ${botError.message}`);
      console.log('   ❌ Bot logs: ERROR');
      console.log(`   ${botError.message}\n`);
    } else {
      results.bots.recent = botLogs || [];

      // Count unique active bots in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const activeBots = new Set(
        (botLogs || [])
          .filter(log => log.created_at > oneDayAgo)
          .map(log => log.bot_name)
      );
      results.bots.active = activeBots.size;

      console.log(`   ✅ Bot Logs: ${botLogs?.length || 0} recent entries`);
      console.log(`   Active Bots (24h): ${results.bots.active}`);
      if (botLogs && botLogs.length > 0) {
        console.log('\n   Most Recent Bot Actions:');
        botLogs.slice(0, 5).forEach(log => {
          const timeAgo = Math.round((Date.now() - new Date(log.created_at)) / 1000 / 60);
          console.log(`     ${log.bot_name}: ${log.action_type} (${timeAgo}m ago) ${log.status === 'completed' ? '✅' : '⏳'}`);
        });
      }
      console.log('');
    }

    // ===================================================================
    // 3. CHECK ATLAS MEMORY (Learning System)
    // ===================================================================
    console.log('🧠 Checking Atlas AI memory system...');
    const { data: memories, error: memoryError } = await supabase
      .from('ai_memory_store')
      .select('id, category, importance, content, created_at')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(10);

    if (memoryError) {
      results.errors.push(`Atlas memory query failed: ${memoryError.message}`);
      console.log('   ❌ Atlas Memory: ERROR');
      console.log(`   ${memoryError.message}\n`);
    } else {
      results.atlas.memories = memories?.length || 0;
      results.atlas.recent = memories || [];

      console.log(`   ✅ Atlas Memories: ${memories?.length || 0} entries`);
      if (memories && memories.length > 0) {
        console.log('\n   Recent Learnings:');
        memories.slice(0, 3).forEach(mem => {
          const timeAgo = Math.round((Date.now() - new Date(mem.created_at)) / 1000 / 60 / 60);
          console.log(`     [${mem.category}] ${mem.content.substring(0, 60)}... (${timeAgo}h ago)`);
        });
      } else {
        console.log('   ⚠️  No memories found - Atlas may not be learning yet');
      }
      console.log('');
    }

    // ===================================================================
    // 4. CHECK DAN'S WHOLESALE BUYER DISCOVERIES
    // ===================================================================
    console.log('🔍 Checking Dan\'s wholesale buyer discovery...');

    // Check bot actions for Dan specifically
    const danActions = (results.bots.recent || []).filter(log => log.bot_name === 'dan');
    results.dan.discoveries = danActions.length;

    if (danActions.length > 0) {
      console.log(`   ✅ Dan Activity: ${danActions.length} recent actions`);
      console.log('\n   Recent Discoveries:');
      danActions.slice(0, 3).forEach(action => {
        const timeAgo = Math.round((Date.now() - new Date(action.created_at)) / 1000 / 60);
        console.log(`     ${action.action_description.substring(0, 70)}... (${timeAgo}m ago)`);
      });
    } else {
      console.log('   ⚠️  No recent Dan activity found');
      console.log('   Dan should be discovering wholesale buyers every 10 minutes');
    }
    console.log('');

    // ===================================================================
    // 5. CHECK CONTACTS DATABASE
    // ===================================================================
    console.log('📇 Checking contacts database...');

    // Total contacts
    const { count: totalCount, error: countError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID);

    // Recent contacts
    const { data: recentContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, full_name, company, email, stage, lead_source, created_at')
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(10);

    // Wholesale buyer contacts (from Dan's B2B discovery)
    const { count: wholesaleCount, error: wholesaleError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('lead_source', 'ai_web_search');

    if (countError || contactsError) {
      results.errors.push(`Contacts query failed: ${countError?.message || contactsError?.message}`);
      console.log('   ❌ Contacts: ERROR\n');
    } else {
      results.contacts.total = totalCount || 0;
      results.contacts.wholesalers = wholesaleCount || 0;
      results.contacts.recent = recentContacts || [];

      console.log(`   ✅ Total Contacts: ${totalCount || 0}`);
      console.log(`   Wholesale Buyers: ${wholesaleCount || 0}`);

      if (recentContacts && recentContacts.length > 0) {
        console.log('\n   Recent Contacts:');
        recentContacts.slice(0, 5).forEach(contact => {
          const timeAgo = Math.round((Date.now() - new Date(contact.created_at)) / 1000 / 60 / 60);
          const source = contact.lead_source || 'unknown';
          console.log(`     ${contact.company || contact.full_name} (${contact.email}) - ${source} (${timeAgo}h ago)`);
        });
      } else {
        console.log('   ⚠️  No contacts found - Dan hasn\'t discovered anyone yet');
      }
    }
    console.log('');

    // ===================================================================
    // 6. CHECK DEPLOYMENT STATUS
    // ===================================================================
    console.log('🚀 Checking deployment status...');

    // Try to determine if deployed to Railway
    const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN;
    if (railwayUrl) {
      results.deployment.status = 'deployed';
      results.deployment.url = `https://${railwayUrl}`;
      console.log(`   ✅ Deployed to Railway: ${railwayUrl}`);
    } else {
      results.deployment.status = 'not_deployed';
      console.log('   ⚠️  No RAILWAY_PUBLIC_DOMAIN found');
      console.log('   System may be running locally or not deployed yet');
    }
    console.log('');

  } catch (error) {
    results.errors.push(`Unexpected error: ${error.message}`);
    console.error('❌ Fatal error:', error.message);
  }

  // ===================================================================
  // 7. SUMMARY & RECOMMENDATIONS
  // ===================================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`  Database:       ${results.database ? '✅ Connected' : '❌ Not Connected'}`);
  console.log(`  Active Bots:    ${results.bots.active} (last 24h)`);
  console.log(`  Atlas Learning: ${results.atlas.memories > 0 ? '✅ Active' : '⚠️  Not Learning Yet'}`);
  console.log(`  Dan Discovery:  ${results.dan.discoveries > 0 ? '✅ Active' : '⚠️  Not Running'}`);
  console.log(`  Contacts:       ${results.contacts.total} total (${results.contacts.wholesalers} wholesale buyers)`);
  console.log(`  Deployment:     ${results.deployment.status === 'deployed' ? '✅ Live' : '⚠️  Not Deployed'}`);

  if (results.errors.length > 0) {
    console.log(`\n  ❌ Errors:      ${results.errors.length} issue(s) found`);
    results.errors.forEach((err, i) => {
      console.log(`     ${i + 1}. ${err}`);
    });
  }

  console.log('\n' + '═'.repeat(63));
  console.log('  🎯 RECOMMENDATIONS');
  console.log('═'.repeat(63) + '\n');

  if (!results.database) {
    console.log('  ⚠️  FIX: Set up Supabase credentials in .env.local');
  }

  if (results.bots.active === 0) {
    console.log('  ⚠️  FIX: Deploy bot server to Railway or start locally');
    console.log('     Run: npm run start:bots');
  }

  if (results.atlas.memories === 0) {
    console.log('  ⚠️  INFO: Atlas will start learning once bots are active');
  }

  if (results.dan.discoveries === 0) {
    console.log('  ⚠️  FIX: Dan should run every 10 minutes via cron');
    console.log('     Manual trigger: node scripts/test-dan-scraper.sh');
  }

  if (results.contacts.total === 0) {
    console.log('  ⚠️  INFO: No wholesale buyers yet - Dan will discover them automatically');
  }

  if (results.deployment.status === 'not_deployed') {
    console.log('  ⚠️  ACTION: Deploy to Railway for 24/7 automation');
    console.log('     Guide: See CRON-AUTOMATION-SETUP.md');
  }

  if (results.database && results.bots.active > 0 && results.contacts.total > 0) {
    console.log('  🎉 System is fully operational! All bots working!');
  }

  console.log('\n' + '═'.repeat(63) + '\n');

  return results;
}

// Run status check
if (require.main === module) {
  checkSystemStatus()
    .then(results => {
      const hasErrors = results.errors.length > 0;
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(err => {
      console.error('\n❌ Status check failed:', err);
      process.exit(1);
    });
}

module.exports = { checkSystemStatus };
