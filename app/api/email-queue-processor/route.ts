/**
 * Email Queue Processor
 * Processes queued emails via Forbes Command (Port 25)
 * CRON: Every 5 minutes via Forbes Command
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

// Forbes Command Email API (Port 25)
const EMAIL_API_URL = process.env.EMAIL_API_URL || 'http://5.78.139.9:3000/api/email-api';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'forbes-command-2026';

/**
 * Send email via Forbes Command (Port 25)
 */
async function sendEmailViaForbesCommand(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        api_key: EMAIL_API_KEY,
        business: 'FF',
        to,
        subject,
        html,
        from: from || 'noreply@frequencyandform.com'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Email API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return { success: true, ...result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Verify Forbes Command cron secret
  if (searchParams.get('secret') !== process.env.FORBES_COMMAND_CRON) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Email Queue Processor] Running...');

  try {
    const supabase = createAdminSupabase();

    // Get queued emails ready to send
    const { data: queuedEmails, error: fetchError } = await supabase
      .from('email_outreach_queue')
      .select('*')
      .eq('status', 'queued')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(10); // Process 10 emails per run

    if (fetchError) {
      console.error('[Email Queue Processor] Fetch error:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      console.log('[Email Queue Processor] No emails in queue');
      return NextResponse.json({
        success: true,
        data: { emails_sent: 0, message: 'No emails in queue' }
      });
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const processLog: any[] = [];

    for (const email of queuedEmails) {
      try {
        // Mark as processing
        await supabase
          .from('email_outreach_queue')
          .update({ status: 'processing' })
          .eq('id', email.id);

        // Send via Forbes Command
        const result = await sendEmailViaForbesCommand(
          email.recipient_email,
          email.subject,
          email.body,
          email.from_email
        );

        if (result.success) {
          // Mark as sent
          await supabase
            .from('email_outreach_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', email.id);

          // Log to email_sent_log
          try {
            await supabase.from('email_sent_log').insert({
              recipient_email: email.recipient_email,
              email_type: email.template_used || 'queued_email',
              email_category: 'operational',
              subject: email.subject,
              sent_from: email.from_email || 'noreply@frequencyandform.com',
              dedup_key: `queue:${email.id}`,
              delivery_status: 'sent',
              sent_at: new Date().toISOString()
            });
          } catch (err) {
            console.error('[Email Queue] Log error:', err);
          }

          emailsSent++;
          processLog.push({
            id: email.id,
            to: email.recipient_email,
            status: 'sent'
          });

          console.log(`[Email Queue Processor] ✅ Sent to: ${email.recipient_email}`);
        } else {
          // Mark as failed
          const retryCount = (email.retry_count || 0) + 1;
          const maxRetries = 3;

          if (retryCount >= maxRetries) {
            await supabase
              .from('email_outreach_queue')
              .update({
                status: 'failed',
                error_message: result.error,
                retry_count: retryCount
              })
              .eq('id', email.id);
          } else {
            // Retry later
            await supabase
              .from('email_outreach_queue')
              .update({
                status: 'queued',
                error_message: result.error,
                retry_count: retryCount,
                scheduled_for: new Date(Date.now() + 15 * 60 * 1000).toISOString() // Retry in 15 min
              })
              .eq('id', email.id);
          }

          emailsFailed++;
          processLog.push({
            id: email.id,
            to: email.recipient_email,
            status: 'failed',
            error: result.error,
            retry: retryCount < maxRetries
          });

          console.error(`[Email Queue Processor] ❌ Failed: ${email.recipient_email} - ${result.error}`);
        }

        // Small delay between emails
        await new Promise(r => setTimeout(r, 1000));

      } catch (error: any) {
        console.error(`[Email Queue Processor] Error processing ${email.id}:`, error);
        emailsFailed++;
        processLog.push({
          id: email.id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`[Email Queue Processor] Complete: ${emailsSent} sent, ${emailsFailed} failed`);

    return NextResponse.json({
      success: true,
      data: {
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        process_log: processLog
      }
    });

  } catch (error: any) {
    console.error('[Email Queue Processor] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET - Check queue status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabase();

    const { data: queueStats } = await supabase
      .from('email_outreach_queue')
      .select('status')
      .then(result => {
        if (!result.data) return { data: null };
        const stats = {
          queued: result.data.filter(e => e.status === 'queued').length,
          processing: result.data.filter(e => e.status === 'processing').length,
          sent: result.data.filter(e => e.status === 'sent').length,
          failed: result.data.filter(e => e.status === 'failed').length
        };
        return { data: stats };
      });

    return NextResponse.json({
      success: true,
      data: {
        queue_status: queueStats || { queued: 0, processing: 0, sent: 0, failed: 0 }
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
