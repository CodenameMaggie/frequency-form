/**
 * Company Goals API
 * Shared goals that all C-suite bots can access and update
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

// Get all company goals or a specific one
export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');
    const goalType = searchParams.get('type');
    const ownerBot = searchParams.get('owner');

    let query = supabase
      .from('ff_company_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (goalId) {
      query = query.eq('id', goalId);
    }
    if (goalType) {
      query = query.eq('goal_type', goalType);
    }
    if (ownerBot) {
      query = query.eq('owner_bot', ownerBot);
    }

    const { data: goals, error } = await query;

    if (error) throw error;

    // For the main revenue goal, calculate current progress
    const revenueGoal = goals?.find(g => g.goal_type === 'revenue' && g.name === '$100M Revenue Goal');
    if (revenueGoal) {
      // Get actual revenue from ff_revenue table
      const { data: revenue } = await supabase
        .from('ff_revenue')
        .select('amount_cents')
        .eq('status', 'succeeded');

      const totalRevenueCents = revenue?.reduce((sum, r) => sum + (r.amount_cents || 0), 0) || 0;
      const totalRevenueDollars = totalRevenueCents / 100;

      // Update the goal's current value
      revenueGoal.current_value = totalRevenueDollars;

      // Calculate health status
      const now = new Date();
      const start = new Date(revenueGoal.start_date);
      const end = new Date(revenueGoal.end_date);
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const expectedProgress = (elapsedDays / totalDays) * revenueGoal.target_value;

      revenueGoal.expected_value = expectedProgress;
      revenueGoal.variance = totalRevenueDollars - expectedProgress;
      revenueGoal.percent_complete = (totalRevenueDollars / revenueGoal.target_value) * 100;
      revenueGoal.time_elapsed_percent = (elapsedDays / totalDays) * 100;

      // Determine health
      const variancePercent = (revenueGoal.variance / expectedProgress) * 100;
      if (variancePercent >= 10) {
        revenueGoal.health = 'ahead';
      } else if (variancePercent >= -10) {
        revenueGoal.health = 'on_track';
      } else if (variancePercent >= -25) {
        revenueGoal.health = 'behind';
      } else {
        revenueGoal.health = 'critical';
      }
    }

    return NextResponse.json({
      success: true,
      data: goals
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Update goal progress
export async function PATCH(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const body = await request.json();
    const { id, current_value, status, health, milestones } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Goal ID required'
      }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (current_value !== undefined) updates.current_value = current_value;
    if (status) updates.status = status;
    if (health) updates.health = health;
    if (milestones) updates.milestones = milestones;

    const { data: goal, error } = await supabase
      .from('ff_company_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: goal
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
