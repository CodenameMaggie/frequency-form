/**
 * Dan's Brand Partnership Outreach
 * Automatically reaches out to brand prospects from brand_outreach_queue
 */

const { withCronAuth } = require('../../lib/api-wrapper');
const { sendEmail } = require('../../lib/email-sender');
const { renderEmail } = require('../../lib/email-templates/renderer');
const brandPartnershipTemplate = require('../../lib/email-templates/emails/brand-partnership');
const { createClient } = require('@supabase/supabase-js');

// CRITICAL: Use Supabase service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.query.tenant_id || '00000000-0000-0000-0000-000000000001';

  try {
    console.log('[Dan Brand Outreach] Starting brand partner outreach...');

    // =====================================================================
    // STEP 1: Check Resend email budget (100/day, 3000/month)
    // =====================================================================

    const today = new Date().toISOString().split('T')[0];

    // Get today's email usage
    const dailyEmailResult = await supabase
      .from('brand_emails')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('sent_at', `${today}T00:00:00Z`);

    if (dailyEmailResult.error) {
      throw new Error(`Database query failed for daily emails: ${dailyEmailResult.error.message}`);
    }

    const todayEmailsSent = dailyEmailResult.count || 0;
    const dailyEmailLimit = 100; // Resend free tier: 100 emails/day
    const remainingDailyEmails = dailyEmailLimit - todayEmailsSent;

    // Check if daily budget reached
    if (todayEmailsSent >= dailyEmailLimit) {
      console.log(`[Dan Brand Outreach] Daily email budget reached (${todayEmailsSent}/${dailyEmailLimit})`);
      return res.json({
        success: true,
        data: {
          emails_sent: 0,
          budget_reached: true,
          message: `Daily Resend budget of ${dailyEmailLimit} emails reached. Resets at midnight.`,
          usage: { daily: { sent: todayEmailsSent, limit: dailyEmailLimit } }
        }
      });
    }

    console.log(`[Dan Brand Outreach] Email budget remaining: ${remainingDailyEmails}/day`);

    // =====================================================================
    // STEP 2: Find brand prospects that need outreach from the queue
    // =====================================================================

    const queueResult = await supabase
      .from('brand_outreach_queue')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .not('contact_email', 'is', null)
      .neq('contact_email', '')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(20);

    const brands = queueResult.data || [];

    if (brands.length === 0) {
      console.log('[Dan Brand Outreach] No brands in queue need outreach');
      return res.json({
        success: true,
        data: { message: 'No brands requiring outreach', emails_sent: 0 }
      });
    }

    console.log(`[Dan Brand Outreach] Found ${brands.length} brands in queue for outreach`);

    // =====================================================================
    // STEP 3: Get current Founding Partner count for urgency messaging
    // =====================================================================

    const { count: partnerCount } = await supabase
      .from('brand_prospects')
      .select('id', { count: 'exact', head: true })
      .eq('outreach_status', 'approved');

    const currentPartnerCount = partnerCount || 12;

    // =====================================================================
    // STEP 4: Send personalized brand partnership emails
    // =====================================================================

    const emailsSent = [];
    const errors = [];

    // Limit emails per run based on remaining daily budget
    const maxEmailsThisRun = Math.min(10, remainingDailyEmails);

    console.log(`[Dan Brand Outreach] Will send up to ${maxEmailsThisRun} emails this run`);

    for (const brand of brands.slice(0, maxEmailsThisRun)) {
      try {
        // Parse personalization data
        const personalizationData = brand.personalization_data || {};

        // Prepare template data
        const templateData = {
          contactName: brand.contact_name || 'there',
          brandName: brand.brand_name,
          specificProduct: personalizationData.specific_product,
          storyElement: personalizationData.story_element,
          currentPartnerCount: currentPartnerCount
        };

        // Generate subject and HTML from template
        const subject = brandPartnershipTemplate.subject(templateData);
        const htmlBody = renderEmail(
          brandPartnershipTemplate.template(templateData),
          brandPartnershipTemplate.preheader(templateData)
        );

        // Send email via Resend
        const emailResult = await sendEmail({
          to: brand.contact_email,
          subject: subject,
          htmlBody: htmlBody,
          fromEmail: 'henry@frequencyandform.com',
          fromName: 'Henry from Frequency & Form'
        });

        // Check if email was actually sent
        if (!emailResult) {
          console.error(`[Dan Brand Outreach] Email failed to send to ${brand.contact_email}`);
          throw new Error(`Email failed to send to ${brand.contact_email}`);
        }

        // Log email in brand_emails table
        await supabase
          .from('brand_emails')
          .insert({
            tenant_id: tenantId,
            brand_prospect_id: brand.brand_prospect_id,
            email_type: 'outreach_initial',
            recipient_email: brand.contact_email,
            recipient_name: brand.contact_name,
            subject: subject,
            body: htmlBody,
            status: 'sent',
            sent_at: new Date().toISOString(),
            metadata: {
              generated_by: 'dan',
              template: 'brand-partnership',
              queue_id: brand.id,
              personalization: personalizationData,
              current_partner_count: currentPartnerCount
            }
          });

        // Update queue status to 'sent'
        await supabase
          .from('brand_outreach_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', brand.id);

        // Update brand_prospects outreach_status and email_sent_at
        if (brand.brand_prospect_id) {
          await supabase
            .from('brand_prospects')
            .update({
              outreach_status: 'email_sent',
              email_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', brand.brand_prospect_id);
        }

        // Log bot action
        await supabase
          .from('bot_actions_log')
          .insert({
            tenant_id: tenantId,
            bot_name: 'dan',
            action_type: 'brand_outreach',
            action_description: `Sent Founding Partner invitation to ${brand.brand_name} (${brand.contact_email})`,
            status: 'completed',
            related_entity_type: 'brand_prospect',
            related_entity_id: brand.brand_prospect_id,
            triggered_by: req.query?.triggered_by || 'automated',
            metadata: {
              brand_name: brand.brand_name,
              contact_email: brand.contact_email,
              priority: brand.priority,
              personalization: personalizationData
            },
            created_at: new Date().toISOString()
          });

        emailsSent.push({
          queue_id: brand.id,
          brand_prospect_id: brand.brand_prospect_id,
          brand_name: brand.brand_name,
          contact_name: brand.contact_name,
          email: brand.contact_email,
          subject: subject,
          priority: brand.priority
        });

        console.log(`[Dan Brand Outreach] ✅ Sent email to ${brand.contact_email} (${brand.brand_name})`);

        // Rate limit: wait 2 seconds between emails
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[Dan Brand Outreach] Failed for ${brand.contact_email}:`, error);

        // Mark queue item as failed
        await supabase
          .from('brand_outreach_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            attempts: (brand.attempts || 0) + 1,
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', brand.id);

        errors.push({
          queue_id: brand.id,
          brand_name: brand.brand_name,
          email: brand.contact_email,
          error: error.message
        });
      }
    }

    console.log(`[Dan Brand Outreach] ✅ Sent ${emailsSent.length} emails, ${errors.length} errors`);

    return res.json({
      success: true,
      data: {
        emails_sent: emailsSent.length,
        current_partner_count: currentPartnerCount,
        emails: emailsSent,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('[Dan Brand Outreach] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
