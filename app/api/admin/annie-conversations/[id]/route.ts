import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // F&F tenant

/**
 * PATCH /api/admin/annie-conversations/[id]
 * Update conversation (mark resolved, add notes, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createAdminSupabase();
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, resolution_notes, tags } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes;
    if (tags) updates.tags = tags;

    const { data, error } = await supabase
      .from('annie_conversations')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', TENANT_ID)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      conversation: data,
    });

  } catch (error: any) {
    console.error('[Admin] Error updating conversation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
