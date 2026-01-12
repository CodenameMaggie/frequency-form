/**
 * Email Unsubscribe API Endpoint
 * CAN-SPAM Act Compliance
 *
 * Handles email preference management and unsubscribe requests
 * No authentication required - uses secure unsubscribe tokens
 */

import { NextRequest, NextResponse } from 'next/server';

// Import email preferences library (CommonJS module)
const {
  getPreferencesByToken,
  unsubscribeAll,
  unsubscribeFromCategory,
  updatePreferences,
  EMAIL_CATEGORIES,
  CRITICAL_CATEGORIES
} = require('@/lib/email-preferences');

/**
 * GET /api/unsubscribe?token=xxx
 * View current email preferences
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    // Fetch preferences
    const prefs = await getPreferencesByToken(token);

    if (!prefs) {
      return NextResponse.json(
        { success: false, error: 'Invalid unsubscribe token' },
        { status: 404 }
      );
    }

    // Return preferences in API format
    return NextResponse.json({
      success: true,
      data: {
        email: prefs.email,
        preferences: {
          marketing_emails: prefs.marketing_emails,
          product_updates: prefs.product_updates,
          order_updates: prefs.order_updates,
          partner_updates: prefs.partner_updates,
          podcast_updates: prefs.podcast_updates,
          unsubscribed_all: prefs.unsubscribed_all
        },
        categories: EMAIL_CATEGORIES,
        critical_categories: CRITICAL_CATEGORIES
      }
    });
  } catch (error: any) {
    console.error('[Unsubscribe API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/unsubscribe
 * Unsubscribe from emails (all or specific category)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, category, reason } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    // Get client metadata for compliance logging
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const metadata = { reason, ip, userAgent };

    // Validate token exists
    const prefs = await getPreferencesByToken(token);
    if (!prefs) {
      return NextResponse.json(
        { success: false, error: 'Invalid unsubscribe token' },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === 'unsubscribe_all') {
      await unsubscribeAll(token, metadata);

      return NextResponse.json({
        success: true,
        message: 'You have been unsubscribed from all non-transactional emails.'
      });
    } else if (action === 'unsubscribe_category' && category) {
      // Validate category
      if (CRITICAL_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { success: false, error: 'Cannot unsubscribe from transactional emails' },
          { status: 400 }
        );
      }

      await unsubscribeFromCategory(token, category, metadata);

      return NextResponse.json({
        success: true,
        message: `You have been unsubscribed from ${category} emails.`
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "unsubscribe_all" or "unsubscribe_category"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[Unsubscribe API] POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process unsubscribe request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/unsubscribe
 * Update email preferences (resubscribe or toggle categories)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, preferences } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid preferences object' },
        { status: 400 }
      );
    }

    // Validate token exists
    const prefs = await getPreferencesByToken(token);
    if (!prefs) {
      return NextResponse.json(
        { success: false, error: 'Invalid unsubscribe token' },
        { status: 404 }
      );
    }

    // Update preferences
    await updatePreferences(token, preferences);

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully.'
    });
  } catch (error: any) {
    console.error('[Unsubscribe API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
