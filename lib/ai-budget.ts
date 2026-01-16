/**
 * AI Budget Management
 * Behind-the-scenes budget tracking tied to membership tiers
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-loaded Supabase client to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Tier budget defaults (fallback if DB lookup fails)
const TIER_BUDGETS = {
  aligned: {
    ai_calls_monthly: 5,
    body_scans: 1,
    color_analyses: 1,
    style_recommendations: 3,
    cost_budget_cents: 50
  },
  elevated: {
    ai_calls_monthly: 25,
    body_scans: 3,
    color_analyses: 3,
    style_recommendations: 20,
    cost_budget_cents: 500
  },
  sovereign: {
    ai_calls_monthly: 100,
    body_scans: 10,
    color_analyses: 10,
    style_recommendations: 80,
    cost_budget_cents: 2500
  }
};

export type AIFeatureType = 'body_scan' | 'color_analysis' | 'style_recommendation' | 'outfit_match';

export interface BudgetCheckResult {
  canProceed: boolean;
  remainingCalls: number;
  tierName: string;
  message: string;
}

export interface UsageRecord {
  userId?: string;
  email: string;
  sessionId?: string;
  featureType: AIFeatureType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * Check if user has remaining AI budget for a feature
 * This runs BEFORE making AI calls
 */
export async function checkAIBudget(
  email: string,
  featureType: AIFeatureType
): Promise<BudgetCheckResult> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const db = getSupabase();

    // Get user's membership tier
    const { data: membership } = await db
      .from('ff_user_memberships')
      .select('tier_id, ff_membership_tiers(slug, ai_calls_monthly, ai_body_scans_monthly, ai_color_analyses_monthly, ai_style_recommendations_monthly)')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    // Default to free tier
    const tierSlug = (membership?.ff_membership_tiers as { slug?: string })?.slug || 'aligned';
    const tierBudget = TIER_BUDGETS[tierSlug as keyof typeof TIER_BUDGETS] || TIER_BUDGETS.aligned;

    // Get feature-specific limit
    let limit: number;
    switch (featureType) {
      case 'body_scan':
        limit = tierBudget.body_scans;
        break;
      case 'color_analysis':
        limit = tierBudget.color_analyses;
        break;
      case 'style_recommendation':
      case 'outfit_match':
        limit = tierBudget.style_recommendations;
        break;
      default:
        limit = tierBudget.ai_calls_monthly;
    }

    // Get current month's usage
    const { data: usage } = await db
      .from('ff_ai_usage_monthly')
      .select('*')
      .eq('email', email)
      .eq('year', year)
      .eq('month', month)
      .single();

    let currentUsage = 0;
    if (usage) {
      switch (featureType) {
        case 'body_scan':
          currentUsage = usage.body_scan_calls || 0;
          break;
        case 'color_analysis':
          currentUsage = usage.color_analysis_calls || 0;
          break;
        case 'style_recommendation':
          currentUsage = usage.style_recommendation_calls || 0;
          break;
        case 'outfit_match':
          currentUsage = usage.outfit_match_calls || 0;
          break;
        default:
          currentUsage = usage.total_ai_calls || 0;
      }
    }

    const remainingCalls = Math.max(0, limit - currentUsage);
    const canProceed = currentUsage < limit;

    let message = 'OK';
    if (!canProceed) {
      message = `Your ${tierSlug} membership includes ${limit} ${featureType.replace('_', ' ')}${limit !== 1 ? 's' : ''} per month. Upgrade for more.`;
    } else if (currentUsage >= limit * 0.8) {
      message = `You've used ${currentUsage} of ${limit} ${featureType.replace('_', ' ')}${limit !== 1 ? 's' : ''} this month.`;
    }

    return {
      canProceed,
      remainingCalls,
      tierName: tierSlug,
      message
    };
  } catch (error) {
    console.error('[AI Budget] Error checking budget:', error);
    // On error, allow the call but log it
    return {
      canProceed: true,
      remainingCalls: 1,
      tierName: 'unknown',
      message: 'Budget check unavailable'
    };
  }
}

/**
 * Record AI usage after a successful (or failed) API call
 * This runs AFTER making AI calls
 */
export async function recordAIUsage(record: UsageRecord): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const db = getSupabase();

    // Get user's tier
    const { data: membership } = await db
      .from('ff_user_memberships')
      .select('tier_id, ff_membership_tiers(slug)')
      .eq('email', record.email)
      .eq('status', 'active')
      .single();

    const tierSlug = (membership?.ff_membership_tiers as { slug?: string })?.slug || 'aligned';

    // Insert detailed usage record
    await db.from('ff_ai_usage').insert({
      user_id: record.userId,
      email: record.email,
      session_id: record.sessionId,
      membership_tier: tierSlug,
      feature_type: record.featureType,
      model_used: record.model,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      total_tokens: record.inputTokens + record.outputTokens,
      cost_cents: record.costCents,
      request_duration_ms: record.durationMs,
      success: record.success,
      error_message: record.error
    });

    // Upsert monthly aggregation
    const { data: existingUsage } = await db
      .from('ff_ai_usage_monthly')
      .select('*')
      .eq('email', record.email)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (existingUsage) {
      // Update existing record
      const updates: Record<string, number> = {
        total_ai_calls: (existingUsage.total_ai_calls || 0) + 1,
        total_input_tokens: (existingUsage.total_input_tokens || 0) + record.inputTokens,
        total_output_tokens: (existingUsage.total_output_tokens || 0) + record.outputTokens,
        total_cost_cents: (existingUsage.total_cost_cents || 0) + record.costCents
      };

      // Increment feature-specific counter
      switch (record.featureType) {
        case 'body_scan':
          updates.body_scan_calls = (existingUsage.body_scan_calls || 0) + 1;
          break;
        case 'color_analysis':
          updates.color_analysis_calls = (existingUsage.color_analysis_calls || 0) + 1;
          break;
        case 'style_recommendation':
          updates.style_recommendation_calls = (existingUsage.style_recommendation_calls || 0) + 1;
          break;
        case 'outfit_match':
          updates.outfit_match_calls = (existingUsage.outfit_match_calls || 0) + 1;
          break;
      }

      await db
        .from('ff_ai_usage_monthly')
        .update(updates)
        .eq('id', existingUsage.id);
    } else {
      // Insert new monthly record
      await db.from('ff_ai_usage_monthly').insert({
        user_id: record.userId,
        email: record.email,
        year,
        month,
        total_ai_calls: 1,
        body_scan_calls: record.featureType === 'body_scan' ? 1 : 0,
        color_analysis_calls: record.featureType === 'color_analysis' ? 1 : 0,
        style_recommendation_calls: record.featureType === 'style_recommendation' ? 1 : 0,
        outfit_match_calls: record.featureType === 'outfit_match' ? 1 : 0,
        total_input_tokens: record.inputTokens,
        total_output_tokens: record.outputTokens,
        total_cost_cents: record.costCents
      });
    }

    console.log(`[AI Budget] Recorded ${record.featureType} usage for ${record.email}`);
  } catch (error) {
    console.error('[AI Budget] Error recording usage:', error);
    // Don't throw - usage tracking failures shouldn't break the app
  }
}

/**
 * Get user's current month usage summary
 */
export async function getUsageSummary(email: string): Promise<{
  tier: string;
  usage: {
    totalCalls: number;
    bodyScans: number;
    colorAnalyses: number;
    styleRecommendations: number;
    totalCostCents: number;
  };
  limits: {
    totalCalls: number;
    bodyScans: number;
    colorAnalyses: number;
    styleRecommendations: number;
    costBudgetCents: number;
  };
} | null> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const db = getSupabase();

    // Get membership tier
    const { data: membership } = await db
      .from('ff_user_memberships')
      .select('tier_id, ff_membership_tiers(slug)')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    const tierSlug = (membership?.ff_membership_tiers as { slug?: string })?.slug || 'aligned';
    const tierBudget = TIER_BUDGETS[tierSlug as keyof typeof TIER_BUDGETS] || TIER_BUDGETS.aligned;

    // Get current usage
    const { data: usage } = await db
      .from('ff_ai_usage_monthly')
      .select('*')
      .eq('email', email)
      .eq('year', year)
      .eq('month', month)
      .single();

    return {
      tier: tierSlug,
      usage: {
        totalCalls: usage?.total_ai_calls || 0,
        bodyScans: usage?.body_scan_calls || 0,
        colorAnalyses: usage?.color_analysis_calls || 0,
        styleRecommendations: usage?.style_recommendation_calls || 0,
        totalCostCents: usage?.total_cost_cents || 0
      },
      limits: {
        totalCalls: tierBudget.ai_calls_monthly,
        bodyScans: tierBudget.body_scans,
        colorAnalyses: tierBudget.color_analyses,
        styleRecommendations: tierBudget.style_recommendations,
        costBudgetCents: tierBudget.cost_budget_cents
      }
    };
  } catch (error) {
    console.error('[AI Budget] Error getting usage summary:', error);
    return null;
  }
}

/**
 * Calculate estimated cost for an AI call (in cents)
 * Based on Anthropic Claude pricing
 */
export function estimateCost(inputTokens: number, outputTokens: number, model: string): number {
  // Claude pricing (approximate, per 1M tokens)
  const PRICING: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-20250514': { input: 300, output: 1500 },  // $3/$15 per 1M
    'claude-3-haiku-20240307': { input: 25, output: 125 },     // $0.25/$1.25 per 1M
    'claude-3-5-sonnet-20241022': { input: 300, output: 1500 },
    'default': { input: 300, output: 1500 }
  };

  const pricing = PRICING[model] || PRICING['default'];

  // Convert to cents (pricing is per 1M tokens in cents * 100)
  const inputCost = (inputTokens / 1_000_000) * pricing.input * 100;
  const outputCost = (outputTokens / 1_000_000) * pricing.output * 100;

  return Math.ceil(inputCost + outputCost);
}
