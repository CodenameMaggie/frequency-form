/**
 * Dan Partner Follow-up Bot
 * Sends follow-up emails to partners who haven't responded
 * CRON: Daily at 2pm via Forbes Command
 *
 * Follow-up sequence:
 * - Day 3: First follow-up (gentle reminder)
 * - Day 7: Second follow-up (value add)
 * - Day 14: Final follow-up (last chance)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Forbes Command Email API (Port 25)
const EMAIL_API_URL = process.env.EMAIL_API_URL || 'http://5.78.139.9:3000/api/email-api';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'forbes-command-2026';
const FROM_EMAIL = 'maggie@frequencyandform.com';
const LOOKBOOK_URL = 'https://frequencyandform.com/ff/lookbook';
const PARTNER_APPLY_URL = 'https://frequencyandform.com/partners/apply';
const STYLE_STUDIO_URL = 'https://frequencyandform.com/ff/style-studio';

/**
 * Send email via Forbes Command (Port 25)
 */
async function sendEmailViaForbesCommand(
  to: string,
  subject: string,
  html: string
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
        from: FROM_EMAIL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Email API error: ${response.status} - ${errorText}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Generate follow-up email based on sequence number
 */
function generateFollowUpEmail(brand: any, followUpNumber: number): { subject: string; html: string } {
  const brandName = brand.brand_name;

  const templates: Record<number, { subject: string; body: string }> = {
    1: {
      subject: `Quick follow-up: ${brandName} + Frequency & Form`,
      body: `
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Hi ${brandName} team,
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          I wanted to follow up on my partnership invitation from a few days ago. I know inboxes get busy!
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Quick recap: We're building an <strong>AI Style Studio</strong> that helps customers find natural fiber
          pieces that match their body type and coloring. We'd love to feature ${brandName} to our audience.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          <strong>What's in it for you:</strong>
        </p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 2; padding-left: 20px;">
          <li>New sales channel — we send customers to your store</li>
          <li>Zero cost — commission-based only</li>
          <li>Real user feedback on your pieces</li>
          <li>Featured in our digital lookbook</li>
        </ul>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Have a look at our Style Studio: <a href="${STYLE_STUDIO_URL}" style="color: #c8b28a;">${STYLE_STUDIO_URL}</a>
        </p>
      `
    },
    2: {
      subject: `Thought you'd find this interesting - ${brandName}`,
      body: `
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Hi ${brandName} team,
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          I wanted to share something that might interest you.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          We just launched our <strong>Client Model Program</strong> — partner brands can submit photos of
          real customers wearing their pieces. These authentic images perform 3x better than studio shots
          in our Style Studio because customers see people who look like them.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          <strong>Here's what partners are saying:</strong>
        </p>
        <div style="background: #f5f3ee; padding: 16px 20px; border-radius: 8px; margin: 16px 0;">
          <p style="color: #1f2937; font-size: 14px; font-style: italic; margin: 0;">
            "The body-type matching has reduced our return rate significantly. Customers know what they're getting."
          </p>
        </div>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          I'd love to add ${brandName} to our curated collection. No strings attached — if it's not a fit,
          no hard feelings.
        </p>
      `
    },
    3: {
      subject: `Last note from me - ${brandName} partnership`,
      body: `
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Hi ${brandName} team,
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          I'll keep this brief — I know you're busy.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          This is my last follow-up about partnering with Frequency & Form. If the timing isn't right,
          I completely understand.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          But if you're curious, here's what you'd get:
        </p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 2; padding-left: 20px;">
          <li><strong>Free to join</strong> — no fees, ever</li>
          <li><strong>Your products in our AI Style Studio</strong> — matched to the right customers</li>
          <li><strong>Monthly analytics</strong> — see how your pieces perform</li>
          <li><strong>Featured in our lookbook</strong> — sent to our growing audience</li>
        </ul>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          If you'd ever like to explore this in the future, just reply to this email. The door's always open.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Wishing you continued success with ${brandName}.
        </p>
      `
    }
  };

  const template = templates[followUpNumber] || templates[1];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
      <div style="text-align: center; padding: 24px 0; border-bottom: 1px solid #f5f3ee;">
        <p style="color: #c8b28a; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;">Frequency & Form</p>
      </div>

      <div style="padding: 32px 0;">
        ${template.body}

        <div style="text-align: center; margin: 32px 0;">
          <a href="${PARTNER_APPLY_URL}?brand=${encodeURIComponent(brandName)}&utm_source=followup_${followUpNumber}"
             style="display: inline-block; background: #c8b28a; color: #1f2937; padding: 16px 40px; text-decoration: none; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">
            Apply for Partnership
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
        <p style="color: #6b7280; font-size: 13px;">
          Warm regards,<br>
          <strong>Maggie Forbes</strong><br>
          Founder, Frequency & Form<br>
          <a href="${LOOKBOOK_URL}" style="color: #c8b28a;">View our Lookbook</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return { subject: template.subject, html };
}

/**
 * POST - Send follow-up emails to contacted partners
 */
export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    console.log('[Dan Partner Follow-up] Starting follow-up sequence...');

    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.FORBES_COMMAND_CRON) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Day 3 follow-ups (72 hours after initial outreach)
    const day3Cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const day3Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Day 7 follow-ups
    const day7Cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day7Start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    // Day 14 final follow-ups
    const day14Cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const day14Start = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    let emailsSent = 0;
    let emailsFailed = 0;
    const followUpLog: any[] = [];

    // Get partners needing follow-up
    const { data: contactedPartners, error: fetchError } = await supabase
      .from('ff_partners')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'contacted')
      .not('contact_email', 'is', null)
      .order('outreach_date', { ascending: true });

    if (fetchError) {
      console.error('[Dan Partner Follow-up] Fetch error:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!contactedPartners || contactedPartners.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No partners need follow-up',
        data: { emails_sent: 0 }
      });
    }

    for (const partner of contactedPartners) {
      const outreachDate = new Date(partner.outreach_date);
      const followUpCount = partner.follow_up_count || 0;

      let shouldFollowUp = false;
      let followUpNumber = 0;

      // Determine if follow-up is needed
      if (followUpCount === 0 && outreachDate >= day3Start && outreachDate <= day3Cutoff) {
        shouldFollowUp = true;
        followUpNumber = 1;
      } else if (followUpCount === 1 && outreachDate >= day7Start && outreachDate <= day7Cutoff) {
        shouldFollowUp = true;
        followUpNumber = 2;
      } else if (followUpCount === 2 && outreachDate >= day14Start && outreachDate <= day14Cutoff) {
        shouldFollowUp = true;
        followUpNumber = 3;
      }

      if (!shouldFollowUp) continue;

      // Check dedup - don't send same follow-up twice
      const { data: existingEmail } = await supabase
        .from('email_sent_log')
        .select('id')
        .eq('dedup_key', `partner_followup:${partner.id}:${followUpNumber}`)
        .single();

      if (existingEmail) continue;

      try {
        const { subject, html } = generateFollowUpEmail(partner, followUpNumber);

        console.log(`[Dan Partner Follow-up] Sending follow-up #${followUpNumber} to: ${partner.contact_email} (${partner.brand_name})`);

        const result = await sendEmailViaForbesCommand(partner.contact_email, subject, html);

        if (!result.success) {
          console.error(`[Dan Partner Follow-up] Failed: ${partner.brand_name} - ${result.error}`);
          emailsFailed++;
          followUpLog.push({ brand: partner.brand_name, followUp: followUpNumber, status: 'failed', error: result.error });
          continue;
        }

        // Update partner follow-up count
        await supabase
          .from('ff_partners')
          .update({
            follow_up_count: followUpNumber,
            last_contact_date: new Date().toISOString(),
            notes: `${partner.notes || ''}\nFollow-up #${followUpNumber} sent ${new Date().toISOString()}`
          })
          .eq('id', partner.id);

        // Log sent email
        try {
          await supabase.from('email_sent_log').insert({
            recipient_email: partner.contact_email,
            email_type: 'partner_followup',
            email_category: 'operational',
            subject,
            sent_from: FROM_EMAIL,
            dedup_key: `partner_followup:${partner.id}:${followUpNumber}`,
            related_entity_type: 'partner',
            related_entity_id: partner.id,
            delivery_status: 'sent',
            sent_at: new Date().toISOString()
          });
        } catch (err) {
          console.error('[Dan Partner Follow-up] Log error:', err);
        }

        // Mark as inactive after final follow-up
        if (followUpNumber === 3) {
          await supabase
            .from('ff_partners')
            .update({ status: 'inactive', notes: `${partner.notes || ''}\nNo response after 3 follow-ups` })
            .eq('id', partner.id);
        }

        emailsSent++;
        followUpLog.push({ brand: partner.brand_name, followUp: followUpNumber, status: 'sent' });

        console.log(`[Dan Partner Follow-up] ✅ Follow-up #${followUpNumber} sent to: ${partner.brand_name}`);

        // Delay between emails
        await new Promise(r => setTimeout(r, 2000));

      } catch (error: any) {
        console.error(`[Dan Partner Follow-up] Error with ${partner.brand_name}:`, error);
        emailsFailed++;
        followUpLog.push({ brand: partner.brand_name, status: 'error', error: error.message });
      }
    }

    console.log(`[Dan Partner Follow-up] Complete: ${emailsSent} sent, ${emailsFailed} failed`);

    return NextResponse.json({
      success: true,
      data: {
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        follow_up_log: followUpLog
      }
    });

  } catch (error: any) {
    console.error('[Dan Partner Follow-up] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET - Check follow-up status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabase();

    const { data: partners } = await supabase
      .from('ff_partners')
      .select('brand_name, status, outreach_date, follow_up_count, last_contact_date')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'contacted')
      .order('outreach_date', { ascending: true });

    const now = new Date();
    const needsFollowUp = partners?.filter(p => {
      const daysSinceOutreach = Math.floor((now.getTime() - new Date(p.outreach_date).getTime()) / (24 * 60 * 60 * 1000));
      const followUpCount = p.follow_up_count || 0;

      if (followUpCount === 0 && daysSinceOutreach >= 3) return true;
      if (followUpCount === 1 && daysSinceOutreach >= 7) return true;
      if (followUpCount === 2 && daysSinceOutreach >= 14) return true;
      return false;
    });

    return NextResponse.json({
      success: true,
      data: {
        total_contacted: partners?.length || 0,
        needs_follow_up: needsFollowUp?.length || 0,
        partners_needing_follow_up: needsFollowUp?.map(p => ({
          brand: p.brand_name,
          days_since_outreach: Math.floor((now.getTime() - new Date(p.outreach_date).getTime()) / (24 * 60 * 60 * 1000)),
          follow_ups_sent: p.follow_up_count || 0
        }))
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
