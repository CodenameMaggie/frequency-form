/**
 * Growth Manager Pro - Express Server
 * Main entry point for Railway deployment
 */

// Apply console override for production (must be first)
// Silences console.log/debug/info in production, keeps warn/error
require('../lib/console-override');

// Load environment variables
if (process.env.NODE_ENV === 'production') {
    require('dotenv').config({ path: '.env.production' });
} else {
    require('dotenv').config();
}

// Validate environment variables before continuing
const { validateEnvOrExit } = require('../lib/env-validation');
validateEnvOrExit({ silent: false });

// Additional configuration validation
const { validateOrExit } = require('../lib/config-validator');
validateOrExit({ silent: false });

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const db = require('./db');
// Import proper rate limiters
const {
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    signupLimiter
} = require('../lib/rate-limiter');
// Import CSP configuration
const { helmetCSPConfig, securityHeaders } = require('../lib/csp-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Railway proxy for rate limiting and real IP addresses
app.set('trust proxy', 1);

// Prevent server crashes from unhandled errors
process.on('uncaughtException', (error) => {
  console.error('[CRITICAL] Uncaught Exception:', error);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security headers (helmet) with improved CSP configuration
app.use(helmet({
  contentSecurityPolicy: helmetCSPConfig,
  crossOriginEmbedderPolicy: {
    policy: 'credentialless'
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'sameorigin' // Allow same-origin iframes (needed for admin-hub)
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  },
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },
  crossOriginResourcePolicy: {
    policy: 'same-origin'
  }
}));

// Add additional security headers not handled by Helmet
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  next();
});

// Gzip compression for responses
app.use(compression());

// CORS configuration
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://growthmanagerpro.com',
  'https://www.growthmanagerpro.com',
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In production, reject unknown origins
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
    return callback(null, true); // Allow in development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
}));

// Apply specific rate limiting to authentication routes
app.use('/api/login', authLimiter);
app.use('/api/reset-password', passwordResetLimiter);
app.use('/api/request-password-reset', passwordResetLimiter);
app.use('/api/forgot-password', passwordResetLimiter);

// Apply signup limiter to all signup routes
app.use('/api/signup', signupLimiter);
app.use('/api/signup-saas', signupLimiter);
app.use('/api/signup-advisor', signupLimiter);
app.use('/api/signup-consultant', signupLimiter);
app.use('/api/signup-client', signupLimiter);
app.use('/api/signup-invited', signupLimiter);

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Special handling for Stripe webhook - must preserve raw body for signature verification
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

// Parse JSON bodies for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (only log in development or for errors)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log in development or for slow/error responses
    if (process.env.NODE_ENV !== 'production' || res.statusCode >= 400 || duration > 1000) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Serve static files with caching headers
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0, // Cache for 1 day in production
  etag: true,
  lastModified: true
}));

// =============================================================================
// HEALTH CHECK
// =============================================================================

// Root path - Railway might check this
app.get('/', (req, res) => {
  res.status(200).send('Growth Manager Pro API Server');
});

// Basic health check (no database) - RAILWAY USES THIS
// This is the fastest health check - just confirms server is alive
// CRITICAL: This must respond immediately for Railway health checks
app.get('/ping', (req, res) => {
  // Send the simplest possible response for Railway
  res.status(200).send('OK');
});

// Manual migration endpoint - run migrations on demand
app.post('/api/run-migrations', async (req, res) => {
  // Check for CRON_SECRET
  const cronSecret = req.query.secret || req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized - invalid secret' });
  }

  try {
    console.log('[Migration] Starting manual migration run...');
    const startTime = Date.now();

    const result = await db.runStartupMigrations();

    const duration = Date.now() - startTime;
    console.log(`[Migration] Completed in ${duration}ms`);

    res.json({
      success: true,
      duration: `${duration}ms`,
      message: 'Migrations completed successfully'
    });
  } catch (error) {
    console.error('[Migration] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Full health check with database connection test (for monitoring only)
// Default to quick mode for reliability - database queries can be flaky
app.get('/health', async (req, res) => {
  // Quick mode by default (Railway health checks)
  // Use ?full=true to test database connection
  if (req.query.full !== 'true') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'not_tested',
      version: process.env.npm_package_version || '1.0.0'
    });
  }

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Health Check] Supabase not configured!');
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'not configured',
      error: 'Supabase environment variables not set',
      env_check: {
        supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        node_env: process.env.NODE_ENV || 'not set'
      }
    });
  }

  try {
    // Test database connection with timeout (8s)
    // Use a simple Supabase query - just check if we can query the tenants table
    const result = await Promise.race([
      db.from('tenants').select('id').limit(1),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database health check timeout after 8s')), 8000)
      )
    ]);

    if (result.error) {
      throw new Error(result.error.message || 'Database query failed');
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      build: 'v2-tenants-fix-20251214'
    });
  } catch (error) {
    console.error('[Health Check] Database error:', error.message);
    console.error('[Health Check] DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.error('[Health Check] Supabase URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error('[Health Check] Supabase Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.error('[Health Check] NODE_ENV:', process.env.NODE_ENV);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      env_check: {
        database_url_set: !!process.env.DATABASE_URL,
        supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        node_env: process.env.NODE_ENV || 'not set'
      }
    });
  }
});

// =============================================================================
// API ROUTES
// =============================================================================

// Import authentication middleware
const { requireAuth } = require('../lib/auth-middleware');

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/api/login',
  '/api/signup',
  '/api/signup-saas',
  '/api/signup-advisor',
  '/api/signup-client',
  '/api/signup-consultant',
  '/api/signup-invited',
  '/api/verify-invitation',
  '/api/request-password-reset',
  '/api/reset-password',
  '/api/ai-chat', // Public website chat
  '/api/ping', // Healthcheck
  '/api/health', // Health check
  '/api/dan-health', // Dan marketing bot health check
  '/api/dave-health', // Dave finance bot health check
  '/api/alex-health', // Alex engineering bot health check
  '/api/stripe-webhook', // Has signature verification
  '/api/zoom-webhook', // Has signature verification
  '/api/calendly-webhook', // Has signature verification
  '/api/webhook-transcript', // Generic transcript webhook with signature verification
  '/api/oauth-urls', // OAuth URL generator (must be public for OAuth flow initiation)
  '/api/oauth-status', // OAuth connection status check (needed before auth)
  '/api/zoom-oauth-callback', // OAuth flow
  '/api/gmail-oauth-callback', // OAuth flow
  '/api/outlook-oauth-callback', // OAuth flow
  '/api/calendly-oauth-callback', // OAuth flow
  '/api/webhooks/receive', // External webhook receiver (has signature verification)
  '/api/debug-env', // Debug env vars (masked values only)
  '/api/test-resend' // Test Resend API
];

// CRON endpoints that need CRON_SECRET verification
const CRON_ENDPOINTS = [
  '/api/follow-up-processor',
  '/api/zoom-import',
  '/api/podcast-to-social-automation',
  '/api/social-post-publisher',
  '/api/generate-weekly-reports',
  '/api/meeting-reminders-processor',
  '/api/email-queue-processor',
  '/api/onboarding-email-processor',
  '/api/henry-ticket-monitor',
  '/api/henry-goal-setter',
  '/api/legal-proactive-monitor',
  '/api/alex-proactive-monitor',
  '/api/dan-lead-discovery',
  '/api/dan-lead-generator',
  '/api/dan-free-scraper',
  '/api/dan-auto-outreach',
  '/api/dave-goal-tracker',
  '/api/dave-auto-proposal',
  '/api/deal-pipeline-processor',
  '/api/auto-followup-processor',
  '/api/henry-goal-worker',
  '/api/dave-goal-worker',
  '/api/jordan-goal-worker',
  '/api/goal-coordinator'
];

// Helper to wrap Vercel-style handlers for Express
function wrapHandler(handler, options = {}) {
  return async (req, res) => {
    try {
      const endpoint = req.path;

      // Check if this endpoint requires authentication
      const isPublic = PUBLIC_ENDPOINTS.includes(endpoint) ||
                       endpoint.startsWith('/api/webhooks/receive') ||
                       options.publicEndpoint;
      const isCron = CRON_ENDPOINTS.includes(endpoint) || options.cronEndpoint;

      // Note: CRON endpoints now use withCronAuth wrapper in their handler files
      // No authentication applied here for cron endpoints - let withCronAuth handle it

      // Apply authentication if not public and not a cron job
      if (!isPublic && !isCron) {
        await new Promise((resolve, reject) => {
          requireAuth(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        }).catch(() => {
          // Error already sent by middleware
          return;
        });

        if (res.headersSent) return;

        // Add tenant access control for authenticated requests
        const tenantId = req.query.tenant_id || req.headers['x-tenant-id'] || req.user?.tenantId;

        if (tenantId && req.user) {
          // Verify tenant access (admin can access all, users only their own)
          if (req.user.role !== 'admin' && req.user.tenantId !== tenantId) {
            return res.status(403).json({
              success: false,
              error: 'Access denied to this tenant'
            });
          }
        }
      }

      // Make db available on request
      req.db = db;
      await handler(req, res);
    } catch (error) {
      console.error('[API Error]', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  };
}

// Import and mount API routes
// These will be gradually migrated - for now we use a compatibility layer

// Health check endpoint
app.all('/api/health', wrapHandler(require('../api/health')));

// System monitoring endpoint
app.all('/api/system-monitor', wrapHandler(require('../api/system-monitor')));

// Auth routes
app.all('/api/login', wrapHandler(require('../api/login')));
app.all('/api/signup', wrapHandler(require('../api/signup')));
app.all('/api/signup-saas', wrapHandler(require('../api/signup-saas')));
app.all('/api/signup-advisor', wrapHandler(require('../api/signup-advisor')));
app.all('/api/signup-client', wrapHandler(require('../api/signup-client')));
app.all('/api/signup-invited', wrapHandler(require('../api/signup-invited')));
app.all('/api/signup-consultant', wrapHandler(require('../api/signup-consultant')));
app.all('/api/request-password-reset', wrapHandler(require('../api/request-password-reset')));
app.all('/api/csrf-token', wrapHandler(require('../api/csrf-token')));
app.all('/api/reset-password', wrapHandler(require('../api/reset-password')));

// Dashboard routes
app.all('/api/dashboard', wrapHandler(require('../api/dashboard')));
app.all('/api/advisor/dashboard', wrapHandler(require('../api/advisor/dashboard')));
app.all('/api/consultant/dashboard', wrapHandler(require('../api/consultant/dashboard')));
app.all('/api/client-dashboard', wrapHandler(require('../api/client-dashboard')));

// Core CRM routes
app.all('/api/contacts', wrapHandler(require('../api/contacts')));
app.all('/api/deals', wrapHandler(require('../api/deals')));
app.all('/api/deals/:id/stage', wrapHandler(require('../api/deals/[id]/stage')));
app.all('/api/proposals', wrapHandler(require('../api/proposals')));
app.all('/api/sign-proposal', wrapHandler(require('../api/sign-proposal')));

// Call tracking routes
app.all('/api/pre-qualification-calls', wrapHandler(require('../api/prequal')));
app.all('/api/podcast-interviews', wrapHandler(require('../api/podcast')));
app.all('/api/discovery-calls', wrapHandler(require('../api/discovery')));
app.all('/api/strategy-calls', wrapHandler(require('../api/strategy')));
app.all('/api/pipeline', wrapHandler(require('../api/pipeline')));
// Shorter route aliases (keep for backward compatibility)
app.all('/api/prequal', wrapHandler(require('../api/prequal')));
app.all('/api/podcast', wrapHandler(require('../api/podcast')));
app.all('/api/discovery', wrapHandler(require('../api/discovery')));
app.all('/api/strategy', wrapHandler(require('../api/strategy')));

// User management
app.all('/api/users', wrapHandler(require('../api/users')));
app.all('/api/users/:id', wrapHandler(require('../api/users/[id]')));
app.all('/api/settings', wrapHandler(require('../api/settings')));
app.all('/api/permissions', wrapHandler(require('../api/permissions')));
app.all('/api/invitations', wrapHandler(require('../api/invitations')));
app.all('/api/verify-invitation', wrapHandler(require('../api/verify-invitation')));

// AI routes
app.all('/api/ai-chat', wrapHandler(require('../api/ai-chat')));
app.all('/api/ai-analyzer', wrapHandler(require('../api/ai-analyzer')));
app.all('/api/ai-assistant-bot', wrapHandler(require('../api/ai-assistant-bot')));
app.all('/api/ai-organization-bot', wrapHandler(require('../api/ai-organization-bot')));
app.all('/api/ai-finance-bot', wrapHandler(require('../api/ai-finance-bot')));
app.all('/api/ai-marketing-bot', wrapHandler(require('../api/ai-marketing-bot')));
app.all('/api/ai-legal-bot', wrapHandler(require('../api/ai-legal-bot')));
app.all('/api/ai-engineering-bot', wrapHandler(require('../api/ai-engineering-bot')));
app.all('/api/ai-task-queue', wrapHandler(require('../api/ai-task-queue')));
app.all('/api/deep-dive-researcher', wrapHandler(require('../api/deep-dive-researcher')));
app.all('/api/atlas-knowledge', wrapHandler(require('../api/atlas-knowledge')));
app.all('/api/ai-memory/list', wrapHandler(require('../api/ai-memory/list')));
app.all('/api/ai-memory/create', wrapHandler(require('../api/ai-memory/create')));
app.all('/api/ai-memory/update', wrapHandler(require('../api/ai-memory/update')));
app.all('/api/ai-memory/delete', wrapHandler(require('../api/ai-memory/delete')));
app.all('/api/ai-memory/store', wrapHandler(require('../api/ai-memory/store')));
app.all('/api/ai-memory/context-loader', wrapHandler(require('../api/ai-memory/context-loader')));

// Integrations
app.all('/api/oauth-urls', wrapHandler(require('../api/oauth-urls')));
app.all('/api/oauth-revoke', wrapHandler(require('../api/oauth-revoke')));
app.all('/api/refresh-oauth-token', wrapHandler(require('../api/refresh-oauth-token')));
app.all('/api/zoom-webhook', wrapHandler(require('../api/zoom-webhook')));
app.all('/api/zoom-import', wrapHandler(require('../api/zoom-import')));
app.all('/api/zoom-create-meeting', wrapHandler(require('../api/zoom-create-meeting')));
app.all('/api/transcript-upload', wrapHandler(require('../api/transcript-upload')));
app.all('/api/webhook-transcript', wrapHandler(require('../api/webhook-transcript')));
app.all('/api/zoom-config', wrapHandler(require('../api/zoom-config')));
app.all('/api/calendly-webhook', wrapHandler(require('../api/calendly-webhook')));
app.all('/api/calendly-oauth-callback', wrapHandler(require('../api/calendly-oauth-callback')));
app.all('/api/calendly-events', wrapHandler(require('../api/calendly-events')));
app.all('/api/gmail-oauth-callback', wrapHandler(require('../api/gmail-oauth-callback')));
app.all('/api/outlook-oauth-callback', wrapHandler(require('../api/outlook-oauth-callback')));
app.all('/api/zoom-oauth-callback', wrapHandler(require('../api/zoom-oauth-callback')));
app.all('/api/integrations/gmail', wrapHandler(require('../api/integrations/gmail')));
app.all('/api/integrations/outlook', wrapHandler(require('../api/integrations/outlook')));
app.all('/api/integrations/instantly', wrapHandler(require('../api/integrations/instantly')));
app.all('/api/integrations/zoom', wrapHandler(require('../api/integrations/zoom')));
app.all('/api/linkedin-auth', wrapHandler(require('../api/linkedin-auth')));
app.all('/api/instantly-handoff', wrapHandler(require('../api/instantly-handoff')));

// Stripe & Billing
app.all('/api/stripe-webhook', wrapHandler(require('../api/stripe-webhook')));
app.all('/api/stripe-config', wrapHandler(require('../api/stripe-config')));
app.all('/api/subscriptions', wrapHandler(require('../api/subscriptions')));
app.all('/api/create-billing-portal', wrapHandler(require('../api/create-billing-portal')));

// Analytics
app.all('/api/analytics', wrapHandler(require('../api/analytics')));
app.all('/api/analytics/:tab', wrapHandler(require('../api/analytics/[tab]')));
app.all('/api/analytics/integration-requests', wrapHandler(require('../api/analytics/integration-requests')));
app.all('/api/analytics/integrations-status', wrapHandler(require('../api/analytics/integrations-status')));
app.all('/api/analytics/calls-aggregate', wrapHandler(require('../api/analytics/calls-aggregate')));

// Email & Campaigns
app.all('/api/email-queue', wrapHandler(require('../api/email-queue')));
app.all('/api/email-queue-processor', wrapHandler(require('../api/email-queue-processor')));
app.all('/api/onboarding-email-processor', wrapHandler(require('../api/onboarding-email-processor')));
app.all('/api/meeting-reminders-processor', wrapHandler(require('../api/meeting-reminders-processor')));
app.all('/api/follow-up-processor', wrapHandler(require('../api/follow-up-processor')));
app.all('/api/generate-weekly-reports', wrapHandler(require('../api/generate-weekly-reports')));
app.all('/api/henry-ticket-monitor', wrapHandler(require('../api/henry-ticket-monitor')));
app.all('/api/henry-goal-setter', wrapHandler(require('../api/henry-goal-setter')));
app.all('/api/legal-proactive-monitor', wrapHandler(require('../api/legal-proactive-monitor')));
app.all('/api/alex-proactive-monitor', wrapHandler(require('../api/alex-proactive-monitor')));
app.all('/api/dan-lead-discovery', wrapHandler(require('../api/dan-lead-discovery')));
app.all('/api/dan-lead-generator', wrapHandler(require('../api/dan-lead-generator')));
app.all('/api/dan-free-scraper', wrapHandler(require('../api/dan-free-scraper')));
app.all('/api/dan-test-insert', wrapHandler(require('../api/dan-test-insert'))); // Diagnostic endpoint
app.all('/api/dan-supabase-diagnostic', wrapHandler(require('../api/dan-supabase-diagnostic'))); // Supabase diagnostic
app.all('/api/env-check', require('../api/env-check')); // Environment check
app.all('/api/dan-auto-outreach', wrapHandler(require('../api/dan-auto-outreach')));
app.all('/api/dan-reply-handler', wrapHandler(require('../api/dan-reply-handler'))); // NEW: AI reply classification
app.all('/api/dan-auto-social-posts', wrapHandler(require('../api/dan-auto-social-posts')));
app.all('/api/dan-social-lead-discovery', wrapHandler(require('../api/dan-social-lead-discovery')));
app.all('/api/dan-populate-queue', wrapHandler(require('../api/dan-populate-queue'))); // NEW: Queue population
app.all('/api/social-publish-diagnostic', wrapHandler(require('../api/social-publish-diagnostic')));
app.all('/api/dan-lead-receiver', wrapHandler(require('../api/dan-lead-receiver')));
app.all('/api/test-resend', wrapHandler(require('../api/test-resend')));

// Annie (Personal Assistant) Bot Endpoints
app.all('/api/annie-auto-onboarding', wrapHandler(require('../api/annie-auto-onboarding'))); // NEW: Auto-onboarding
app.all('/api/annie-auto-support', wrapHandler(require('../api/annie-auto-support'))); // NEW: Auto-support

// Webhook Endpoints (public, no auth wrapper)
app.post('/api/email-inbound-webhook', require('../api/email-inbound-webhook')); // NEW: Resend inbound emails
app.all('/api/dave-goal-tracker', wrapHandler(require('../api/dave-goal-tracker')));
app.all('/api/dave-auto-proposal', wrapHandler(require('../api/dave-auto-proposal')));
app.all('/api/deal-pipeline-processor', wrapHandler(require('../api/deal-pipeline-processor')));

// Proactive Goal Workers
app.all('/api/henry-goal-worker', wrapHandler(require('../api/henry-goal-worker')));
app.all('/api/dave-goal-worker', wrapHandler(require('../api/dave-goal-worker')));
app.all('/api/jordan-goal-worker', wrapHandler(require('../api/jordan-goal-worker')));
app.all('/api/goal-coordinator', wrapHandler(require('../api/goal-coordinator')));
app.all('/api/auto-followup-processor', wrapHandler(require('../api/auto-followup-processor')));
app.all('/api/campaigns', wrapHandler(require('../api/campaigns')));
app.all('/api/unsubscribe', wrapHandler(require('../api/unsubscribe')));

// Sprints & Tasks
app.all('/api/sprints', wrapHandler(require('../api/sprints')));

// Financial
app.all('/api/expenses', wrapHandler(require('../api/expenses')));
app.all('/api/cash-flow', wrapHandler(require('../api/cash-flow')));
app.all('/api/accounting', wrapHandler(require('../api/accounting')));
app.all('/api/financial-documents', wrapHandler(require('../api/financial-documents')));
app.all('/api/generate-financial-document', wrapHandler(require('../api/generate-financial-document')));

// Support
app.all('/api/support-tickets', wrapHandler(require('../api/support-tickets')));
app.all('/api/support-reports', wrapHandler(require('../api/support-reports')));

// Enterprise Features - Client-facing AI Bots (tiered access)
app.all('/api/client-assistant-bot', wrapHandler(require('../api/client-assistant-bot')));
app.all('/api/client-finance-bot', wrapHandler(require('../api/client-finance-bot')));
app.all('/api/client-marketing-bot', wrapHandler(require('../api/client-marketing-bot')));

// Enterprise Features - Custom Integrations & Webhooks (Scale+)
app.all('/api/custom-integrations', wrapHandler(require('../api/custom-integrations')));
app.all('/api/webhooks/receive/:id', wrapHandler(require('../api/webhooks/receive/[id]')));

// Enterprise Features - Advanced Analytics (Scale+)
app.all('/api/advanced-analytics', wrapHandler(require('../api/advanced-analytics')));

// Enterprise Features - VA Management (Scale+)
app.all('/api/va-management', wrapHandler(require('../api/va-management')));

// Enterprise Features - API Keys (Enterprise only)
app.all('/api/api-keys', wrapHandler(require('../api/api-keys')));

// Social Media
app.all('/api/social-post-generator', wrapHandler(require('../api/social-post-generator')));
app.all('/api/social-post-publisher', wrapHandler(require('../api/social-post-publisher')));
app.all('/api/podcast-to-social-automation', wrapHandler(require('../api/podcast-to-social-automation')));

// Faceless YouTube System (100% Free Integration Stack)
app.all('/api/faceless-video-generator', wrapHandler(require('../api/faceless-video-generator')));
app.all('/api/faceless-script-generator', wrapHandler(require('../api/faceless-script-generator')));
app.all('/api/faceless-voiceover', wrapHandler(require('../api/faceless-voiceover')));
app.all('/api/faceless-footage-matcher', wrapHandler(require('../api/faceless-footage-matcher')));
app.all('/api/faceless-video-assembler', wrapHandler(require('../api/faceless-video-assembler')));
app.all('/api/faceless-youtube-uploader', wrapHandler(require('../api/faceless-youtube-uploader')));

// Video Studio - DISABLED: video-studio/generators/* modules not yet created (causing 502 errors)
// TODO: Create video-studio/generators/podcast-video.js, sales-video.js, social-clip.js
// app.all('/api/video-generator', wrapHandler(require('../api/video-generator')));

// Misc routes
app.all('/api/time-slots', wrapHandler(require('../api/time-slots')));
app.all('/api/meeting-types', wrapHandler(require('../api/meeting-types')));
app.all('/api/onboarding/update-step', wrapHandler(require('../api/onboarding/update-step')));
app.all('/api/onboarding/configure', wrapHandler(require('../api/onboarding/configure')));
app.all('/api/onboarding-tour', wrapHandler(require('../api/onboarding-tour')));
app.all('/api/funnel-progression', wrapHandler(require('../api/funnel-progression')));
app.all('/api/confirm-booking', wrapHandler(require('../api/confirm-booking')));
app.all('/api/get-conversation', wrapHandler(require('../api/get-conversation')));
app.all('/api/legal-alerts', wrapHandler(require('../api/legal-alerts')));
app.all('/api/legal-documents', wrapHandler(require('../api/legal-documents')));
app.all('/api/legal-sync', wrapHandler(require('../api/legal-sync')));
app.all('/api/delete-account', wrapHandler(require('../api/delete-account')));
app.all('/api/run-migration', wrapHandler(require('../api/run-migration')));

// Advisor routes
app.all('/api/advisor/clients', wrapHandler(require('../api/advisor/clients')));
app.all('/api/clients/active', wrapHandler(require('../api/clients/active')));
app.all('/api/clients/:id/messages', wrapHandler(require('../api/clients/[id]/messages')));

// Additional missing routes (added Dec 3, 2025)
app.all('/api/tenants', wrapHandler(require('../api/tenants')));
app.all('/api/branding', wrapHandler(require('../api/branding')));
app.all('/api/tasks', wrapHandler(require('../api/tasks')));
app.all('/api/tasks/:id', wrapHandler(require('../api/tasks/[id]')));
app.all('/api/deal-activities', wrapHandler(require('../api/deal-activities')));
app.all('/api/change-password', wrapHandler(require('../api/change-password')));
app.all('/api/deliverables/:id', wrapHandler(require('../api/deliverables/[id]')));
app.all('/api/sprints/action-items', wrapHandler(require('../api/sprints/action-items')));
app.all('/api/integrations/resend', wrapHandler(require('../api/integrations/resend')));
app.all('/api/integrations/eleven-labs', wrapHandler(require('../api/integrations/eleven-labs')));
// Note: Commented out duplicates - frontend uses nested versions (/api/advisor/dashboard, etc.)
// app.all('/api/advisor-dashboard', wrapHandler(require('../api/advisor-dashboard')));
// app.all('/api/consultant-dashboard', wrapHandler(require('../api/consultant-dashboard')));
// app.all('/api/clients-active', wrapHandler(require('../api/clients-active')));
// app.all('/api/clients-messages', wrapHandler(require('../api/clients-messages')));
app.all('/api/calendly-status', wrapHandler(require('../api/calendly-status')));
app.all('/api/calendly-disconnect', wrapHandler(require('../api/calendly-disconnect')));
app.all('/api/zoom-status', wrapHandler(require('../api/zoom-status')));
app.all('/api/dan-marketing-metrics', wrapHandler(require('../api/dan-marketing-metrics')));
app.all('/api/dave-financial-metrics', wrapHandler(require('../api/dave-financial-metrics')));
app.all('/api/henry-executive-metrics', wrapHandler(require('../api/henry-executive-metrics')));
app.all('/api/jordan-legal-metrics', wrapHandler(require('../api/jordan-legal-metrics')));
app.all('/api/annie-support-metrics', wrapHandler(require('../api/annie-support-metrics')));
app.all('/api/alex-engineering-metrics', wrapHandler(require('../api/alex-engineering-metrics')));

// Bot Health & Support Endpoints
app.all('/api/dan-health', wrapHandler(require('../api/dan-health')));
app.all('/api/dan-leads-count', wrapHandler(require('../api/dan-leads-count')));
app.all('/api/convert-leads-to-contacts', wrapHandler(require('../api/convert-leads-to-contacts')));
app.all('/api/dave-health', wrapHandler(require('../api/dave-health')));
app.all('/api/dave-mrr', wrapHandler(require('../api/dave-mrr')));
app.all('/api/dave-payment', wrapHandler(require('../api/dave-payment')));
app.all('/api/henry-alerts', wrapHandler(require('../api/henry-alerts')));
app.all('/api/jordan-compliance', wrapHandler(require('../api/jordan-compliance')));
app.all('/api/jordan-contract', wrapHandler(require('../api/jordan-contract')));
app.all('/api/jordan-expiring', wrapHandler(require('../api/jordan-expiring')));
app.all('/api/alex-status', wrapHandler(require('../api/alex-status')));
app.all('/api/alex-health', wrapHandler(require('../api/alex-health')));

app.all('/api/ai-governance-stats', wrapHandler(require('../api/ai-governance-stats')));
app.all('/api/ai-activity-log', wrapHandler(require('../api/ai-activity-log')));
app.all('/api/ai-approval-queue', wrapHandler(require('../api/ai-approval-queue')));
app.all('/api/ai-approve-action', wrapHandler(require('../api/ai-approve-action')));
app.all('/api/ai-reject-action', wrapHandler(require('../api/ai-reject-action')));
app.all('/api/ai-bot-status', wrapHandler(require('../api/ai-bot-status')));
app.all('/api/ai-kill-switch', wrapHandler(require('../api/ai-kill-switch')));
app.all('/api/ai-assistant-bot-minimal', wrapHandler(require('../api/ai-assistant-bot-minimal')));
app.all('/api/availability-bookings', wrapHandler(require('../api/availability-bookings')));
app.all('/api/deliverables', wrapHandler(require('../api/deliverables')));
app.all('/api/pipeline-stage', wrapHandler(require('../api/pipeline-stage')));
app.all('/api/sprints-action-items', wrapHandler(require('../api/sprints-action-items')));
app.all('/api/video-studio-metrics', wrapHandler(require('../api/video-studio-metrics')));
app.all('/api/test-email-config', wrapHandler(require('../api/test-email-config')));
app.all('/api/test-db', wrapHandler(require('../api/test-db')));
app.all('/api/test-deploy', wrapHandler(require('../api/test-deploy')));
app.all('/api/test-env', wrapHandler(require('../api/test-env')));
app.all('/api/check-db-url', wrapHandler(require('../api/check-db-url')));
app.all('/api/check-env', wrapHandler(require('../api/check-env')));
app.all('/api/debug-env', wrapHandler(require('../api/debug-env')));
app.all('/api/oauth-status', wrapHandler(require('../api/oauth-status')));
app.all('/api/run-migration-direct', wrapHandler(require('../api/run-migration-direct')));
app.all('/api/run-migration-endpoint', wrapHandler(require('../api/run-migration-endpoint')));

// MFS Dashboard stub endpoints (Dec 3, 2025)
app.all('/api/ai-secretary-bot', wrapHandler(require('../api/ai-secretary-bot')));
app.all('/api/provision-client', wrapHandler(require('../api/provision-client')));
app.all('/api/automation-settings', wrapHandler(require('../api/automation-settings')));
app.all('/api/web-prospector', wrapHandler(require('../api/web-prospector')));
app.all('/api/sales-automation', wrapHandler(require('../api/sales-automation')));
app.all('/api/auth/logout', wrapHandler(require('../api/auth/logout')));

// Social Media Features - Missing Routes
app.all('/api/social-connections', wrapHandler(require('../api/social-connections')));
app.all('/api/social-post', wrapHandler(require('../api/social-post')));

// Call Tracking - Missing Routes
app.all('/api/prequal-calls', wrapHandler(require('../api/prequal-calls')));
app.all('/api/podcast-calls', wrapHandler(require('../api/podcast-calls')));

// Bot Management - Missing Routes
app.all('/api/bot-actions', wrapHandler(require('../api/bot-actions')));
app.all('/api/bot-goals', wrapHandler(require('../api/bot-goals')));
app.all('/api/ai-conversations', wrapHandler(require('../api/ai-conversations')));
app.all('/api/get-recent-conversation', wrapHandler(require('../api/get-recent-conversation')));

// Email & Communication - Missing Routes
app.all('/api/send-user-email', wrapHandler(require('../api/send-user-email')));

// Financial - Missing Routes
app.all('/api/finance-sync', wrapHandler(require('../api/finance-sync')));

// Monitoring - Missing Routes
app.all('/api/activity-monitor', wrapHandler(require('../api/activity-monitor')));

// =============================================================================
// CATCH-ALL FOR SPA
// =============================================================================

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  // Railway health check on root path - return simple 200 OK
  if (req.path === '/' && !req.headers['accept']?.includes('text/html')) {
    return res.status(200).json({ status: 'ok' });
  }

  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }

  // Check if requesting a specific HTML file
  const htmlPath = path.join(__dirname, '../public', req.path);
  if (req.path.endsWith('.html')) {
    return res.sendFile(htmlPath);
  }

  // Check if file exists with .html extension
  const htmlWithExt = path.join(__dirname, '../public', `${req.path}.html`);
  const fs = require('fs');
  if (fs.existsSync(htmlWithExt)) {
    return res.sendFile(htmlWithExt);
  }

  // Default to index.html
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`
========================================
  Growth Manager Pro Server
========================================
  Port: ${PORT}
  Host: 0.0.0.0 (listening on all interfaces)
  Environment: ${process.env.NODE_ENV || 'development'}
  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}
  Health Check: /ping (instant)
  Full Check: /health?quick=true (fast)
========================================
  `);

  console.log('[Server] Ready to accept connections');
  console.log('[Server] BUILD VERSION: v2-database-migrations-enabled');

  // Run startup migrations to ensure database schema and default tenant exist
  if (process.env.DATABASE_URL) {
    console.log('[Server] Running startup migrations...');
    try {
      await db.runStartupMigrations();
      console.log('[Server] Database migrations completed successfully');
    } catch (error) {
      console.error('[Server] Migration error:', error.message);
      console.error('[Server] Application may not function correctly without migrations');
    }
  } else {
    console.log('[Server] Skipping migrations - DATABASE_URL not configured (using Supabase client)');
  }

  // Start bot automation cron scheduler
  console.log('[Server] Starting bot automation cron scheduler...');
  require('./cron-scheduler');
  });


// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down...');
  await db.close();
  process.exit(0);
});

module.exports = app;
