/**
 * Email Queue Processor
 * Processes pending emails from the email_queue table
 * Runs every 5 minutes via cron
 * Handles retries and error tracking
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { sendEmail } = require('../lib/email-sender');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Email Queue Processor] Starting email queue processing...');

  try {
    // Get pending emails that are ready to send
    const now = new Date().toISOString();

    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .lte('send_at', now)
      .lt('retry_count', supabase.raw('max_retries'))
      .order('priority', { ascending: false })
      .order('send_at', { ascending: true })
      .limit(20); // Process 20 emails per run

    if (fetchError) {
      console.error('[Email Queue Processor] Error fetching emails:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch pending emails'
      });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('[Email Queue Processor] No pending emails to process');
      return res.json({
        success: true,
        data: {
          processed: 0,
          message: 'No pending emails'
        }
      });
    }

    console.log(`[Email Queue Processor] Found ${pendingEmails.length} pending emails`);

    let successCount = 0;
    let failureCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        console.log(`[Email Queue Processor] Sending email to ${email.to_email}`);

        // Send the email
        const result = await sendEmail({
          to: email.to_email,
          subject: email.subject,
          html: email.html_body,
          from: email.from_email
        });

        if (result.success) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              last_error: null
            })
            .eq('id', email.id);

          successCount++;
          console.log(`[Email Queue Processor] ✅ Email ${email.id} sent successfully`);

        } else {
          throw new Error(result.error || 'Email send failed');
        }

      } catch (error) {
        console.error(`[Email Queue Processor] ❌ Failed to send email ${email.id}:`, error.message);

        // Increment retry count
        const newRetryCount = email.retry_count + 1;
        const newStatus = newRetryCount >= email.max_retries ? 'failed' : 'pending';

        await supabase
          .from('email_queue')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            last_error: error.message,
            send_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 minutes
          })
          .eq('id', email.id);

        failureCount++;
      }
    }

    console.log(`[Email Queue Processor] Complete: ${successCount} sent, ${failureCount} failed`);

    return res.json({
      success: true,
      data: {
        processed: pendingEmails.length,
        sent: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('[Email Queue Processor] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
