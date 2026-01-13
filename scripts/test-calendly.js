/**
 * Test Calendly Integration
 * Verify API connection and fetch event types
 */

require('dotenv').config({ path: '.env.local' });

const CALENDLY_API_TOKEN = process.env.CALENDLY_API_TOKEN;
const CALENDLY_API_BASE = 'https://api.calendly.com';

async function testCalendly() {
  console.log('\n🧪 Testing Calendly Integration\n');
  console.log('='.repeat(60));

  if (!CALENDLY_API_TOKEN) {
    console.log('❌ CALENDLY_API_TOKEN not found in .env.local');
    process.exit(1);
  }

  try {
    // Test 1: Get current user
    console.log('\n1. Testing user authentication...');
    const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      const error = await userResponse.json();
      throw new Error(`User API failed: ${error.message || userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const user = userData.resource;

    console.log('✅ Authentication successful');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   URI: ${user.uri}`);

    // Test 2: Get event types
    console.log('\n2. Fetching available event types...');
    const eventTypesResponse = await fetch(
      `${CALENDLY_API_BASE}/event_types?user=${user.uri}&active=true`,
      {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!eventTypesResponse.ok) {
      const error = await eventTypesResponse.json();
      throw new Error(`Event Types API failed: ${error.message || eventTypesResponse.statusText}`);
    }

    const eventTypesData = await eventTypesResponse.json();
    const eventTypes = eventTypesData.collection;

    console.log(`✅ Found ${eventTypes.length} active event type(s)\n`);

    eventTypes.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.name}`);
      console.log(`      Duration: ${event.duration} minutes`);
      console.log(`      Booking URL: ${event.scheduling_url}`);
      console.log(`      Description: ${event.description_plain || 'N/A'}`);
      console.log('');
    });

    // Test 3: Get scheduled events
    console.log('3. Fetching scheduled events...');
    const scheduledResponse = await fetch(
      `${CALENDLY_API_BASE}/scheduled_events?user=${user.uri}&status=active&count=5`,
      {
        headers: {
          'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!scheduledResponse.ok) {
      const error = await scheduledResponse.json();
      throw new Error(`Scheduled Events API failed: ${error.message || scheduledResponse.statusText}`);
    }

    const scheduledData = await scheduledResponse.json();
    const scheduledEvents = scheduledData.collection;

    console.log(`✅ Found ${scheduledEvents.length} upcoming event(s)\n`);

    if (scheduledEvents.length > 0) {
      scheduledEvents.forEach((event, index) => {
        const startTime = new Date(event.start_time);
        console.log(`   ${index + 1}. ${event.name}`);
        console.log(`      When: ${startTime.toLocaleString()}`);
        console.log(`      Status: ${event.status}`);
        console.log('');
      });
    } else {
      console.log('   No upcoming events scheduled\n');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('\n✅ Calendly Integration Test: PASSED\n');
    console.log('Next steps:');
    console.log('1. Run the SQL migration: 013_annie_calendly_templates.sql');
    console.log('2. Update Calendly URLs in templates with your actual booking links');
    console.log('3. Test Annie chat with booking requests\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nPlease check:');
    console.error('- CALENDLY_API_TOKEN is correct in .env.local');
    console.error('- Token has not expired');
    console.error('- You have active event types set up in Calendly\n');
    process.exit(1);
  }
}

testCalendly();
