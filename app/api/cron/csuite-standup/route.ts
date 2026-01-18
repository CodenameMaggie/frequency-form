/**
 * Daily C-Suite Standup Cron
 * Runs every morning to coordinate the bot team
 *
 * Call: POST /api/cron/csuite-standup?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { sendBotMessage, broadcastMessage } from '@/lib/mfs-bot-comms';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabase();
    const now = new Date();

    console.log('[C-Suite Standup] Starting daily standup...');

    // 1. Get current revenue status
    const { data: revenue } = await supabase
      .from('ff_revenue')
      .select('amount_cents, type, created_at')
      .eq('status', 'succeeded');

    const totalRevenue = (revenue?.reduce((sum, r) => sum + (r.amount_cents || 0), 0) || 0) / 100;

    // Yesterday's revenue
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayRevenue = (revenue?.filter(r => {
      const d = new Date(r.created_at);
      return d >= yesterday && d < now;
    }).reduce((sum, r) => sum + (r.amount_cents || 0), 0) || 0) / 100;

    // 2. Get membership stats
    const { count: activeMembers } = await supabase
      .from('ff_user_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null);

    // 3. Get partner stats
    const { data: partners } = await supabase
      .from('ff_partners')
      .select('status');

    const partnerStats = {
      total: partners?.length || 0,
      active: partners?.filter(p => p.status === 'active').length || 0,
      negotiating: partners?.filter(p => p.status === 'negotiating').length || 0
    };

    // 4. Calculate goal progress
    const goalTarget = 100_000_000;
    const goalStart = new Date('2025-01-01');
    const goalEnd = new Date('2030-01-01');
    const totalDays = (goalEnd.getTime() - goalStart.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = Math.max(0, (now.getTime() - goalStart.getTime()) / (1000 * 60 * 60 * 24));
    const expectedRevenue = (elapsedDays / totalDays) * goalTarget;
    const goalProgress = ((totalRevenue / goalTarget) * 100).toFixed(4);
    const onTrack = totalRevenue >= expectedRevenue;

    // 5. Create meeting record
    const { data: meeting } = await supabase
      .from('ff_csuite_meetings')
      .insert({
        meeting_type: 'daily_standup',
        title: `Daily Standup - ${now.toLocaleDateString()}`,
        attendees: ['atlas', 'dave', 'maggie', 'jordan', 'annie'],
        facilitator: 'atlas',
        scheduled_for: now.toISOString(),
        started_at: now.toISOString(),
        ended_at: now.toISOString(),
        status: 'completed',
        discussion_notes: generateStandupNotes({
          totalRevenue,
          yesterdayRevenue,
          activeMembers: activeMembers || 0,
          partnerStats,
          goalProgress,
          onTrack,
          expectedRevenue
        }),
        decisions_made: [],
        action_items: generateDailyActions({
          totalRevenue,
          activeMembers: activeMembers || 0,
          partnerStats
        })
      })
      .select()
      .single();

    // 6. Dave sends revenue update to Atlas (via MFS unified bot-comms)
    await sendBotMessage('dave', 'atlas', {
      type: 'report',
      subject: `Daily Revenue Report - ${now.toLocaleDateString()}`,
      body: `Morning Atlas,

Revenue Status:
- Total Revenue: $${totalRevenue.toLocaleString()}
- Yesterday: $${yesterdayRevenue.toLocaleString()}
- Goal Progress: ${goalProgress}%
- Status: ${onTrack ? '✅ On Track' : '⚠️ Behind Schedule'}

Active Subscriptions: ${activeMembers || 0}

${totalRevenue === 0 ? '🚨 ALERT: We are still at $0 revenue. Prioritizing membership acquisition.' : ''}

Ready for today's priorities.

- Dave`,
      data: { totalRevenue, yesterdayRevenue, activeMembers, goalProgress, meeting_id: meeting?.id }
    }, { channel: 'REVENUE', priority: totalRevenue === 0 ? 'HIGH' : 'NORMAL' });

    // Also log locally
    await supabase.from('ff_bot_communications').insert({
      from_bot: 'dave',
      to_bot: 'atlas',
      subject: `Daily Revenue Report - ${now.toLocaleDateString()}`,
      message: `Revenue: $${totalRevenue.toLocaleString()}, Progress: ${goalProgress}%`,
      message_type: 'report',
      priority: totalRevenue === 0 ? 'high' : 'normal'
    });

    // 7. Atlas broadcasts daily priorities (via MFS unified bot-comms)
    const dailyPriorities = totalRevenue === 0 ? `
🎯 PRIORITY: First Revenue
- Henry: Close any warm leads, push partner deals
- Dan: Accelerate outreach, generate qualified leads for Henry
- Maggie: Engage community, drive membership interest
- Annie: Ensure any interested prospects get immediate attention
` : `
- Dave: Continue monitoring revenue streams
- Henry: Progress on sales pipeline
- Everyone: Maintain momentum
`;

    await broadcastMessage('atlas', {
      type: 'update',
      subject: `Daily Priorities - ${now.toLocaleDateString()}`,
      body: `Team,

Today we are ${elapsedDays.toFixed(0)} days into our 5-year journey to $100M.

Current Status:
- Revenue: $${totalRevenue.toLocaleString()} (${goalProgress}% of goal)
- ${onTrack ? 'We are on track.' : 'We are behind schedule. Let\'s focus.'}

Today's Focus:
${dailyPriorities}

Let's make today count.

- Atlas`,
      data: { meeting_id: meeting?.id, elapsed_days: elapsedDays, revenue: totalRevenue, goal_progress: goalProgress }
    }, { channel: 'CSUITE', priority: 'NORMAL' });

    // Also log locally
    await supabase.from('ff_bot_communications').insert({
      from_bot: 'atlas',
      to_bot: null,
      subject: `Daily Priorities - ${now.toLocaleDateString()}`,
      message: `Day ${elapsedDays.toFixed(0)}: Revenue $${totalRevenue.toLocaleString()} (${goalProgress}%)`,
      message_type: 'update',
      priority: 'normal'
    });

    // 8. If revenue is $0, send urgent messages to sales team
    if (totalRevenue === 0) {
      // Atlas escalates to Dave
      await supabase.from('ff_bot_communications').insert({
        from_bot: 'atlas',
        to_bot: 'dave',
        subject: '🚨 Revenue Priority - Need Sales Update',
        message: `Dave,

We are ${elapsedDays.toFixed(0)} days into Year 1 with $0 revenue. I need a status update from Henry on the sales pipeline.

Please coordinate with Henry and report back with:
1. Current pipeline status
2. Nearest deals to closing
3. What blockers exist

- Atlas`,
        message_type: 'request',
        priority: 'urgent',
        requires_response: true
      });

      // Dave delegates to Henry
      await supabase.from('ff_bot_communications').insert({
        from_bot: 'dave',
        to_bot: 'henry',
        subject: '🚨 Sales Pipeline Status Needed - Urgent',
        message: `Henry,

Atlas is asking for an urgent sales update. We're at $0 revenue and need to show progress.

I need from you by end of day:
1. Review all leads in the pipeline
2. Identify the 3 most likely to convert this week
3. What do you need from Dan to accelerate?

The whole team is counting on sales. Let me know what support you need.

- Dave`,
        message_type: 'request',
        priority: 'urgent',
        requires_response: true
      });

      // Henry tasks Dan
      await supabase.from('ff_bot_communications').insert({
        from_bot: 'henry',
        to_bot: 'dan',
        subject: 'Outreach Push - Need More Qualified Leads',
        message: `Dan,

We need to accelerate. I need you to:
1. Double outreach volume today
2. Follow up on all warm leads immediately
3. Report back with any prospects showing interest

Let's close something this week.

- Henry`,
        message_type: 'request',
        priority: 'high',
        requires_response: true
      });
    }

    console.log('[C-Suite Standup] Completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        meeting_id: meeting?.id,
        revenue: {
          total: totalRevenue,
          yesterday: yesterdayRevenue,
          goal_progress: goalProgress,
          on_track: onTrack
        },
        memberships: activeMembers || 0,
        partners: partnerStats
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[C-Suite Standup] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

function generateStandupNotes(data: {
  totalRevenue: number;
  yesterdayRevenue: number;
  activeMembers: number;
  partnerStats: { total: number; active: number; negotiating: number };
  goalProgress: string;
  onTrack: boolean;
  expectedRevenue: number;
}): string {
  return `## Daily C-Suite Standup

### Revenue (Dave)
- Total: $${data.totalRevenue.toLocaleString()}
- Yesterday: $${data.yesterdayRevenue.toLocaleString()}
- Goal Progress: ${data.goalProgress}%
- Expected at this point: $${data.expectedRevenue.toLocaleString()}
- Status: ${data.onTrack ? '✅ On Track' : '⚠️ Behind'}

### Memberships (Dave)
- Active Subscribers: ${data.activeMembers}

### Partners (Jordan/Maggie)
- Total: ${data.partnerStats.total}
- Active: ${data.partnerStats.active}
- In Negotiation: ${data.partnerStats.negotiating}

### Priority
${data.totalRevenue === 0 ? '🚨 CRITICAL: Achieve first revenue' : 'Continue steady execution'}`;
}

function generateDailyActions(data: {
  totalRevenue: number;
  activeMembers: number;
  partnerStats: { active: number; negotiating: number };
}): object[] {
  const actions: object[] = [];

  if (data.totalRevenue === 0) {
    actions.push({
      action: 'Identify and pursue 3 highest-probability leads',
      assignee: 'maggie',
      priority: 'urgent'
    });
    actions.push({
      action: 'Push membership acquisition content',
      assignee: 'dan',
      priority: 'high'
    });
  }

  if (data.partnerStats.negotiating > 0) {
    actions.push({
      action: `Follow up with ${data.partnerStats.negotiating} partners in negotiation`,
      assignee: 'maggie',
      priority: 'high'
    });
  }

  actions.push({
    action: 'Monitor and report any revenue changes',
    assignee: 'dave',
    priority: 'normal'
  });

  return actions;
}

// Allow GET to check status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabase();

  // Get last standup
  const { data: lastMeeting } = await supabase
    .from('ff_csuite_meetings')
    .select('*')
    .eq('meeting_type', 'daily_standup')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get unread communications count per bot
  const bots = ['atlas', 'dave', 'maggie', 'jordan', 'annie', 'henry', 'dan'];
  const unreadCounts: Record<string, number> = {};

  for (const bot of bots) {
    const { count } = await supabase
      .from('ff_bot_communications')
      .select('*', { count: 'exact', head: true })
      .or(`to_bot.eq.${bot},to_bot.is.null`)
      .is('read_at', null);
    unreadCounts[bot] = count || 0;
  }

  return NextResponse.json({
    success: true,
    data: {
      last_standup: lastMeeting?.created_at || 'Never',
      unread_communications: unreadCounts
    }
  });
}
