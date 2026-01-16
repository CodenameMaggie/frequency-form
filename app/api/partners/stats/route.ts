/**
 * Partner Stats API
 * Provides partner statistics for the bots dashboard
 */

import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createAdminSupabase();

    // Get partner counts by status
    const { data: partners, error } = await supabase
      .from('ff_partners')
      .select('status');

    if (error) throw error;

    const stats = {
      total: partners?.length || 0,
      active: partners?.filter(p => p.status === 'active').length || 0,
      pending: partners?.filter(p => p.status === 'pending').length || 0,
      negotiating: partners?.filter(p => p.status === 'negotiating').length || 0,
      onboarding: partners?.filter(p => p.status === 'onboarding').length || 0
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Partners Stats] Error:', error);
    return NextResponse.json({
      success: true,
      data: {
        total: 0,
        active: 0,
        pending: 0,
        negotiating: 0,
        onboarding: 0
      }
    });
  }
}
