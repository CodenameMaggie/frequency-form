/**
 * Dan Partner Outreach Bot
 * Sends partnership invitation emails to natural fiber brands
 * Works with ff_partners table (prospects discovered by Henry)
 * Uses Forbes Command email system (Port 25)
 * CRON: Daily at 10am via Forbes Command
 *
 * Key Features:
 * - Sends digital flipbook/lookbook link
 * - Invites brands to provide client models
 * - Offers real-time user feedback collaboration
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
 * Generate partnership invitation email HTML
 */
function generatePartnerEmail(brand: any, templateType: string): { subject: string; html: string } {
  const brandName = brand.brand_name;
  const fabricType = brand.primary_fabric || 'natural fiber';

  // Common elements
  const lookbookCTA = `
    <div style="background: #f5f3ee; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
      <p style="color: #c8b28a; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">View Our Digital Lookbook</p>
      <a href="${LOOKBOOK_URL}?utm_source=partner_outreach&utm_medium=email&utm_campaign=${encodeURIComponent(brandName)}"
         style="display: inline-block; background: #1f2937; color: #f5f3ee; padding: 14px 32px; text-decoration: none; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
        View Spring 2026 Collection →
      </a>
    </div>
  `;

  const clientModelSection = `
    <div style="border-left: 3px solid #c8b28a; padding-left: 20px; margin: 24px 0;">
      <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">Client Model Program</h3>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.7;">
        We're inviting partner brands to provide <strong>real client models</strong> for our Style Studio.
        Your customers become our models—authentic people wearing your pieces, with their permission.
      </p>
      <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li>Your pieces featured on real body types</li>
        <li>Customer testimonials alongside products</li>
        <li>Authentic representation drives sales</li>
      </ul>
    </div>
  `;

  const feedbackSection = `
    <div style="border-left: 3px solid #c8b28a; padding-left: 20px; margin: 24px 0;">
      <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">Real-Time User Feedback</h3>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.7;">
        Our AI Style Studio collects <strong>real-time feedback</strong> from users on fit, quality, and styling preferences.
        As a partner, you'll receive:
      </p>
      <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li>Monthly insights on how customers perceive your pieces</li>
        <li>Body type data showing who's buying what</li>
        <li>Color preference trends for your target market</li>
        <li>Direct customer feedback on fit and quality</li>
      </ul>
    </div>
  `;

  const applyCTA = `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${PARTNER_APPLY_URL}?brand=${encodeURIComponent(brandName)}&utm_source=outreach"
         style="display: inline-block; background: #c8b28a; color: #1f2937; padding: 16px 40px; text-decoration: none; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">
        Apply for Partnership
      </a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 12px;">Free to join • No inventory risk • Commission-based</p>
    </div>
  `;

  const footer = `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
      Frequency & Form curates natural fiber fashion based on fabric frequency science.
      We connect quality brands with customers who value what they wear.
    </p>
    <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
      Warm regards,<br>
      <strong>Maggie Forbes</strong><br>
      Founder, Frequency & Form
    </p>
  `;

  // Template-specific content
  const templates: Record<string, { subject: string; intro: string }> = {
    linen_brand: {
      subject: `Partnership Invitation: ${brandName} + Frequency & Form`,
      intro: `
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Hi ${brandName} team,
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Your ${fabricType} pieces caught my attention. At Frequency & Form, we're building an
          <strong>AI-powered Style Studio</strong> that connects customers with quality natural fiber brands—and
          we'd love to feature your collection.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          We believe in fabric frequency science: linen measures at <strong>5,000 Hz</strong>—fifty times the
          human body's natural frequency. Your pieces aren't just clothing; they're wellness.
        </p>
      `
    },
    cashmere_brand: {
      subject: `Luxury Partnership Opportunity - ${brandName}`,
      intro: `
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Dear ${brandName} team,
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Your ${fabricType} pieces represent exactly the kind of <strong>investment quality</strong> our
          customers are seeking. Frequency & Form is an exclusive Style Studio for natural fiber fashion,
          and we're selectively inviting luxury brands to join our network.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Our audience: Women who invest in pieces that last. They understand quality, sustainability,
          and the difference that natural fibers make in how they feel.
        </p>
      `
    },
    organic_cotton: {
      subject: `Sustainable Partnership - ${brandName} × Frequency & Form`,
      intro: `
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Hi ${brandName} team,
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Your commitment to <strong>organic cotton</strong> aligns perfectly with our mission. At Frequency & Form,
          we're helping people build wardrobes with natural, sustainable materials—and we'd love to feature your pieces.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Our AI Style Studio matches customers to pieces based on their body type, color profile, and preferences.
          It's not just shopping—it's a personalized styling experience.
        </p>
      `
    },
    etsy_artisan: {
      subject: `Feature Your Creations - Frequency & Form Partnership`,
      intro: `
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          Hi!
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          I discovered your beautiful ${fabricType} pieces and wanted to reach out personally.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          I'm building a <strong>Style Studio</strong> called Frequency & Form that helps women find natural
          fiber clothing. Our AI matches customers with pieces that suit their body type and coloring—and
          I think your work would resonate with our audience.
        </p>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          The best part? There's no cost, no inventory changes. We simply feature your pieces,
          customers click through to your shop, and you earn the sale.
        </p>
      `
    }
  };

  const template = templates[templateType] || templates.linen_brand;

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
        <p style="color: #1f2937; font-size: 14px; font-style: italic;">Dress in Alignment</p>
      </div>

      <!-- Main Content -->
      <div style="padding: 32px 0;">
        ${template.intro}

        ${lookbookCTA}

        <h2 style="color: #1f2937; font-size: 20px; margin-top: 32px; margin-bottom: 16px;">Why Partner With Us?</h2>

        <p style="color: #6b7280; font-size: 15px; line-height: 1.8;">
          We're not just another marketplace. We're a <strong>sales channel</strong> that brings you customers
          who already know what they want—quality natural fibers that align with their values.
        </p>

        <ul style="color: #6b7280; font-size: 14px; line-height: 2; padding-left: 20px;">
          <li><strong>Zero upfront cost</strong> — We earn only when you sell</li>
          <li><strong>AI-powered recommendations</strong> — Right customers find your pieces</li>
          <li><strong>Body type matching</strong> — Better fit = fewer returns</li>
          <li><strong>Color analysis</strong> — Customers see how pieces work for them</li>
        </ul>

        ${clientModelSection}

        ${feedbackSection}

        ${applyCTA}

        ${footer}
      </div>
    </body>
    </html>
  `;

  return { subject: template.subject, html };
}

/**
 * Select the best template based on brand info
 */
function selectTemplate(brand: any): string {
  const fabric = brand.primary_fabric?.toLowerCase() || '';
  const website = brand.website?.toLowerCase() || '';

  if (fabric.includes('cashmere') || fabric.includes('wool')) {
    return 'cashmere_brand';
  }
  if (fabric.includes('cotton')) {
    return 'organic_cotton';
  }
  if (website.includes('etsy.com')) {
    return 'etsy_artisan';
  }
  return 'linen_brand';
}

/**
 * POST - Send partnership outreach emails
 * Called via Forbes Command cron
 */
export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    console.log('[Dan Partner Outreach] Starting partner outreach via Forbes Command...');

    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Verify Forbes Command cron secret
    if (secret !== process.env.FORBES_COMMAND_CRON) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get partner prospects who haven't been contacted yet
    const { data: prospects, error: fetchError } = await supabase
      .from('ff_partners')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'prospect')
      .is('outreach_date', null)
      .not('contact_email', 'is', null)
      .order('created_at', { ascending: true })
      .limit(5); // Send 5 outreach emails per run

    if (fetchError) {
      console.error('[Dan Partner Outreach] Error fetching prospects:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!prospects || prospects.length === 0) {
      // Get prospects without email for manual outreach
      const { data: noEmailProspects } = await supabase
        .from('ff_partners')
        .select('brand_name, website, instagram_handle')
        .eq('tenant_id', TENANT_ID)
        .eq('status', 'prospect')
        .is('contact_email', null)
        .limit(10);

      console.log('[Dan Partner Outreach] No prospects with email. Manual outreach needed for:', noEmailProspects?.length || 0);

      return NextResponse.json({
        success: true,
        message: 'No prospects with email addresses to contact',
        manual_outreach_needed: noEmailProspects?.map(p => ({
          brand: p.brand_name,
          website: p.website,
          instagram: p.instagram_handle
        }))
      });
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    let partnersSkipped = 0;
    const outreachLog: any[] = [];

    // Track emails we've already sent to in this batch to avoid duplicates
    const emailsSentThisBatch = new Set<string>();

    for (const prospect of prospects) {
      try {
        // Skip if we already sent to this email in this batch
        if (emailsSentThisBatch.has(prospect.contact_email.toLowerCase())) {
          console.log(`[Dan Partner Outreach] Skipping duplicate email: ${prospect.contact_email}`);
          partnersSkipped++;
          continue;
        }

        // Check if we've ever sent to this email before
        const { data: previouslySent } = await supabase
          .from('email_sent_log')
          .select('id')
          .eq('recipient_email', prospect.contact_email)
          .eq('email_type', 'partner_outreach')
          .single();

        if (previouslySent) {
          console.log(`[Dan Partner Outreach] Already sent to ${prospect.contact_email} previously, skipping`);
          // Mark this prospect as contacted to prevent future attempts
          await supabase.from('ff_partners').update({
            status: 'contacted',
            outreach_date: new Date().toISOString(),
            notes: 'Marked as contacted - email already in sent log'
          }).eq('id', prospect.id);
          partnersSkipped++;
          continue;
        }

        // Select appropriate template
        const templateType = selectTemplate(prospect);
        const { subject, html } = generatePartnerEmail(prospect, templateType);

        console.log(`[Dan Partner Outreach] Sending to: ${prospect.contact_email} (${prospect.brand_name})`);

        // Send via Forbes Command email (Port 25)
        const result = await sendEmailViaForbesCommand(prospect.contact_email, subject, html);

        // Track this email
        emailsSentThisBatch.add(prospect.contact_email.toLowerCase());

        if (!result.success) {
          console.error(`[Dan Partner Outreach] Failed: ${prospect.brand_name} - ${result.error}`);
          emailsFailed++;
          outreachLog.push({
            brand: prospect.brand_name,
            email: prospect.contact_email,
            status: 'failed',
            error: result.error
          });
          continue;
        }

        // Update partner status to 'contacted'
        const { error: updateError } = await supabase
          .from('ff_partners')
          .update({
            status: 'contacted',
            outreach_date: new Date().toISOString(),
            last_contact_date: new Date().toISOString(),
            notes: `Partnership outreach sent via ${templateType} template. Included lookbook link and client model invitation.`
          })
          .eq('id', prospect.id);

        if (updateError) {
          console.error(`[Dan Partner Outreach] Status update failed for ${prospect.brand_name}:`, updateError);
        }

        // Log the sent email
        try {
          await supabase.from('email_sent_log').insert({
            recipient_email: prospect.contact_email,
            email_type: 'partner_outreach',
            email_category: 'operational',
            subject,
            sent_from: FROM_EMAIL,
            dedup_key: `partner_outreach:${prospect.id}:initial`,
            related_entity_type: 'partner',
            related_entity_id: prospect.id,
            delivery_status: 'sent',
            sent_at: new Date().toISOString()
          });
        } catch (err) {
          console.error('[Dan] Email log error:', err);
        }

        emailsSent++;
        outreachLog.push({
          brand: prospect.brand_name,
          email: prospect.contact_email,
          template: templateType,
          status: 'sent'
        });

        console.log(`[Dan Partner Outreach] ✅ Sent to: ${prospect.brand_name}`);

        // Small delay between emails
        await new Promise(r => setTimeout(r, 2000));

      } catch (error: any) {
        console.error(`[Dan Partner Outreach] Error with ${prospect.brand_name}:`, error);
        emailsFailed++;
        outreachLog.push({
          brand: prospect.brand_name,
          status: 'error',
          error: error.message
        });
      }
    }

    // Create follow-up task if emails were sent
    if (emailsSent > 0) {
      try {
        await supabase.from('tasks').insert({
          tenant_id: TENANT_ID,
          title: `Follow up on ${emailsSent} partner outreach emails`,
          description: `Dan sent partnership outreach to:\n${outreachLog.filter(l => l.status === 'sent').map(l => `- ${l.brand} (${l.email})`).join('\n')}\n\nCheck for responses in 2-3 days. Each email included:\n- Digital lookbook link\n- Client model program invitation\n- Real-time feedback collaboration offer`,
          assigned_to: 'maggie@maggieforbesstrategies.com',
          priority: 'high',
          status: 'pending',
          related_entity_type: 'partner',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (err) {
        console.error('[Dan] Task creation error:', err);
      }
    }

    console.log(`[Dan Partner Outreach] Complete: ${emailsSent} sent, ${emailsFailed} failed`);

    return NextResponse.json({
      success: true,
      data: {
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        outreach_log: outreachLog
      }
    });

  } catch (error: any) {
    console.error('[Dan Partner Outreach] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Return outreach status and pending prospects
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabase();

    // Get prospects ready for outreach
    const { data: readyForOutreach } = await supabase
      .from('ff_partners')
      .select('brand_name, website, contact_email, primary_fabric, country')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'prospect')
      .is('outreach_date', null)
      .not('contact_email', 'is', null)
      .limit(20);

    // Get recently contacted
    const { data: recentlyContacted } = await supabase
      .from('ff_partners')
      .select('brand_name, contact_email, outreach_date, status')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'contacted')
      .order('outreach_date', { ascending: false })
      .limit(10);

    // Get partners without email (need manual contact via Instagram/website)
    const { data: needsManualContact } = await supabase
      .from('ff_partners')
      .select('brand_name, website, instagram_handle')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'prospect')
      .is('contact_email', null)
      .limit(20);

    // Get active partners
    const { data: activePartners } = await supabase
      .from('ff_partners')
      .select('brand_name, website')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ready_for_outreach: readyForOutreach?.length || 0,
          recently_contacted: recentlyContacted?.length || 0,
          needs_manual_contact: needsManualContact?.length || 0,
          active_partners: activePartners?.length || 0
        },
        prospects_with_email: readyForOutreach,
        recently_contacted: recentlyContacted,
        manual_outreach_needed: needsManualContact,
        active_partners: activePartners
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
