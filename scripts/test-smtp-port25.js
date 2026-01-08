/**
 * SMTP Port 25 Connection Test
 * Tests SMTP connectivity and email sending via Port 25
 */

require('dotenv').config({ path: '.env.local' });
const { sendEmail, sendFromHenry, sendFromConcierge, verifyConnection, SENDER_EMAILS } = require('../lib/email-sender');

async function testSMTPConnection() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SMTP PORT 25 CONNECTION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Display configuration
  console.log('📋 SMTP Configuration:');
  console.log(`  Host: ${process.env.SMTP_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.SMTP_PORT || '25'}`);
  console.log(`  Auth: ${process.env.SMTP_USER ? 'Enabled' : 'Disabled (anonymous)'}`);
  console.log('');

  console.log('📧 Configured Email Addresses:');
  console.log(`  Henry:     ${SENDER_EMAILS.henry}`);
  console.log(`  Concierge: ${SENDER_EMAILS.concierge}`);
  console.log(`  No-Reply:  ${SENDER_EMAILS.noreply}`);
  console.log(`  Support:   ${SENDER_EMAILS.support}`);
  console.log('');

  // Test 1: Connection Verification
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST 1: SMTP Connection Verification');
  console.log('═══════════════════════════════════════════════════════════\n');

  const connectionValid = await verifyConnection();

  if (!connectionValid) {
    console.log('\n❌ CONNECTION FAILED');
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Check if SMTP server is running');
    console.log('  2. Verify SMTP_HOST and SMTP_PORT in .env.local');
    console.log('  3. Check firewall settings for port 25');
    console.log('  4. Try: telnet localhost 25');
    console.log('\n📝 Common SMTP Hosts:');
    console.log('  - localhost (if running local SMTP server)');
    console.log('  - smtp.gmail.com:587 (Gmail with STARTTLS)');
    console.log('  - smtp.sendgrid.net:587 (SendGrid)');
    console.log('  - smtp-relay.gmail.com:587 (Google Workspace)');
    console.log('');
    process.exit(1);
  }

  console.log('✅ CONNECTION VERIFIED\n');

  // Get test recipient email
  const testRecipient = process.argv[2] || 'maggie@maggieforbesstrategies.com';
  console.log(`📧 Test Recipient: ${testRecipient}\n`);

  // Test 2: Send from Henry
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST 2: Send Email from Henry');
  console.log('═══════════════════════════════════════════════════════════\n');

  const henryResult = await sendFromHenry({
    to: testRecipient,
    subject: 'SMTP Test - Henry @ Frequency & Form',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e2a3a;">SMTP Port 25 Test - Henry</h2>
        <p>This is a test email from the Frequency & Form SMTP system.</p>

        <div style="background: #f8f6f3; padding: 20px; border-left: 4px solid #d4c8a8; margin: 20px 0;">
          <p><strong>Sender:</strong> ${SENDER_EMAILS.henry}</p>
          <p><strong>Protocol:</strong> SMTP Port 25</p>
          <p><strong>Purpose:</strong> B2B Wholesale Outreach</p>
          <p><strong>Bot:</strong> Dan (Marketing)</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 30px 0;">

        <p style="color: #666; font-size: 13px;">
          If you received this email, SMTP Port 25 is working correctly! ✅
        </p>

        <p style="color: #666; font-size: 12px;">
          Henry @ Frequency & Form<br>
          Natural Fiber Distribution<br>
          henry@frequencyandform.com
        </p>
      </div>
    `
  });

  if (henryResult.success) {
    console.log('✅ SUCCESS: Email sent from henry@frequencyandform.com');
    console.log(`📬 Message ID: ${henryResult.messageId}`);
    console.log(`📊 Response: ${henryResult.response}\n`);
  } else {
    console.log('❌ FAILED: Could not send email from henry@');
    console.log(`Error: ${henryResult.error}`);
    console.log(`Code: ${henryResult.code}\n`);
  }

  // Test 3: Send from Concierge
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST 3: Send Email from Concierge');
  console.log('═══════════════════════════════════════════════════════════\n');

  const conciergeResult = await sendFromConcierge({
    to: testRecipient,
    subject: 'SMTP Test - Concierge @ Frequency & Form',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e2a3a;">SMTP Port 25 Test - Concierge</h2>
        <p>This is a test email from the Frequency & Form concierge service.</p>

        <div style="background: #f8f6f3; padding: 20px; border-left: 4px solid #d4c8a8; margin: 20px 0;">
          <p><strong>Sender:</strong> ${SENDER_EMAILS.concierge}</p>
          <p><strong>Protocol:</strong> SMTP Port 25</p>
          <p><strong>Purpose:</strong> Customer Support & Onboarding</p>
          <p><strong>Bot:</strong> Annie (Support)</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e8dcc4; margin: 30px 0;">

        <p style="color: #666; font-size: 13px;">
          If you received this email, the concierge email system is working! ✅
        </p>

        <p style="color: #666; font-size: 12px;">
          Frequency & Form Concierge<br>
          Customer Support<br>
          concierge@frequencyandform.com
        </p>
      </div>
    `
  });

  if (conciergeResult.success) {
    console.log('✅ SUCCESS: Email sent from concierge@frequencyandform.com');
    console.log(`📬 Message ID: ${conciergeResult.messageId}`);
    console.log(`📊 Response: ${conciergeResult.response}\n`);
  } else {
    console.log('❌ FAILED: Could not send email from concierge@');
    console.log(`Error: ${conciergeResult.error}`);
    console.log(`Code: ${conciergeResult.code}\n`);
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const tests = [
    { name: 'SMTP Connection', passed: connectionValid },
    { name: 'Henry Email', passed: henryResult.success },
    { name: 'Concierge Email', passed: conciergeResult.success }
  ];

  tests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });

  const allPassed = tests.every(t => t.passed);
  console.log('');

  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! SMTP Port 25 is fully operational.\n');
    console.log('📧 Check your inbox at: ' + testRecipient);
    console.log('📊 Both henry@ and concierge@ can now send emails via Port 25\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED - See errors above for details\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
testSMTPConnection().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  console.error(err.stack);
  process.exit(1);
});
