/**
 * Dan Wholesale Outreach Bot
 * Sends outreach emails to boutique buyers, yoga studios, hotels, etc.
 * Works with ff_boutique_buyers table
 *
 * CRON: Daily at 9am
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

// Forbes Command Email API
const EMAIL_API_URL = process.env.EMAIL_API_URL || 'http://5.78.139.9:3000/api/email-api';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || 'forbes-command-2026';
const FROM_EMAIL = 'maggie@frequencyandform.com';
const WHOLESALE_URL = 'https://frequencyandform.com/wholesale';
const LOOKBOOK_URL = 'https://frequencyandform.com/ff/lookbook';

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

function generateWholesaleEmail(buyer: {
  business_name: string;
  business_type: string;
  contact_name: string;
  city: string;
  state_province: string;
}): { subject: string; html: string } {
  const firstName = buyer.contact_name?.split(' ')[0] || 'there';
  const businessType = buyer.business_type || 'business';

  const typeSpecificContent: Record<string, { hook: string; benefits: string }> = {
    boutique: {
      hook: 'curate natural fiber collections that your customers are actively seeking',
      benefits: `
        <li>European designer pieces exclusive to your region</li>
        <li>Healing-tier fabrics (linen, wool, silk) at 5,000 Hz</li>
        <li>Foundation essentials in organic cotton and hemp</li>
        <li>Full lookbook and marketing materials included</li>
      `
    },
    yoga_studio: {
      hook: 'offer your members natural fiber yoga wear that enhances their practice',
      benefits: `
        <li>Breathable linen and organic cotton yoga wear</li>
        <li>Natural fibers that move with the body</li>
        <li>Sustainable options your wellness-focused members want</li>
        <li>Retail-ready with display materials</li>
      `
    },
    hotel: {
      hook: 'elevate your guest experience with premium natural fiber linens and robes',
      benefits: `
        <li>Luxury linen robes and towels</li>
        <li>Premium bedding in natural fibers</li>
        <li>Sustainable luxury your guests will remember</li>
        <li>Custom branding options available</li>
      `
    },
    spa: {
      hook: 'enhance your spa experience with healing-tier natural fiber textiles',
      benefits: `
        <li>Linen robes with natural antibacterial properties</li>
        <li>Organic cotton towels and wraps</li>
        <li>Wellness-focused fabrics at 5,000 Hz frequency</li>
        <li>Luxury that aligns with your wellness mission</li>
      `
    },
    gift_shop: {
      hook: 'stock unique natural fiber accessories your customers won\'t find elsewhere',
      benefits: `
        <li>European-designed scarves, bags, and accessories</li>
        <li>Unique pieces with a sustainability story</li>
        <li>High margins on premium natural fiber goods</li>
        <li>Conversation-starting products</li>
      `
    }
  };

  const content = typeSpecificContent[businessType] || typeSpecificContent.boutique;

  const subject = `Wholesale Inquiry: Natural Fiber Collection for ${buyer.business_name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; padding: 24px 0; border-bottom: 1px solid #f5f3ee;">
        <p style="color: #c8b28a; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;">Frequency & Form</p>
        <p style="color: #1f2937; font-size: 14px; font-style: italic;">Wholesale Partnership</p>
      </div>

      <!-- Main Content -->
      <div style="padding: 32px 0;">
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Hi ${firstName},
        </p>

        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          I came across <strong>${buyer.business_name}</strong> in ${buyer.city}, ${buyer.state_province} and wanted to reach out about a wholesale opportunity.
        </p>

        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Frequency & Form partners with boutiques and specialty retailers to ${content.hook}.
        </p>

        <!-- Lookbook CTA -->
        <div style="background: #f5f3ee; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="color: #c8b28a; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">View Our Collection</p>
          <a href="${LOOKBOOK_URL}?utm_source=wholesale_outreach&utm_medium=email&utm_campaign=${encodeURIComponent(buyer.business_name)}"
             style="display: inline-block; background: #1f2937; color: #f5f3ee; padding: 14px 32px; text-decoration: none; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
            View Spring 2026 Lookbook →
          </a>
        </div>

        <h3 style="color: #1f2937; font-size: 16px; margin-top: 24px;">What We Offer:</h3>
        <ul style="color: #6b7280; font-size: 14px; line-height: 2; padding-left: 20px;">
          ${content.benefits}
        </ul>

        <h3 style="color: #1f2937; font-size: 16px; margin-top: 24px;">Wholesale Terms:</h3>
        <ul style="color: #6b7280; font-size: 14px; line-height: 2; padding-left: 20px;">
          <li><strong>Minimum order:</strong> $500 (first order)</li>
          <li><strong>Wholesale pricing:</strong> 50% off retail</li>
          <li><strong>Shipping:</strong> Free on orders over $1,000</li>
          <li><strong>Returns:</strong> 30-day return policy on unsold items</li>
        </ul>

        <!-- Apply CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${WHOLESALE_URL}?business=${encodeURIComponent(buyer.business_name)}&utm_source=outreach"
             style="display: inline-block; background: #c8b28a; color: #1f2937; padding: 16px 40px; text-decoration: none; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">
            Request Wholesale Access
          </a>
        </div>

        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Would you be open to a quick call this week to discuss how we might work together?
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
          Warm regards,<br>
          <strong>Maggie</strong><br>
          Wholesale Partnerships<br>
          Frequency & Form
        </p>

        <p style="color: #9ca3af; font-size: 11px; margin-top: 24px;">
          Reply to this email or call (555) 123-4567
        </p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Dan Wholesale] Starting wholesale outreach...');

    // Get leads ready for outreach
    const { data: leads, error: fetchError } = await supabase
      .from('ff_boutique_buyers')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'prospect')
      .eq('emails_sent_count', 0)
      .not('contact_email', 'is', null)
      .order('lead_quality_score', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('[Dan Wholesale] Error fetching leads:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      console.log('[Dan Wholesale] No leads ready for outreach');
      return NextResponse.json({
        success: true,
        message: 'No leads ready for outreach',
        data: { emails_sent: 0 }
      });
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const results: { business: string; status: string; error?: string }[] = [];

    for (const lead of leads) {
      try {
        const { subject, html } = generateWholesaleEmail(lead);

        console.log(`[Dan Wholesale] Sending to: ${lead.contact_email} (${lead.business_name})`);

        const result = await sendEmail(lead.contact_email, subject, html);

        if (!result.success) {
          console.error(`[Dan Wholesale] Failed: ${lead.business_name} - ${result.error}`);
          emailsFailed++;
          results.push({ business: lead.business_name, status: 'failed', error: result.error });
          continue;
        }

        // Update lead status
        await supabase
          .from('ff_boutique_buyers')
          .update({
            status: 'contacted',
            first_contact_date: new Date().toISOString(),
            last_contact_date: new Date().toISOString(),
            last_email_sent_date: new Date().toISOString(),
            emails_sent_count: 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        // Log the email
        await supabase.from('email_sent_log').insert({
          tenant_id: TENANT_ID,
          recipient_email: lead.contact_email,
          recipient_name: lead.contact_name,
          email_type: 'initial_outreach',
          email_category: 'marketing',
          subject,
          sent_from: FROM_EMAIL,
          sent_by: 'dan',
          dedup_key: `wholesale_outreach:${lead.id}:initial`,
          related_entity_type: 'boutique_buyer',
          related_entity_id: lead.id,
          delivery_status: 'sent',
          sent_at: new Date().toISOString()
        });

        emailsSent++;
        results.push({ business: lead.business_name, status: 'sent' });

        console.log(`[Dan Wholesale] ✅ Sent to: ${lead.business_name}`);

        // Small delay between emails
        await new Promise(r => setTimeout(r, 2000));

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Dan Wholesale] Error with ${lead.business_name}:`, error);
        emailsFailed++;
        results.push({ business: lead.business_name, status: 'error', error: errorMessage });
      }
    }

    // Notify Henry about outreach (via C-suite communication)
    if (emailsSent > 0) {
      await supabase.from('ff_bot_communications').insert({
        from_bot: 'dan',
        to_bot: 'henry',
        subject: `Wholesale Outreach Complete: ${emailsSent} emails sent`,
        message: `Henry,

I've completed today's wholesale outreach:
- Emails sent: ${emailsSent}
- Failed: ${emailsFailed}

Businesses contacted:
${results.filter(r => r.status === 'sent').map(r => `- ${r.business}`).join('\n')}

I'll follow up in 3 days with non-responders.

- Dan`,
        message_type: 'report',
        priority: 'normal'
      });
    }

    console.log(`[Dan Wholesale] Complete: ${emailsSent} sent, ${emailsFailed} failed`);

    return NextResponse.json({
      success: true,
      data: {
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        results
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dan Wholesale] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabase();

  const { data: stats } = await supabase
    .from('ff_boutique_buyers')
    .select('status, lead_quality_score')
    .eq('tenant_id', TENANT_ID);

  const summary = {
    total: stats?.length || 0,
    prospect: stats?.filter(s => s.status === 'prospect').length || 0,
    contacted: stats?.filter(s => s.status === 'contacted').length || 0,
    interested: stats?.filter(s => s.status === 'interested').length || 0,
    customer: stats?.filter(s => s.status === 'customer').length || 0
  };

  return NextResponse.json({ success: true, data: summary });
}
