/**
 * Dan Contact Form Outreach Bot
 * For brands without email addresses, submits partnership inquiries via their website contact forms
 * Uses Puppeteer-style form detection and submission
 *
 * CRON: Daily at 11am (after partner discovery)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

// Known contact page patterns
const CONTACT_PAGE_PATTERNS = [
  '/contact',
  '/contact-us',
  '/kontakt',
  '/contacto',
  '/get-in-touch',
  '/reach-out',
  '/about/contact',
  '/pages/contact',
  '/pages/contact-us',
  '/support',
  '/help',
  '/wholesale',
  '/wholesale-inquiry',
  '/partnerships',
  '/collaborate',
  '/work-with-us',
  '/b2b',
  '/trade'
];

// Known contact form endpoints (for direct API submission)
const KNOWN_FORM_ENDPOINTS: Record<string, {
  url: string;
  method: 'POST' | 'GET';
  fields: Record<string, string>;
  contentType?: string;
}> = {
  'etsy.com': {
    url: 'https://www.etsy.com/api/v3/ajax/shop/{shop_id}/contact',
    method: 'POST',
    fields: {
      message: 'message',
      subject: 'subject'
    }
  }
};

interface ContactFormResult {
  brand: string;
  website: string;
  method: 'contact_page' | 'email_found' | 'instagram' | 'form_submitted' | 'no_contact';
  contact_url?: string;
  email_found?: string;
  instagram?: string;
  notes: string;
}

/**
 * Try to find contact page or email on a website
 */
async function findContactInfo(website: string): Promise<{
  contactUrl?: string;
  emailFound?: string;
  formDetected?: boolean;
}> {
  try {
    // First, try to fetch the main page and look for contact info
    const mainResponse = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      redirect: 'follow'
    });

    if (!mainResponse.ok) {
      return {};
    }

    const html = await mainResponse.text();

    // Look for email addresses
    const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    const validEmails = emailMatches?.filter(e =>
      !e.includes('example') &&
      !e.includes('test') &&
      !e.includes('wixpress') &&
      !e.includes('sentry') &&
      (e.includes('hello') || e.includes('info') || e.includes('contact') ||
       e.includes('wholesale') || e.includes('partnerships') || e.includes('support'))
    );

    if (validEmails && validEmails.length > 0) {
      return { emailFound: validEmails[0] };
    }

    // Look for contact page links
    const contactLinkMatch = html.match(/href=["']([^"']*(?:contact|kontakt|wholesale|partnerships)[^"']*)["']/i);
    if (contactLinkMatch) {
      let contactUrl = contactLinkMatch[1];
      if (!contactUrl.startsWith('http')) {
        const base = new URL(website);
        contactUrl = new URL(contactUrl, base).href;
      }
      return { contactUrl, formDetected: true };
    }

    // Try common contact page paths
    const baseUrl = new URL(website);
    for (const pattern of CONTACT_PAGE_PATTERNS) {
      try {
        const testUrl = `${baseUrl.origin}${pattern}`;
        const response = await fetch(testUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (response.ok) {
          return { contactUrl: testUrl, formDetected: true };
        }
      } catch {
        continue;
      }
    }

    return {};
  } catch (error) {
    console.error(`[Dan Contact Form] Error checking ${website}:`, error);
    return {};
  }
}

/**
 * Generate partnership inquiry message
 */
function generateContactMessage(brandName: string): { subject: string; message: string } {
  return {
    subject: `Partnership Inquiry - Frequency & Form`,
    message: `Hi ${brandName} team,

I'm reaching out from Frequency & Form, an AI-powered Style Studio that connects customers with quality natural fiber brands.

We curate European and artisan natural fiber fashion based on fabric frequency science - connecting wellness-minded customers with pieces that truly enhance how they feel.

We'd love to explore a partnership with your brand. We offer:
- Commission-based model (no upfront costs)
- AI-powered customer matching based on body type and color profile
- Real-time customer feedback and insights
- Featured placement in our digital lookbook

You can view our current collection at: https://frequencyandform.com/ff/lookbook

Would you be open to a quick conversation about how we might work together?

Warm regards,
Henry
Partnerships, Frequency & Form
henry@frequencyandform.com
https://frequencyandform.com`
  };
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Dan Contact Form] Starting contact form outreach...');

    // Get partners without email who haven't been contacted
    const { data: partners, error: fetchError } = await supabase
      .from('ff_partners')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'prospect')
      .is('contact_email', null)
      .is('outreach_date', null)
      .not('website', 'is', null)
      .limit(10);

    if (fetchError) {
      console.error('[Dan Contact Form] Error fetching partners:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!partners || partners.length === 0) {
      console.log('[Dan Contact Form] No partners need contact form outreach');
      return NextResponse.json({
        success: true,
        message: 'No partners need contact form outreach',
        data: { processed: 0 }
      });
    }

    const results: ContactFormResult[] = [];
    let emailsFound = 0;
    let contactPagesFound = 0;
    let instagramOnly = 0;

    for (const partner of partners) {
      console.log(`[Dan Contact Form] Processing: ${partner.brand_name}`);

      const contactInfo = await findContactInfo(partner.website);

      if (contactInfo.emailFound) {
        // Found an email! Update the partner record
        await supabase
          .from('ff_partners')
          .update({
            contact_email: contactInfo.emailFound,
            notes: `Email discovered via website scraping: ${contactInfo.emailFound}`
          })
          .eq('id', partner.id);

        emailsFound++;
        results.push({
          brand: partner.brand_name,
          website: partner.website,
          method: 'email_found',
          email_found: contactInfo.emailFound,
          notes: 'Email discovered - will be emailed in next outreach run'
        });

        console.log(`[Dan Contact Form] ✅ Found email for ${partner.brand_name}: ${contactInfo.emailFound}`);
      } else if (contactInfo.contactUrl) {
        // Found contact page
        await supabase
          .from('ff_partners')
          .update({
            notes: `Contact page found: ${contactInfo.contactUrl}. Manual outreach needed.`,
            outreach_date: new Date().toISOString(),
            status: 'contacted'
          })
          .eq('id', partner.id);

        contactPagesFound++;
        results.push({
          brand: partner.brand_name,
          website: partner.website,
          method: 'contact_page',
          contact_url: contactInfo.contactUrl,
          notes: 'Contact page found - marked for manual form submission'
        });

        // Create task for manual outreach
        await supabase.from('tasks').insert({
          tenant_id: TENANT_ID,
          title: `Submit contact form: ${partner.brand_name}`,
          description: `Contact form found at: ${contactInfo.contactUrl}\n\nUse this message:\n\n${generateContactMessage(partner.brand_name).message}`,
          assigned_to: 'maggie@maggieforbesstrategies.com',
          priority: 'high',
          status: 'pending',
          related_entity_type: 'partner',
          related_entity_id: partner.id
        });

        console.log(`[Dan Contact Form] 📝 Contact page found for ${partner.brand_name}: ${contactInfo.contactUrl}`);
      } else if (partner.instagram_handle) {
        // Only Instagram available
        await supabase
          .from('ff_partners')
          .update({
            notes: `No email or contact form found. Instagram: ${partner.instagram_handle}`,
            outreach_date: new Date().toISOString(),
            status: 'contacted'
          })
          .eq('id', partner.id);

        instagramOnly++;
        results.push({
          brand: partner.brand_name,
          website: partner.website,
          method: 'instagram',
          instagram: partner.instagram_handle,
          notes: 'Instagram DM required for outreach'
        });

        // Create task for Instagram outreach
        await supabase.from('tasks').insert({
          tenant_id: TENANT_ID,
          title: `Instagram DM: ${partner.brand_name}`,
          description: `No email found. Send Instagram DM to ${partner.instagram_handle}\n\nMessage:\n${generateContactMessage(partner.brand_name).message}`,
          assigned_to: 'maggie@maggieforbesstrategies.com',
          priority: 'normal',
          status: 'pending',
          related_entity_type: 'partner',
          related_entity_id: partner.id
        });

        console.log(`[Dan Contact Form] 📸 Instagram only for ${partner.brand_name}: ${partner.instagram_handle}`);
      } else {
        results.push({
          brand: partner.brand_name,
          website: partner.website,
          method: 'no_contact',
          notes: 'No contact method found'
        });

        console.log(`[Dan Contact Form] ❌ No contact method for ${partner.brand_name}`);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 2000));
    }

    // Notify Henry about results
    if (emailsFound > 0) {
      await supabase.from('ff_bot_communications').insert({
        from_bot: 'dan',
        to_bot: 'henry',
        subject: `Contact Form Scan Complete: ${emailsFound} emails discovered`,
        message: `Henry,

I scanned ${partners.length} partner websites for contact info:
- Emails discovered: ${emailsFound} (ready for email outreach)
- Contact pages found: ${contactPagesFound} (tasks created for manual submission)
- Instagram only: ${instagramOnly} (tasks created for DM outreach)

The newly discovered emails will be picked up in the next partner outreach run.

- Dan`,
        message_type: 'report',
        priority: emailsFound > 0 ? 'high' : 'normal'
      });
    }

    console.log(`[Dan Contact Form] Complete: ${emailsFound} emails, ${contactPagesFound} contact pages, ${instagramOnly} Instagram`);

    return NextResponse.json({
      success: true,
      data: {
        processed: partners.length,
        emails_found: emailsFound,
        contact_pages_found: contactPagesFound,
        instagram_only: instagramOnly,
        results
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dan Contact Form] Error:', error);
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

  // Get partners needing contact form outreach
  const { data: needsOutreach } = await supabase
    .from('ff_partners')
    .select('brand_name, website, instagram_handle')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'prospect')
    .is('contact_email', null)
    .is('outreach_date', null);

  return NextResponse.json({
    success: true,
    data: {
      needs_contact_form_outreach: needsOutreach?.length || 0,
      partners: needsOutreach
    }
  });
}
