/**
 * Shopify Product Sync
 * Syncs products from Shopify to F&F database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import ShopifyClient from '@/lib/shopify-client';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    console.log('[Shopify Sync] Starting product sync from Shopify...');

    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.FORBES_COMMAND_CRON) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { products } = await ShopifyClient.getProducts(250);
    console.log(`[Shopify Sync] Fetched ${products.length} products from Shopify`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const { data: existing } = await supabase
          .from('shopify_products')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .eq('shopify_product_id', product.id.toString())
          .single();

        if (existing) {
          await supabase
            .from('shopify_products')
            .update({
              product_name: product.title,
              sync_status: 'active',
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          console.log(`[Shopify Sync] Updated product: ${product.title}`);
        } else {
          await supabase
            .from('shopify_products')
            .insert({
              tenant_id: TENANT_ID,
              shopify_product_id: product.id.toString(),
              product_name: product.title,
              sku_prefix: product.variants?.[0]?.sku || null,
              sync_status: 'active',
              last_synced_at: new Date().toISOString(),
            });

          console.log(`[Shopify Sync] Created product: ${product.title}`);
        }

        syncedCount++;

      } catch (error: any) {
        console.error(`[Shopify Sync] Error syncing product ${product.title}:`, error.message);
        errorCount++;
      }
    }

    await supabase
      .from('shopify_sync_log')
      .insert({
        tenant_id: TENANT_ID,
        sync_type: 'product_sync',
        status: 'success',
        message: `Synced ${syncedCount} products from Shopify`,
        details: {
          synced_count: syncedCount,
          error_count: errorCount,
          total_products: products.length,
        },
      });

    console.log(`[Shopify Sync] Complete: ${syncedCount} synced, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      data: {
        synced: syncedCount,
        errors: errorCount,
        total: products.length,
      },
    });

  } catch (error: any) {
    console.error('[Shopify Sync] Error:', error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();
  try {
    const { data: logs } = await supabase
      .from('shopify_sync_log')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('sync_type', 'product_sync')
      .order('created_at', { ascending: false })
      .limit(10);

    const { count } = await supabase
      .from('shopify_products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('sync_status', 'active');

    return NextResponse.json({
      success: true,
      data: {
        synced_products: count,
        recent_syncs: logs,
      },
    });

  } catch (error: any) {
    console.error('[Shopify Sync] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
