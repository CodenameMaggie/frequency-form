/**
 * Email Sender - Forbes Command Center Integration
 * Sends emails via Forbes Command server (Port 25 with DKIM)
 * Centralized email service for all Forbes Command businesses
 */

const axios = require('axios');

// Forbes Command Center Configuration
const FORBES_COMMAND_API = process.env.FORBES_COMMAND_EMAIL_API || 'http://5.78.139.9:3000/api/email-api';
const FORBES_COMMAND_API_KEY = process.env.FORBES_COMMAND_API_KEY || 'forbes-command-2026';
const BUSINESS_CODE = process.env.BUSINESS_CODE || 'FF';

// Default sender addresses
const SENDER_EMAILS = {
  henry: process.env.FROM_EMAIL_HENRY || 'henry@maggieforbesstrategies.com',
  concierge: process.env.FROM_EMAIL_CONCIERGE || 'concierge@frequencyandform.com',
  noreply: process.env.FROM_EMAIL_NOREPLY || 'noreply@maggieforbesstrategies.com',
  support: process.env.FROM_EMAIL_SUPPORT || 'support@maggieforbesstrategies.com'
};

/**
 * Verify Forbes Command email API connection
 */
async function verifyConnection() {
  try {
    console.log('[Forbes Command] Verifying email API connection...');
    const response = await axios.post(FORBES_COMMAND_API, {
      action: 'status',
      api_key: FORBES_COMMAND_API_KEY
    }, {
      timeout: 10000
    });

    if (response.data && response.data.status === 'ready') {
      console.log('[Forbes Command] ✅ Email API verified -', response.data.service);
      console.log('[Forbes Command] Supported businesses:', response.data.businesses.join(', '));
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Forbes Command] ❌ Connection verification failed:', error.message);
    return false;
  }
}

/**
 * Send email via Forbes Command Center (Port 25 with DKIM)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Plain text body (optional)
 * @param {string} options.from - Sender email (defaults to henry@)
 * @param {string} options.fromName - Sender name (optional)
 * @param {string} options.replyTo - Reply-to address (optional)
 * @returns {Promise<Object>} Result with success status and messageId
 */
async function sendEmail({
  to,
  subject,
  html,
  text = null,
  from = SENDER_EMAILS.henry,
  fromName = 'Frequency & Form',
  replyTo = null
}) {
  try {
    // Validate inputs
    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, html');
    }

    console.log(`[Forbes Command] Sending email via Port 25`);
    console.log(`[Forbes Command] From: ${from}`);
    console.log(`[Forbes Command] To: ${to}`);
    console.log(`[Forbes Command] Subject: ${subject.substring(0, 60)}...`);
    console.log(`[Forbes Command] Business: ${BUSINESS_CODE}`);

    // Call Forbes Command email API
    const response = await axios.post(FORBES_COMMAND_API, {
      action: 'send',
      api_key: FORBES_COMMAND_API_KEY,
      business: BUSINESS_CODE,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      from: from,
      from_name: fromName,
      reply_to: replyTo || from
    }, {
      timeout: 30000, // 30 second timeout for email sending
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.success) {
      console.log(`[Forbes Command] ✅ Email sent successfully`);
      console.log(`[Forbes Command] Message ID: ${response.data.id}`);
      console.log(`[Forbes Command] Provider: ${response.data.provider}`);

      return {
        success: true,
        messageId: response.data.id,
        provider: response.data.provider,
        response: 'Email sent via Forbes Command Center'
      };
    } else {
      throw new Error(response.data?.error || 'Email send failed');
    }

  } catch (error) {
    console.error('[Forbes Command] ❌ Error sending email:', error.message);

    if (error.response) {
      console.error('[Forbes Command] API Error:', error.response.data);
    }

    return {
      success: false,
      error: error.message,
      code: error.code || error.response?.status
    };
  }
}

/**
 * Send email from Henry (B2B wholesale outreach)
 */
async function sendFromHenry({ to, subject, html, text = null }) {
  return await sendEmail({
    to,
    subject,
    html,
    text,
    from: SENDER_EMAILS.henry,
    fromName: 'Henry @ Frequency & Form'
  });
}

/**
 * Send email from Concierge (customer support)
 */
async function sendFromConcierge({ to, subject, html, text = null }) {
  return await sendEmail({
    to,
    subject,
    html,
    text,
    from: SENDER_EMAILS.concierge,
    fromName: 'Frequency & Form Concierge'
  });
}

/**
 * Send system/noreply email (transactional)
 */
async function sendSystemEmail({ to, subject, html, text = null }) {
  return await sendEmail({
    to,
    subject,
    html,
    text,
    from: SENDER_EMAILS.noreply,
    fromName: 'Frequency & Form',
    replyTo: SENDER_EMAILS.support
  });
}

// =============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// (Maintain backward compatibility with existing bot code)
// =============================================================================

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, resetUrl) {
  return await sendSystemEmail({
    to: email,
    subject: 'Reset Your Password - Frequency & Form',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
}

/**
 * Send password changed confirmation
 */
async function sendPasswordChangedEmail({ email, name }) {
  return await sendSystemEmail({
    to: email,
    subject: 'Password Changed - Frequency & Form',
    html: `
      <h2>Password Changed</h2>
      <p>Hi ${name},</p>
      <p>Your password has been successfully changed.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    `
  });
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail({ email, name }) {
  return await sendFromConcierge({
    to: email,
    subject: 'Welcome to Frequency & Form!',
    html: `
      <h2>Welcome to Frequency & Form!</h2>
      <p>Hi ${name},</p>
      <p>We're excited to have you join our community of natural fiber enthusiasts.</p>
      <p>Explore our collection of high-frequency, natural fiber products.</p>
      <p>Best regards,<br/>The Frequency & Form Team</p>
    `
  });
}

/**
 * Send outreach email (wholesale buyer discovery)
 */
async function sendOutreachEmail({ to, subject, html, text = null }) {
  return await sendFromHenry({
    to,
    subject,
    html,
    text
  });
}

/**
 * Send follow-up email
 */
async function sendFollowUpEmail({ to, subject, html, text = null }) {
  return await sendFromHenry({
    to,
    subject,
    html,
    text
  });
}

/**
 * Send support email
 */
async function sendSupportEmail({ to, subject, html, text = null }) {
  return await sendFromConcierge({
    to,
    subject,
    html,
    text
  });
}

/**
 * Send notification email
 */
async function sendNotificationEmail({ to, subject, html, text = null }) {
  return await sendSystemEmail({
    to,
    subject,
    html,
    text
  });
}

/**
 * Generic email send (backward compatibility)
 */
async function sendGenericEmail({ to, subject, html, text = null, from = null }) {
  return await sendEmail({
    to,
    subject,
    html,
    text,
    from: from || SENDER_EMAILS.henry
  });
}

/**
 * Send subscription confirmation
 */
async function sendSubscriptionConfirmation({ email, name, tier }) {
  return await sendFromConcierge({
    to: email,
    subject: `Welcome to ${tier} - Frequency & Form`,
    html: `
      <h2>Subscription Confirmed!</h2>
      <p>Hi ${name},</p>
      <p>Your ${tier} subscription is now active.</p>
      <p>Thank you for supporting natural fiber products!</p>
    `
  });
}

/**
 * Send payment received confirmation
 */
async function sendPaymentReceived({ email, name, amount }) {
  return await sendSystemEmail({
    to: email,
    subject: 'Payment Received - Frequency & Form',
    html: `
      <h2>Payment Received</h2>
      <p>Hi ${name},</p>
      <p>We've received your payment of $${amount}.</p>
      <p>Thank you!</p>
    `
  });
}

/**
 * Send payment failed notification
 */
async function sendPaymentFailed({ email, name }) {
  return await sendSystemEmail({
    to: email,
    subject: 'Payment Failed - Action Required',
    html: `
      <h2>Payment Failed</h2>
      <p>Hi ${name},</p>
      <p>We were unable to process your payment.</p>
      <p>Please update your payment method.</p>
    `
  });
}

/**
 * Send proposal email
 */
async function sendProposalEmail({ to, subject, html }) {
  return await sendFromHenry({
    to,
    subject,
    html
  });
}

/**
 * Send onboarding email
 */
async function sendOnboardingEmail({ to, subject, html }) {
  return await sendFromConcierge({
    to,
    subject,
    html
  });
}

/**
 * Send ticket update
 */
async function sendTicketUpdate({ to, subject, html }) {
  return await sendFromConcierge({
    to,
    subject,
    html
  });
}

/**
 * Send proposal accepted notification
 */
async function sendProposalAccepted({ email, proposalTitle }) {
  return await sendFromHenry({
    to: email,
    subject: `Proposal Accepted: ${proposalTitle}`,
    html: `
      <h2>Proposal Accepted!</h2>
      <p>Great news! Your proposal "${proposalTitle}" has been accepted.</p>
      <p>We'll be in touch shortly with next steps.</p>
    `
  });
}

/**
 * Send proposal rejected notification
 */
async function sendProposalRejected({ email, proposalTitle, reason }) {
  return await sendFromHenry({
    to: email,
    subject: `Proposal Update: ${proposalTitle}`,
    html: `
      <h2>Proposal Update</h2>
      <p>Thank you for your proposal "${proposalTitle}".</p>
      ${reason ? `<p>Feedback: ${reason}</p>` : ''}
      <p>We appreciate your interest in working with us.</p>
    `
  });
}

// For legacy code compatibility
const getTransporter = () => {
  console.warn('[Forbes Command] getTransporter() called - using Forbes Command API instead');
  return null;
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Core functions
  sendEmail,
  verifyConnection,
  getTransporter, // Legacy compatibility

  // Sender-specific functions
  sendFromHenry,
  sendFromConcierge,
  sendSystemEmail,

  // Legacy compatibility
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail,
  sendOutreachEmail,
  sendFollowUpEmail,
  sendSupportEmail,
  sendNotificationEmail,
  sendGenericEmail,
  sendSubscriptionConfirmation,
  sendPaymentReceived,
  sendPaymentFailed,
  sendProposalEmail,
  sendProposalAccepted,
  sendProposalRejected,
  sendOnboardingEmail,
  sendTicketUpdate,

  // Sender addresses (for reference)
  SENDER_EMAILS
};
