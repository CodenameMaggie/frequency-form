/**
 * FF Style Studio - Body Scan API
 * Analyzes body measurements from photo upload using AI vision
 * AI usage tracked against membership tier budget
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { checkAIBudget, recordAIUsage, estimateCost } from '@/lib/ai-budget';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AI_MODEL = 'claude-sonnet-4-20250514';

interface BodyAnalysisResult {
  measurements: {
    bust: number;
    waist: number;
    hips: number;
    shoulder_width: number;
    arm_length: number;
    inseam: number;
    torso_length: number;
  };
  bodyType: 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted_triangle';
  confidence: number;
  recommendedSilhouettes: string[];
  silhouettesToAvoid: string[];
  aiRecommendations: string;
}

async function analyzeBodyWithAI(imageBase64: string, heightInches: number): Promise<{ result: BodyAnalysisResult | null; inputTokens: number; outputTokens: number }> {
  if (!ANTHROPIC_API_KEY) {
    return { result: null, inputTokens: 0, outputTokens: 0 };
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Analyze this full-body photo to estimate body measurements and type. The person's height is ${heightInches} inches.

Return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "measurements": {
    "bust": <number in inches>,
    "waist": <number in inches>,
    "hips": <number in inches>,
    "shoulder_width": <number in inches>,
    "arm_length": <number in inches>,
    "inseam": <number in inches>,
    "torso_length": <number in inches>
  },
  "bodyType": "<hourglass|pear|apple|rectangle|inverted_triangle>",
  "confidence": <0.0-1.0>,
  "recommendedSilhouettes": ["<silhouette1>", "<silhouette2>", ...],
  "silhouettesToAvoid": ["<silhouette1>", ...],
  "aiRecommendations": "<personalized styling tips>"
}

Base all measurements proportionally from the given height. Focus on the body proportions visible in the image.`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    console.error('[Body Scan] Anthropic API error:', response.status);
    return { result: null, inputTokens: 0, outputTokens: 0 };
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;

  if (!content) return { result: null, inputTokens, outputTokens };

  try {
    const result = JSON.parse(content) as BodyAnalysisResult;
    return { result, inputTokens, outputTokens };
  } catch {
    console.error('[Body Scan] Failed to parse AI response');
    return { result: null, inputTokens, outputTokens };
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    const email = formData.get('email') as string;
    const heightInches = parseFloat(formData.get('heightInches') as string);

    if (!image || !userId || !heightInches) {
      return NextResponse.json(
        { error: 'Missing required fields: image, userId, heightInches' },
        { status: 400 }
      );
    }

    // Check AI budget before making the call
    if (email) {
      const budgetCheck = await checkAIBudget(email, 'body_scan');
      if (!budgetCheck.canProceed) {
        return NextResponse.json({
          success: false,
          error: 'AI budget exceeded',
          message: budgetCheck.message,
          remainingCalls: budgetCheck.remainingCalls,
          tier: budgetCheck.tierName
        }, { status: 402 }); // Payment Required
      }
    }

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Analyze with AI
    const { result: analysisResult, inputTokens, outputTokens } = await analyzeBodyWithAI(base64, heightInches);
    const durationMs = Date.now() - startTime;
    const costCents = estimateCost(inputTokens, outputTokens, AI_MODEL);

    // Record AI usage (behind the scenes)
    if (email) {
      await recordAIUsage({
        userId,
        email,
        featureType: 'body_scan',
        model: AI_MODEL,
        inputTokens,
        outputTokens,
        costCents,
        durationMs,
        success: !!analysisResult,
        error: analysisResult ? undefined : 'Analysis failed'
      });
    }

    if (!analysisResult) {
      return NextResponse.json({
        success: false,
        error: 'Body analysis not available. Ensure ANTHROPIC_API_KEY is configured.',
      }, { status: 503 });
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('ff_body_measurements')
      .upsert({
        user_id: userId,
        measurements: analysisResult.measurements,
        body_type: analysisResult.bodyType,
        confidence: analysisResult.confidence,
        recommended_silhouettes: analysisResult.recommendedSilhouettes,
        silhouettes_to_avoid: analysisResult.silhouettesToAvoid,
        ai_recommendations: analysisResult.aiRecommendations,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('[Body Scan] Database error:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Body Scan API] Error:', error);
    return NextResponse.json(
      { error: 'Body scan failed', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If no userId, return demo/empty state
    if (!userId) {
      return NextResponse.json({
        success: true,
        hasMeasurements: false,
        message: 'No measurements found. Please complete a body scan.'
      });
    }

    // Try to get supabase client - may fail if env vars missing
    let supabase;
    try {
      supabase = createAdminSupabase();
    } catch {
      return NextResponse.json({
        success: true,
        hasMeasurements: false,
        message: 'No measurements found. Please complete a body scan.'
      });
    }

    // Get user's latest body measurements
    const { data, error } = await supabase
      .from('ff_body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return NextResponse.json({
        success: true,
        hasMeasurements: false,
        message: 'No measurements found. Please complete a body scan.'
      });
    }

    return NextResponse.json({
      success: true,
      hasMeasurements: true,
      data
    });

  } catch (error: any) {
    console.error('[Body Scan API] Error:', error);
    return NextResponse.json({
      success: true,
      hasMeasurements: false,
      message: 'No measurements found. Please complete a body scan.'
    });
  }
}
