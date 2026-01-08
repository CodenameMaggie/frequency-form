/**
 * Check Bot Activity - Verify autonomous bot operations
 * Queries Supabase to check if bots are running and sending emails
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.FF_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.FF_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBotActivity() {
  console.log('🤖 Checking Frequency & Form Bot Activity...\n');

  try {
    // Check recent bot actions (last 24 hours)
    console.log('1️⃣ Checking bot_actions_log (last 24 hours)...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: actions, error: actionsError } = await supabase
      .from('bot_actions_log')
      .select('id, bot_name, action_type, status, created_at')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if (actionsError) {
      console.error('❌ Error querying bot_actions_log:', actionsError.message);
    } else if (actions && actions.length > 0) {
      console.log(`✅ Found ${actions.length} recent bot actions:`);
      actions.forEach(action => {
        console.log(`   - ${action.bot_name}: ${action.action_type} (${action.status}) at ${new Date(action.created_at).toLocaleString()}`);
      });
    } else {
      console.log('⚠️  No bot actions in the last 24 hours');
    }

    // Check emails sent (last 24 hours)
    console.log('\n2️⃣ Checking emails table (last 24 hours)...');

    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('id, to_email, subject, status, created_at')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if (emailsError) {
      console.error('❌ Error querying emails:', emailsError.message);
    } else if (emails && emails.length > 0) {
      console.log(`✅ Found ${emails.length} recent emails sent:`);
      emails.forEach(email => {
        console.log(`   - To: ${email.to_email}`);
        console.log(`     Subject: ${email.subject ? email.subject.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`     Status: ${email.status || 'N/A'}`);
        console.log(`     Time: ${new Date(email.created_at).toLocaleString()}\n`);
      });
    } else {
      console.log('⚠️  No emails sent in the last 24 hours');
    }

    // Check Dan's scraper discoveries (last 24 hours)
    console.log('3️⃣ Checking contacts table (Dan\'s discoveries - last 24 hours)...');

    let newContacts = null;
    try {
      const result = await supabase
        .from('contacts')
        .select('*')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      if (result.error) {
        console.error('❌ Error querying contacts:', result.error.message);
      } else if (result.data && result.data.length > 0) {
        // Filter for Dan's sources if we got data
        newContacts = result.data.filter(c =>
          c.source && ['dan_scraper', 'web_search', 'linkedin', 'twitter', 'social_media'].includes(c.source)
        );

        if (newContacts.length > 0) {
          console.log(`✅ Dan discovered ${newContacts.length} new leads:`);
          newContacts.forEach(contact => {
            const companyName = contact.company || contact.full_name || 'Unknown';
            console.log(`   - ${companyName} (${contact.email || 'No email'})`);
            console.log(`     Source: ${contact.source} | ${new Date(contact.created_at).toLocaleString()}`);
          });
        } else {
          console.log('⚠️  No new leads from Dan in the last 24 hours');
        }
      } else {
        console.log('⚠️  No new contacts in the last 24 hours');
      }
    } catch (error) {
      console.error('❌ Contacts table error:', error.message);
    }

    // Check AI memory (last 24 hours)
    console.log('\n4️⃣ Checking ai_memory_store (Atlas activity - last 24 hours)...');

    try {
      const result = await supabase
        .from('ai_memory_store')
        .select('*')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (result.error) {
        console.error('❌ Error querying ai_memory_store:', result.error.message);
      } else if (result.data && result.data.length > 0) {
        console.log(`✅ Atlas stored ${result.data.length} new memories:`);
        result.data.forEach(memory => {
          const type = memory.memory_type || 'unknown';
          const bot = memory.bot_type || 'assistant';
          const key = memory.memory_key || memory.id || 'N/A';
          console.log(`   - Type: ${type} | Bot: ${bot}`);
          console.log(`     Key: ${key.substring(0, 60)}${key.length > 60 ? '...' : ''}`);
          console.log(`     Time: ${new Date(memory.created_at).toLocaleString()}\n`);
        });
      } else {
        console.log('⚠️  No AI memory activity in the last 24 hours');
      }
    } catch (error) {
      console.error('❌ AI memory store error:', error.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUTONOMOUS OPERATION STATUS\n');

    const hasActivity = (actions && actions.length > 0) ||
                       (emails && emails.length > 0) ||
                       (newContacts && newContacts.length > 0);

    if (hasActivity) {
      console.log('✅ BOTS ARE RUNNING AUTONOMOUSLY');
      console.log('   The bot system is actively operating without prompts.');
      console.log('   Cron jobs are firing and bots are working.');
    } else {
      console.log('❌ BOTS ARE NOT RUNNING AUTONOMOUSLY');
      console.log('   No activity detected in the last 24 hours.');
      console.log('   This likely means:');
      console.log('   - Railway environment needs NODE_ENV=production');
      console.log('   - Or ENABLE_CRON=true must be set');
      console.log('   - Or the bot server needs to be restarted');
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error checking bot activity:', error.message);
  }
}

// Run the check
checkBotActivity();
