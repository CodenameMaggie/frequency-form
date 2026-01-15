import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') !== process.env.FORBES_COMMAND_CRON) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[Social Post Publisher] Running...');
  return NextResponse.json({ success: true, data: { posts_published: 0 } });
}
