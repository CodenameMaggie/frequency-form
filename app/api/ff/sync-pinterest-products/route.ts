import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID;

interface PinterestPin {
  id: string;
  title: string;
  description: string;
  link: string;
  media: {
    images: {
      '600x': { url: string };
      '1200x': { url: string };
    };
  };
  board_id: string;
  created_at: string;
}

/**
 * Fetch pins from Pinterest board
 */
async function getPinterestPins(boardId: string): Promise<PinterestPin[]> {
  if (!PINTEREST_ACCESS_TOKEN) {
    throw new Error('Pinterest access token not configured');
  }

  const response = await fetch(
    `https://api.pinterest.com/v5/boards/${boardId}/pins?page_size=100`,
    {
      headers: {
        'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinterest API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Parse product info from Pinterest pin
 */
function parsePinToProduct(pin: PinterestPin) {
  const title = pin.title || 'Pinterest Product';
  const description = pin.description || '';
  const link = pin.link || '';

  // Try to extract price from description (e.g., "$45" or "45.00")
  const priceMatch = description.match(/\$?(\d+(?:\.\d{2})?)/);
  const price = priceMatch ? parseFloat(priceMatch[1]) : 99.00;

  // Determine category from title/description
  let category = 'tops';
  const text = (title + ' ' + description).toLowerCase();
  if (text.includes('dress')) category = 'dresses';
  else if (text.includes('pant') || text.includes('trouser') || text.includes('skirt') || text.includes('short')) category = 'bottoms';
  else if (text.includes('jacket') || text.includes('coat') || text.includes('blazer') || text.includes('cardigan')) category = 'outerwear';
  else if (text.includes('blouse') || text.includes('top') || text.includes('shirt') || text.includes('tee')) category = 'tops';

  // Determine fabric type
  let fabricType = 'blend';
  let frequencyCompatible = false;
  if (text.includes('linen')) { fabricType = 'linen'; frequencyCompatible = true; }
  else if (text.includes('silk')) { fabricType = 'silk'; frequencyCompatible = true; }
  else if (text.includes('cotton')) { fabricType = 'cotton'; frequencyCompatible = true; }
  else if (text.includes('wool') || text.includes('cashmere')) { fabricType = 'wool'; frequencyCompatible = true; }

  // Determine budget tier
  let budgetTier = 'moderate';
  if (price < 50) budgetTier = 'budget';
  else if (price < 150) budgetTier = 'moderate';
  else if (price < 300) budgetTier = 'premium';
  else budgetTier = 'luxury';

  // Extract color if mentioned
  let primaryColor = 'neutral';
  const colors = ['white', 'black', 'navy', 'blue', 'red', 'green', 'beige', 'cream', 'pink', 'gray', 'grey', 'brown', 'tan', 'olive', 'burgundy'];
  for (const color of colors) {
    if (text.includes(color)) {
      primaryColor = color;
      break;
    }
  }

  // Get image URL
  const imageUrl = pin.media?.images?.['1200x']?.url ||
                   pin.media?.images?.['600x']?.url ||
                   null;

  return {
    source: 'pinterest',
    external_id: pin.id,
    name: title,
    brand: 'Pinterest Find',
    description: description,
    category,
    garment_type: category,
    price,
    budget_tier: budgetTier,
    silhouettes: ['relaxed'],
    best_for_body_types: ['hourglass', 'pear', 'apple', 'rectangle'],
    torso_fit: 'balanced',
    primary_color: primaryColor,
    fabric_type: fabricType,
    frequency_compatible: frequencyCompatible,
    image_url: imageUrl,
    image_urls: imageUrl ? [imageUrl] : [],
    source_url: link || `https://pinterest.com/pin/${pin.id}`,
    affiliate_url: link || null,
    in_stock: true,
    tags: ['pinterest', category, fabricType],
    status: 'active',
    curated: false
  };
}

/**
 * POST /api/ff/sync-pinterest-products
 * Syncs products from Pinterest board into ff_partner_products table
 */
export async function POST(request: NextRequest) {
  try {
    // Check auth
    const cronSecret = process.env.CRON_SECRET || process.env.FORBES_COMMAND_CRON;
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}` &&
          request.nextUrl.searchParams.get('secret') !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!PINTEREST_ACCESS_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Pinterest not configured. Set PINTEREST_ACCESS_TOKEN in environment.'
      }, { status: 400 });
    }

    if (!PINTEREST_BOARD_ID) {
      return NextResponse.json({
        success: false,
        error: 'Pinterest board not configured. Set PINTEREST_BOARD_ID in environment.'
      }, { status: 400 });
    }

    // Fetch pins from Pinterest
    const pins = await getPinterestPins(PINTEREST_BOARD_ID);

    if (!pins.length) {
      return NextResponse.json({
        success: true,
        message: 'No pins found on Pinterest board',
        synced: 0
      });
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        pins: pins.slice(0, 5).map(p => ({
          id: p.id,
          title: p.title,
          image: p.media?.images?.['600x']?.url
        }))
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let synced = 0;
    let errors: string[] = [];

    for (const pin of pins) {
      try {
        const product = parsePinToProduct(pin);

        const { error: upsertError } = await supabase
          .from('ff_partner_products')
          .upsert(product, {
            onConflict: 'source,external_id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          errors.push(`Pin ${pin.id}: ${upsertError.message}`);
        } else {
          synced++;
        }
      } catch (err: any) {
        errors.push(`Pin ${pin.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: pins.length,
      synced,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('[Sync Pinterest Products] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/ff/sync-pinterest-products
 * Returns Pinterest connection status
 */
export async function GET() {
  const connected = !!PINTEREST_ACCESS_TOKEN && !!PINTEREST_BOARD_ID;

  if (!connected) {
    return NextResponse.json({
      connected: false,
      message: 'Pinterest not configured',
      setup: {
        step1: 'Run: node scripts/pinterest-auth.js',
        step2: 'Add PINTEREST_ACCESS_TOKEN to .env',
        step3: 'Add PINTEREST_BOARD_ID to .env'
      }
    });
  }

  try {
    const pins = await getPinterestPins(PINTEREST_BOARD_ID!);

    return NextResponse.json({
      connected: true,
      boardId: PINTEREST_BOARD_ID,
      pinCount: pins.length,
      pins: pins.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        image: p.media?.images?.['600x']?.url
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error.message
    });
  }
}
