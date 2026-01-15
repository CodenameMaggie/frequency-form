/**
 * Annie Auto Onboarding Bot
 * Creates seller accounts and sends welcome emails
 * CRON: Every 30 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { sendSellerWelcomeEmail } from '@/lib/email';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.FORBES_COMMAND_CRON) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Annie Auto Onboarding] Running...');

    const supabase = createAdminSupabase();

    // Get partners who are 'active' but don't have seller accounts yet
    const { data: partners } = await supabase
      .from('ff_partners')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'active')
      .is('auth_user_id', null)
      .limit(5);

    let accountsCreated = 0;
    const errors: string[] = [];

    for (const partner of partners || []) {
      try {
        // Generate temporary password
        const temporaryPassword = generateTemporaryPassword();

        // Create Supabase auth user for seller
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: partner.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            business_name: partner.business_name,
            contact_name: partner.contact_name,
            role: 'seller',
          },
        });

        if (authError) {
          console.error(`[Annie] Failed to create auth user for ${partner.email}:`, authError);
          errors.push(`Auth error for ${partner.email}: ${authError.message}`);
          continue;
        }

        // Create seller profile in brand_partners table
        const { error: profileError } = await supabase
          .from('brand_partners')
          .insert({
            auth_user_id: authData.user.id,
            business_name: partner.business_name,
            contact_name: partner.contact_name,
            email: partner.email,
            phone: partner.phone,
            website: partner.website,
            status: 'approved',
            commission_rate: 0.15,
          });

        if (profileError) {
          console.error(`[Annie] Failed to create seller profile for ${partner.email}:`, profileError);
          errors.push(`Profile error for ${partner.email}: ${profileError.message}`);
          continue;
        }

        // Update partner record with auth_user_id
        await supabase
          .from('ff_partners')
          .update({ auth_user_id: authData.user.id })
          .eq('id', partner.id);

        // Send welcome email with login credentials
        const emailResult = await sendSellerWelcomeEmail(
          partner.email,
          partner.contact_name,
          partner.business_name,
          temporaryPassword
        );

        if (!emailResult.success) {
          console.error(`[Annie] Failed to send welcome email to ${partner.email}:`, emailResult.error);
          errors.push(`Email error for ${partner.email}: ${emailResult.error}`);
        }

        accountsCreated++;
        console.log(`[Annie] Successfully onboarded seller: ${partner.business_name}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Annie] Error processing partner ${partner.email}:`, errorMsg);
        errors.push(`Error for ${partner.email}: ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        accounts_created: accountsCreated,
        partners_processed: partners?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
