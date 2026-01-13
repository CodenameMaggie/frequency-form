/**
 * Test script to verify Dan's dual-write setup
 * Tests connection to both F&F and MFS databases
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDualWrite() {
  console.log('====================================');
  console.log('Testing Dan Dual-Write Setup');
  console.log('====================================\n');

  // Test F&F Database
  console.log('1. Testing F&F Database Connection...');
  try {
    const ffSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await ffSupabase
      .from('ff_boutique_buyers')
      .select('id')
      .limit(1);

    if (error) throw error;
    console.log('   ✅ F&F Database: Connected');
    console.log(`   Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  } catch (error) {
    console.log('   ❌ F&F Database: Failed');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }

  console.log('');

  // Test MFS Central Database
  console.log('2. Testing MFS Central Database Connection...');
  try {
    const mfsSupabase = createClient(
      process.env.MFS_SUPABASE_URL,
      process.env.MFS_SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await mfsSupabase
      .from('leads')
      .select('id')
      .limit(1);

    if (error) throw error;
    console.log('   ✅ MFS Central Database: Connected');
    console.log(`   Database: ${process.env.MFS_SUPABASE_URL}`);
  } catch (error) {
    console.log('   ❌ MFS Central Database: Failed');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }

  console.log('');

  // Check for existing F&F leads
  console.log('3. Checking F&F Leads...');
  try {
    const ffSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { count, error } = await ffSupabase
      .from('ff_boutique_buyers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', '00000000-0000-0000-0000-000000000001');

    if (error) throw error;
    console.log(`   📊 Total F&F leads: ${count || 0}`);
  } catch (error) {
    console.log(`   ⚠️  Could not count F&F leads: ${error.message}`);
  }

  console.log('');

  // Check for existing MFS leads with FF_osm source
  console.log('4. Checking MFS Central Leads (FF_osm)...');
  try {
    const mfsSupabase = createClient(
      process.env.MFS_SUPABASE_URL,
      process.env.MFS_SUPABASE_SERVICE_ROLE_KEY
    );

    const { count, error } = await mfsSupabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'FF_osm');

    if (error) throw error;
    console.log(`   📊 Total MFS leads (FF_osm): ${count || 0}`);
  } catch (error) {
    console.log(`   ⚠️  Could not count MFS leads: ${error.message}`);
  }

  console.log('');
  console.log('====================================');
  console.log('✅ Dual-Write Setup: READY');
  console.log('====================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run Dan bot: curl -X POST "http://localhost:3000/api/bots/dan-lead-generator?secret=freq-form-cron-secret-2026"');
  console.log('2. Check both databases for new leads');
  console.log('3. Deploy to Railway with MFS credentials in environment variables');
  console.log('');
}

testDualWrite().catch(console.error);
