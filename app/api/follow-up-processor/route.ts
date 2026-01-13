import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[Follow-up Processor] Running...');
  return NextResponse.json({ success: true, data: { followups_sent: 0 } });
}
