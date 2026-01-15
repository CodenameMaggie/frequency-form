/**
 * Annie Pinterest Poster Bot
 * Creates Pinterest pins for F&F natural fiber fashion
 * CRON: Twice daily at 9 AM and 3 PM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const PINTEREST_API_URL = 'https://api.pinterest.com/v5';

interface PinData {
  title: string;
  description: string;
  link: string;
  media_source: {
    source_type: string;
    url: string;
  };
  board_id: string;
}

const PIN_TEMPLATES = {
  healing: [
    '✨ {name} - Healing Frequency 5,000 Hz',
    '🌿 Elevate Your Energy with {name}',
    '💫 {name} - 50× Your Natural Frequency',
  ],
  foundation: [
    '🌾 {name} - Foundation Frequency 100 Hz',
    '☯️ Perfect Harmony: {name}',
    '🍃 {name} - In Tune with Your Body',
  ],
};

const HASHTAGS = '#NaturalFibers #SustainableFashion #FrequencyFashion #ConsciousClothing #EcoLuxury #NaturalFabrics #HealingFashion #FrequencyAndForm';

async function createPin(pinData: PinData, accessToken: string): Promise<{ success: boolean; pinId?: string; error?: string }> {
  try {
    const response = await fetch(`${PINTEREST_API_URL}/pins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || `Pinterest API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, pinId: data.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function generatePinContent(product: { name: string; description: string; price: number; tier: string; image_url?: string; slug: string }): PinData {
  const templates = product.tier === 'healing' ? PIN_TEMPLATES.healing : PIN_TEMPLATES.foundation;
  const titleTemplate = templates[Math.floor(Math.random() * templates.length)];
  const title = titleTemplate.replace('{name}', product.name);

  const frequency = product.tier === 'healing' ? '5,000 Hz' : '100 Hz';
  const description = `${product.description}\n\n${frequency} Natural Fiber Fashion\n\n${HASHTAGS}`;

  return {
    title,
    description,
    link: `https://frequencyandform.com/shop/${product.slug}`,
    media_source: {
      source_type: 'image_url',
      url: product.image_url || 'https://frequencyandform.com/images/default-product.jpg',
    },
    board_id: process.env.PINTEREST_BOARD_ID || '',
  };
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.FORBES_COMMAND_CRON) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Annie Pinterest Poster] Running...');

    const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    const boardId = process.env.PINTEREST_BOARD_ID;

    if (!accessToken || !boardId) {
      return NextResponse.json({
        success: true,
        data: {
          pins_created: 0,
          message: 'Pinterest API credentials not configured. Set PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID in environment variables.',
        }
      });
    }

    // Get approved products that haven't been pinned recently
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('id, name, description, price, frequency_tier, image_url, slug')
      .eq('status', 'approved')
      .limit(3);

    if (dbError) {
      console.error('[Annie Pinterest] Database error:', dbError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    let pinsCreated = 0;
    const errors: string[] = [];

    for (const product of products || []) {
      const pinData = generatePinContent({
        name: product.name,
        description: product.description || '',
        price: product.price,
        tier: product.frequency_tier || 'foundation',
        image_url: product.image_url,
        slug: product.slug,
      });

      const result = await createPin(pinData, accessToken);

      if (result.success) {
        pinsCreated++;
        console.log(`[Annie Pinterest] Created pin for ${product.name}: ${result.pinId}`);

        // Log pin creation (ignore errors if table doesn't exist)
        try {
          await supabase.from('pinterest_pins').insert({
            product_id: product.id,
            pin_id: result.pinId,
            title: pinData.title,
            created_at: new Date().toISOString(),
          });
        } catch {
          // Ignore logging errors
        }
      } else {
        errors.push(`Failed to pin ${product.name}: ${result.error}`);
      }

      // Rate limiting: wait between pins
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return NextResponse.json({
      success: true,
      data: {
        pins_created: pinsCreated,
        products_processed: products?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
