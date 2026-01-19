/**
 * Admin Outreach Status Endpoint
 * Shows complete status of all outreach activities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabase();

  try {
    // 1. Get all emails sent
    const { data: emailLogs, error: emailError } = await supabase
      .from('email_sent_log')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);

    // 2. Get partner status breakdown
    const { data: partners } = await supabase
      .from('ff_partners')
      .select('id, brand_name, contact_email, status, outreach_date, created_at')
      .eq('tenant_id', TENANT_ID)
      .order('outreach_date', { ascending: false });

    // 3. Get wholesale buyer status breakdown
    const { data: buyers } = await supabase
      .from('ff_boutique_buyers')
      .select('id, business_name, contact_email, status, first_contact_date, emails_sent_count')
      .eq('tenant_id', TENANT_ID)
      .order('first_contact_date', { ascending: false });

    // 4. Get bot actions related to outreach
    const { data: botActions } = await supabase
      .from('ff_bot_actions')
      .select('*')
      .in('bot_name', ['dan-partner-outreach', 'dan-wholesale-outreach', 'dan-partner-followup'])
      .order('created_at', { ascending: false })
      .limit(20);

    // Analyze partner data
    const partnerStats = {
      total: partners?.length || 0,
      by_status: {
        prospect: partners?.filter(p => p.status === 'prospect').length || 0,
        contacted: partners?.filter(p => p.status === 'contacted').length || 0,
        negotiating: partners?.filter(p => p.status === 'negotiating').length || 0,
        active: partners?.filter(p => p.status === 'active').length || 0
      },
      with_email: partners?.filter(p => p.contact_email).length || 0,
      without_email: partners?.filter(p => !p.contact_email).length || 0,
      contacted_list: partners?.filter(p => p.status === 'contacted').map(p => ({
        brand: p.brand_name,
        email: p.contact_email,
        contacted_on: p.outreach_date
      })) || []
    };

    // Analyze buyer data
    const buyerStats = {
      total: buyers?.length || 0,
      by_status: {
        prospect: buyers?.filter(b => b.status === 'prospect').length || 0,
        contacted: buyers?.filter(b => b.status === 'contacted').length || 0,
        interested: buyers?.filter(b => b.status === 'interested').length || 0,
        customer: buyers?.filter(b => b.status === 'customer').length || 0
      },
      with_email: buyers?.filter(b => b.contact_email).length || 0,
      contacted_list: buyers?.filter(b => b.status === 'contacted').map(b => ({
        business: b.business_name,
        email: b.contact_email,
        emails_sent: b.emails_sent_count,
        first_contact: b.first_contact_date
      })) || []
    };

    // Analyze email logs
    const emailStats = {
      total_sent: emailLogs?.length || 0,
      by_type: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
      recent_emails: emailLogs?.slice(0, 20).map(e => ({
        to: e.recipient_email,
        type: e.email_type,
        subject: e.subject?.substring(0, 60),
        status: e.delivery_status,
        sent_at: e.sent_at
      })) || []
    };

    // Count by type and status
    for (const log of emailLogs || []) {
      const type = log.email_type || 'unknown';
      const status = log.delivery_status || 'unknown';
      emailStats.by_type[type] = (emailStats.by_type[type] || 0) + 1;
      emailStats.by_status[status] = (emailStats.by_status[status] || 0) + 1;
    }

    // Check for issues
    const issues: string[] = [];

    // Check for fake/placeholder emails
    const fakeEmailPatterns = [
      '@example.com', '@test.com', '@placeholder',
      'brand.brand@', 'fake@', 'test@'
    ];

    const suspiciousEmails = emailLogs?.filter(e =>
      fakeEmailPatterns.some(pattern => e.recipient_email?.toLowerCase().includes(pattern))
    ) || [];

    if (suspiciousEmails.length > 0) {
      issues.push(`Found ${suspiciousEmails.length} emails sent to suspicious/fake addresses`);
    }

    // Check for partners marked contacted but no email in log
    const contactedNoLog = partners?.filter(p =>
      p.status === 'contacted' &&
      p.contact_email &&
      !emailLogs?.some(e => e.recipient_email === p.contact_email)
    ) || [];

    if (contactedNoLog.length > 0) {
      issues.push(`${contactedNoLog.length} partners marked 'contacted' but no email in sent log`);
    }

    // Check for duplicate emails
    const emailAddresses = emailLogs?.map(e => e.recipient_email) || [];
    const duplicates = emailAddresses.filter((e, i) => emailAddresses.indexOf(e) !== i);
    const uniqueDuplicates = [...new Set(duplicates)];

    if (uniqueDuplicates.length > 0) {
      issues.push(`${uniqueDuplicates.length} email addresses received multiple emails: ${uniqueDuplicates.slice(0, 5).join(', ')}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          partners: partnerStats.total,
          partners_contacted: partnerStats.by_status.contacted,
          wholesale_buyers: buyerStats.total,
          buyers_contacted: buyerStats.by_status.contacted,
          total_emails_sent: emailStats.total_sent,
          issues_found: issues.length
        },
        partners: partnerStats,
        wholesale_buyers: buyerStats,
        emails: emailStats,
        issues,
        suspicious_emails: suspiciousEmails.map(e => ({
          to: e.recipient_email,
          type: e.email_type,
          sent_at: e.sent_at
        })),
        recent_bot_actions: botActions?.map(a => ({
          bot: a.bot_name,
          action: a.action_type,
          status: a.status,
          details: a.details,
          created_at: a.created_at
        })) || []
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
