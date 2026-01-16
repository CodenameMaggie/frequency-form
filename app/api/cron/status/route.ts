import { NextRequest, NextResponse } from 'next/server';
import { getCronStatus } from '@/lib/cron-scheduler';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = getCronStatus();

  return NextResponse.json({
    success: true,
    data: {
      isRunning: status.isRunning,
      jobs: status.jobs.map(job => ({
        name: job.name,
        endpoint: job.endpoint,
        schedule: job.schedule,
        lastRun: job.lastRun ? job.lastRun.toISOString() : null,
        enabled: job.enabled
      })),
      serverTime: new Date().toISOString(),
      timezone: 'UTC'
    }
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { startCronScheduler, stopCronScheduler, getScheduler } = await import('@/lib/cron-scheduler');

  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'start') {
      startCronScheduler();
      return NextResponse.json({ success: true, message: 'Cron scheduler started' });
    } else if (action === 'stop') {
      stopCronScheduler();
      return NextResponse.json({ success: true, message: 'Cron scheduler stopped' });
    } else if (action === 'run-now') {
      const scheduler = getScheduler();
      await scheduler.checkAndRunJobs();
      return NextResponse.json({ success: true, message: 'Jobs checked and run' });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use: start, stop, or run-now' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
