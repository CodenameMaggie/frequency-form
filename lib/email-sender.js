/**
 * Email Sender - Stub Implementation
 * Minimal stub to allow bot server to load without all email dependencies
 */

// Stub function that logs instead of sending
const stubEmailFunction = async (...args) => {
  console.log('[Email Stub] Email function called with args:', args.length);
  return { success: true, message: 'Stub email - not actually sent' };
};

// Export all possible email functions as stubs
module.exports = {
  // Core
  sendEmail: stubEmailFunction,

  // Auth
  sendPasswordResetEmail: stubEmailFunction,
  sendPasswordChangedEmail: stubEmailFunction,

  // Subscription
  sendSubscriptionConfirmation: stubEmailFunction,
  sendPaymentReceived: stubEmailFunction,
  sendPaymentFailed: stubEmailFunction,

  // Proposals
  sendProposalEmail: stubEmailFunction,
  sendProposalAccepted: stubEmailFunction,
  sendProposalRejected: stubEmailFunction,

  // Onboarding
  sendWelcomeEmail: stubEmailFunction,
  sendOnboardingEmail: stubEmailFunction,

  // Outreach
  sendOutreachEmail: stubEmailFunction,
  sendFollowUpEmail: stubEmailFunction,

  // Support
  sendSupportEmail: stubEmailFunction,
  sendTicketUpdate: stubEmailFunction,

  // Notifications
  sendNotificationEmail: stubEmailFunction,

  // Catch-all for any other functions
  sendGenericEmail: stubEmailFunction
};
