/**
 * C-Suite Communication API
 * Enables bots to send messages to each other like real executives
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const body = await request.json();
    const {
      from_bot,
      to_bot,
      to_bots,
      subject,
      message,
      message_type,
      priority = 'normal',
      related_goal_id,
      related_entity_type,
      related_entity_id,
      requires_response = false,
      response_deadline,
      metadata
    } = body;

    if (!from_bot || !message || !message_type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: from_bot, message, message_type'
      }, { status: 400 });
    }

    // Insert the communication
    const { data: comm, error } = await supabase
      .from('ff_bot_communications')
      .insert({
        from_bot,
        to_bot,
        to_bots,
        subject,
        message,
        message_type,
        priority,
        related_goal_id,
        related_entity_type,
        related_entity_id,
        requires_response,
        response_deadline,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    // Log for debugging
    console.log(`[C-Suite] ${from_bot} → ${to_bot || 'ALL'}: ${subject || message.substring(0, 50)}...`);

    return NextResponse.json({
      success: true,
      data: comm
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[C-Suite Communication] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Get messages for a specific bot
export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const bot = searchParams.get('bot');
    const unread_only = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('ff_bot_communications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (bot) {
      // Get messages TO this bot or broadcast messages
      query = query.or(`to_bot.eq.${bot},to_bot.is.null,to_bots.cs.{${bot}}`);
    }

    if (unread_only) {
      query = query.is('read_at', null);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
