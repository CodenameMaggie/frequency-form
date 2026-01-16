/**
 * Revenue API for Dave's Dashboard
 * Provides revenue metrics, membership stats, and goal tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

// Revenue goal: $100M in 5 years (2025-2030)
const REVENUE_GOAL_CENTS = 100_000_000 * 100; // $100M in cents
const GOAL_START = new Date('2025-01-01');
const GOAL_END = new Date('2030-01-01');

export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Allow access with secret or from authenticated dashboard
    if (secret !== CRON_SECRET) {
      // Could add session-based auth here for dashboard access
    }

    // Get all-time revenue
    const { data: allTimeRevenue } = await supabase
      .from('ff_revenue')
      .select('amount_cents')
      .eq('status', 'succeeded');

    const totalRevenueCents = allTimeRevenue?.reduce((sum, r) => sum + (r.amount_cents || 0), 0) || 0;

    // Get current month revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthRevenue } = await supabase
      .from('ff_revenue')
      .select('amount_cents, type')
      .eq('status', 'succeeded')
      .gte('created_at', startOfMonth.toISOString());

    const monthlyRevenueCents = monthRevenue?.reduce((sum, r) => sum + (r.amount_cents || 0), 0) || 0;
    const monthlySubscriptions = monthRevenue?.filter(r => r.type === 'subscription').length || 0;
    const monthlyOneTime = monthRevenue?.filter(r => r.type === 'one_time').length || 0;

    // Get active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from('ff_user_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null);

    // Get membership tier breakdown
    const { data: memberships } = await supabase
      .from('ff_user_memberships')
      .select(`
        tier_id,
        ff_membership_tiers (slug, price_monthly)
      `)
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null);

    const tierBreakdown = {
      elevated: 0,
      sovereign: 0
    };

    let mrr = 0; // Monthly Recurring Revenue
    memberships?.forEach(m => {
      const tier = (m.ff_membership_tiers as any)?.slug;
      const price = (m.ff_membership_tiers as any)?.price_monthly || 0;
      if (tier === 'elevated') {
        tierBreakdown.elevated++;
        mrr += price;
      } else if (tier === 'sovereign') {
        tierBreakdown.sovereign++;
        mrr += price;
      }
    });

    // Calculate goal progress
    const now = new Date();
    const totalDays = (GOAL_END.getTime() - GOAL_START.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = Math.max(0, (now.getTime() - GOAL_START.getTime()) / (1000 * 60 * 60 * 24));
    const progressPercent = (elapsedDays / totalDays) * 100;
    const revenuePercent = (totalRevenueCents / REVENUE_GOAL_CENTS) * 100;

    // Expected revenue at this point
    const expectedRevenueCents = (elapsedDays / totalDays) * REVENUE_GOAL_CENTS;
    const onTrack = totalRevenueCents >= expectedRevenueCents;

    // Get last 12 months revenue trend
    const { data: monthlyTrend } = await supabase
      .from('ff_revenue')
      .select('amount_cents, created_at')
      .eq('status', 'succeeded')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    // Group by month
    const trendByMonth: Record<string, number> = {};
    monthlyTrend?.forEach(r => {
      const month = new Date(r.created_at).toISOString().slice(0, 7); // YYYY-MM
      trendByMonth[month] = (trendByMonth[month] || 0) + r.amount_cents;
    });

    // Calculate ARR (Annual Recurring Revenue) from MRR
    const arr = mrr * 12;

    // Calculate years to goal at current ARR
    const remainingGoal = REVENUE_GOAL_CENTS - totalRevenueCents;
    const yearsToGoal = arr > 0 ? remainingGoal / arr / 100 : Infinity;

    return NextResponse.json({
      success: true,
      data: {
        // Goal tracking
        goal: {
          target: REVENUE_GOAL_CENTS / 100, // $100M
          current: totalRevenueCents / 100,
          percent: revenuePercent,
          timeElapsedPercent: progressPercent,
          onTrack,
          yearsRemaining: Math.max(0, (GOAL_END.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365)),
          projectedYearsToGoal: yearsToGoal === Infinity ? null : yearsToGoal
        },

        // Current metrics
        metrics: {
          totalRevenue: totalRevenueCents / 100,
          monthlyRevenue: monthlyRevenueCents / 100,
          mrr: mrr / 100,
          arr: arr / 100,
          activeSubscriptions: activeSubscriptions || 0
        },

        // Membership breakdown
        memberships: {
          elevated: tierBreakdown.elevated,
          sovereign: tierBreakdown.sovereign,
          total: (tierBreakdown.elevated + tierBreakdown.sovereign)
        },

        // This month's activity
        thisMonth: {
          revenue: monthlyRevenueCents / 100,
          subscriptionPayments: monthlySubscriptions,
          oneTimePayments: monthlyOneTime
        },

        // Revenue trend (last 12 months)
        trend: Object.entries(trendByMonth).map(([month, cents]) => ({
          month,
          revenue: cents / 100
        })),

        // Timestamp
        asOf: now.toISOString()
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Revenue API] Error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
