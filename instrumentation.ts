/**
 * Next.js Instrumentation - Server Startup Hook
 * This file runs automatically when the server starts
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server (not during build or on client)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCronScheduler } = await import('./lib/cron-scheduler');

    // Start the internal cron scheduler
    console.log('[Instrumentation] Starting F&F internal cron scheduler...');
    startCronScheduler();
  }
}
