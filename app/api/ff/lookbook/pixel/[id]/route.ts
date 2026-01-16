import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trackingId } = await params;

    // Parse tracking ID format: {lookbook_slug}_{email_hash}_{timestamp}
    // Example: spring-2026_abc123_1704067200
    const parts = trackingId.split('_');
    const lookbookSlug = parts[0] || 'unknown';

    // Get device info from headers
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /mobile|android|iphone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    // Detect email client
    let emailClient = 'unknown';
    if (userAgent.includes('Outlook')) emailClient = 'outlook';
    else if (userAgent.includes('Thunderbird')) emailClient = 'thunderbird';
    else if (userAgent.includes('Apple Mail') || userAgent.includes('AppleWebKit')) emailClient = 'apple_mail';
    else if (userAgent.includes('Gmail')) emailClient = 'gmail';
    else if (userAgent.includes('Yahoo')) emailClient = 'yahoo';

    // Track the open if Supabase is configured
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Update email tracking record
      const { error } = await supabase
        .from('ff_lookbook_email_tracking')
        .update({
          opened_at: new Date().toISOString(),
          open_count: supabase.rpc('increment', { x: 1 }),
          device_type: deviceType,
          email_client: emailClient
        })
        .eq('id', trackingId);

      if (error) {
        // If exact ID match fails, try to find by partial match
        // This handles cases where tracking ID format varies
        console.log('[Pixel Track] Direct update failed, trying alternate method');

        // Log the open event separately
        await supabase.from('ff_lookbook_views').insert({
          lookbook_id: null,
          session_id: trackingId,
          source: 'email_pixel',
          device_type: deviceType,
          browser: emailClient
        });
      }
    }

    // Return transparent 1x1 GIF
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[Pixel Track] Error:', error);

    // Always return the GIF even on error
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store'
      }
    });
  }
}
