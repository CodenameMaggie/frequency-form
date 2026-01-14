/**
 * Dan Auto Outreach Bot
 * Sends personalized wholesale outreach emails to new prospects
 * Uses templates from WHOLESALE-EMAIL-TEMPLATES.md
 * CRON: Hourly during business hours (9am-5pm Mon-Fri)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Email templates matching WHOLESALE-EMAIL-TEMPLATES.md
const EMAIL_TEMPLATES = {
  boutique_initial: {
    subject: 'Natural Fiber Wholesale - Pre-Order Now for Spring',
    template: (businessName: string) => `Hi there,

Spring 2026 pre-orders are open for ${businessName}.

Frequency & Form is offering wholesale natural fiber collections:
- 100% linen, hemp, organic cotton
- Custom sizing (XS-3X)
- Pre-order pricing: 50% off retail
- $500-2,500 packages available

Limited to 20 boutiques. Reserve your spot:
→ 50% deposit locks your order
→ Balance due on delivery (4 weeks)

Reply "INTERESTED" for our lookbook.

Maggie Forbes
Frequency & Form
frequencyandform.com`
  },
  yoga_studio_initial: {
    subject: 'Sustainable Activewear for Your Studio Retail',
    template: (businessName: string) => `Hi there,

I noticed that ${businessName} offers retail products to your community. We specialize in natural fiber clothing that aligns perfectly with wellness and mindful living.

Frequency & Form creates custom linen and cotton pieces that your clients would love:
- Breathable linen loungewear
- Hemp yoga pants
- Organic cotton basics
- Flowy movement-friendly designs

First Order Special:
- No minimum order requirement
- Free shipping
- Consignment option available

Can I send you our wellness collection lookbook?

Namaste,
Maggie Forbes
Frequency & Form`
  },
  hotel_initial: {
    subject: 'Elevated Natural Fiber Fashion for Your Guests',
    template: (businessName: string) => `Dear ${businessName} team,

Your property clearly attracts sophisticated guests who appreciate quality and sustainability. Our natural fiber fashion line would be a perfect addition to your gift shop.

Frequency & Form specializes in:
- Packable linen dresses
- Wrinkle-resistant natural fabrics
- Comfortable luxury
- Sustainable fashion

Special Resort Partner Program:
- Consignment option available
- Custom pieces with your branding
- Quarterly collection updates

Would you be open to a 15-minute call to explore this partnership?

Best regards,
Maggie Forbes
Frequency & Form`
  }
};

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    console.log('[Dan Auto Outreach] Starting outreach campaign...');

    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get prospects who haven't been contacted yet (status='prospect')
    const { data: prospects, error: fetchError } = await supabase
      .from('ff_boutique_buyers')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'prospect')
      .is('first_contact_date', null)
      .order('lead_quality_score', { ascending: false })
      .limit(10); // Send to top 10 prospects per run

    if (fetchError) {
      console.error('[Dan Auto Outreach] Error fetching prospects:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    let emailsQueued = 0;
    let emailsSkipped = 0;

    for (const prospect of prospects || []) {
      if (!prospect.contact_email) {
        emailsSkipped++;
        continue;
      }

      // Select template based on business type
      let templateKey = 'boutique_initial';
      if (prospect.business_type === 'yoga_studio') {
        templateKey = 'yoga_studio_initial';
      } else if (prospect.business_type === 'hotel') {
        templateKey = 'hotel_initial';
      }

      const template = EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES];
      const subject = template.subject;
      const body = template.template(prospect.business_name);

      // Add to email outreach queue
      const { error: queueError } = await supabase
        .from('email_outreach_queue')
        .insert({
          tenant_id: TENANT_ID,
          buyer_id: prospect.id,
          recipient_email: prospect.contact_email,
          recipient_name: prospect.contact_name,
          business_name: prospect.business_name,
          subject,
          body,
          template_used: templateKey,
          status: 'queued',
          campaign_name: 'wholesale_spring_2026',
          priority: prospect.lead_quality_score >= 80 ? 3 : 5,
          scheduled_for: new Date()
        });

      if (queueError) {
        console.error(`[Dan Auto Outreach] Error queuing email for ${prospect.business_name}:`, queueError);
        emailsSkipped++;
        continue;
      }

      // Update prospect status
      await supabase
        .from('ff_boutique_buyers')
        .update({
          status: 'contacted',
          first_contact_date: new Date().toISOString(),
          last_contact_date: new Date().toISOString(),
          emails_sent_count: (prospect.emails_sent_count || 0) + 1
        })
        .eq('id', prospect.id);

      emailsQueued++;
      console.log(`[Dan Auto Outreach] ✅ Queued email for: ${prospect.business_name}`);
    }

    console.log(`[Dan Auto Outreach] Complete: ${emailsQueued} emails queued, ${emailsSkipped} skipped`);

    return NextResponse.json({
      success: true,
      data: {
        emails_queued: emailsQueued,
        emails_skipped: emailsSkipped
      }
    });

  } catch (error: any) {
    console.error('[Dan Auto Outreach] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
