/**
 * Forbes Command - Business Connection Test Script
 * Tests: Growth Manager Pro, IntroAlignment, Frequency & Form
 */

const BUSINESSES = {
  GMP: {
    name: 'Growth Manager Pro',
    supabaseUrl: process.env.GMP_SUPABASE_URL || 'YOUR_GMP_SUPABASE_URL',
    supabaseKey: process.env.GMP_SUPABASE_ANON_KEY || 'YOUR_GMP_ANON_KEY',
  },
  IA: {
    name: 'IntroAlignment',
    supabaseUrl: process.env.IA_SUPABASE_URL || 'YOUR_IA_SUPABASE_URL',
    supabaseKey: process.env.IA_SUPABASE_ANON_KEY || 'YOUR_IA_ANON_KEY',
  },
  FF: {
    name: 'Frequency & Form',
    supabaseUrl: process.env.FF_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.FF_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

async function testSupabaseConnection(businessKey) {
  const biz = BUSINESSES[businessKey];
  const results = {
    business: biz.name,
    connection: false,
    auth: false,
    tables: [],
    bots: [],
    errors: [],
  };

  try {
    // Test 1: Basic connection
    const healthCheck = await fetch(`${biz.supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: biz.supabaseKey,
        Authorization: `Bearer ${biz.supabaseKey}`,
      },
    });
    results.connection = healthCheck.ok;

    // Test 2: Auth endpoint
    const authCheck = await fetch(`${biz.supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: biz.supabaseKey,
      },
    });
    results.auth = authCheck.ok;

    // Test 3: List tables (users, bots, etc.)
    const tablesCheck = await fetch(
      `${biz.supabaseUrl}/rest/v1/?apikey=${biz.supabaseKey}`,
      {
        headers: {
          apikey: biz.supabaseKey,
          Authorization: `Bearer ${biz.supabaseKey}`,
        },
      }
    );
    if (tablesCheck.ok) {
      const tableData = await tablesCheck.json();
      results.tables = Object.keys(tableData || {});
    }

    // Test 4: Check bots table
    const botsCheck = await fetch(
      `${biz.supabaseUrl}/rest/v1/bots?select=id,name,status&limit=10`,
      {
        headers: {
          apikey: biz.supabaseKey,
          Authorization: `Bearer ${biz.supabaseKey}`,
        },
      }
    );
    if (botsCheck.ok) {
      results.bots = await botsCheck.json();
    }

    // Test 5: Check users table
    const usersCheck = await fetch(
      `${biz.supabaseUrl}/rest/v1/users?select=id,full_name,role&limit=5`,
      {
        headers: {
          apikey: biz.supabaseKey,
          Authorization: `Bearer ${biz.supabaseKey}`,
        },
      }
    );
    if (usersCheck.ok) {
      results.users = await usersCheck.json();
    }

  } catch (err) {
    results.errors.push(err.message);
  }

  return results;
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FORBES COMMAND - BUSINESS CONNECTION TESTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const allResults = {};

  for (const key of ['GMP', 'IA', 'FF']) {
    console.log(`Testing ${BUSINESSES[key].name}...`);
    allResults[key] = await testSupabaseConnection(key);

    const r = allResults[key];
    console.log(`\n  ✓ Connection: ${r.connection ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ Auth:       ${r.auth ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ Tables:     ${r.tables.length > 0 ? r.tables.join(', ') : 'None found'}`);
    console.log(`  ✓ Bots:       ${r.bots.length} found`);
    console.log(`  ✓ Users:      ${r.users?.length || 0} found`);

    if (r.errors.length > 0) {
      console.log(`  ✗ Errors:     ${r.errors.join(', ')}`);
    }
    console.log('\n───────────────────────────────────────────────────────────\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  const passed = Object.values(allResults).filter(r => r.connection && r.auth).length;
  console.log(`  ${passed}/3 businesses fully connected\n`);

  return allResults;
}

// Run tests
runAllTests().then(results => {
  console.log('\nRaw results:', JSON.stringify(results, null, 2));
}).catch(err => {
  console.error('Test runner failed:', err);
});
