import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import crypto from 'crypto';

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

/**
 * GET /api/shopify/oauth/callback
 * Handles OAuth callback from Shopify, exchanges code for access token
 */
export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state');
  const hmac = searchParams.get('hmac');

  // Verify state
  const storedState = request.cookies.get('shopify_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop parameter' }, { status: 400 });
  }

  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Shopify credentials not configured' }, { status: 500 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    console.log('[Shopify OAuth] Got access token for shop:', shop);
    console.log('[Shopify OAuth] Scopes:', scope);

    // Store token in database
    const { error: dbError } = await supabase
      .from('shopify_tokens')
      .upsert({
        shop_domain: shop,
        access_token: accessToken,
        scope: scope,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'shop_domain',
      });

    if (dbError) {
      console.error('Failed to store token:', dbError);
      // Continue anyway - we'll show the token to the user
    }

    // Clear state cookie
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/admin?shopify=connected`);
    response.cookies.delete('shopify_oauth_state');

    return response;

  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
