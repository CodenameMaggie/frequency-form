/**
 * Fix Partner Status
 * Resets partners without emails back to 'prospect' status
 * since they couldn't have been contacted via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabase();

  try {
    // Find ALL partners marked as 'contacted' - reset them all
    // Previous emails used wrong FROM address (maggie@ instead of henry@) so none were delivered
    const { data: wrongStatus, error: fetchError } = await supabase
      .from('ff_partners')
      .select('id, brand_name, status, contact_email')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'contacted');

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!wrongStatus || wrongStatus.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No partners need fixing',
        data: { fixed: 0 }
      });
    }

    console.log(`[Fix Partner Status] Found ${wrongStatus.length} partners to reset (emails used wrong FROM address)`);

    // Reset ALL contacted partners to prospect
    const { error: updateError } = await supabase
      .from('ff_partners')
      .update({
        status: 'prospect',
        outreach_date: null,
        last_contact_date: null,
        notes: 'Status reset - previous outreach used wrong FROM address'
      })
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'contacted');

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Also clear invalid email_sent_log entries (sent from wrong address)
    const { data: deletedLogs, error: logError } = await supabase
      .from('email_sent_log')
      .delete()
      .eq('sent_from', 'maggie@frequencyandform.com')
      .select('id');

    if (logError) {
      console.error('[Fix Partner Status] Error clearing email logs:', logError);
    }

    const fixedBrands = wrongStatus.map(p => p.brand_name);
    console.log(`[Fix Partner Status] Reset ${fixedBrands.length} partners: ${fixedBrands.join(', ')}`);
    console.log(`[Fix Partner Status] Cleared ${deletedLogs?.length || 0} invalid email log entries`);

    return NextResponse.json({
      success: true,
      data: {
        fixed: wrongStatus.length,
        brands: fixedBrands,
        email_logs_cleared: deletedLogs?.length || 0
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

  // Show ALL partners that would be fixed (all contacted ones)
  const { data: wrongStatus } = await supabase
    .from('ff_partners')
    .select('brand_name, status, contact_email, outreach_date')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'contacted');

  return NextResponse.json({
    success: true,
    data: {
      needs_fixing: wrongStatus?.length || 0,
      partners: wrongStatus?.map(p => ({
        brand: p.brand_name,
        status: p.status,
        email: p.contact_email || 'NONE',
        outreach_date: p.outreach_date
      })) || []
    }
  });
}
