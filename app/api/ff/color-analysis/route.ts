/**
 * FF Style Studio - Color Analysis API
 * Analyzes skin tone and creates personal color palette using AI vision
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface ColorAnalysisResult {
  skinUndertone: 'warm' | 'cool' | 'neutral';
  skinDepth: 'fair' | 'light' | 'medium' | 'tan' | 'deep';
  colorSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  colorSeasonSubtype: string;
  bestColors: Array<{ name: string; hex: string; category: string }>;
  avoidColors: Array<{ name: string; hex: string; reason: string }>;
  bestMetals: string[];
  avoidMetals: string[];
  aiRecommendations: string;
}

async function analyzeColorsWithAI(imageBase64: string): Promise<ColorAnalysisResult | null> {
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
      max_tokens: 1500,
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
            text: `Analyze this face photo to determine the person's color season and create a personalized color palette.

Return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "skinUndertone": "<warm|cool|neutral>",
  "skinDepth": "<fair|light|medium|tan|deep>",
  "colorSeason": "<spring|summer|autumn|winter>",
  "colorSeasonSubtype": "<e.g., light_spring, soft_autumn, deep_winter>",
  "bestColors": [
    {"name": "<color name>", "hex": "<#XXXXXX>", "category": "<neutrals|accent|statement>"},
    ... (include 10-12 colors)
  ],
  "avoidColors": [
    {"name": "<color name>", "hex": "<#XXXXXX>", "reason": "<why to avoid>"},
    ... (include 4-6 colors)
  ],
  "bestMetals": ["<gold|silver|rose_gold|copper>", ...],
  "avoidMetals": ["<metal>", ...],
  "aiRecommendations": "<personalized color and styling advice based on their coloring>"
}

Consider: skin undertone, hair color, eye color, and natural coloring to determine the seasonal palette. Include a variety of colors for different occasions.`,
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    console.error('[Color Analysis] Anthropic API error:', response.status);
    return null;
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    console.error('[Color Analysis] Failed to parse AI response');
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const userId = formData.get('userId') as string;

    if (!image || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: image, userId' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Analyze with AI
    const analysisResult = await analyzeColorsWithAI(base64);

    if (!analysisResult) {
      return NextResponse.json({
        success: false,
        error: 'Color analysis not available. Ensure ANTHROPIC_API_KEY is configured.',
      }, { status: 503 });
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('ff_color_profiles')
      .upsert({
        user_id: userId,
        season: analysisResult.colorSeason,
        undertone: analysisResult.skinUndertone,
        skin_depth: analysisResult.skinDepth,
        season_subtype: analysisResult.colorSeasonSubtype,
        best_colors: analysisResult.bestColors,
        avoid_colors: analysisResult.avoidColors,
        best_metals: analysisResult.bestMetals,
        avoid_metals: analysisResult.avoidMetals,
        ai_recommendations: analysisResult.aiRecommendations,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('[Color Analysis] Database error:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
    });

  } catch (error: any) {
    console.error('[Color Analysis API] Error:', error);
    return NextResponse.json(
      { error: 'Color analysis failed', details: error.message },
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
        hasProfile: false,
        message: 'No color profile found. Please complete color analysis.'
      });
    }

    // Try to get supabase client - may fail if env vars missing
    let supabase;
    try {
      supabase = createAdminSupabase();
    } catch {
      return NextResponse.json({
        success: true,
        hasProfile: false,
        message: 'No color profile found. Please complete color analysis.'
      });
    }

    // Get user's color profile
    const { data, error } = await supabase
      .from('ff_color_profiles')
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
        hasProfile: false,
        message: 'No color profile found. Please complete color analysis.'
      });
    }

    return NextResponse.json({
      success: true,
      hasProfile: true,
      data
    });

  } catch (error: any) {
    console.error('[Color Analysis API] Error:', error);
    return NextResponse.json({
      success: true,
      hasProfile: false,
      message: 'No color profile found. Please complete color analysis.'
    });
  }
}

// Check if a specific color works for user
export async function PUT(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { userId, colorHex } = await request.json();

    if (!userId || !colorHex) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, colorHex' },
        { status: 400 }
      );
    }

    // Get user's color profile
    const { data: profile, error } = await supabase
      .from('ff_color_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !profile) {
      return NextResponse.json({
        match: false,
        reason: 'No color profile found. Please complete color analysis first.'
      });
    }

    // Check if color is in best colors
    const inBestColors = profile.best_colors?.some(
      (c: any) => c.hex.toLowerCase() === colorHex.toLowerCase()
    );

    if (inBestColors) {
      return NextResponse.json({
        match: true,
        reason: 'This color is in your best colors palette! ✨'
      });
    }

    // Check if color is in avoid colors
    const avoidColor = profile.avoid_colors?.find(
      (c: any) => c.hex.toLowerCase() === colorHex.toLowerCase()
    );

    if (avoidColor) {
      return NextResponse.json({
        match: false,
        reason: avoidColor.reason
      });
    }

    // Calculate color temperature
    const rgb = hexToRgb(colorHex);
    if (!rgb) {
      return NextResponse.json({
        match: false,
        reason: 'Invalid color format'
      });
    }

    const isWarm = (rgb.r + (255 - rgb.b)) / 2 > (rgb.b + (255 - rgb.r)) / 2;
    const userIsWarm = profile.skin_undertone === 'warm';

    if (isWarm === userIsWarm) {
      return NextResponse.json({
        match: true,
        reason: `This ${isWarm ? 'warm' : 'cool'} color complements your undertone`
      });
    } else {
      return NextResponse.json({
        match: false,
        reason: `This color may clash with your ${profile.skin_undertone} undertone`
      });
    }

  } catch (error: any) {
    console.error('[Color Check API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check color match', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
