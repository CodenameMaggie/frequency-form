/**
 * Master Cron Scheduler
 * Single endpoint that triggers all bot jobs on schedule
 *
 * Call: POST /api/cron/master-scheduler?secret=YOUR_CRON_SECRET
 *
 * This should be called every hour by Railway cron.
 * It determines which jobs to run based on the current time.
 */

import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://frequency-form-production.up.railway.app';

interface JobConfig {
  name: string;
  endpoint: string;
  hours: number[]; // Hours (0-23) when this job should run
  days?: number[]; // Days of week (0=Sun, 1=Mon, etc). If not set, runs every day
  enabled: boolean;
}

const SCHEDULED_JOBS: JobConfig[] = [
  // =====================================================
  // DAILY MORNING JOBS (6-9 AM)
  // =====================================================
  {
    name: 'C-Suite Daily Standup',
    endpoint: '/api/cron/csuite-standup',
    hours: [6],
    enabled: true
  },
  {
    name: 'Dan Pinterest Morning Post',
    endpoint: '/api/bots/dan-pinterest-poster',
    hours: [7],
    enabled: true
  },
  {
    name: 'Annie Auto Onboarding',
    endpoint: '/api/bots/annie-auto-onboarding',
    hours: [8],
    enabled: true
  },
  {
    name: 'Dan Partner Outreach',
    endpoint: '/api/bots/dan-partner-outreach',
    hours: [9],
    enabled: true
  },
  {
    name: 'Dan Wholesale Outreach',
    endpoint: '/api/bots/dan-wholesale-outreach',
    hours: [9],
    enabled: true
  },

  // =====================================================
  // MIDDAY JOBS (12-2 PM)
  // =====================================================
  {
    name: 'Dan Pinterest Midday Post',
    endpoint: '/api/bots/dan-pinterest-poster',
    hours: [12],
    enabled: true
  },
  {
    name: 'Dan Partner Followup',
    endpoint: '/api/bots/dan-partner-followup',
    hours: [14],
    enabled: true
  },
  {
    name: 'Deal Pipeline Processor',
    endpoint: '/api/deal-pipeline-processor',
    hours: [14],
    enabled: true
  },

  // =====================================================
  // AFTERNOON JOBS (4-6 PM)
  // =====================================================
  {
    name: 'Email Queue Processor',
    endpoint: '/api/email-queue-processor',
    hours: [16],
    enabled: true
  },
  {
    name: 'Dan Pinterest Evening Post',
    endpoint: '/api/bots/dan-pinterest-poster',
    hours: [18],
    enabled: true
  },
  {
    name: 'Social Post Publisher',
    endpoint: '/api/social-post-publisher',
    hours: [18],
    enabled: true
  },

  // =====================================================
  // WEEKLY JOBS
  // =====================================================
  {
    name: 'Henry Partner Discovery',
    endpoint: '/api/bots/henry-partner-discovery',
    hours: [10],
    days: [1, 3, 5], // Mon, Wed, Fri
    enabled: true
  },
  {
    name: 'Dan Lead Generator',
    endpoint: '/api/bots/dan-lead-generator',
    hours: [11],
    days: [2, 4], // Tue, Thu
    enabled: true
  },
  {
    name: 'Dan Contact Form Outreach',
    endpoint: '/api/bots/dan-contact-form-outreach',
    hours: [11],
    days: [1, 3, 5], // Mon, Wed, Fri - after Henry discovers new partners
    enabled: true
  },
  {
    name: 'Weekly C-Suite Review',
    endpoint: '/api/csuite/meeting',
    hours: [9],
    days: [1], // Monday
    enabled: true
  }
];

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay();

    console.log(`[Master Scheduler] Running at hour ${currentHour}, day ${currentDay}`);

    const results: Record<string, { success: boolean; message: string }> = {};
    const jobsToRun = SCHEDULED_JOBS.filter(job => {
      if (!job.enabled) return false;
      if (!job.hours.includes(currentHour)) return false;
      if (job.days && !job.days.includes(currentDay)) return false;
      return true;
    });

    console.log(`[Master Scheduler] ${jobsToRun.length} jobs to run this hour`);

    for (const job of jobsToRun) {
      try {
        console.log(`[Master Scheduler] Running: ${job.name}`);

        const url = `${BASE_URL}${job.endpoint}?secret=${CRON_SECRET}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json().catch(() => ({}));

        results[job.name] = {
          success: response.ok,
          message: response.ok ? 'Completed' : `Failed: ${data.error || response.status}`
        };

        console.log(`[Master Scheduler] ${job.name}: ${response.ok ? 'OK' : 'FAILED'}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results[job.name] = { success: false, message: errorMessage };
        console.error(`[Master Scheduler] ${job.name} error:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hour: currentHour,
        day: currentDay,
        jobs_run: jobsToRun.length,
        results
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Master Scheduler] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// GET shows the schedule
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const schedule = SCHEDULED_JOBS.map(job => ({
    name: job.name,
    endpoint: job.endpoint,
    schedule: {
      hours: job.hours.map(h => `${h}:00 UTC`),
      days: job.days ? job.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]) : 'Daily'
    },
    enabled: job.enabled
  }));

  return NextResponse.json({
    success: true,
    data: {
      timezone: 'UTC',
      jobs: schedule
    }
  });
}
