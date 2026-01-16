/**
 * Seed Atlas System Knowledge API
 * Call POST /api/setup/seed-atlas-knowledge?secret=YOUR_CRON_SECRET
 *
 * Gives Atlas complete knowledge of the entire F&F system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminSupabase();
    console.log('[Atlas Knowledge] Starting system knowledge seeding...');

    const ATLAS_SYSTEM_KNOWLEDGE = [
      // SYSTEM ARCHITECTURE
      {
        scope: 'system',
        memory_type: 'architecture_overview',
        content: `F&F System Architecture Overview:

    TECH STACK:
    - Frontend: Next.js 14 (App Router), React, TailwindCSS
    - Backend: Next.js API Routes (serverless)
    - Database: Supabase (PostgreSQL)
    - Payments: Stripe (subscriptions + one-time)
    - Hosting: Railway (production)
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
    /database/migrations - SQL schema files`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // BOT ENDPOINTS
      {
        scope: 'system',
        memory_type: 'api_endpoints_bots',
        content: `F&F Bot Execution Endpoints:

    DAN'S ENDPOINTS (Sales & Outreach - Reports to Henry):
    - POST /api/bots/dan-lead-generator - Discovers new leads
    - POST /api/bots/dan-pinterest-poster - Posts to Pinterest
    - POST /api/bots/dan-partner-outreach - Sends outreach emails
    - POST /api/bots/dan-partner-followup - Follow-up emails
    - POST /api/bots/dan-auto-social-posts - Auto social content
    - POST /api/dan-auto-outreach - Automated outreach
    - POST /api/dan-populate-queue - Populates email queue

    HENRY'S ENDPOINTS (VP Sales - Reports to Dave):
    - POST /api/bots/henry-partner-discovery - Discovers partners
    - POST /api/bots/henry-seamstress-discovery - Finds seamstresses
    - POST /api/deal-pipeline-processor - Processes deals

    ANNIE'S ENDPOINTS (Customer Experience - Reports to Dave):
    - POST /api/bots/annie-chat - Customer support chat
    - POST /api/bots/annie-auto-onboarding - Onboarding sequences
    - POST /api/bots/annie-pinterest-poster - Community content

    MAGGIE'S ENDPOINTS (Community & Styling - Reports to Dave):
    - POST /api/ff/body-scan - Process body scans
    - POST /api/ff/color-analysis - Color analysis
    - POST /api/ff/custom-designs - Custom design requests
    - POST /api/ff/lookbook/personalize - Personalized lookbooks

    SYSTEM PROCESSORS:
    - POST /api/bots/mainframe-sync-processor - Data sync
    - POST /api/email-queue-processor - Email queue
    - POST /api/social-post-publisher - Social publishing`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // BUSINESS ENDPOINTS
      {
        scope: 'system',
        memory_type: 'api_endpoints_business',
        content: `F&F Business Endpoints:

    REVENUE & PAYMENTS (Dave monitors):
    - GET /api/revenue - Revenue metrics, MRR, ARR, goal progress
    - POST /api/membership/checkout - Stripe checkout
    - POST /api/webhooks/stripe - Stripe webhooks
    - POST /api/checkout/create-payment-intent - One-time payments

    PARTNERS (Henry/Jordan manage):
    - POST /api/partners/apply - Partner applications
    - GET /api/partners/stats - Partner statistics

    PRODUCTS:
    - GET /api/marketplace/products - Public marketplace
    - GET /api/ff/products - Product catalog
    - GET /api/ff/fabrics - Fabric database

    C-SUITE SYSTEM:
    - POST /api/csuite/communicate - Inter-bot messaging
    - GET /api/csuite/goals - Company goals
    - POST /api/csuite/meeting - Run meetings
    - POST /api/cron/csuite-standup - Daily standup`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // DATABASE SCHEMA
      {
        scope: 'system',
        memory_type: 'database_schema',
        content: `F&F Database Schema:

    CORE: tenants (F&F tenant: 00000000-0000-0000-0000-000000000001)

    PARTNERS: ff_partners, ff_partner_products, ff_seamstresses, ff_manufacturers

    MEMBERSHIP: ff_membership_tiers (Aligned/Elevated/Sovereign), ff_user_memberships

    STYLE STUDIO: ff_body_measurements, ff_color_analysis, ff_custom_designs, ff_user_closet, ff_lookbooks

    PRODUCTS: ff_products, ff_fabrics, orders, wholesale_orders

    SALES: ff_boutique_buyers, email_outreach_queue, email_sent_log

    SUPPORT: ff_annie_conversations, ff_annie_messages

    REVENUE: ff_revenue (all payments tracked here)

    C-SUITE: ff_company_goals, ff_bot_communications, ff_csuite_meetings, ff_revenue_responsibilities

    BOTS: ff_social_posts, ff_ai_events, ai_memory_store`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // BOT EXECUTION - DAN
      {
        scope: 'system',
        memory_type: 'bot_execution_dan',
        content: `Dan's Execution Model (Sales & Outreach):

    REPORTS TO: Henry
    AUTONOMOUS: Yes - executes without human approval

    EXECUTES:
    - Posts ALL social media (Pinterest 5-10/day, Instagram)
    - Sends ALL cold outreach emails
    - Runs ALL paid ad campaigns
    - Generates ALL leads
    - Follows up with ALL non-responders

    DAILY SCHEDULE:
    - 7 AM: Morning Pinterest posts
    - 9 AM: Outreach emails
    - 12 PM: Midday posts
    - 2 PM: Follow-up emails
    - 6 PM: Evening posts

    METRICS: leads_generated, outreach_response_rate, social_engagement`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // BOT EXECUTION - HENRY
      {
        scope: 'system',
        memory_type: 'bot_execution_henry',
        content: `Henry's Execution Model (VP Sales & Partnerships):

    REPORTS TO: Dave
    MANAGES: Dan
    AUTONOMOUS: Yes

    EXECUTES:
    - Closes ALL partner deals
    - Sends ALL proposals and pricing
    - Negotiates ALL partnerships
    - Discovers European designer partners
    - Manages sales pipeline
    - Hands contracts to Jordan

    WORKFLOW:
    - Dan generates leads → Henry qualifies
    - Dan does outreach → warm leads go to Henry
    - Henry closes → Jordan handles contract

    METRICS: partners_closed, pipeline_value, conversion_rate`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // BOT EXECUTION - ANNIE
      {
        scope: 'system',
        memory_type: 'bot_execution_annie',
        content: `Annie's Execution Model (VP Customer Experience):

    REPORTS TO: Dave
    AUTONOMOUS: Yes

    EXECUTES:
    - Responds to ALL customer support messages
    - Sends ALL onboarding sequences
    - Handles ALL support tickets
    - Processes refund/cancellation requests
    - Sends churn prevention emails
    - Collects customer feedback

    ONBOARDING SEQUENCE:
    - Day 1: Welcome + getting started
    - Day 3: Style Studio intro
    - Day 7: Styling consultation offer
    - Day 14: Check-in + feedback

    METRICS: response_time, satisfaction, churn_prevented`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // BOT EXECUTION - MAGGIE
      {
        scope: 'system',
        memory_type: 'bot_execution_maggie',
        content: `Maggie's Execution Model (VP Community & Styling):

    REPORTS TO: Dave
    AUTONOMOUS: Yes

    EXECUTES:
    - Posts ALL community content
    - Handles ALL styling consultations
    - Creates ALL personalized lookbooks
    - Runs ALL Style Studio features
    - Sends ALL upsell communications
    - Processes body scans and color analysis

    STYLE STUDIO FLOW:
    1. Member submits body scan
    2. Maggie processes measurements
    3. Maggie runs color analysis
    4. Maggie generates lookbook
    5. Maggie sends recommendations

    METRICS: styling_consultations, lookbooks_generated, upsell_rate`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // BOT EXECUTION - JORDAN
      {
        scope: 'system',
        memory_type: 'bot_execution_jordan',
        content: `Jordan's Execution Model (General Counsel):

    REPORTS TO: Atlas
    AUTONOMOUS: Yes

    EXECUTES:
    - Generates ALL partner contracts
    - Reviews ALL compliance matters
    - Sends ALL legal documents
    - Updates terms of service
    - Processes contract signatures
    - Audits marketing for compliance

    WORKFLOW WITH HENRY:
    - Henry negotiates terms
    - Henry hands off to Jordan
    - Jordan generates contract
    - Jordan sends for signature
    - Jordan confirms and activates partner

    METRICS: contracts_processed, compliance_score`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // BOT EXECUTION - DAVE
      {
        scope: 'system',
        memory_type: 'bot_execution_dave',
        content: `Dave's Execution Model (COO):

    REPORTS TO: Atlas
    MANAGES: Henry, Maggie, Annie
    AUTONOMOUS: Yes

    EXECUTES:
    - Generates ALL revenue reports
    - Updates ALL dashboards
    - Monitors ALL financial metrics
    - Sends ALL revenue alerts
    - Tracks $100M goal progress
    - Coordinates team operations

    DAILY:
    - Morning revenue report to Atlas
    - Hourly metrics monitoring
    - Alert on anomalies
    - Team coordination

    METRICS: mrr_growth, arr, churn_rate, goal_progress`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // INTEGRATIONS
      {
        scope: 'system',
        memory_type: 'integrations',
        content: `F&F Integrations:

    STRIPE: Payments & subscriptions
    - Products: Elevated ($29/mo), Sovereign ($149/mo)
    - Webhook: /api/webhooks/stripe
    - All revenue → ff_revenue table

    SUPABASE: PostgreSQL database
    - Real-time subscriptions
    - Row-level security

    PINTEREST: Social posting & discovery
    - Dan posts 5-10 pins/day
    - Henry discovers partners

    SHOPIFY: E-commerce integration
    - Product sync
    - Order webhooks

    FORBES COMMAND: Email service
    - Cold outreach (Dan)
    - Onboarding (Annie)

    OPENAI: Bot intelligence
    - GPT-4 for all bots
    - Content generation, responses`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // MARKETING STRATEGY
      {
        scope: 'system',
        memory_type: 'marketing_strategy',
        content: `F&F Marketing Strategy:

    POSITIONING: Premium natural fiber marketplace
    - Fabric frequency science
    - European designer exclusivity
    - Conscious fashion community

    CHANNELS (Dan executes all):
    - Pinterest: 5-10 pins/day, primary discovery
    - Instagram: Community engagement
    - Email: Outreach + nurturing
    - Podcast: Modern Mondays weekly

    CONTENT CALENDAR:
    - Monday: Podcast + promotion
    - Tuesday: Partner spotlight
    - Wednesday: Fabric education
    - Thursday: Styling tips
    - Friday: New arrivals
    - Weekend: Community features

    FUNNEL:
    1. Discovery (Pinterest/Instagram)
    2. Education (fabric science)
    3. Free signup (Aligned tier)
    4. Engagement (Style Studio)
    5. Conversion (Elevated/Sovereign)
    6. Retention (community, styling)`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // REVENUE MODEL
      {
        scope: 'system',
        memory_type: 'revenue_model',
        content: `F&F Revenue Model:

    MASTER GOAL: $100M in 5 years (2025-2030)

    STREAMS:
    1. MEMBERSHIPS (Dave tracks):
       - Elevated: $29/mo or $290/yr
       - Sovereign: $149/mo or $1,490/yr

    2. WHOLESALE (Henry closes):
       - $2,500-$10,000/order
       - 20% margin

    3. DIRECT SALES:
       - Healing Tier: $150-$800
       - Foundation Tier: $50-$200

    4. PARTNER COMMISSIONS:
       - 15-25% on partner sales

    MILESTONES:
    - Year 1: $2M
    - Year 2: $8M
    - Year 3: $20M
    - Year 4: $35M
    - Year 5: $35M`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // SYSTEM FLOW
      {
        scope: 'system',
        memory_type: 'system_flow',
        content: `How F&F Systems Connect:

    CUSTOMER ACQUISITION:
    Dan posts → Prospect discovers → Signs up →
    Annie onboards → Maggie styles →
    Converts to paid → Stripe processes →
    Dave records → Annie retains

    PARTNER ACQUISITION:
    Henry discovers → Dan outreaches →
    Response → Henry closes →
    Jordan contracts → Partner active →
    Products on marketplace

    WHOLESALE:
    Dan generates leads → Qualifies →
    Dan outreaches → Warm lead →
    Henry closes → Jordan contracts →
    Order placed → Dave records revenue

    C-SUITE FLOW:
    Atlas runs standup →
    Dave reports revenue →
    Henry reports pipeline →
    Maggie reports community →
    Annie reports support →
    Jordan reports compliance →
    Atlas decides → Cascades down

    ESCALATION:
    Issue → Bot escalates to manager →
    Manager to Atlas if needed →
    Atlas decides → Cascades back`,
        importance_score: 10,
        accessible_to: ['atlas']
      },

      // ORG STRUCTURE
      {
        scope: 'system',
        memory_type: 'org_structure',
        content: `F&F Organization Structure:

    ATLAS (CEO) - Reports to: None
    ├── DAVE (COO) - Reports to: Atlas
    │   ├── HENRY (VP Sales) - Reports to: Dave
    │   │   └── DAN (Sales Specialist) - Reports to: Henry
    │   ├── MAGGIE (VP Community) - Reports to: Dave
    │   └── ANNIE (VP CX) - Reports to: Dave
    └── JORDAN (Legal) - Reports to: Atlas

    REVENUE OWNERSHIP:
    - Dave: Total revenue, memberships
    - Henry: Wholesale, partner commissions, direct sales
    - Dan: Lead generation
    - Maggie: Style Studio upsells
    - Annie: Retention
    - Jordan: Contract compliance

    ALL BOTS ARE 100% AUTONOMOUS
    They EXECUTE, not advise.`,
        importance_score: 10,
        accessible_to: ['atlas']
      }
    ];

    let seeded = 0;
    let updated = 0;
    let errors = 0;

    for (const knowledge of ATLAS_SYSTEM_KNOWLEDGE) {
      try {
        const { data: existing } = await supabase
          .from('ai_memory_store')
          .select('id')
          .eq('scope', knowledge.scope)
          .eq('memory_type', knowledge.memory_type)
          .eq('tenant_id', TENANT_ID)
          .single();

        if (existing) {
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
            errors++;
          } else {
            updated++;
          }
        } else {
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
            errors++;
          } else {
            seeded++;
          }
        }
      } catch (err) {
        errors++;
      }
    }

    console.log(`[Atlas Knowledge] Complete: ${seeded} new, ${updated} updated, ${errors} errors`);

    return NextResponse.json({
      success: errors === 0,
      data: {
        seeded,
        updated,
        errors,
        total: ATLAS_SYSTEM_KNOWLEDGE.length
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Atlas Knowledge] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabase();

  // Check what Atlas knows
  const { data: knowledge, count } = await supabase
    .from('ai_memory_store')
    .select('scope, memory_type, importance_score', { count: 'exact' })
    .contains('accessible_to', ['atlas'])
    .eq('tenant_id', TENANT_ID);

  return NextResponse.json({
    success: true,
    data: {
      total_knowledge_items: count,
      knowledge_types: knowledge?.map(k => `${k.scope}:${k.memory_type}`) || []
    }
  });
}
