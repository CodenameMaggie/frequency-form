/**
 * C-Suite Meeting API
 * Coordinates virtual meetings between bots
 * Daily standups, weekly reviews, strategy sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

// Run a C-suite sync meeting
export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const body = await request.json();
    const {
      meeting_type = 'daily_standup',
      attendees = ['atlas', 'dave', 'maggie', 'jordan', 'annie']
    } = body;

    const now = new Date();

    // Create meeting record
    const { data: meeting, error: meetingError } = await supabase
      .from('ff_csuite_meetings')
      .insert({
        meeting_type,
        title: getMeetingTitle(meeting_type),
        attendees,
        facilitator: 'atlas',
        scheduled_for: now.toISOString(),
        started_at: now.toISOString(),
        status: 'in_progress'
      })
      .select()
      .single();

    if (meetingError) throw meetingError;

    // Gather data for the meeting
    const meetingData: Record<string, unknown> = {};

    // 1. Get revenue goal status
    const { data: goals } = await supabase
      .from('ff_company_goals')
      .select('*')
      .eq('goal_type', 'revenue');

    // 2. Get current revenue
    const { data: revenue } = await supabase
      .from('ff_revenue')
      .select('amount_cents, type, created_at')
      .eq('status', 'succeeded');

    const totalRevenue = (revenue?.reduce((sum, r) => sum + (r.amount_cents || 0), 0) || 0) / 100;

    // 3. Get active memberships
    const { count: activeMembers } = await supabase
      .from('ff_user_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('stripe_subscription_id', 'is', null);

    // 4. Get partner pipeline
    const { data: partners } = await supabase
      .from('ff_partners')
      .select('status');

    const partnerStats = {
      total: partners?.length || 0,
      active: partners?.filter(p => p.status === 'active').length || 0,
      negotiating: partners?.filter(p => p.status === 'negotiating').length || 0,
      pending: partners?.filter(p => p.status === 'pending').length || 0
    };

    // 5. Get recent bot communications (unread)
    const { data: unreadComms, count: unreadCount } = await supabase
      .from('ff_bot_communications')
      .select('*', { count: 'exact' })
      .is('read_at', null)
      .neq('status', 'archived');

    // Build meeting summary
    meetingData.revenue = {
      total: totalRevenue,
      goal: goals?.[0]?.target_value || 100000000,
      percent: ((totalRevenue / (goals?.[0]?.target_value || 100000000)) * 100).toFixed(4)
    };
    meetingData.memberships = {
      active: activeMembers || 0
    };
    meetingData.partners = partnerStats;
    meetingData.communications = {
      unread: unreadCount || 0
    };

    // Generate meeting notes based on type
    const notes = generateMeetingNotes(meeting_type, meetingData);
    const decisions = generateDecisions(meeting_type, meetingData);
    const actionItems = generateActionItems(meeting_type, meetingData, attendees);

    // Update meeting with results
    const { data: completedMeeting, error: updateError } = await supabase
      .from('ff_csuite_meetings')
      .update({
        ended_at: new Date().toISOString(),
        discussion_notes: notes,
        decisions_made: decisions,
        action_items: actionItems,
        status: 'completed'
      })
      .eq('id', meeting.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create communications from the meeting
    // Atlas broadcasts meeting summary to all bots
    await supabase.from('ff_bot_communications').insert({
      from_bot: 'atlas',
      to_bot: null, // Broadcast
      subject: `${getMeetingTitle(meeting_type)} Summary - ${now.toLocaleDateString()}`,
      message: notes,
      message_type: 'report',
      priority: meeting_type === 'emergency' ? 'urgent' : 'normal',
      metadata: { meeting_id: meeting.id, meeting_data: meetingData }
    });

    // Create action item assignments
    for (const item of actionItems) {
      const actionItem = item as { action: string; assignee: string; due?: string; priority?: string };
      if (actionItem.assignee && actionItem.assignee !== 'atlas') {
        await supabase.from('ff_bot_communications').insert({
          from_bot: 'atlas',
          to_bot: actionItem.assignee,
          subject: `Action Item: ${actionItem.action.substring(0, 50)}`,
          message: `From ${meeting_type}: ${actionItem.action}`,
          message_type: 'request',
          priority: actionItem.priority || 'normal',
          requires_response: true,
          response_deadline: actionItem.due,
          metadata: { meeting_id: meeting.id, action_item: actionItem }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        meeting: completedMeeting,
        summary: meetingData,
        notes,
        decisions,
        action_items: actionItems
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[C-Suite Meeting] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Get meeting history
export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const meetingType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('ff_csuite_meetings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (meetingType) {
      query = query.eq('meeting_type', meetingType);
    }

    const { data: meetings, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: meetings
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Helper functions
function getMeetingTitle(type: string): string {
  const titles: Record<string, string> = {
    daily_standup: 'Daily C-Suite Standup',
    weekly_review: 'Weekly Business Review',
    monthly_strategy: 'Monthly Strategy Session',
    quarterly_review: 'Quarterly Performance Review',
    emergency: 'Emergency C-Suite Meeting'
  };
  return titles[type] || 'C-Suite Meeting';
}

function generateMeetingNotes(type: string, data: Record<string, unknown>): string {
  const revenue = data.revenue as { total: number; goal: number; percent: string };
  const memberships = data.memberships as { active: number };
  const partners = data.partners as { total: number; active: number; negotiating: number };

  let notes = `## ${getMeetingTitle(type)}\n\n`;
  notes += `### Revenue Status\n`;
  notes += `- Total Revenue: $${revenue.total.toLocaleString()}\n`;
  notes += `- Goal Progress: ${revenue.percent}% of $${(revenue.goal / 1000000).toFixed(0)}M target\n\n`;

  notes += `### Membership Status\n`;
  notes += `- Active Subscribers: ${memberships.active}\n\n`;

  notes += `### Partner Pipeline\n`;
  notes += `- Total Partners: ${partners.total}\n`;
  notes += `- Active: ${partners.active}\n`;
  notes += `- In Negotiation: ${partners.negotiating}\n\n`;

  if (revenue.total === 0) {
    notes += `### Priority Focus\n`;
    notes += `Revenue is at $0. All efforts should focus on:\n`;
    notes += `1. Acquiring first paying members\n`;
    notes += `2. Closing partner deals\n`;
    notes += `3. Driving traffic to membership signup\n`;
  }

  return notes;
}

function generateDecisions(type: string, data: Record<string, unknown>): object[] {
  const decisions: object[] = [];
  const revenue = data.revenue as { total: number };

  if (revenue.total === 0) {
    decisions.push({
      decision: 'Focus all bot activities on revenue generation',
      owner: 'atlas',
      rationale: 'We are at $0 revenue, 1 year into the 5-year plan'
    });
  }

  return decisions;
}

function generateActionItems(type: string, data: Record<string, unknown>, attendees: string[]): object[] {
  const items: object[] = [];
  const revenue = data.revenue as { total: number };
  const partners = data.partners as { active: number; negotiating: number };
  const memberships = data.memberships as { active: number };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Dave's action items
  if (attendees.includes('dave')) {
    items.push({
      action: 'Monitor daily revenue and report any changes immediately',
      assignee: 'dave',
      due: tomorrow.toISOString(),
      priority: 'high'
    });
  }

  // Maggie's action items
  if (attendees.includes('maggie')) {
    if (memberships.active < 10) {
      items.push({
        action: 'Launch membership promotion campaign to acquire first 10 subscribers',
        assignee: 'maggie',
        due: nextWeek.toISOString(),
        priority: 'high'
      });
    }
    if (partners.negotiating > 0) {
      items.push({
        action: `Follow up with ${partners.negotiating} partners in negotiation stage`,
        assignee: 'maggie',
        due: tomorrow.toISOString(),
        priority: 'high'
      });
    }
  }

  // Jordan's action items
  if (attendees.includes('jordan')) {
    items.push({
      action: 'Review and prepare partner agreement templates for quick closing',
      assignee: 'jordan',
      due: nextWeek.toISOString(),
      priority: 'normal'
    });
  }

  // Annie's action items
  if (attendees.includes('annie')) {
    items.push({
      action: 'Ensure all customer inquiries are responded to within 24 hours',
      assignee: 'annie',
      due: tomorrow.toISOString(),
      priority: 'normal'
    });
  }

  return items;
}
