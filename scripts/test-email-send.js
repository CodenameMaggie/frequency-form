/**
 * Test Email Sending
 * Tests Resend API configuration and email delivery
 */

require('dotenv').config({ path: '.env.local' });

async function testEmailSending() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  EMAIL SYSTEM TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  const apiKey = process.env.RESEND_API_KEY;
  const henryEmail = process.env.FROM_EMAIL_HENRY || 'henry@frequencyandform.com';
  const conciergeEmail = process.env.FROM_EMAIL_CONCIERGE || 'concierge@frequencyandform.com';

  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`  API Key: ${apiKey ? `✅ Set (${apiKey.substring(0, 10)}...)` : '❌ Not set'}`);
  console.log(`  Henry Email: ${henryEmail}`);
  console.log(`  Concierge Email: ${conciergeEmail}\n`);

  if (!apiKey) {
    console.error('❌ ERROR: RESEND_API_KEY not found in .env.local');
    console.log('\n📝 To fix:');
    console.log('  1. Sign up at https://resend.com/');
    console.log('  2. Get your API key');
    console.log('  3. Add to .env.local:');
    console.log('     RESEND_API_KEY=re_your_key_here\n');
    process.exit(1);
  }

  // Ask for test recipient
  const testRecipient = process.argv[2] || 'maggie@maggieforbesstrategies.com';
  console.log(`📧 Test Recipient: ${testRecipient}\n`);

  // Test 1: Send from henry@
  console.log('🧪 TEST 1: Sending from henry@frequencyandform.com...');

  try {
    const response1 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: henryEmail,
        to: [testRecipient],
        subject: 'Test Email from Henry @ Frequency & Form',
        html: `
          <h2>Email System Test - Henry</h2>
          <p>This is a test email from the Frequency & Form bot system.</p>
          <p><strong>Sender:</strong> ${henryEmail}</p>
          <p><strong>Purpose:</strong> B2B wholesale outreach</p>
          <p><strong>Bot:</strong> Dan (Marketing)</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you received this email, the email system is working correctly! ✅
          </p>
        `
      })
    });

    if (!response1.ok) {
      const errorData = await response1.json();
      console.log(`  ❌ FAILED: ${response1.status}`);
      console.log(`  Error: ${JSON.stringify(errorData, null, 2)}\n`);
    } else {
      const result1 = await response1.json();
      console.log(`  ✅ SUCCESS: Email sent`);
      console.log(`  Email ID: ${result1.id}\n`);
    }

  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
  }

  // Test 2: Send from concierge@
  console.log('🧪 TEST 2: Sending from concierge@frequencyandform.com...');

  try {
    const response2 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: conciergeEmail,
        to: [testRecipient],
        subject: 'Test Email from Concierge @ Frequency & Form',
        html: `
          <h2>Email System Test - Concierge</h2>
          <p>This is a test email from the Frequency & Form concierge service.</p>
          <p><strong>Sender:</strong> ${conciergeEmail}</p>
          <p><strong>Purpose:</strong> Customer support & onboarding</p>
          <p><strong>Bot:</strong> Annie (Support)</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you received this email, the concierge email is working correctly! ✅
          </p>
        `
      })
    });

    if (!response2.ok) {
      const errorData = await response2.json();
      console.log(`  ❌ FAILED: ${response2.status}`);
      console.log(`  Error: ${JSON.stringify(errorData, null, 2)}\n`);
    } else {
      const result2 = await response2.json();
      console.log(`  ✅ SUCCESS: Email sent`);
      console.log(`  Email ID: ${result2.id}\n`);
    }

  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📧 Check your inbox at: ' + testRecipient);
  console.log('📊 View sent emails: https://resend.com/emails\n');
}

// Run test
testEmailSending().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
