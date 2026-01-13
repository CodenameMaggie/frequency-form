/**
 * Calendly Integration for Frequency & Form
 * Allows Annie to help customers book consultations/appointments
 *
 * Features:
 * - Get available event types (Color Analysis, Body Scan, etc.)
 * - Create booking links
 * - Check scheduled events
 */

import { NextRequest, NextResponse } from 'next/server';

const CALENDLY_API_TOKEN = process.env.CALENDLY_API_TOKEN;
const CALENDLY_API_BASE = 'https://api.calendly.com';

/**
 * GET /api/integrations/calendly?action=event_types
 * GET /api/integrations/calendly?action=scheduled_events
 */
export async function GET(request: NextRequest) {
  if (!CALENDLY_API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Calendly API not configured' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'event_types':
        return await getEventTypes();

      case 'scheduled_events':
        return await getScheduledEvents();

      case 'user':
        return await getCurrentUser();

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: event_types, scheduled_events, or user'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Calendly Integration] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/calendly
 * Create a booking link for Annie to share with customers
 */
export async function POST(request: NextRequest) {
  if (!CALENDLY_API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Calendly API not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { event_type_uri, email, name } = body;

    if (!event_type_uri) {
      return NextResponse.json({
        success: false,
        error: 'event_type_uri is required'
      }, { status: 400 });
    }

    // Create a scheduling link with pre-filled customer info
    const schedulingLink = new URL(event_type_uri.replace('/event_types/', '/'));

    if (email) {
      schedulingLink.searchParams.set('email', email);
    }

    if (name) {
      schedulingLink.searchParams.set('name', name);
    }

    return NextResponse.json({
      success: true,
      data: {
        scheduling_link: schedulingLink.toString(),
        event_type: event_type_uri
      }
    });

  } catch (error: any) {
    console.error('[Calendly Integration] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get current Calendly user info
 */
async function getCurrentUser() {
  const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
    headers: {
      'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user info');
  }

  return NextResponse.json({
    success: true,
    data: data.resource
  });
}

/**
 * Get all available event types (Color Analysis, Body Scan, etc.)
 */
async function getEventTypes() {
  // First get user URI
  const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
    headers: {
      'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const userData = await userResponse.json();
  const userUri = userData.resource.uri;

  // Get event types for this user
  const response = await fetch(`${CALENDLY_API_BASE}/event_types?user=${userUri}&active=true`, {
    headers: {
      'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch event types');
  }

  // Format for Annie to use
  const eventTypes = data.collection.map((event: any) => ({
    uri: event.uri,
    name: event.name,
    description: event.description_plain,
    duration: event.duration,
    booking_url: event.scheduling_url,
    active: event.active
  }));

  return NextResponse.json({
    success: true,
    data: eventTypes
  });
}

/**
 * Get scheduled events (upcoming appointments)
 */
async function getScheduledEvents() {
  // First get user URI
  const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
    headers: {
      'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const userData = await userResponse.json();
  const userUri = userData.resource.uri;

  // Get scheduled events for this user
  const response = await fetch(`${CALENDLY_API_BASE}/scheduled_events?user=${userUri}&status=active`, {
    headers: {
      'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch scheduled events');
  }

  // Format upcoming appointments
  const events = data.collection.map((event: any) => ({
    uri: event.uri,
    name: event.name,
    start_time: event.start_time,
    end_time: event.end_time,
    status: event.status,
    location: event.location?.join_url || event.location?.location
  }));

  return NextResponse.json({
    success: true,
    data: events
  });
}
