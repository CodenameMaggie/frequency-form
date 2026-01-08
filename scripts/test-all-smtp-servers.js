/**
 * Test All SMTP Servers
 * Tests root server, Google Workspace, Railway SMTP
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const SENDER_EMAILS = {
  henry: 'henry@frequencyandform.com',
  concierge: 'concierge@frequencyandform.com'
};

// SMTP Server Configurations to Test
const SMTP_SERVERS = {
  'Root Server (216.150.1.1:25)': {
    host: '216.150.1.1',
    port: 25,
    secure: false,
    auth: undefined,
    tls: { rejectUnauthorized: false }
  },
  'Root Server (216.150.1.1:587)': {
    host: '216.150.1.1',
    port: 587,
    secure: false,
    auth: undefined,
    tls: { rejectUnauthorized: false }
  },
  'Google Workspace SMTP Relay (587)': {
    host: 'smtp-relay.gmail.com',
    port: 587,
    secure: false,
    auth: process.env.GOOGLE_SMTP_USER && process.env.GOOGLE_SMTP_PASS ? {
      user: process.env.GOOGLE_SMTP_USER,
      pass: process.env.GOOGLE_SMTP_PASS
    } : undefined,
    tls: { rejectUnauthorized: false }
  },
  'Google SMTP (587)': {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: process.env.GOOGLE_SMTP_USER && process.env.GOOGLE_SMTP_PASS ? {
      user: process.env.GOOGLE_SMTP_USER,
      pass: process.env.GOOGLE_SMTP_PASS
    } : undefined,
    tls: { rejectUnauthorized: false }
  },
  'localhost:25': {
    host: 'localhost',
    port: 25,
    secure: false,
    auth: undefined,
    tls: { rejectUnauthorized: false }
  }
};

async function testServer(name, config) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  Testing: ${name}`);
  console.log('='.repeat(70));
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Auth: ${config.auth ? 'Yes' : 'No'}`);
  console.log('');

  try {
    const transporter = nodemailer.createTransport(config);

    // Test connection
    console.log('⏳ Verifying connection...');
    await transporter.verify();
    console.log('✅ CONNECTION SUCCESSFUL!');

    // Test sending email
    const testRecipient = process.argv[2] || 'maggie@maggieforbesstrategies.com';
    console.log(`\n⏳ Sending test email to ${testRecipient}...`);

    const result = await transporter.sendMail({
      from: `"Henry @ Frequency & Form" <${SENDER_EMAILS.henry}>`,
      to: testRecipient,
      subject: `SMTP Test - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SMTP Connection Test</h2>
          <p><strong>Server:</strong> ${name}</p>
          <p><strong>Host:</strong> ${config.host}:${config.port}</p>
          <p><strong>From:</strong> ${SENDER_EMAILS.henry}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>

          <div style="background: #f0f0f0; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <p style="margin: 0;">✅ This server can send emails successfully!</p>
          </div>
        </div>
      `
    });

    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);

    return { success: true, name, config };

  } catch (error) {
    console.log('❌ FAILED');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    return { success: false, name, config, error: error.message };
  }
}

async function testAllServers() {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  SMTP SERVER DISCOVERY & TESTING');
  console.log('  Frequency & Form Email System');
  console.log('═'.repeat(70));

  const testRecipient = process.argv[2] || 'maggie@maggieforbesstrategies.com';
  console.log(`\n📧 Test Recipient: ${testRecipient}`);
  console.log(`📨 From Addresses:`);
  console.log(`   - ${SENDER_EMAILS.henry}`);
  console.log(`   - ${SENDER_EMAILS.concierge}`);

  if (!process.env.GOOGLE_SMTP_USER) {
    console.log(`\n⚠️  Note: Google SMTP credentials not set (GOOGLE_SMTP_USER, GOOGLE_SMTP_PASS)`);
    console.log(`   Google servers will attempt without authentication.`);
  }

  const results = [];

  for (const [name, config] of Object.entries(SMTP_SERVERS)) {
    const result = await testServer(name, config);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }

  // Summary
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(70));
  console.log('');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    console.log('✅ WORKING SMTP SERVERS:');
    successful.forEach(r => {
      console.log(`   ✓ ${r.name}`);
      console.log(`     → ${r.config.host}:${r.config.port}`);
    });
  }

  console.log('');

  if (failed.length > 0) {
    console.log('❌ FAILED SERVERS:');
    failed.forEach(r => {
      console.log(`   ✗ ${r.name}`);
      console.log(`     → ${r.error}`);
    });
  }

  console.log('');
  console.log('═'.repeat(70));

  if (successful.length > 0) {
    console.log('\n🎉 RECOMMENDATION:');
    console.log(`   Use: ${successful[0].name}`);
    console.log(`   Update .env.local with:`);
    console.log(`   SMTP_HOST=${successful[0].config.host}`);
    console.log(`   SMTP_PORT=${successful[0].config.port}`);
    if (successful[0].config.auth) {
      console.log(`   SMTP_USER=${successful[0].config.auth.user}`);
      console.log(`   SMTP_PASS=your_password`);
    }
  }

  console.log('');
  process.exit(failed.length > 0 && successful.length === 0 ? 1 : 0);
}

// Run tests
testAllServers().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  console.error(err.stack);
  process.exit(1);
});
