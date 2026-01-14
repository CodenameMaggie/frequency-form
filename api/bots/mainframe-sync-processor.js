/**
 * Mainframe Sync Processor
 *
 * Processes the mainframe_sync_queue and sends data to MFS Suite (Forbes Command Center)
 *
 * This processor:
 * 1. Queries pending sync items from mainframe_sync_queue
 * 2. Fetches the actual entity data (contacts, bot_actions, etc.)
 * 3. Sends to MFS Suite API
 * 4. Updates sync status (synced/failed)
 * 5. Handles retry logic (max 3 attempts)
 *
 * Run via cron: Every 5-15 minutes
 * Or manually via API endpoint
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUSINESS_CODE = 'FF';

/**
 * Get system configuration (mainframe URL and API key)
 */
async function getSystemConfig() {
  const { data, error } = await supabase
    .from('system_config')
    .select('mainframe_url, mainframe_api_key, sync_enabled')
    .eq('business_code', BUSINESS_CODE)
    .single();

  if (error) {
    console.error('[Mainframe Sync] Error fetching config:', error);
    return null;
  }

  return data;
}

/**
 * Get pending sync items from queue
 */
async function getPendingSyncItems(limit = 50) {
  const { data, error } = await supabase
    .from('mainframe_sync_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('attempts', 3) // Only get items that haven't exceeded max attempts
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Mainframe Sync] Error fetching queue:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch entity data based on type and ID
 */
async function fetchEntityData(entityType, entityId) {
  const { data, error } = await supabase
    .from(entityType)
    .select('*')
    .eq('id', entityId)
    .single();

  if (error) {
    console.error(`[Mainframe Sync] Error fetching ${entityType}:`, error);
    return null;
  }

  return data;
}

/**
 * Transform entity data into mainframe sync format
 */
function transformForMainframe(entityType, entityData, action) {
  const timestamp = new Date().toISOString();

  // Base payload
  const payload = {
    business_code: BUSINESS_CODE,
    entity_type: entityType,
    action: action,
    timestamp: timestamp,
    data: entityData
  };

  // Entity-specific transformations
  switch (entityType) {
    case 'contacts':
      return {
        ...payload,
        sync_type: 'contact',
        contact: {
          id: entityData.id,
          email: entityData.email,
          full_name: entityData.full_name,
          source: entityData.source,
          status: entityData.status,
          tags: entityData.tags || [],
          metadata: entityData.metadata || {},
          created_at: entityData.created_at,
          updated_at: entityData.updated_at
        }
      };

    case 'bot_actions_log':
      return {
        ...payload,
        sync_type: 'bot_action',
        bot_action: {
          id: entityData.id,
          bot_name: entityData.bot_name,
          action_type: entityData.action_type,
          action_description: entityData.action_description,
          status: entityData.status,
          metadata: entityData.metadata || {},
          tenant_id: entityData.tenant_id,
          created_at: entityData.created_at
        }
      };

    case 'emails':
      return {
        ...payload,
        sync_type: 'email',
        email: {
          id: entityData.id,
          to: entityData.to_email,
          from: entityData.from_email,
          subject: entityData.subject,
          sent_at: entityData.sent_at,
          status: entityData.status,
          campaign: entityData.campaign,
          opened: entityData.opened,
          clicked: entityData.clicked
        }
      };

    case 'tickets':
      return {
        ...payload,
        sync_type: 'ticket',
        ticket: {
          id: entityData.id,
          contact_id: entityData.contact_id,
          subject: entityData.subject,
          status: entityData.status,
          priority: entityData.priority,
          assigned_to: entityData.assigned_to,
          resolved_at: entityData.resolved_at,
          created_at: entityData.created_at
        }
      };

    default:
      return payload;
  }
}

/**
 * Send sync data to MFS Suite
 */
async function sendToMainframe(config, payload) {
  if (!config.mainframe_url || !config.mainframe_api_key) {
    throw new Error('Mainframe URL or API key not configured');
  }

  const syncEndpoint = `${config.mainframe_url}/api/sync`;

  console.log(`[Mainframe Sync] Sending ${payload.sync_type} to ${syncEndpoint}`);

  try {
    const response = await axios.post(syncEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.mainframe_api_key}`,
        'X-Business-Code': BUSINESS_CODE
      },
      timeout: 15000 // 15 second timeout
    });

    if (response.data && response.data.success) {
      console.log(`[Mainframe Sync] ✅ Synced ${payload.sync_type} successfully`);
      return { success: true, response: response.data };
    } else {
      throw new Error(response.data?.error || 'Sync failed');
    }
  } catch (error) {
    console.error(`[Mainframe Sync] ❌ Sync failed:`, error.message);
    if (error.response) {
      console.error('[Mainframe Sync] API Error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Mark sync item as synced
 */
async function markSynced(syncItemId) {
  const { error } = await supabase
    .from('mainframe_sync_queue')
    .update({
      status: 'synced',
      synced_at: new Date().toISOString(),
      error_message: null
    })
    .eq('id', syncItemId);

  if (error) {
    console.error('[Mainframe Sync] Error marking as synced:', error);
  }
}

/**
 * Mark sync item as failed and increment attempts
 */
async function markFailed(syncItemId, errorMessage) {
  // Get current attempts
  const { data: item } = await supabase
    .from('mainframe_sync_queue')
    .select('attempts')
    .eq('id', syncItemId)
    .single();

  const attempts = (item?.attempts || 0) + 1;
  const status = attempts >= 3 ? 'failed' : 'pending';

  const { error } = await supabase
    .from('mainframe_sync_queue')
    .update({
      status: status,
      attempts: attempts,
      last_attempt_at: new Date().toISOString(),
      error_message: errorMessage
    })
    .eq('id', syncItemId);

  if (error) {
    console.error('[Mainframe Sync] Error marking as failed:', error);
  }

  if (status === 'failed') {
    console.error(`[Mainframe Sync] ❌ Item ${syncItemId} failed permanently after ${attempts} attempts`);
  } else {
    console.log(`[Mainframe Sync] ⚠️  Item ${syncItemId} will retry (attempt ${attempts}/3)`);
  }
}

/**
 * Process one sync item
 */
async function processSyncItem(config, syncItem) {
  try {
    console.log(`[Mainframe Sync] Processing ${syncItem.entity_type} ${syncItem.entity_id}`);

    // Fetch entity data
    const entityData = await fetchEntityData(syncItem.entity_type, syncItem.entity_id);

    if (!entityData) {
      throw new Error(`Entity not found: ${syncItem.entity_type} ${syncItem.entity_id}`);
    }

    // Transform for mainframe
    const payload = transformForMainframe(syncItem.entity_type, entityData, syncItem.action);

    // Send to mainframe
    await sendToMainframe(config, payload);

    // Mark as synced
    await markSynced(syncItem.id);

    return { success: true };
  } catch (error) {
    console.error(`[Mainframe Sync] Error processing sync item:`, error.message);
    await markFailed(syncItem.id, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main processor function
 */
async function processMainframeSync() {
  console.log('[Mainframe Sync] Starting sync processor...');

  try {
    // Get system config
    const config = await getSystemConfig();

    if (!config) {
      console.error('[Mainframe Sync] ❌ System config not found');
      return {
        success: false,
        error: 'System config not found',
        processed: 0,
        failed: 0
      };
    }

    if (!config.sync_enabled) {
      console.log('[Mainframe Sync] ⏸️  Sync is disabled in system config');
      return {
        success: true,
        message: 'Sync disabled',
        processed: 0,
        failed: 0
      };
    }

    if (!config.mainframe_url || !config.mainframe_api_key) {
      console.error('[Mainframe Sync] ❌ Mainframe URL or API key not configured');
      return {
        success: false,
        error: 'Mainframe not configured',
        processed: 0,
        failed: 0
      };
    }

    // Get pending sync items
    const pendingItems = await getPendingSyncItems(50);

    if (pendingItems.length === 0) {
      console.log('[Mainframe Sync] ✅ No pending sync items');
      return {
        success: true,
        message: 'No items to sync',
        processed: 0,
        failed: 0
      };
    }

    console.log(`[Mainframe Sync] Found ${pendingItems.length} pending items`);

    // Process each item
    let processed = 0;
    let failed = 0;

    for (const item of pendingItems) {
      const result = await processSyncItem(config, item);
      if (result.success) {
        processed++;
      } else {
        failed++;
      }
    }

    console.log(`[Mainframe Sync] ✅ Completed: ${processed} synced, ${failed} failed`);

    return {
      success: true,
      processed: processed,
      failed: failed,
      total: pendingItems.length
    };
  } catch (error) {
    console.error('[Mainframe Sync] ❌ Processor error:', error);
    return {
      success: false,
      error: error.message,
      processed: 0,
      failed: 0
    };
  }
}

/**
 * API Handler (for manual trigger or cron)
 */
async function handler(req, res) {
  // Authorization check
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Bearer ', '');

  const validKey = process.env.FORBES_COMMAND_API_KEY || 'forbes-command-2026';

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  // Run processor
  const result = await processMainframeSync();

  return res.status(result.success ? 200 : 500).json(result);
}

// For direct execution (cron jobs)
if (require.main === module) {
  processMainframeSync()
    .then(result => {
      console.log('Sync complete:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Sync error:', error);
      process.exit(1);
    });
}

module.exports = handler;
module.exports.processMainframeSync = processMainframeSync;
