/**
 * FF Style Studio - Body Scan API
 * Analyzes body measurements from photo upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Import body analyzer (will work when agents are deployed)
// For now, we'll implement a simplified version

export async function POST(request: NextRequest) {
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

    // Convert image to buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // TODO: When bot server is running, call body analyzer agent
    // For now, return a structured response that frontend can use

    // In production, this would call:
    // const bodyAnalyzer = require('@/unbound/backend/agents/ff/body-analyzer');
    // const result = await bodyAnalyzer.analyzeBody(buffer, userId, heightInches);

    // Simplified response structure for initial testing
    const mockResponse = {
      success: true,
      message: 'Body scan endpoint ready. Connect to bot server for full analysis.',
      requirements: {
        image: 'Full body photo, front-facing',
        heightInches: 'User height in inches for calibration'
      },
      expectedOutput: {
        measurements: {
          bust: 'number (inches)',
          waist: 'number (inches)',
          hips: 'number (inches)',
          shoulder_width: 'number (inches)',
          arm_length: 'number (inches)',
          inseam: 'number (inches)',
          torso_length: 'number (inches)'
        },
        bodyType: 'hourglass | pear | apple | rectangle | inverted_triangle',
        confidence: 'number (0-1)',
        recommendedSilhouettes: 'array of strings',
        silhouettesToAvoid: 'array of strings',
        aiRecommendations: 'string with styling tips'
      }
    };

    return NextResponse.json(mockResponse);

  } catch (error: any) {
    console.error('[Body Scan API] Error:', error);
    return NextResponse.json(
      { error: 'Body scan failed', details: error.message },
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
