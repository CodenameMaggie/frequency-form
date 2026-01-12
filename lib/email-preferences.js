/**
 * Email Preferences Management System
 * CAN-SPAM Act Compliance
 *
 * Manages user email subscription preferences and unsubscribe functionality
 */

const crypto = require('crypto');
const { createClient } = require('./supabase');

// Email category mapping
const EMAIL_CATEGORIES = {
  marketing: 'marketing_emails',
  product_updates: 'product_updates',
  order_updates: 'order_updates',
  partner_updates: 'partner_updates',
  podcast: 'podcast_updates'
};

// Categories that CANNOT be unsubscribed from (transactional)
const CRITICAL_CATEGORIES = ['order_updates'];

/**
 * Get Supabase client instance
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Generate secure unsubscribe token
 */
function generateUnsubscribeToken(email) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return crypto
    .createHash('sha256')
    .update(`${email}-${timestamp}-${random}`)
    .digest('hex');
}

/**
 * Get or create email preferences for an email address
 */
async function getOrCreatePreferences(email) {
  const supabase = getSupabaseClient();

  // Try to get existing preferences
  const { data: existing, error: fetchError } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) {
    return existing;
  }

  // Create new preferences with unsubscribe token
  const token = generateUnsubscribeToken(email);

  const { data: created, error: createError } = await supabase
    .from('email_preferences')
    .insert({
      email,
      unsubscribe_token: token,
      marketing_emails: true,
      product_updates: true,
      order_updates: true,
      partner_updates: true,
      podcast_updates: true,
      unsubscribed_all: false
    })
    .select()
    .single();

  if (createError) {
    console.error('[Email Preferences] Error creating preferences:', createError);
    throw createError;
  }

  return created;
}

/**
 * Get preferences by unsubscribe token
 */
async function getPreferencesByToken(token) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('unsubscribe_token', token)
    .single();

  if (error) {
    console.error('[Email Preferences] Error fetching by token:', error);
    throw error;
  }

  return data;
}

/**
 * Check if user can receive a specific type of email
 */
async function canReceiveEmail(email, emailType) {
  try {
    const prefs = await getOrCreatePreferences(email);

    // If unsubscribed from all, only allow critical emails
    if (prefs.unsubscribed_all) {
      return CRITICAL_CATEGORIES.includes(emailType);
    }

    // Map email type to database column
    const column = EMAIL_CATEGORIES[emailType];
    if (!column) {
      console.warn(`[Email Preferences] Unknown email type: ${emailType}`);
      return true; // Default to allowing if type unknown
    }

    return prefs[column] === true;
  } catch (error) {
    console.error('[Email Preferences] Error checking email permission:', error);
    // Fail open - allow email if there's an error
    return true;
  }
}

/**
 * Get unsubscribe URL for an email address
 */
async function getUnsubscribeUrl(email, category = null) {
  try {
    const prefs = await getOrCreatePreferences(email);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frequencyandform.com';
    const url = new URL(`${baseUrl}/unsubscribe`);

    url.searchParams.set('token', prefs.unsubscribe_token);
    if (category) {
      url.searchParams.set('category', category);
    }

    return url.toString();
  } catch (error) {
    console.error('[Email Preferences] Error generating unsubscribe URL:', error);
    return 'https://frequencyandform.com/unsubscribe';
  }
}

/**
 * Log unsubscribe action (compliance requirement)
 */
async function logUnsubscribe(email, category, action = 'unsubscribe', metadata = {}) {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('email_unsubscribe_log')
    .insert({
      email,
      category,
      action,
      reason: metadata.reason || null,
      ip_address: metadata.ip || null,
      user_agent: metadata.userAgent || null
    });

  if (error) {
    console.error('[Email Preferences] Error logging unsubscribe:', error);
  }
}

/**
 * Unsubscribe from all emails (except critical)
 */
async function unsubscribeAll(token, metadata = {}) {
  const supabase = getSupabaseClient();

  // Get current preferences
  const prefs = await getPreferencesByToken(token);

  // Update all non-critical preferences to false
  const { error } = await supabase
    .from('email_preferences')
    .update({
      marketing_emails: false,
      product_updates: false,
      partner_updates: false,
      podcast_updates: false,
      unsubscribed_all: true,
      unsubscribed_at: new Date().toISOString()
    })
    .eq('unsubscribe_token', token);

  if (error) {
    console.error('[Email Preferences] Error unsubscribing all:', error);
    throw error;
  }

  // Log the action
  await logUnsubscribe(prefs.email, 'all', 'unsubscribe', metadata);

  return true;
}

/**
 * Unsubscribe from specific category
 */
async function unsubscribeFromCategory(token, category, metadata = {}) {
  // Don't allow unsubscribe from critical emails
  if (CRITICAL_CATEGORIES.includes(category)) {
    throw new Error('Cannot unsubscribe from transactional emails');
  }

  const supabase = getSupabaseClient();
  const column = EMAIL_CATEGORIES[category];

  if (!column) {
    throw new Error(`Invalid category: ${category}`);
  }

  // Get current preferences
  const prefs = await getPreferencesByToken(token);

  // Update specific category
  const { error } = await supabase
    .from('email_preferences')
    .update({ [column]: false })
    .eq('unsubscribe_token', token);

  if (error) {
    console.error('[Email Preferences] Error unsubscribing from category:', error);
    throw error;
  }

  // Log the action
  await logUnsubscribe(prefs.email, category, 'unsubscribe', metadata);

  return true;
}

/**
 * Resubscribe to emails
 */
async function resubscribe(token, categories = null, metadata = {}) {
  const supabase = getSupabaseClient();
  const prefs = await getPreferencesByToken(token);

  let updates = { unsubscribed_all: false };

  if (categories === null) {
    // Resubscribe to all
    updates = {
      ...updates,
      marketing_emails: true,
      product_updates: true,
      partner_updates: true,
      podcast_updates: true
    };
    await logUnsubscribe(prefs.email, 'all', 'resubscribe', metadata);
  } else {
    // Resubscribe to specific categories
    for (const category of categories) {
      const column = EMAIL_CATEGORIES[category];
      if (column) {
        updates[column] = true;
        await logUnsubscribe(prefs.email, category, 'resubscribe', metadata);
      }
    }
  }

  const { error } = await supabase
    .from('email_preferences')
    .update(updates)
    .eq('unsubscribe_token', token);

  if (error) {
    console.error('[Email Preferences] Error resubscribing:', error);
    throw error;
  }

  return true;
}

/**
 * Update specific preferences
 */
async function updatePreferences(token, updates) {
  const supabase = getSupabaseClient();

  // Filter to only allowed fields
  const allowedFields = Object.values(EMAIL_CATEGORIES);
  const filteredUpdates = {};

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && !CRITICAL_CATEGORIES.includes(key)) {
      filteredUpdates[key] = value;
    }
  }

  // If all categories are disabled, set unsubscribed_all
  const allDisabled = Object.values(filteredUpdates).every(v => v === false);
  if (allDisabled) {
    filteredUpdates.unsubscribed_all = true;
    filteredUpdates.unsubscribed_at = new Date().toISOString();
  } else {
    filteredUpdates.unsubscribed_all = false;
  }

  const { error } = await supabase
    .from('email_preferences')
    .update(filteredUpdates)
    .eq('unsubscribe_token', token);

  if (error) {
    console.error('[Email Preferences] Error updating preferences:', error);
    throw error;
  }

  return true;
}

module.exports = {
  // Main exports
  canReceiveEmail,
  getUnsubscribeUrl,

  // Preference management
  getOrCreatePreferences,
  getPreferencesByToken,
  updatePreferences,

  // Unsubscribe operations
  unsubscribeAll,
  unsubscribeFromCategory,
  resubscribe,

  // Utilities
  generateUnsubscribeToken,
  logUnsubscribe,

  // Constants
  EMAIL_CATEGORIES,
  CRITICAL_CATEGORIES
};
