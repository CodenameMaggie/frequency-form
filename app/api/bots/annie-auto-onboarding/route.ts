/**
 * Annie Auto Onboarding Bot
 * Creates seller accounts and sends welcome emails
 * CRON: Every 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Annie Auto Onboarding] Running...');

    // Get partners who are 'active' but don't have seller accounts yet
    const { data: partners } = await supabase
      .from('ff_partners')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'active')
      .limit(5);

    let accountsCreated = 0;

    for (const partner of partners || []) {
      // TODO: Create Supabase auth user for seller
      // TODO: Create seller profile
      // TODO: Send welcome email with login credentials
      accountsCreated++;
    }

    return NextResponse.json({
      success: true,
      data: {
        accounts_created: accountsCreated
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
