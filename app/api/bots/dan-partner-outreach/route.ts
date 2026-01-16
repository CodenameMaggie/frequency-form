/**
 * Dan Partner Outreach Bot
 * Sends partnership invitation emails to natural fiber brands
 * Works with ff_partners table (prospects discovered by Henry)
 * NO paid AI - uses simple templates
 * CRON: Daily at 10am
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Partnership invitation email templates
const PARTNER_TEMPLATES = {
  linen_brand: {
    subject: 'Partnership Opportunity - Frequency & Form Style Studio',
    template: (brandName: string, website: string) => `Hi ${brandName} team,

I'm Maggie from Frequency & Form. We're building a curated Style Studio that connects customers with quality natural fiber brands.

Why I reached out to you:
Your linen pieces caught my eye. We're looking for brands that share our values - natural materials, thoughtful design, and quality craftsmanship.

What we offer partners:
• Featured placement in our Style Studio
• AI-powered styling that recommends your pieces to the right customers
• Body-type matching so customers find items that fit them beautifully
• Zero upfront cost - we earn a small commission on sales we generate

How it works:
1. You join our partner program (free)
2. We feature your products in our Style Studio
3. Customers discover your pieces through personalized recommendations
4. They click through to buy directly from your store
5. You fulfill the order, we earn a commission

We're selective - we only work with brands whose quality we can stand behind.

Would you be open to a quick chat about partnering?

Best,
Maggie Forbes
Frequency & Form
frequencyandform.com`
  },

  cashmere_brand: {
    subject: 'Luxury Partnership - Frequency & Form',
    template: (brandName: string, website: string) => `Dear ${brandName} team,

Frequency & Form is building an exclusive Style Studio focused on natural luxury - and your cashmere pieces are exactly what our clients are looking for.

Our audience:
Women who invest in quality natural fibers - linen, cashmere, silk, organic cotton. They value craftsmanship over fast fashion.

Partnership benefits:
• Curated placement alongside complementary luxury brands
• AI styling recommendations matched to customer preferences
• Color analysis that suggests your pieces based on skin tone
• Body-type fitting recommendations

Our model is simple:
You gain a new sales channel. We feature your products. Customers buy directly from you. We earn a small commission.

No inventory risk. No upfront costs. No exclusivity requirements.

I'd love to discuss how we can feature ${brandName} in our collection.

Warm regards,
Maggie Forbes
Frequency & Form`
  },

  organic_cotton: {
    subject: 'Sustainable Fashion Partnership - Frequency & Form',
    template: (brandName: string, website: string) => `Hi ${brandName} team,

Your commitment to organic cotton caught my attention. At Frequency & Form, we're on a mission to help people build wardrobes with natural, sustainable materials.

Our Style Studio features:
• AI body scanning for personalized fit recommendations
• Color analysis matching products to skin tones
• Fabric education helping customers understand natural fibers
• Curated collections from brands we believe in

Partnership opportunity:
We'd love to feature ${brandName} products in our Style Studio. Our customers would click through to your site to purchase - you handle fulfillment, we earn a commission on referred sales.

Benefits for you:
✓ New customer acquisition channel
✓ Zero inventory or fulfillment burden
✓ AI-powered product recommendations
✓ No upfront costs

Interested in learning more?

Best,
Maggie Forbes
Frequency & Form
frequencyandform.com`
  },

  etsy_artisan: {
    subject: 'Feature Your Linen Creations - Frequency & Form',
    template: (brandName: string, website: string) => `Hi!

I discovered your beautiful work on Etsy and wanted to reach out.

I'm building a Style Studio called Frequency & Form that helps women find natural fiber clothing. We use AI to match customers with pieces that suit their body type and coloring.

I'd love to feature your creations to our audience.

How it works:
- We add your products to our Style Studio
- Our AI recommends them to customers who are good fits
- They click through to your Etsy shop to buy
- You fulfill the order, we earn a referral commission

No costs. No inventory changes. Just a new way for the right customers to find you.

Would you be interested?

Maggie
Frequency & Form`
  }
};

/**
 * Select the best template based on brand info
 */
function selectTemplate(brand: any): keyof typeof PARTNER_TEMPLATES {
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

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    console.log('[Dan Partner Outreach] Starting partner outreach...');

    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

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
      .limit(5); // Send 5 outreach emails per day

    if (fetchError) {
      console.error('[Dan Partner Outreach] Error fetching prospects:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!prospects || prospects.length === 0) {
      // Also try prospects without email - just log them for manual outreach
      const { data: noEmailProspects } = await supabase
        .from('ff_partners')
        .select('brand_name, website, instagram_handle')
        .eq('tenant_id', TENANT_ID)
        .eq('status', 'prospect')
        .is('contact_email', null)
        .limit(10);

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
    let emailsSkipped = 0;
    const outreachLog: any[] = [];

    for (const prospect of prospects) {
      try {
        // Select appropriate template
        const templateKey = selectTemplate(prospect);
        const template = PARTNER_TEMPLATES[templateKey];
        const subject = template.subject;
        const body = template.template(prospect.brand_name, prospect.website || '');

        // Log the outreach (in production, this would send via SendGrid/Resend)
        console.log(`[Dan Partner Outreach] Would send to: ${prospect.contact_email}`);
        console.log(`  Subject: ${subject}`);

        // Queue the email (or send directly if email service configured)
        const { error: queueError } = await supabase
          .from('email_outreach_queue')
          .insert({
            tenant_id: TENANT_ID,
            recipient_email: prospect.contact_email,
            recipient_name: prospect.brand_name,
            business_name: prospect.brand_name,
            subject,
            body,
            template_used: `partner_${templateKey}`,
            status: 'queued',
            campaign_name: 'partner_outreach_2026',
            priority: 1,
            scheduled_for: new Date(),
            metadata: {
              partner_id: prospect.id,
              fabric_type: prospect.primary_fabric,
              country: prospect.country
            }
          });

        if (queueError) {
          console.error(`[Dan Partner Outreach] Queue error for ${prospect.brand_name}:`, queueError);
          // Continue anyway - update the partner status
        }

        // Update partner status to 'contacted'
        const { error: updateError } = await supabase
          .from('ff_partners')
          .update({
            status: 'contacted',
            outreach_date: new Date().toISOString(),
            last_contact_date: new Date().toISOString(),
            notes: `Initial partnership outreach sent via ${templateKey} template`
          })
          .eq('id', prospect.id);

        if (updateError) {
          console.error(`[Dan Partner Outreach] Update error for ${prospect.brand_name}:`, updateError);
          emailsSkipped++;
          continue;
        }

        emailsSent++;
        outreachLog.push({
          brand: prospect.brand_name,
          email: prospect.contact_email,
          template: templateKey,
          status: 'sent'
        });

        console.log(`[Dan Partner Outreach] ✅ Contacted: ${prospect.brand_name}`);

      } catch (error: any) {
        console.error(`[Dan Partner Outreach] Error with ${prospect.brand_name}:`, error);
        emailsSkipped++;
      }
    }

    // Create summary task
    if (emailsSent > 0) {
      await supabase.from('tasks').insert({
        tenant_id: TENANT_ID,
        title: `Follow up on ${emailsSent} partner outreach emails`,
        description: `Dan sent partnership outreach to:\n${outreachLog.map(l => `- ${l.brand}`).join('\n')}\n\nCheck for responses in 2-3 days.`,
        assigned_to: 'maggie@maggieforbesstrategies.com',
        priority: 'medium',
        status: 'pending',
        related_entity_type: 'partner',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      });
    }

    console.log(`[Dan Partner Outreach] Complete: ${emailsSent} sent, ${emailsSkipped} skipped`);

    return NextResponse.json({
      success: true,
      data: {
        emails_sent: emailsSent,
        emails_skipped: emailsSkipped,
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
      .select('brand_name, outreach_date, status')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'contacted')
      .order('outreach_date', { ascending: false })
      .limit(10);

    // Get partners without email (need manual contact)
    const { data: needsManualContact } = await supabase
      .from('ff_partners')
      .select('brand_name, website, instagram_handle')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'prospect')
      .is('contact_email', null)
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        ready_for_outreach: readyForOutreach?.length || 0,
        recently_contacted: recentlyContacted?.length || 0,
        needs_manual_contact: needsManualContact?.length || 0,
        prospects_with_email: readyForOutreach,
        contacted: recentlyContacted,
        manual_outreach_needed: needsManualContact
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
