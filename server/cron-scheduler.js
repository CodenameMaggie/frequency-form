/**
 * Bot Automation Cron Scheduler
 * Runs all bot progressive operation tasks on schedule
 */

const cron = require('node-cron');
const axios = require('axios');

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : 'http://localhost:3000';

console.log('[Cron Scheduler] Initializing bot automation cron jobs...');
console.log('[Cron Scheduler] Base URL:', BASE_URL);

/**
 * Call a bot automation endpoint
 */
async function callEndpoint(path, description) {
  try {
    const url = `${BASE_URL}${path}?secret=${CRON_SECRET}&triggered_by=cron`;
    console.log(`[Cron] ${description} - Starting...`);

    const response = await axios.post(url, {}, {
      timeout: 120000, // 2 minute timeout for AI operations
      headers: {
        'Content-Type': 'application/json',
        'X-Vercel-Cron-Secret': CRON_SECRET
      }
    });

    console.log(`[Cron] ${description} - ✅ Success:`, response.data.success ? 'Completed' : 'Partial');

    if (response.data.data) {
      // Log summary of what was done
      const data = response.data.data;
      if (data.goals_tracked) console.log(`  → Tracked ${data.goals_tracked} goals`);
      if (data.leads_discovered) console.log(`  → Discovered ${data.leads_discovered} leads`);
      if (data.leads_added) console.log(`  → Added ${data.leads_added} new leads`);
      if (data.emails_sent) console.log(`  → Sent ${data.emails_sent} emails`);
      if (data.proposals_sent) console.log(`  → Sent ${data.proposals_sent} proposals`);
      if (data.goals) console.log(`  → Set ${data.goals.length} goals`);
    }

    return response.data;
  } catch (error) {
    console.error(`[Cron] ${description} - ❌ Error:`, error.response?.data?.error || error.message);
    if (error.response?.status === 401) {
      console.error('[Cron] ⚠️  CRON_SECRET authentication failed - check environment variable');
    }
    return null;
  }
}

// =====================================================================
// BUSINESS MATCHING SYSTEM (Rule-based, No AI cost)
// =====================================================================

// QUALIFY LEADS - Every 15 Minutes
// Rule-based lead scoring and qualification
cron.schedule('*/15 * * * *', () => {
  console.log('\n[Cron] ⏰ Lead Qualification - 15-minute trigger');
  callEndpoint('/api/qualify-leads', 'Lead Qualification (Rule-based)');
});

// MATCH PRODUCTS TO BUYERS - Every 30 Minutes
// Find best product-buyer matches based on business rules
cron.schedule('*/30 * * * *', () => {
  console.log('\n[Cron] ⏰ Product-Buyer Matching - 30-minute trigger');
  callEndpoint('/api/match-products-to-buyers', 'Product-Buyer Matching (Rule-based)');
});

// MATCH ORDERS TO SUPPLIERS - Every 10 Minutes
// Auto-route orders to best suppliers
cron.schedule('*/10 * * * *', () => {
  console.log('\n[Cron] ⏰ Order-Supplier Matching - 10-minute trigger');
  callEndpoint('/api/match-orders-to-suppliers', 'Order-Supplier Matching (Rule-based)');
});

// =====================================================================
// MAINFRAME SYNC PROCESSOR - Every 10 Minutes
// Syncs bot actions, contacts, and tickets to MFS Suite Command Center
// =====================================================================
cron.schedule('*/10 * * * *', () => {
  console.log('\n[Cron] ⏰ Mainframe Sync Processor - 10-minute trigger');
  callEndpoint('/api/bots/mainframe-sync-processor', 'Mainframe Sync Processor');
});

// =====================================================================
// EMAIL QUEUE PROCESSOR - Every 5 Minutes
// Processes queued emails with retry logic
// =====================================================================
cron.schedule('*/5 * * * *', () => {
  console.log('\n[Cron] ⏰ Email Queue Processor - 5-minute trigger');
  callEndpoint('/api/email-queue-processor', 'Email Queue Processor');
});

// =====================================================================
// DAN FREE SCRAPER - Every 10 Minutes
// Free lead discovery using AI
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('*/10 * * * *', () => {
//   console.log('\n[Cron] ⏰ Dan Free Scraper - 10-minute trigger');
//   callEndpoint('/api/dan-free-scraper', 'Dan Free Scraper');
// });

// =====================================================================
// DAN POPULATE QUEUE - Every 15 Minutes
// Moves new contacts into outreach queue
// =====================================================================
cron.schedule('*/15 * * * *', () => {
  console.log('\n[Cron] ⏰ Dan Populate Queue - 15-minute trigger');
  callEndpoint('/api/dan-populate-queue', 'Dan Populate Queue');
});

// =====================================================================
// DAN SOCIAL LEAD DISCOVERY - Every 30 Minutes
// Discovers leads from LinkedIn and Twitter using AI
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('*/30 * * * *', () => {
//   console.log('\n[Cron] ⏰ Dan Social Lead Discovery - 30-minute trigger');
//   callEndpoint('/api/dan-social-lead-discovery', 'Dan Social Lead Discovery');
// });

// =====================================================================
// CONVERT LEADS TO CONTACTS - Every Hour
// Converts qualified leads to contacts
// =====================================================================
cron.schedule('0 * * * *', () => {
  console.log('\n[Cron] ⏰ Convert Leads to Contacts - Hourly trigger');
  callEndpoint('/api/convert-leads-to-contacts', 'Convert Leads to Contacts');
});

// =====================================================================
// ALEX PROACTIVE MONITOR - Every Hour
// Engineering bot monitoring
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 * * * *', () => {
//   console.log('\n[Cron] ⏰ Alex Proactive Monitor - Hourly trigger');
//   callEndpoint('/api/alex-proactive-monitor', 'Alex Proactive Monitor');
// });

// =====================================================================
// HENRY (Chief of Staff) - Every Hour
// Analyzes business and sets strategic goals
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 * * * *', () => {
//   console.log('\n[Cron] ⏰ Henry Goal Setter - Hourly trigger');
//   callEndpoint('/api/henry-goal-setter', 'Henry Goal Setter');
// });

// =====================================================================
// DAVE (Accountant) - Every 3 Hours
// Tracks financial metrics and updates goal progress
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 */3 * * *', () => {
//   console.log('\n[Cron] ⏰ Dave Goal Tracker - 3-hour trigger');
//   callEndpoint('/api/dave-goal-tracker', 'Dave Goal Tracker');
// });

// =====================================================================
// HENRY TICKET MONITOR - Every 3 Hours
// Monitors support tickets
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 */3 * * *', () => {
//   console.log('\n[Cron] ⏰ Henry Ticket Monitor - 3-hour trigger');
//   callEndpoint('/api/henry-ticket-monitor', 'Henry Ticket Monitor');
// });

// =====================================================================
// DAN (Marketing) - Lead Generator - Every 2 Hours
// Creates marketing strategies and campaigns
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 */2 * * *', () => {
//   console.log('\n[Cron] ⏰ Dan Lead Generator - 2-hour trigger');
//   callEndpoint('/api/dan-lead-generator', 'Dan Lead Generator');
// });

// =====================================================================
// DAN (Marketing) - Auto Outreach - Hourly During Business Hours
// Sends personalized emails to leads automatically (9am-5pm Mon-Fri)
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 9-17 * * 1-5', () => {
//   console.log('\n[Cron] ⏰ Dan Auto Outreach - Hourly (business hours)');
//   callEndpoint('/api/dan-auto-outreach', 'Dan Auto Outreach');
// });

// =====================================================================
// DAN (Marketing) - Auto Social Posts - Daily at 9 AM
// Creates and schedules social media posts for Twitter/LinkedIn/Facebook
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 9 * * *', () => {
//   console.log('\n[Cron] ⏰ Dan Auto Social Posts - Daily 9 AM trigger');
//   callEndpoint('/api/dan-auto-social-posts', 'Dan Auto Social Posts');
// });

// =====================================================================
// SOCIAL POST PUBLISHER - Every 5 Minutes
// Publishes approved posts to social media platforms
// =====================================================================
cron.schedule('*/5 * * * *', () => {
  console.log('\n[Cron] ⏰ Social Post Publisher - 5-minute trigger');
  callEndpoint('/api/social-post-publisher', 'Social Post Publisher');
});

// =====================================================================
// DAVE (Accountant) - Auto Proposal - Every 6 Hours
// Generates and sends proposals to qualified leads
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 */6 * * *', () => {
//   console.log('\n[Cron] ⏰ Dave Auto Proposal - 6-hour trigger');
//   callEndpoint('/api/dave-auto-proposal', 'Dave Auto Proposal');
// });

// =====================================================================
// SYSTEM - Deal Pipeline Processor - Every 30 Minutes
// Moves deals through pipeline stages automatically
// =====================================================================
cron.schedule('*/30 * * * *', () => {
  console.log('\n[Cron] ⏰ Deal Pipeline Processor - 30-minute trigger');
  callEndpoint('/api/deal-pipeline-processor', 'Deal Pipeline Processor');
});

// =====================================================================
// DAN REPLY HANDLER - Every 15 Minutes
// AI classifies email replies and sends automated responses
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('*/15 * * * *', () => {
//   console.log('\n[Cron] ⏰ Dan Reply Handler - 15-minute trigger');
//   callEndpoint('/api/dan-reply-handler', 'Dan Reply Handler');
// });

// =====================================================================
// FOLLOW-UP PROCESSOR - Every 6 Hours
// Processes follow-ups
// =====================================================================
cron.schedule('0 */6 * * *', () => {
  console.log('\n[Cron] ⏰ Follow-up Processor - 6-hour trigger');
  callEndpoint('/api/follow-up-processor', 'Follow-up Processor');
});

// =====================================================================
// SYSTEM - Auto Follow-up Processor - Every 8 Hours
// Sends follow-up emails to prospects
// =====================================================================
cron.schedule('0 */8 * * *', () => {
  console.log('\n[Cron] ⏰ Auto Follow-up Processor - 8-hour trigger');
  callEndpoint('/api/auto-followup-processor', 'Auto Follow-up Processor');
});

// =====================================================================
// ANNIE AUTO ONBOARDING - Every 30 Minutes
// Creates client accounts and sends welcome emails
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('*/30 * * * *', () => {
//   console.log('\n[Cron] ⏰ Annie Auto Onboarding - 30-minute trigger');
//   callEndpoint('/api/annie-auto-onboarding', 'Annie Auto Onboarding');
// });

// =====================================================================
// ANNIE AUTO SUPPORT - Every Hour
// Processes support tickets and sends client health checks
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 * * * *', () => {
//   console.log('\n[Cron] ⏰ Annie Auto Support - Hourly trigger');
//   callEndpoint('/api/annie-auto-support', 'Annie Auto Support');
// });

// =====================================================================
// FREQUENCY & FORM MARKETPLACE BOTS
// Sourcing (Partners) + Posting (Pinterest Marketing)
// =====================================================================

// ANNIE PINTEREST POSTER - Twice Daily at 9 AM and 3 PM
// Creates and posts Pinterest content for F&F natural fiber fashion
// Content pillars: European fashion, natural fiber education, seasonal styling,
// sustainable fashion, fabric frequency science, designer spotlights
cron.schedule('0 9,15 * * *', () => {
  console.log('\n[Cron] ⏰ Annie Pinterest Poster - Twice daily trigger');
  callEndpoint('/api/bots/annie-pinterest-poster', 'Annie Pinterest Content Generation');
});

// HENRY PARTNER DISCOVERY - Twice Daily at 10 AM and 4 PM
// Discovers European natural fiber designers and brands for F&F marketplace
// Sources: Pinterest, Instagram, sustainable fashion directories, trade shows
cron.schedule('0 10,16 * * *', () => {
  console.log('\n[Cron] ⏰ Henry Partner Discovery - Twice daily trigger');
  callEndpoint('/api/bots/henry-partner-discovery', 'European Partner Discovery');
});

// =====================================================================
// FF STYLE STUDIO BOTS
// DISABLED: No AI until making money
// =====================================================================

// FF CLOSET ORGANIZER - Daily at 6 AM
// Analyzes and organizes virtual closet
// cron.schedule('0 6 * * *', () => {
//   console.log('\n[Cron] ⏰ FF Closet Organizer - Daily 6 AM trigger');
//   callEndpoint('/api/ff/closet-organizer', 'FF Closet Organizer');
// });

// FF TREND SPOTTER - Weekly on Monday at 8 AM
// Identifies trends to inspire designs
// cron.schedule('0 8 * * 1', () => {
//   console.log('\n[Cron] ⏰ FF Trend Spotter - Weekly Monday 8 AM trigger');
//   callEndpoint('/api/ff/trend-spotter', 'FF Trend Spotter');
// });

// FF DESIGN SUGGESTER - Twice Daily at 9 AM and 3 PM
// Generates daily design suggestions
// cron.schedule('0 9,15 * * *', () => {
//   console.log('\n[Cron] ⏰ FF Design Suggester - Twice daily trigger');
//   callEndpoint('/api/ff/design-suggester', 'FF Design Suggester');
// });

// =====================================================================
// GOAL COORDINATOR - Daily at 6 AM
// Coordinates all bot goals
// DISABLED: No AI until making money
// =====================================================================
// cron.schedule('0 7 * * *', () => {
//   console.log('\n[Cron] ⏰ Goal Coordinator - Daily 7 AM trigger');
//   callEndpoint('/api/goal-coordinator', 'Goal Coordinator');
// });

// =====================================================================
// STARTUP: Run initial checks
// =====================================================================
setTimeout(async () => {
  console.log('\n[Cron Scheduler] ✅ Frequency & Form Marketplace Automation Active');
  console.log('[Cron Scheduler] 📊 Schedule Summary:');
  console.log('\n🎯 BUSINESS MATCHING (Rule-based, No AI):');
  console.log('  - Lead Qualification: Every 15 minutes 📋');
  console.log('  - Product-Buyer Matching: Every 30 minutes 🤝');
  console.log('  - Order-Supplier Matching: Every 10 minutes 📦');
  console.log('\n📧 AUTOMATION (No AI):');
  console.log('  - Mainframe Sync Processor: Every 10 minutes 🔄');
  console.log('  - Email Queue Processor: Every 5 minutes');
  console.log('  - Dan Populate Queue: Every 15 minutes');
  console.log('  - Convert Leads to Contacts: Every hour');
  console.log('  - Social Post Publisher: Every 5 minutes');
  console.log('  - Deal Pipeline Processor: Every 30 minutes');
  console.log('  - Follow-up Processor: Every 6 hours');
  console.log('  - Auto Follow-up: Every 8 hours');
  console.log('\n🌿 FREQUENCY & FORM MARKETPLACE (AI-Powered):');
  console.log('  - Annie Pinterest Poster: Twice daily (9 AM, 3 PM) 📌');
  console.log('  - Henry Partner Discovery: Twice daily (10 AM, 4 PM) 🇪🇺');
  console.log('  - Sourcing: European natural fiber brands');
  console.log('  - Posting: Pinterest content for F&F marketing');
  console.log('\n❌ OTHER AI BOTS DISABLED (Until making money):');
  console.log('  - Dan AI features (scraper, outreach, social)');
  console.log('  - Henry AI features (goals, tickets)');
  console.log('  - Dave AI features (proposals, tracking)');
  console.log('  - Annie AI features (onboarding, support)');
  console.log('  - Alex AI features (monitoring)');
  console.log('  - FF Style Studio AI features');
  console.log('\n[Cron Scheduler] 💰 BUSINESS LOGIC MATCHING PIPELINE:');
  console.log('[Cron Scheduler] 📊 Leads → Qualify → Match Products → Route Orders');
  console.log('[Cron Scheduler] 💵 Zero AI cost until profitable\n');

  // Run initial health check (GET request for health endpoints)
  try {
    console.log('[Cron Scheduler] Running initial health checks...');
    const response = await axios.get(`${BASE_URL}/api/dan-health`);
    console.log('[Cron Scheduler] Dan Health Check - ✅ Success');
    if (response.data.metrics) {
      console.log(`  → Total Leads: ${response.data.metrics.total_leads}`);
      console.log(`  → New Leads: ${response.data.metrics.new_leads}`);
      console.log(`  → Conversion Rate: ${response.data.metrics.conversion_rate}`);
    }
  } catch (error) {
    console.error('[Cron Scheduler] Dan Health Check - ❌ Error:', error.message);
  }
}, 5000);

module.exports = {
  startCronJobs: () => {
    console.log('[Cron Scheduler] Bot automation cron jobs are running');
  }
};
