/**
 * Check Database Schema - List all tables
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.FF_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.FF_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('📊 Checking Database Schema...\n');

  try {
    // Query information_schema to list all tables
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });

    if (error) {
      console.error('❌ Error querying schema:', error.message);

      // Try direct table checks instead
      console.log('\n Trying direct table checks...\n');
      const tables = [
        'bot_actions_log',
        'emails',
        'email_queue',
        'retailers',
        'wholesale_buyers',
        'leads',
        'ai_memory_store',
        'bot_memory'
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table} - Does not exist or no access`);
        } else {
          console.log(`✅ ${table} - Exists (${data?.length || 0} rows checked)`);
        }
      }
    } else {
      console.log('✅ Tables found in database:');
      data.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
