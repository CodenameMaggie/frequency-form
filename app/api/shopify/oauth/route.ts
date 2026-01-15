import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import crypto from 'crypto';

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const SHOPIFY_SCOPES = 'read_products,write_products,read_orders,write_orders,read_inventory,write_inventory,read_locations';

/**
 * GET /api/shopify/oauth
 * Initiates OAuth flow - redirects to Shopify authorization
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop') || 'frequency-and-form.myshopify.com';

  if (!SHOPIFY_CLIENT_ID) {
    return NextResponse.json({ error: 'Shopify client ID not configured' }, { status: 500 });
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Store state in cookie for verification
  const redirectUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  redirectUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID);
  redirectUrl.searchParams.set('scope', SHOPIFY_SCOPES);
  redirectUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_SITE_URL}/api/shopify/oauth/callback`);
  redirectUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(redirectUrl.toString());
  response.cookies.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  return response;
}
