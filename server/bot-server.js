/**
 * Frequency & Form - Bot Server
 * Express server for all 6 AI bots + Atlas router
 * Deploys to Railway for 24/7 automation
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Railway proxy
app.set('trust proxy', 1);

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security
app.use(helmet());
app.use(compression());

// CORS - allow Vercel frontend to call bot APIs
app.use(cors({
  origin: [
    'https://frequency-and-form.vercel.app',
    'https://frequencyandform.com',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('system_config')
      .select('business_code')
      .eq('business_code', 'FF')
      .single();

    if (error) throw error;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      business: data?.business_code || 'FF',
      bots: ['Henry', 'Dave', 'Dan', 'Jordan', 'Annie', 'Alex', 'Atlas']
    });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// BOT API ROUTES
// =============================================================================

// Import all bot API handlers (Vercel serverless function format)
const henryGoalSetter = require('../api/bots/henry-goal-setter');
const henryTicketMonitor = require('../api/bots/henry-ticket-monitor');

const daveGoalTracker = require('../api/bots/dave-goal-tracker');
const daveAutoProposal = require('../api/bots/dave-auto-proposal');

const danFreeScaper = require('../api/bots/dan-free-scraper');
const danPopulateQueue = require('../api/bots/dan-populate-queue');
const danAutoOutreach = require('../api/bots/dan-auto-outreach');
const danReplyHandler = require('../api/bots/dan-reply-handler');
const danSocialLeadDiscovery = require('../api/bots/dan-social-lead-discovery');

const jordanCompliance = require('../api/bots/jordan-compliance');

const annieAutoOnboarding = require('../api/bots/annie-auto-onboarding');
const annieAutoSupport = require('../api/bots/annie-auto-support');
const annieChat = require('../api/bots/annie-chat');

const alexProactiveMonitor = require('../api/bots/alex-proactive-monitor');

const atlasKnowledge = require('../api/bots/atlas-knowledge');
const aiBotStatus = require('../api/bots/ai-bot-status');
const aiKillSwitch = require('../api/bots/ai-kill-switch');

// Register routes - support both GET and POST for all bot endpoints
app.all('/api/bots/henry-goal-setter', henryGoalSetter);
app.all('/api/bots/henry-ticket-monitor', henryTicketMonitor);

app.all('/api/bots/dave-goal-tracker', daveGoalTracker);
app.all('/api/bots/dave-auto-proposal', daveAutoProposal);

app.all('/api/bots/dan-free-scraper', danFreeScaper);
app.all('/api/bots/dan-populate-queue', danPopulateQueue);
app.all('/api/bots/dan-auto-outreach', danAutoOutreach);
app.all('/api/bots/dan-reply-handler', danReplyHandler);
app.all('/api/bots/dan-social-lead-discovery', danSocialLeadDiscovery);

app.all('/api/bots/jordan-compliance', jordanCompliance);

app.all('/api/bots/annie-auto-onboarding', annieAutoOnboarding);
app.all('/api/bots/annie-auto-support', annieAutoSupport);
app.post('/api/bots/annie-chat', annieChat);

app.all('/api/bots/alex-proactive-monitor', alexProactiveMonitor);

app.all('/api/bots/atlas-knowledge', atlasKnowledge);
app.get('/api/bots/ai-bot-status', aiBotStatus);
app.post('/api/bots/ai-kill-switch', aiKillSwitch);

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =============================================================================
// START SERVER + CRON SCHEDULER
// =============================================================================

app.listen(PORT, () => {
  console.log('\n=============================================================');
  console.log('🤖 FREQUENCY & FORM - BOT SERVER');
  console.log('=============================================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log('\n📋 Active Bots:');
  console.log('  1. Henry - Chief of Staff (Operations & Goals)');
  console.log('  2. Dave - Accountant (Finance & Proposals)');
  console.log('  3. Dan - Marketing (Leads & Outreach)');
  console.log('  4. Jordan - Legal (Compliance & Risk)');
  console.log('  5. Annie - Concierge (Customer Support & Styling)');
  console.log('  6. Alex - Engineering (System Monitoring)');
  console.log('  7. Atlas - AI Router (Shared Memory & Coordination)');
  console.log('\n🔗 API Endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  POST /api/bots/annie-chat - Annie chat widget');
  console.log('  POST /api/bots/* - All bot automation endpoints');
  console.log('=============================================================\n');

  // Start cron scheduler for automated tasks
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    console.log('⏰ Starting cron scheduler for automated bot tasks...');
    require('./cron-scheduler');
  } else {
    console.log('⏰ Cron scheduler disabled (set ENABLE_CRON=true to enable)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
