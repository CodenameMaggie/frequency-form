#!/usr/bin/env node
/**
 * Root Server Access Test
 * Tests connectivity to 5.78.139.9 (forbes-command)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testServerAccess() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ROOT SERVER ACCESS TEST');
  console.log('  Server: 5.78.139.9 (forbes-command)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: SSH Key Status
  console.log('Test 1: SSH Key Status');
  console.log('─'.repeat(60));
  try {
    const { stdout } = await execAsync('ssh-add -l');
    console.log('✅ SSH key loaded in agent');
    console.log(`   ${stdout.trim()}\n`);
    results.passed++;
    results.tests.push({ name: 'SSH Key', status: 'PASS' });
  } catch (error) {
    console.log('❌ No SSH key in agent');
    console.log(`   ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'SSH Key', status: 'FAIL' });
  }

  // Test 2: SSH Connection (non-interactive, with key)
  console.log('Test 2: SSH Connection (with loaded key)');
  console.log('─'.repeat(60));
  try {
    const { stdout } = await execAsync(
      'ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new root@5.78.139.9 "hostname && echo Connected" 2>&1',
      { timeout: 15000 }
    );
    console.log('✅ SSH connection successful');
    console.log(`   Hostname: ${stdout.trim()}\n`);
    results.passed++;
    results.tests.push({ name: 'SSH Connection', status: 'PASS' });
  } catch (error) {
    console.log('❌ SSH connection failed');
    console.log(`   ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'SSH Connection', status: 'FAIL', error: error.message });
  }

  // Test 3: Port 25 (SMTP)
  console.log('Test 3: SMTP Port 25');
  console.log('─'.repeat(60));
  try {
    const { stdout } = await execAsync('nc -zv -w 5 5.78.139.9 25 2>&1', { timeout: 10000 });
    console.log('✅ Port 25 is open');
    console.log(`   ${stdout.trim()}\n`);
    results.passed++;
    results.tests.push({ name: 'Port 25', status: 'PASS' });
  } catch (error) {
    console.log('❌ Port 25 connection failed');
    console.log(`   ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Port 25', status: 'FAIL' });
  }

  // Test 4: Port 587 (SMTP with STARTTLS)
  console.log('Test 4: SMTP Port 587');
  console.log('─'.repeat(60));
  try {
    const { stdout } = await execAsync('nc -zv -w 5 5.78.139.9 587 2>&1', { timeout: 10000 });
    console.log('✅ Port 587 is open');
    console.log(`   ${stdout.trim()}\n`);
    results.passed++;
    results.tests.push({ name: 'Port 587', status: 'PASS' });
  } catch (error) {
    console.log('❌ Port 587 connection failed');
    console.log(`   ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Port 587', status: 'FAIL' });
  }

  // Test 5: Check Postfix Status via SSH (if SSH works)
  const sshTest = results.tests.find(t => t.name === 'SSH Connection');
  if (sshTest && sshTest.status === 'PASS') {
    console.log('Test 5: Postfix Service Status (via SSH)');
    console.log('─'.repeat(60));
    try {
      const { stdout } = await execAsync(
        'ssh -o BatchMode=yes -o ConnectTimeout=10 root@5.78.139.9 "systemctl is-active postfix 2>&1"',
        { timeout: 15000 }
      );
      const status = stdout.trim();
      if (status === 'active') {
        console.log('✅ Postfix is running');
        results.passed++;
        results.tests.push({ name: 'Postfix Service', status: 'PASS' });
      } else {
        console.log(`⚠️  Postfix status: ${status}`);
        results.tests.push({ name: 'Postfix Service', status: 'WARN', details: status });
      }
      console.log('');
    } catch (error) {
      console.log('❌ Could not check Postfix status');
      console.log(`   ${error.message}\n`);
      results.failed++;
      results.tests.push({ name: 'Postfix Service', status: 'FAIL' });
    }
  } else {
    console.log('Test 5: Postfix Service Status');
    console.log('─'.repeat(60));
    console.log('⏭️  Skipped (SSH connection failed)\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
  });

  console.log('');
  console.log(`Total: ${results.passed + results.failed} tests`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('');

  if (results.passed === results.passed + results.failed) {
    console.log('🎉 ALL TESTS PASSED! Server is accessible.');
  } else if (results.passed > 0) {
    console.log('⚠️  PARTIAL SUCCESS - Some tests failed.');
  } else {
    console.log('❌ ALL TESTS FAILED - Server not accessible from this location.');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
testServerAccess().catch(err => {
  console.error('\n❌ Test script failed:', err);
  process.exit(1);
});
