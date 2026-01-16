/**
 * Internal Cron Scheduler for Frequency & Form
 * Runs automatically on server start - no external dependencies
 * Failsafe: runs on Railway, Vercel, or any Node.js server
 */

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : 'http://localhost:3000';

interface CronJob {
  name: string;
  endpoint: string;
  schedule: {
    hour?: number;
    minute?: number;
    intervalMinutes?: number;
  };
  lastRun?: Date;
  enabled: boolean;
}

const CRON_JOBS: CronJob[] = [
  {
    name: 'Henry Partner Discovery',
    endpoint: '/api/bots/henry-partner-discovery',
    schedule: { hour: 6, minute: 0 },
    enabled: true
  },
  {
    name: 'Dan Partner Outreach',
    endpoint: '/api/bots/dan-partner-outreach',
    schedule: { hour: 10, minute: 0 },
    enabled: true
  },
  {
    name: 'Dan Partner Follow-up',
    endpoint: '/api/bots/dan-partner-followup',
    schedule: { hour: 14, minute: 0 },
    enabled: true
  },
  {
    name: 'Email Queue Processor',
    endpoint: '/api/email-queue-processor',
    schedule: { intervalMinutes: 5 },
    enabled: true
  }
];

class CronScheduler {
  private jobs: CronJob[] = [];
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;

  constructor() {
    this.jobs = CRON_JOBS;
  }

  async executeJob(job: CronJob): Promise<void> {
    const url = `${BASE_URL}${job.endpoint}?secret=${CRON_SECRET}`;

    try {
      console.log(`[Cron] Executing: ${job.name}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      job.lastRun = new Date();

      if (response.ok) {
        console.log(`[Cron] ✅ ${job.name} completed:`, data.data || data.message || 'success');
      } else {
        console.error(`[Cron] ❌ ${job.name} failed:`, data.error || response.status);
      }
    } catch (error) {
      console.error(`[Cron] ❌ ${job.name} error:`, error);
    }
  }

  shouldRunDaily(job: CronJob): boolean {
    if (job.schedule.hour === undefined) return false;

    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Check if it's the right time (within 1 minute window)
    if (currentHour !== job.schedule.hour) return false;
    if (Math.abs(currentMinute - (job.schedule.minute || 0)) > 1) return false;

    // Check if already run today
    if (job.lastRun) {
      const lastRunDate = job.lastRun.toDateString();
      const todayDate = now.toDateString();
      if (lastRunDate === todayDate) return false;
    }

    return true;
  }

  shouldRunInterval(job: CronJob): boolean {
    if (!job.schedule.intervalMinutes) return false;

    if (!job.lastRun) return true;

    const now = new Date();
    const minutesSinceLastRun = (now.getTime() - job.lastRun.getTime()) / (1000 * 60);

    return minutesSinceLastRun >= job.schedule.intervalMinutes;
  }

  async checkAndRunJobs(): Promise<void> {
    for (const job of this.jobs) {
      if (!job.enabled) continue;

      const shouldRun = job.schedule.intervalMinutes
        ? this.shouldRunInterval(job)
        : this.shouldRunDaily(job);

      if (shouldRun) {
        await this.executeJob(job);
      }
    }
  }

  start(): void {
    if (this.isRunning) {
      console.log('[Cron] Scheduler already running');
      return;
    }

    console.log('[Cron] Starting scheduler...');
    console.log(`[Cron] Base URL: ${BASE_URL}`);
    console.log('[Cron] Jobs configured:');
    this.jobs.forEach(job => {
      const schedule = job.schedule.intervalMinutes
        ? `every ${job.schedule.intervalMinutes} minutes`
        : `daily at ${job.schedule.hour}:${String(job.schedule.minute || 0).padStart(2, '0')} UTC`;
      console.log(`  - ${job.name}: ${schedule}`);
    });

    // Check every minute
    const interval = setInterval(() => {
      this.checkAndRunJobs();
    }, 60 * 1000);

    this.intervals.push(interval);
    this.isRunning = true;

    // Run initial check after 10 seconds (let server fully start)
    setTimeout(() => {
      console.log('[Cron] Running initial job check...');
      this.checkAndRunJobs();
    }, 10000);

    console.log('[Cron] ✅ Scheduler started');
  }

  stop(): void {
    console.log('[Cron] Stopping scheduler...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
    console.log('[Cron] ✅ Scheduler stopped');
  }

  getStatus(): { isRunning: boolean; jobs: CronJob[] } {
    return {
      isRunning: this.isRunning,
      jobs: this.jobs.map(j => ({
        ...j,
        lastRun: j.lastRun
      }))
    };
  }
}

// Singleton instance
let scheduler: CronScheduler | null = null;

export function getScheduler(): CronScheduler {
  if (!scheduler) {
    scheduler = new CronScheduler();
  }
  return scheduler;
}

export function startCronScheduler(): void {
  const s = getScheduler();
  s.start();
}

export function stopCronScheduler(): void {
  if (scheduler) {
    scheduler.stop();
  }
}

export function getCronStatus() {
  return getScheduler().getStatus();
}
