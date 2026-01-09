/**
 * Send Emails to Qualified Leads
 * Sends emails to qualified leads from the qualified-leads folder
 *
 * Usage:
 *   node scripts/send-to-qualified-leads.js
 *   node scripts/send-to-qualified-leads.js --subject "Your Subject" --template custom
 *   node scripts/send-to-qualified-leads.js --file qualified-leads/latest.json
 *   node scripts/send-to-qualified-leads.js --limit 10 --dry-run
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const QUALIFIED_LEADS_DIR = path.join(__dirname, '..', 'qualified-leads');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const subject = args.includes('--subject') ? args[args.indexOf('--subject') + 1] : 'Frequency & Form - Curated Home Goods Partnership Opportunity';
const inputFile = args.includes('--file') ? args[args.indexOf('--file') + 1] : path.join(QUALIFIED_LEADS_DIR, 'latest.json');
const template = args.includes('--template') ? args[args.indexOf('--template') + 1] : 'default';
const tenantId = '00000000-0000-0000-0000-000000000001';

// Email templates
const templates = {
  default: {
    subject: 'Frequency & Form - Curated Home Goods Partnership Opportunity',
    getHtml: (lead) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; color: #1a3a2f; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f6f3; padding: 30px; text-align: center; border-bottom: 3px solid #c9a962; }
    .content { padding: 30px 20px; background: white; }
    .cta { background: #1a3a2f; color: white; padding: 15px 30px; text-decoration: none; display: inline-block; border-radius: 3px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #1a3a2f; margin: 0;">Frequency & Form</h1>
      <p style="color: #c9a962; margin: 10px 0 0 0;">Curated Home Goods Marketplace</p>
    </div>

    <div class="content">
      <p>Hi${lead.first_name ? ' ' + lead.first_name : ''},</p>

      <p>I hope this message finds you well! I came across ${lead.company || 'your business'} and was impressed by your commitment to quality home goods.</p>

      <p>I'm reaching out from <strong>Frequency & Form</strong>, a curated marketplace connecting thoughtful makers with design-conscious buyers. We're building a community of independent brands who value craftsmanship, natural materials, and timeless design.</p>

      <p><strong>Why partner with us?</strong></p>
      <ul>
        <li>Zero upfront costs - only pay when you sell</li>
        <li>Access to our curated audience of design enthusiasts</li>
        <li>Marketing support and brand storytelling</li>
        <li>Simple wholesale ordering system</li>
        <li>Full control over your products and pricing</li>
      </ul>

      <p>We're selective about the brands we work with, and ${lead.company || 'your work'} aligns beautifully with our aesthetic and values.</p>

      <p style="text-align: center;">
        <a href="https://www.frequencyandform.com/partners/apply" class="cta">Learn More & Apply</a>
      </p>

      <p>Would love to explore a partnership. Feel free to reply with any questions!</p>

      <p>Best,<br>
      <strong>Kristi</strong><br>
      Founder, Frequency & Form<br>
      <a href="https://www.frequencyandform.com">frequencyandform.com</a></p>
    </div>

    <div class="footer">
      <p>Frequency & Form | Curated Home Goods</p>
      <p><a href="https://www.frequencyandform.com/unsubscribe">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `
  },

  brief: {
    subject: 'Quick question about partnership - Frequency & Form',
    getHtml: (lead) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'Georgia', serif; color: #1a3a2f; line-height: 1.6; max-width: 600px; margin: 0 auto;">
  <p>Hi${lead.first_name ? ' ' + lead.first_name : ''},</p>

  <p>Quick question - would ${lead.company || 'you'} be interested in selling through a curated home goods marketplace?</p>

  <p><strong>Frequency & Form</strong> connects independent makers with design-conscious buyers. No upfront costs, just a commission on sales.</p>

  <p>If this sounds interesting, I'd love to chat: <a href="https://www.frequencyandform.com/partners/apply">Apply here</a></p>

  <p>Best,<br>Kristi<br>Frequency & Form</p>

  <p style="font-size: 11px; color: #666;"><a href="https://www.frequencyandform.com/unsubscribe">Unsubscribe</a></p>
</body>
</html>
    `
  }
};

async function sendToQualifiedLeads() {
  console.log('\n📧 Send to Qualified Leads');
  console.log(`   File: ${inputFile}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Template: ${template}`);
  console.log(`   Limit: ${limit || 'No limit'}`);
  console.log(`   Mode: ${isDryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);

  try {
    // Load leads from file
    if (!fs.existsSync(inputFile)) {
      throw new Error(`File not found: ${inputFile}`);
    }

    const fileContent = fs.readFileSync(inputFile, 'utf8');
    let leads;

    if (inputFile.endsWith('.json')) {
      leads = JSON.parse(fileContent);
    } else if (inputFile.endsWith('.csv')) {
      // Parse CSV (simple implementation)
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      leads = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const lead = {};
        headers.forEach((header, i) => {
          lead[header] = values[i];
        });
        return lead;
      });
    } else {
      throw new Error('Unsupported file format. Use .json or .csv');
    }

    console.log(`\n✅ Loaded ${leads.length} qualified leads`);

    // Apply limit
    const leadsToEmail = limit ? leads.slice(0, limit) : leads;
    console.log(`📤 Will send to ${leadsToEmail.length} leads`);

    if (isDryRun) {
      console.log('\n🧪 DRY RUN - No emails will be sent\n');
    }

    // Get template
    const emailTemplate = templates[template] || templates.default;

    // Send emails
    let queued = 0;
    let skipped = 0;
    const errors = [];

    for (const lead of leadsToEmail) {
      // Skip if no email
      if (!lead.email) {
        console.log(`⚠️  Skipping ${lead.company || 'Unknown'}: No email address`);
        skipped++;
        continue;
      }

      try {
        const emailHtml = emailTemplate.getHtml(lead);
        const emailSubject = emailTemplate.subject || subject;

        if (isDryRun) {
          console.log(`✓ Would send to: ${lead.email} (${lead.first_name || ''} ${lead.last_name || ''} - ${lead.company || 'N/A'})`);
          queued++;
          continue;
        }

        // Add to email queue
        const { error } = await supabase
          .from('email_queue')
          .insert({
            tenant_id: tenantId,
            to_email: lead.email,
            from_email: 'hello@frequencyandform.com',
            subject: emailSubject,
            html_body: emailHtml,
            status: 'pending',
            priority: lead.lead_score >= 80 ? 10 : 5,
            send_at: new Date().toISOString(),
            max_retries: 3,
            retry_count: 0,
            metadata: {
              lead_id: lead.id,
              lead_grade: lead.lead_grade,
              lead_score: lead.lead_score,
              campaign: 'qualified_leads_outreach',
              template: template
            }
          });

        if (error) throw error;

        console.log(`✅ Queued: ${lead.email} (${lead.lead_grade}, score: ${lead.lead_score})`);
        queued++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Failed to queue ${lead.email}:`, error.message);
        errors.push({ email: lead.email, error: error.message });
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Queued: ${queued}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   ${err.email}: ${err.error}`);
      });
    }

    if (!isDryRun && queued > 0) {
      console.log('\n💡 Emails queued successfully!');
      console.log('   They will be sent by the email queue processor (runs every 5 minutes)');
    }

    return {
      success: true,
      queued,
      skipped,
      errors: errors.length
    };

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  sendToQualifiedLeads()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { sendToQualifiedLeads };
