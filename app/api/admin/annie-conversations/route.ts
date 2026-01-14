import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // F&F tenant

/**
 * GET /api/admin/annie-conversations
 * List all Annie conversations with last message preview
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminSupabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build query
    let query = supabase
      .from('annie_conversations')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('last_message_at', { ascending: false });

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: conversations, error } = await query;

    if (error) throw error;

    // Get last message for each conversation
    const conversationsWithPreview = await Promise.all(
      (conversations as any[]).map(async (conv: any) => {
        // Get message count
        const { count } = await supabase
          .from('annie_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        // Get last message
        const { data: lastMsg } = await supabase
          .from('annie_messages')
          .select('message')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get customer profile if available
        const { data: profile } = await supabase
          .from('annie_customer_profiles')
          .select('name, email')
          .eq('tenant_id', TENANT_ID)
          .eq('visitor_id', conv.visitor_id)
          .single();

        return {
          ...conv,
          message_count: count || 0,
          last_message_preview: (lastMsg as any)?.message || 'No messages',
          customer_name: (profile as any)?.name || null,
          customer_email: (profile as any)?.email || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithPreview,
    });

  } catch (error: any) {
    console.error('[Admin] Error loading conversations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
