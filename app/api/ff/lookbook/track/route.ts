import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, lookbook_id, session_id, interaction_type, ...metadata } = body;

    // Skip if no Supabase configured
    if (!supabaseUrl || !supabaseKey) {
      console.log('[Lookbook Track] Supabase not configured, skipping tracking');
      return NextResponse.json({ success: true, message: 'Tracking skipped - no database' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user info from headers
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    // Determine device type
    const isMobile = /mobile|android|iphone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    if (event === 'lookbook_open') {
      // Track lookbook view
      const { error: viewError } = await supabase.from('ff_lookbook_views').insert({
        lookbook_id: null, // Will be linked by slug lookup
        session_id,
        source: metadata.source,
        utm_source: metadata.utm_source,
        utm_medium: metadata.utm_medium,
        utm_campaign: metadata.utm_campaign,
        device_type: deviceType,
        browser: userAgent.substring(0, 500), // Limit browser string length
        ip_address: ip
      });

      if (viewError) {
        console.error('[Lookbook Track] View insert error:', viewError);
      }

      // Increment total views using RPC function
      const { error: rpcError } = await supabase.rpc('increment_lookbook_views', {
        lookbook_slug: lookbook_id
      });

      if (rpcError) {
        // Function might not exist yet, try direct update
        await supabase
          .from('ff_lookbooks')
          .update({
            total_views: supabase.rpc('coalesce', ['total_views', 0])
          })
          .eq('slug', lookbook_id);
      }

    } else if (event === 'interaction') {
      // Track interaction
      const { error: interactionError } = await supabase.from('ff_lookbook_interactions').insert({
        lookbook_id: null, // Will be linked by slug lookup
        session_id,
        interaction_type,
        product_id: metadata.product_id ? metadata.product_id.toString() : null,
        metadata: {
          page_number: metadata.page_number,
          page_id: metadata.page_id,
          product_name: metadata.product_name
        }
      });

      if (interactionError) {
        console.error('[Lookbook Track] Interaction insert error:', interactionError);
      }

      // Update counters based on interaction type
      if (interaction_type === 'add_to_cart') {
        const { error: rpcError } = await supabase.rpc('increment_lookbook_carts', {
          lookbook_slug: lookbook_id
        });

        if (rpcError) {
          console.error('[Lookbook Track] Cart increment error:', rpcError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Lookbook Track] Error:', error);
    return NextResponse.json({ success: false, error: 'Tracking failed' }, { status: 500 });
  }
}
