import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getShopifyProducts, isShopifyConnected } from '@/lib/shopify';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * POST /api/ff/sync-shopify-products
 * Syncs products from Shopify store into ff_partner_products table
 * for display in the Style Studio
 */
export async function POST(request: NextRequest) {
  try {
    // Check auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.FORBES_COMMAND_CRON;

    if (authHeader !== `Bearer ${cronSecret}` &&
        request.nextUrl.searchParams.get('secret') !== cronSecret) {
      // Allow manual trigger in dev
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Check if Shopify is connected
    const connected = await isShopifyConnected();
    if (!connected) {
      return NextResponse.json({
        success: false,
        error: 'Shopify not connected. Please authorize first.',
        authUrl: '/api/shopify/oauth?shop=frequency-and-form.myshopify.com'
      }, { status: 400 });
    }

    // Get products from Shopify
    const shopifyProducts = await getShopifyProducts();

    if (!shopifyProducts.length) {
      return NextResponse.json({
        success: true,
        message: 'No products found in Shopify store',
        synced: 0
      });
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
        products: shopifyProducts.map(p => ({
          id: p.id,
          name: p.title,
          image: p.images[0]?.src
        }))
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let synced = 0;
    let errors: string[] = [];

    for (const product of shopifyProducts) {
      try {
        // Parse tags for metadata
        const tags = product.tags.split(',').map(t => t.trim().toLowerCase());

        // Determine category from product_type or tags
        let category = 'tops';
        if (tags.includes('dress') || tags.includes('dresses') || product.product_type?.toLowerCase().includes('dress')) {
          category = 'dresses';
        } else if (tags.includes('pants') || tags.includes('bottoms') || tags.includes('skirt')) {
          category = 'bottoms';
        } else if (tags.includes('jacket') || tags.includes('coat') || tags.includes('outerwear')) {
          category = 'outerwear';
        }

        // Determine fabric type
        let fabricType = 'blend';
        let frequencyCompatible = false;
        if (tags.includes('linen')) {
          fabricType = 'linen';
          frequencyCompatible = true;
        } else if (tags.includes('silk')) {
          fabricType = 'silk';
          frequencyCompatible = true;
        } else if (tags.includes('cotton')) {
          fabricType = 'cotton';
          frequencyCompatible = true;
        } else if (tags.includes('wool')) {
          fabricType = 'wool';
          frequencyCompatible = true;
        }

        // Get price from first variant
        const price = parseFloat(product.variants[0]?.price || '0');

        // Determine budget tier
        let budgetTier = 'moderate';
        if (price < 50) budgetTier = 'budget';
        else if (price < 150) budgetTier = 'moderate';
        else if (price < 300) budgetTier = 'premium';
        else budgetTier = 'luxury';

        // Determine body types from tags
        const bodyTypes: string[] = [];
        if (tags.includes('hourglass')) bodyTypes.push('hourglass');
        if (tags.includes('pear')) bodyTypes.push('pear');
        if (tags.includes('apple')) bodyTypes.push('apple');
        if (tags.includes('rectangle')) bodyTypes.push('rectangle');
        if (tags.includes('inverted-triangle') || tags.includes('inverted_triangle')) bodyTypes.push('inverted_triangle');
        // Default to all if none specified
        if (bodyTypes.length === 0) {
          bodyTypes.push('hourglass', 'pear', 'apple', 'rectangle');
        }

        // Determine silhouettes from tags
        const silhouettes: string[] = [];
        if (tags.includes('wrap')) silhouettes.push('wrap');
        if (tags.includes('a-line') || tags.includes('a_line')) silhouettes.push('a_line');
        if (tags.includes('fitted')) silhouettes.push('fitted');
        if (tags.includes('relaxed')) silhouettes.push('relaxed');
        if (tags.includes('empire')) silhouettes.push('empire_waist');
        if (silhouettes.length === 0) silhouettes.push('relaxed');

        // Get all image URLs
        const imageUrls = product.images.map(img => img.src);

        // Upsert into ff_partner_products
        const { error: upsertError } = await supabase
          .from('ff_partner_products')
          .upsert({
            source: 'shopify',
            external_id: String(product.id),
            name: product.title,
            brand: product.vendor || 'Frequency & Form',
            description: product.body_html?.replace(/<[^>]*>/g, '') || '',
            category,
            garment_type: product.product_type || category,
            price,
            budget_tier: budgetTier,
            silhouettes,
            best_for_body_types: bodyTypes,
            torso_fit: 'balanced',
            fabric_type: fabricType,
            frequency_compatible: frequencyCompatible,
            image_url: imageUrls[0] || null,
            image_urls: imageUrls,
            source_url: `https://frequency-and-form.myshopify.com/products/${product.handle}`,
            in_stock: product.status === 'active',
            tags,
            status: 'active',
            curated: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'source,external_id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          errors.push(`Product ${product.id}: ${upsertError.message}`);
        } else {
          synced++;
        }
      } catch (err: any) {
        errors.push(`Product ${product.id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: shopifyProducts.length,
      synced,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('[Sync Shopify Products] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/ff/sync-shopify-products
 * Returns sync status and recent products
 */
export async function GET() {
  try {
    const connected = await isShopifyConnected();

    if (!connected) {
      return NextResponse.json({
        connected: false,
        message: 'Shopify not connected',
        authUrl: '/api/shopify/oauth?shop=frequency-and-form.myshopify.com'
      });
    }

    // Get products from Shopify to show count
    const products = await getShopifyProducts();

    return NextResponse.json({
      connected: true,
      shopifyProductCount: products.length,
      products: products.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        price: p.variants[0]?.price,
        image: p.images[0]?.src,
        status: p.status
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      error: error.message
    });
  }
}
