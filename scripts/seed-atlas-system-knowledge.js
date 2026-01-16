/**
 * Seed Atlas with COMPLETE System Knowledge
 *
 * Atlas is the "know-all" bot - understands every aspect of F&F:
 * - All API endpoints and what they do
 * - All database tables and relationships
 * - All bot jobs and how they execute
 * - All integrations and how they connect
 * - All marketing strategies and execution
 * - How everything ties together
 *
 * Run: node scripts/seed-atlas-system-knowledge.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const ATLAS_SYSTEM_KNOWLEDGE = [
  // =====================================================
  // SYSTEM ARCHITECTURE
  // =====================================================
  {
    scope: 'system',
    memory_type: 'architecture_overview',
    content: `F&F System Architecture Overview:

    TECH STACK:
    - Frontend: Next.js 14 (App Router), React, TailwindCSS
    - Backend: Next.js API Routes (serverless)
    - Database: Supabase (PostgreSQL)
    - Payments: Stripe (subscriptions + one-time)
    - Hosting: Railway (production), Vercel (alternative)
    - AI: OpenAI GPT-4 for bot intelligence
    - Email: Forbes Command API (outreach), Resend (transactional)
    - Social: Pinterest API, Instagram API

    DIRECTORY STRUCTURE:
    /app - Next.js pages and API routes
    /app/api - All backend endpoints
    /app/api/bots - Bot execution endpoints
    /app/api/cron - Scheduled job endpoints
    /app/api/csuite - C-suite communication system
    /app/api/ff - Frequency & Form specific features
    /lib - Shared utilities and configurations
    /lib/csuite - C-suite bot definitions
    /database/migrations - SQL schema files
    /scripts - Utility and seeding scripts

    ENVIRONMENTS:
    - Production: Railway (frequencyandform.com)
    - Database: Supabase project
    - Secrets: Railway environment variables`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  // =====================================================
  // ALL API ENDPOINTS
  // =====================================================
  {
    scope: 'system',
    memory_type: 'api_endpoints_bots',
    content: `F&F Bot Execution Endpoints:

    DAN'S ENDPOINTS (Sales & Outreach):
    - POST /api/bots/dan-lead-generator - Discovers new leads from web research
    - POST /api/bots/dan-pinterest-poster - Posts content to Pinterest
    - POST /api/bots/dan-partner-outreach - Sends initial outreach emails to partners
    - POST /api/bots/dan-partner-followup - Sends follow-up emails to non-responders
    - POST /api/bots/dan-auto-social-posts - Auto-generates and schedules social content
    - POST /api/dan-auto-outreach - Automated outreach processor
    - POST /api/dan-populate-queue - Populates email queue with outreach

    HENRY'S ENDPOINTS (Partnerships & Sales):
    - POST /api/bots/henry-partner-discovery - Discovers European designer partners
    - POST /api/bots/henry-seamstress-discovery - Finds seamstresses for custom work
    - POST /api/deal-pipeline-processor - Processes deals through pipeline stages

    ANNIE'S ENDPOINTS (Customer Experience):
    - POST /api/bots/annie-chat - Customer chat/support conversations
    - POST /api/bots/annie-auto-onboarding - Automated onboarding sequences
    - POST /api/bots/annie-pinterest-poster - Community Pinterest content

    MAGGIE'S ENDPOINTS (Community & Styling):
    - POST /api/ff/body-scan - Process body scan for styling
    - POST /api/ff/color-analysis - Color analysis for members
    - POST /api/ff/custom-designs - Custom design requests
    - POST /api/ff/lookbook/personalize - Generate personalized lookbooks

    SYSTEM PROCESSORS:
    - POST /api/bots/mainframe-sync-processor - Syncs data across systems
    - POST /api/email-queue-processor - Processes email send queue
    - POST /api/follow-up-processor - Handles follow-up scheduling
    - POST /api/auto-followup-processor - Automated follow-ups
    - POST /api/social-post-publisher - Publishes scheduled social posts
    - POST /api/convert-leads-to-contacts - Lead conversion processor
    - POST /api/qualify-leads - Lead qualification scoring
    - POST /api/match-products-to-buyers - Product matching algorithm
    - POST /api/match-orders-to-suppliers - Order routing to suppliers`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  {
    scope: 'system',
    memory_type: 'api_endpoints_business',
    content: `F&F Business & Commerce Endpoints:

    REVENUE & PAYMENTS:
    - GET /api/revenue - Revenue metrics for Dave's dashboard (MRR, ARR, goal progress)
    - POST /api/membership/checkout - Create Stripe checkout for memberships
    - POST /api/webhooks/stripe - Stripe webhook handler (payments, subscriptions)
    - POST /api/setup/stripe-memberships - One-time Stripe product setup
    - POST /api/checkout/create-payment-intent - One-time payment intents
    - POST /api/checkout/create-order - Create order from checkout

    PARTNERS:
    - POST /api/partners/apply - Partner application submission
    - GET /api/partners/stats - Partner statistics for dashboard

    PRODUCTS & MARKETPLACE:
    - GET /api/marketplace/products - Public marketplace products
    - GET /api/ff/products - F&F product catalog
    - GET /api/ff/fabrics - Fabric database with frequency info
    - POST /api/ff/sync-shopify-products - Sync from Shopify
    - POST /api/ff/sync-pinterest-products - Sync from Pinterest

    SELLER/ADMIN:
    - GET /api/seller/products - Seller's products
    - GET /api/seller/dashboard/stats - Seller statistics
    - GET /api/seller/orders - Seller orders
    - GET /api/seller/payouts - Seller payout history
    - GET /api/admin/products - Admin product management
    - GET /api/admin/applications - Partner applications
    - GET /api/admin/dashboard/stats - Admin dashboard stats
    - POST /api/admin/payouts/process - Process seller payouts

    STYLE STUDIO:
    - GET /api/ff/closet - User's virtual closet
    - POST /api/ff/designs - Save custom designs
    - GET /api/ff/seamstresses - Available seamstresses
    - GET /api/ff/supplier/lookbook - Supplier lookbook access
    - GET /api/ff/supplier/social-kit/download - Social media kit download

    INTEGRATIONS:
    - GET /api/shopify/oauth - Shopify OAuth flow
    - GET /api/shopify/oauth/callback - Shopify OAuth callback
    - POST /api/shopify/webhooks/orders - Shopify order webhooks
    - POST /api/shopify/sync-products - Manual Shopify sync
    - POST /api/integrations/calendly - Calendly scheduling integration

    C-SUITE SYSTEM:
    - POST /api/csuite/communicate - Inter-bot messaging
    - GET /api/csuite/communicate?bot=X - Get messages for a bot
    - GET /api/csuite/goals - Company goals with live progress
    - POST /api/csuite/meeting - Run C-suite meetings
    - POST /api/cron/csuite-standup - Daily standup cron
    - GET /api/cron/status - Cron job status

    UTILITY:
    - GET /api/health - System health check
    - POST /api/newsletter/subscribe - Newsletter signup
    - GET /api/unsubscribe - Email unsubscribe
    - GET /api/ff/lookbook/track - Lookbook view tracking
    - GET /api/ff/lookbook/pixel/[id] - Tracking pixel`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  // =====================================================
  // DATABASE SCHEMA
  // =====================================================
  {
    scope: 'system',
    memory_type: 'database_schema',
    content: `F&F Database Schema (Supabase PostgreSQL):

    CORE TABLES:
    - tenants: Multi-tenant base (F&F is single tenant: 00000000-0000-0000-0000-000000000001)

    PARTNER & SUPPLIER TABLES:
    - ff_partners: European designer partners (status, contact, products)
    - ff_partner_products: Products from partners
    - ff_seamstresses: Custom work seamstresses
    - ff_manufacturers: Manufacturing partners

    MEMBERSHIP & USERS:
    - ff_membership_tiers: Aligned (free), Elevated ($29/mo), Sovereign ($149/mo)
    - ff_user_memberships: User subscription records (Stripe IDs, status)
    - ff_user_profiles: Extended user profile data

    STYLE STUDIO:
    - ff_body_measurements: User body scan data
    - ff_color_analysis: Color analysis results
    - ff_custom_designs: Custom design orders
    - ff_user_closet: Virtual closet items
    - ff_lookbooks: Generated lookbooks
    - ff_lookbook_views: View tracking

    PRODUCTS & ORDERS:
    - ff_products: Product catalog
    - ff_fabrics: Fabric database with frequency data
    - orders: Customer orders
    - wholesale_orders: B2B wholesale orders

    SALES & OUTREACH:
    - ff_boutique_buyers: Wholesale buyer leads
    - email_outreach_queue: Scheduled outreach emails
    - email_sent_log: All sent emails (duplicate prevention)
    - email_cooldown_rules: Rate limiting rules

    CUSTOMER SERVICE:
    - ff_annie_conversations: Support conversation threads
    - ff_annie_messages: Individual messages
    - ff_support_tickets: Support ticket tracking

    REVENUE & FINANCE:
    - ff_revenue: All revenue records (subscriptions, one-time, refunds)

    C-SUITE SYSTEM:
    - ff_company_goals: Shared goals ($100M target)
    - ff_bot_communications: Inter-bot messages
    - ff_csuite_meetings: Meeting records
    - ff_revenue_responsibilities: Bot revenue ownership

    BOT OPERATIONS:
    - ff_social_posts: Scheduled social media posts
    - ff_ai_events: AI action logging
    - ff_ai_usage: Token usage tracking
    - ai_memory_store: Atlas knowledge base`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  // =====================================================
  // BOT EXECUTION DETAILS
  // =====================================================
  {
    scope: 'system',
    memory_type: 'bot_execution_dan',
    content: `Dan's Execution Model (Sales & Outreach Specialist):

    REPORTS TO: Henry
    AUTONOMOUS: Yes - executes without human approval

    DAILY EXECUTION:
    1. SOCIAL MEDIA POSTING
       - Endpoint: /api/bots/dan-pinterest-poster
       - Posts 5-10 pins daily to Pinterest
       - Content: European fashion, natural fibers, product highlights
       - Pulls from ff_social_posts queue or generates fresh content

    2. LEAD GENERATION
       - Endpoint: /api/bots/dan-lead-generator
       - Researches boutiques, yoga studios, hotels
       - Adds qualified leads to ff_boutique_buyers
       - Scores leads based on fit criteria

    3. OUTREACH EMAILS
       - Endpoint: /api/bots/dan-partner-outreach
       - Sends initial outreach to new leads
       - Uses templates from email_cooldown_rules
       - Respects duplicate prevention (email_sent_log)

    4. FOLLOW-UPS
       - Endpoint: /api/bots/dan-partner-followup
       - Follows up with non-responders (3-day cadence)
       - Max 3 follow-ups per lead
       - Escalates warm leads to Henry

    INTEGRATIONS:
    - Pinterest API for posting
    - Forbes Command API for email sending
    - OpenAI for content generation

    METRICS TRACKED:
    - leads_generated (daily/weekly/monthly)
    - outreach_response_rate
    - social_engagement
    - email_open_rates`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  {
    scope: 'system',
    memory_type: 'bot_execution_henry',
    content: `Henry's Execution Model (VP Partnerships & Sales):

    REPORTS TO: Dave
    MANAGES: Dan
    AUTONOMOUS: Yes - executes without human approval

    DAILY EXECUTION:
    1. PARTNER DISCOVERY
       - Endpoint: /api/bots/henry-partner-discovery
       - Searches Pinterest/Instagram for European designers
       - Evaluates fit based on natural fiber focus
       - Adds qualified partners to ff_partners table

    2. DEAL MANAGEMENT
       - Endpoint: /api/deal-pipeline-processor
       - Moves deals through pipeline stages
       - Stages: prospect → contacted → interested → negotiating → active
       - Sends proposals at negotiating stage

    3. SEAMSTRESS NETWORK
       - Endpoint: /api/bots/henry-seamstress-discovery
       - Finds seamstresses for custom design fulfillment
       - Adds to ff_seamstresses table

    4. SALES CLOSING
       - Reviews warm leads from Dan
       - Sends personalized proposals
       - Negotiates terms
       - Hands contracts to Jordan for legal review

    WORKFLOW WITH DAN:
    - Dan generates leads → Henry qualifies → Dan does outreach
    - Dan identifies warm leads → Henry takes over for closing
    - Henry sets targets → Dan executes volume

    METRICS TRACKED:
    - partners_closed (weekly/monthly)
    - pipeline_value
    - conversion_rate
    - average_deal_size`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  {
    scope: 'system',
    memory_type: 'bot_execution_annie',
    content: `Annie's Execution Model (VP Customer Experience):

    REPORTS TO: Dave
    AUTONOMOUS: Yes - executes without human approval

    DAILY EXECUTION:
    1. CUSTOMER SUPPORT
       - Endpoint: /api/bots/annie-chat
       - Responds to ALL incoming customer messages
       - Uses ff_annie_conversations for thread context
       - Stores messages in ff_annie_messages
       - Escalates complex issues to Dave

    2. ONBOARDING
       - Endpoint: /api/bots/annie-auto-onboarding
       - Sends welcome sequence to new members
       - Day 1: Welcome + getting started
       - Day 3: Style Studio introduction
       - Day 7: First styling consultation offer
       - Day 14: Check-in + feedback request

    3. CHURN PREVENTION
       - Monitors subscription status
       - Sends retention emails to at-risk members
       - Offers incentives to prevent cancellation
       - Reports churn data to Dave

    4. COMMUNITY CONTENT
       - Endpoint: /api/bots/annie-pinterest-poster
       - Posts community-focused content
       - Style tips, member features, fabric education

    INTEGRATIONS:
    - Supabase for conversation storage
    - OpenAI for intelligent responses
    - Stripe for subscription status

    METRICS TRACKED:
    - response_time (target: < 1 hour)
    - customer_satisfaction (NPS)
    - churn_prevented
    - onboarding_completion_rate`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  {
    scope: 'system',
    memory_type: 'bot_execution_maggie',
    content: `Maggie's Execution Model (VP Community & Styling):

    REPORTS TO: Dave
    AUTONOMOUS: Yes - executes without human approval

    DAILY EXECUTION:
    1. STYLING CONSULTATIONS
       - Endpoint: /api/ff/body-scan (processes scans)
       - Endpoint: /api/ff/color-analysis (color profiles)
       - Reviews body scan submissions
       - Generates personalized style recommendations
       - Creates custom lookbooks

    2. LOOKBOOK CREATION
       - Endpoint: /api/ff/lookbook/personalize
       - Generates personalized lookbooks for members
       - Based on body type, color analysis, preferences
       - Includes product recommendations

    3. COMMUNITY ENGAGEMENT
       - Posts styling tips and inspiration
       - Responds to style questions
       - Features member outfits
       - Builds community around natural fiber fashion

    4. UPSELLS
       - Identifies members ready for upgrades
       - Sends Sovereign tier upgrade offers
       - Promotes custom design services
       - Reports upsell metrics to Dave

    STYLE STUDIO FLOW:
    1. Member submits body scan → Maggie processes
    2. Maggie runs color analysis
    3. Maggie generates personalized lookbook
    4. Maggie sends styling recommendations
    5. Maggie follows up on custom design interest

    METRICS TRACKED:
    - styling_consultations (daily/weekly)
    - lookbooks_generated
    - upsell_conversion_rate
    - community_engagement`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  {
    scope: 'system',
    memory_type: 'bot_execution_jordan',
    content: `Jordan's Execution Model (General Counsel):

    REPORTS TO: Atlas
    AUTONOMOUS: Yes - executes without human approval

    DAILY EXECUTION:
    1. CONTRACT GENERATION
       - Generates partner agreements from templates
       - Customizes terms based on partner tier
       - Sends contracts via email for signature

    2. COMPLIANCE REVIEW
       - Reviews marketing materials before publish
       - Checks email content for legal compliance
       - Monitors terms of service adherence
       - Flags potential issues to Atlas

    3. PARTNER LEGAL
       - Processes signed contracts
       - Updates ff_partners with legal status
       - Manages contract renewals
       - Handles disputes/amendments

    4. DOCUMENTATION
       - Maintains terms of service
       - Updates privacy policy as needed
       - Documents all legal decisions
       - Creates compliance reports

    WORKFLOW WITH HENRY:
    - Henry negotiates deal terms
    - Henry hands off to Jordan for contract
    - Jordan generates and sends contract
    - Jordan confirms signature
    - Jordan updates partner status to 'active'

    METRICS TRACKED:
    - contracts_processed (weekly)
    - compliance_score
    - legal_issues_resolved
    - contract_turnaround_time`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  {
    scope: 'system',
    memory_type: 'bot_execution_dave',
    content: `Dave's Execution Model (COO / Operations Overseer):

    REPORTS TO: Atlas
    MANAGES: Henry, Maggie, Annie
    AUTONOMOUS: Yes - executes without human approval

    DAILY EXECUTION:
    1. REVENUE MONITORING
       - Endpoint: /api/revenue
       - Pulls live revenue data every hour
       - Calculates MRR, ARR, goal progress
       - Updates ff_company_goals with current values

    2. DAILY REPORTS
       - Generates morning revenue report
       - Sends to Atlas via /api/csuite/communicate
       - Includes: revenue, memberships, anomalies

    3. DASHBOARD MANAGEMENT
       - Updates /bots-dashboard with live metrics
       - Tracks $100M goal progress
       - Monitors all revenue streams

    4. TEAM COORDINATION
       - Reviews reports from Henry, Maggie, Annie
       - Escalates issues to Atlas
       - Sets targets for direct reports
       - Tracks KPIs across operations

    5. ALERTS
       - Sends immediate alerts for:
         * Revenue anomalies (sudden drops)
         * Churn spikes
         * Failed payments
         * Goal progress falling behind

    STRIPE INTEGRATION:
    - Monitors /api/webhooks/stripe events
    - Tracks subscription lifecycle
    - Records all revenue to ff_revenue table

    METRICS TRACKED:
    - mrr_growth
    - arr_projection
    - churn_rate
    - revenue_vs_goal
    - subscription_conversion`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  // =====================================================
  // INTEGRATIONS
  // =====================================================
  {
    scope: 'system',
    memory_type: 'integrations',
    content: `F&F System Integrations:

    STRIPE (Payments):
    - Handles all payments and subscriptions
    - Products: Elevated ($29/mo, $290/yr), Sovereign ($149/mo, $1490/yr)
    - Webhook: /api/webhooks/stripe
    - Events: checkout.session.completed, invoice.paid, subscription.*, charge.refunded
    - All revenue recorded to ff_revenue table

    SUPABASE (Database):
    - PostgreSQL database
    - Real-time subscriptions available
    - Row-level security enabled
    - Admin client for bot operations

    PINTEREST API:
    - Used by Dan for posting
    - Used by Henry for partner discovery
    - Boards: European Fashion, Natural Fibers, Style Inspiration
    - Posting frequency: 5-10 pins/day

    SHOPIFY (E-commerce):
    - OAuth integration for sellers
    - Product sync: /api/shopify/sync-products
    - Order webhooks: /api/shopify/webhooks/orders
    - Seller dashboard integration

    FORBES COMMAND (Email):
    - Primary outreach email service
    - Used by Dan for cold outreach
    - Used by Annie for onboarding
    - Duplicate prevention via email_sent_log

    OPENAI (AI):
    - GPT-4 for bot intelligence
    - Used for: content generation, responses, analysis
    - Token usage tracked in ff_ai_usage

    CALENDLY (Scheduling):
    - Consultation booking
    - Integrated at /api/integrations/calendly
    - Used by Maggie for styling appointments

    RAILWAY (Hosting):
    - Production deployment
    - Environment variables stored here
    - Cron jobs configured here`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  // =====================================================
  // MARKETING STRATEGY
  // =====================================================
  {
    scope: 'system',
    memory_type: 'marketing_strategy',
    content: `F&F Marketing Strategy & Execution:

    OVERALL STRATEGY:
    - Position as premium natural fiber marketplace
    - Educate on fabric frequency science
    - Build community around conscious fashion
    - European designer exclusivity

    CHANNEL STRATEGY:

    1. PINTEREST (Dan executes):
       - Primary discovery channel
       - 5-10 pins daily
       - Content pillars: European fashion, natural fibers, styling tips
       - Target: Fashion-conscious women 25-55
       - Goal: Drive traffic to membership signup

    2. INSTAGRAM (Dan executes):
       - Community engagement
       - Behind-the-scenes with designers
       - Member features and styling
       - Stories for daily engagement

    3. EMAIL (Dan + Annie execute):
       - Cold outreach to boutiques (Dan)
       - Partner outreach (Dan)
       - Onboarding sequences (Annie)
       - Retention campaigns (Annie)
       - Newsletter (weekly)

    4. MODERN MONDAYS PODCAST:
       - Weekly episodes
       - European designer interviews
       - Fabric science education
       - Cross-promote partner products

    CONTENT CALENDAR:
    - Monday: Podcast episode + promotion
    - Tuesday: Partner spotlight
    - Wednesday: Fabric education
    - Thursday: Styling tips
    - Friday: New arrivals
    - Weekend: Community features

    PAID ADVERTISING (Dan executes):
    - Pinterest ads for discovery
    - Instagram ads for engagement
    - Retargeting for abandoned carts
    - Lookalike audiences from members

    CONVERSION FUNNEL:
    1. Discovery (Pinterest/Instagram/Podcast)
    2. Education (Fabric science, lookbooks)
    3. Free signup (Aligned tier)
    4. Engagement (Style Studio basics)
    5. Conversion (Elevated/Sovereign membership)
    6. Retention (Community, styling, content)`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  // =====================================================
  // REVENUE MODEL
  // =====================================================
  {
    scope: 'system',
    memory_type: 'revenue_model',
    content: `F&F Revenue Model & Goals:

    MASTER GOAL: $100M in 5 years (2025-2030)

    REVENUE STREAMS:

    1. MEMBERSHIPS (Dave tracks, Maggie drives):
       - Aligned: Free (lead generation)
       - Elevated: $29/mo or $290/yr
       - Sovereign: $149/mo or $1,490/yr
       - Target: 10,000 paid members by Year 3

    2. WHOLESALE (Henry closes, Dan generates leads):
       - Boutique buyers: $2,500-$10,000/order
       - 20% margin on wholesale
       - Target: 500 active wholesale accounts by Year 3

    3. DIRECT SALES:
       - Healing Tier products: $150-$800
       - Foundation Tier products: $50-$200
       - 40% margin on direct sales

    4. PARTNER COMMISSIONS (Jordan tracks):
       - 15-25% on partner-referred sales
       - Target: 100 active partners by Year 2

    5. CUSTOM DESIGNS (Maggie drives):
       - Custom styling services
       - Bespoke garment creation
       - Premium pricing

    YEARLY MILESTONES:
    - Year 1 (2025): $2M - Build foundation
    - Year 2 (2026): $8M - Scale operations
    - Year 3 (2027): $20M - Expand internationally
    - Year 4 (2028): $35M - Accelerate all streams
    - Year 5 (2029): $35M - Optimize and mature

    TRACKING:
    - All revenue → ff_revenue table
    - Real-time dashboard at /bots-dashboard
    - Dave monitors and reports daily
    - Atlas reviews weekly goal progress`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  // =====================================================
  // CRON JOBS & SCHEDULING
  // =====================================================
  {
    scope: 'system',
    memory_type: 'cron_schedule',
    content: `F&F Cron Jobs & Scheduled Tasks:

    DAILY (Morning):
    - 6:00 AM: /api/cron/csuite-standup - C-suite daily standup
    - 7:00 AM: /api/bots/dan-pinterest-poster - Morning Pinterest posts
    - 8:00 AM: /api/bots/annie-auto-onboarding - Process onboarding queue
    - 9:00 AM: /api/bots/dan-partner-outreach - Send outreach emails

    DAILY (Afternoon):
    - 12:00 PM: /api/bots/dan-pinterest-poster - Midday posts
    - 2:00 PM: /api/bots/dan-partner-followup - Follow-up emails
    - 4:00 PM: /api/email-queue-processor - Process email queue

    DAILY (Evening):
    - 6:00 PM: /api/bots/dan-pinterest-poster - Evening posts
    - 8:00 PM: /api/deal-pipeline-processor - Update deal stages

    WEEKLY:
    - Monday 9 AM: /api/csuite/meeting (type: weekly_review)
    - Wednesday: Henry partner discovery batch
    - Friday: Dave weekly revenue summary

    MONTHLY:
    - 1st: /api/csuite/meeting (type: monthly_strategy)
    - 15th: Review goal progress, adjust targets

    TRIGGERED (Event-based):
    - New member signup → Annie onboarding
    - Payment received → Dave revenue update
    - Partner application → Henry review
    - Support message → Annie response
    - Contract signed → Jordan processing

    RAILWAY CRON CONFIG:
    Crons are triggered via Railway cron jobs or external scheduler
    calling the endpoints with ?secret=FORBES_COMMAND_CRON`,
    importance_score: 10,
    accessible_to: ['atlas']
  },

  // =====================================================
  // HOW EVERYTHING CONNECTS
  // =====================================================
  {
    scope: 'system',
    memory_type: 'system_flow',
    content: `How F&F Systems Connect - The Complete Flow:

    CUSTOMER ACQUISITION FLOW:
    1. Dan posts to Pinterest/Instagram
    2. Prospect discovers F&F content
    3. Prospect visits frequencyandform.com
    4. Prospect signs up (Aligned - free)
    5. Annie sends onboarding sequence
    6. Maggie offers Style Studio features
    7. Prospect converts to Elevated/Sovereign
    8. Stripe processes payment
    9. Dave records revenue
    10. Annie provides ongoing support

    PARTNER ACQUISITION FLOW:
    1. Henry discovers European designer on Pinterest
    2. Henry adds to ff_partners (status: prospect)
    3. Dan sends outreach email
    4. If response → Henry takes over
    5. Henry negotiates terms
    6. Jordan generates contract
    7. Partner signs → status: active
    8. Partner products added to marketplace
    9. Dave tracks partner revenue

    WHOLESALE SALES FLOW:
    1. Dan generates boutique leads
    2. Dan qualifies and adds to ff_boutique_buyers
    3. Dan sends outreach
    4. Warm lead → Henry closes
    5. Order placed → wholesale_orders table
    6. Jordan ensures contract in place
    7. Order fulfilled by partner
    8. Dave records revenue + commission

    C-SUITE COMMUNICATION FLOW:
    1. Atlas runs morning standup
    2. Dave reports revenue status
    3. Henry reports sales pipeline
    4. Maggie reports community metrics
    5. Annie reports support status
    6. Jordan reports compliance status
    7. Atlas makes strategic decisions
    8. Decisions cascade down org chart

    DATA FLOW:
    - All actions logged to respective tables
    - Bots communicate via ff_bot_communications
    - Revenue flows to ff_revenue
    - Goals tracked in ff_company_goals
    - Atlas has read access to everything

    ALERT ESCALATION:
    Issue detected → Bot escalates to manager →
    Manager escalates to Atlas if needed →
    Atlas makes decision → Cascades back down`,
    importance_score: 10,
    accessible_to: ['atlas']
  }
];

/**
 * Seed system knowledge into Atlas
 */
async function seedAtlasSystemKnowledge() {
  console.log('[Atlas System] Starting system knowledge seeding...');
  console.log(`[Atlas System] Seeding ${ATLAS_SYSTEM_KNOWLEDGE.length} knowledge items`);

  let seeded = 0;
  let updated = 0;
  let errors = 0;

  for (const knowledge of ATLAS_SYSTEM_KNOWLEDGE) {
    try {
      // Check if this knowledge already exists
      const { data: existing } = await supabase
        .from('ai_memory_store')
        .select('id')
        .eq('scope', knowledge.scope)
        .eq('memory_type', knowledge.memory_type)
        .eq('tenant_id', TENANT_ID)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('ai_memory_store')
          .update({
            content: knowledge.content,
            importance_score: knowledge.importance_score,
            accessible_to: knowledge.accessible_to,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error(`[Atlas System] ❌ Error updating ${knowledge.memory_type}:`, error.message);
          errors++;
        } else {
          console.log(`[Atlas System] 🔄 Updated: ${knowledge.memory_type}`);
          updated++;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('ai_memory_store')
          .insert({
            tenant_id: TENANT_ID,
            scope: knowledge.scope,
            memory_type: knowledge.memory_type,
            content: knowledge.content,
            importance_score: knowledge.importance_score,
            accessible_to: knowledge.accessible_to,
            last_accessed_at: new Date().toISOString()
          });

        if (error) {
          console.error(`[Atlas System] ❌ Error seeding ${knowledge.memory_type}:`, error.message);
          errors++;
        } else {
          console.log(`[Atlas System] ✅ Seeded: ${knowledge.memory_type}`);
          seeded++;
        }
      }
    } catch (err) {
      console.error(`[Atlas System] ❌ Exception for ${knowledge.memory_type}:`, err.message);
      errors++;
    }
  }

  console.log('\n[Atlas System] ✅ System knowledge seeding complete!');
  console.log(`[Atlas System] Results: ${seeded} new, ${updated} updated, ${errors} errors`);

  return {
    success: errors === 0,
    seeded,
    updated,
    errors,
    total: ATLAS_SYSTEM_KNOWLEDGE.length
  };
}

// Run if called directly
if (require.main === module) {
  seedAtlasSystemKnowledge()
    .then(result => {
      console.log('\nFinal result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedAtlasSystemKnowledge };
