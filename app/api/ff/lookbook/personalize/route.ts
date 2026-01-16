import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    // Skip if no Supabase configured
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        tier: 'aligned',
        recommendations: null
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from session/cookie
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('ff_user_email')?.value;

    if (!userEmail) {
      return NextResponse.json({
        tier: 'aligned',
        recommendations: null
      });
    }

    // Get user membership
    const { data: membership } = await supabase
      .from('ff_user_memberships')
      .select('*, ff_membership_tiers(*)')
      .eq('email', userEmail)
      .single();

    // Get user AI profile
    const { data: aiProfile } = await supabase
      .from('ff_user_ai_profile')
      .select('*')
      .eq('email', userEmail)
      .single();

    // Get Style Studio data
    const { data: colorProfile } = await supabase
      .from('ff_color_profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    const { data: bodyProfile } = await supabase
      .from('ff_body_measurements')
      .select('*')
      .eq('email', userEmail)
      .single();

    // Determine tier
    const tier = membership?.ff_membership_tiers?.slug || 'aligned';

    // Generate AI recommendations if Sovereign tier
    let recommendations = null;

    if (tier === 'sovereign' && (colorProfile || bodyProfile || aiProfile)) {
      recommendations = generateAIRecommendations({
        colorProfile,
        bodyProfile,
        aiProfile,
        purchaseHistory: aiProfile?.products_purchased || []
      });
    }

    return NextResponse.json({
      tier,
      recommendations,
      colorPalette: colorProfile?.best_colors,
      bodyType: bodyProfile?.body_type,
      styleArchetypes: aiProfile?.style_archetypes
    });

  } catch (error) {
    console.error('[Lookbook Personalize] Error:', error);
    return NextResponse.json({ tier: 'aligned', recommendations: null });
  }
}

function generateAIRecommendations(data: any) {
  const { colorProfile, bodyProfile, aiProfile, purchaseHistory } = data;

  // AI-style personalized message
  const messages: string[] = [];

  if (colorProfile?.color_season) {
    const seasonRecommendations: Record<string, string> = {
      'autumn': 'warm camel and burgundy',
      'winter': 'crisp navy and white',
      'spring': 'soft ivory and blush',
      'summer': 'cool stone and forest'
    };
    const recommended = seasonRecommendations[colorProfile.color_season] || 'natural tones';
    messages.push(`As a ${colorProfile.color_season}, you'll love our ${recommended} pieces this season.`);
  }

  if (bodyProfile?.body_type) {
    const silhouettes = bodyProfile.recommended_silhouettes || [];
    if (silhouettes.length > 0) {
      messages.push(`The ${silhouettes[0]} silhouettes we've featured will be particularly flattering for your ${bodyProfile.body_type} figure.`);
    }
  }

  if (purchaseHistory?.length > 0) {
    messages.push(`Based on your previous purchases, we think you'll especially love the new linen pieces.`);
  }

  // Default message if nothing specific
  const finalMessage = messages.length > 0
    ? messages.join(' ')
    : 'We\'ve curated this collection with investment pieces that transcend seasons.';

  return {
    message: finalMessage,
    suggestedProducts: [],
    colorMatches: colorProfile?.best_colors || []
  };
}
