/**
 * FF Style Studio - Body Scan API
 * Analyzes body measurements from photo upload using AI vision
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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

async function analyzeBodyWithAI(imageBase64: string, heightInches: number): Promise<BodyAnalysisResult | null> {
  if (!ANTHROPIC_API_KEY) {
    return null;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
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
    return null;
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    console.error('[Body Scan] Failed to parse AI response');
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    const heightInches = parseFloat(formData.get('heightInches') as string);

    if (!image || !userId || !heightInches) {
      return NextResponse.json(
        { error: 'Missing required fields: image, userId, heightInches' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Analyze with AI
    const analysisResult = await analyzeBodyWithAI(base64, heightInches);

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

  } catch (error: any) {
    console.error('[Body Scan API] Error:', error);
    return NextResponse.json(
      { error: 'Body scan failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: 'Failed to retrieve measurements', details: error.message },
      { status: 500 }
    );
  }
}
