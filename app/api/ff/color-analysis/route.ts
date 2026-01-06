/**
 * FF Style Studio - Color Analysis API
 * Analyzes skin tone and creates personal color palette
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
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

    // Convert image to buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // TODO: When bot server is running, call color analyzer agent
    // const colorAnalyzer = require('@/unbound/backend/agents/ff/color-analyzer');
    // const result = await colorAnalyzer.analyzeColors(buffer, userId);

    // Simplified response structure for initial testing
    const mockResponse = {
      success: true,
      message: 'Color analysis endpoint ready. Connect to bot server for full analysis.',
      requirements: {
        image: 'Face photo with natural lighting, no makeup preferred'
      },
      expectedOutput: {
        skinUndertone: 'warm | cool | neutral',
        skinDepth: 'fair | light | medium | tan | deep',
        colorSeason: 'spring | summer | autumn | winter',
        colorSeasonSubtype: 'e.g., light_spring, soft_autumn',
        bestColors: 'array of color objects with name, hex, category',
        avoidColors: 'array of color objects with name, hex, reason',
        bestMetals: 'array of strings',
        avoidMetals: 'array of strings',
        aiRecommendations: 'personalized color advice'
      }
    };

    return NextResponse.json(mockResponse);

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

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: 'Failed to retrieve color profile', details: error.message },
      { status: 500 }
    );
  }
}

// Check if a specific color works for user
export async function PUT(request: NextRequest) {
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
