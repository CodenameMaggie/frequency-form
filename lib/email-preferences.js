/**
 * Email Preferences Stub
 * Minimal implementation for bot server to load
 */

async function canReceiveEmail(userId, emailType) {
  // Stub - always return true for now
  return true;
}

function getUnsubscribeUrl(userId) {
  // Stub - return placeholder URL
  return 'https://frequencyandform.com/unsubscribe';
}

module.exports = {
  canReceiveEmail,
  getUnsubscribeUrl
};
