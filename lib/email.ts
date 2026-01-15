import { createClient } from '@supabase/supabase-js';

const EMAIL_API_URL = 'http://5.78.139.9:3000/api/send-email';

const FROM_EMAIL_CONCIERGE = process.env.FROM_EMAIL_CONCIERGE || 'concierge@frequencyandform.com';
const FROM_EMAIL_HENRY = process.env.FROM_EMAIL_HENRY || 'henry@maggieforbesstrategies.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@frequencyandform.com';

// Supabase client for email tracking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface TrackedEmailOptions extends EmailOptions {
  emailType: string;
  dedupKey?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  skipDuplicateCheck?: boolean;
}

/**
 * TRIPLE-CHECK DUPLICATE PREVENTION
 * 1. Check exact dedup_key match
 * 2. Check email_type + recipient within cooldown
 * 3. Check daily limit for email type
 */
async function canSendEmail(
  recipientEmail: string,
  emailType: string,
  dedupKey: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Email] Supabase not configured, skipping duplicate check');
    return { allowed: true };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // CHECK 1: Exact dedup_key match (MOST STRICT - never send same email twice)
    const { data: exactMatch } = await supabase
      .from('email_sent_log')
      .select('id, sent_at')
      .eq('dedup_key', dedupKey)
      .limit(1);

    if (exactMatch && exactMatch.length > 0) {
      return {
        allowed: false,
        reason: `BLOCKED: Exact duplicate - this email was already sent on ${exactMatch[0].sent_at}`
      };
    }

    // Get cooldown rules for this email type
    const { data: rules } = await supabase
      .from('email_cooldown_rules')
      .select('cooldown_hours, max_per_day, allow_duplicates')
      .eq('email_type', emailType)
      .single();

    // Default rules if none found
    const cooldownHours = rules?.cooldown_hours || 24;
    const maxPerDay = rules?.max_per_day || 1;
    const allowDuplicates = rules?.allow_duplicates || false;

    // Transactional emails (order confirmations, etc.) skip remaining checks
    if (allowDuplicates) {
      return { allowed: true };
    }

    // CHECK 2: Same email type + recipient within cooldown period
    const cooldownTime = new Date(Date.now() - cooldownHours * 60 * 60 * 1000).toISOString();
    const { data: recentSame } = await supabase
      .from('email_sent_log')
      .select('id, sent_at')
      .eq('recipient_email', recipientEmail)
      .eq('email_type', emailType)
      .gte('sent_at', cooldownTime)
      .limit(1);

    if (recentSame && recentSame.length > 0) {
      return {
        allowed: false,
        reason: `BLOCKED: ${emailType} already sent to ${recipientEmail} within ${cooldownHours} hours (at ${recentSame[0].sent_at})`
      };
    }

    // CHECK 3: Daily limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('email_sent_log')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_email', recipientEmail)
      .eq('email_type', emailType)
      .gte('sent_at', todayStart.toISOString());

    if (count !== null && count >= maxPerDay) {
      return {
        allowed: false,
        reason: `BLOCKED: Daily limit (${maxPerDay}) reached for ${emailType} to ${recipientEmail}`
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('[Email] Duplicate check error:', err);
    // On error, block the email to be safe
    return { allowed: false, reason: 'Duplicate check failed - blocking to be safe' };
  }
}

/**
 * Log sent email to database for tracking
 */
async function logSentEmail(
  recipientEmail: string,
  emailType: string,
  subject: string,
  dedupKey: string,
  from?: string,
  relatedEntityType?: string,
  relatedEntityId?: string
): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('email_sent_log').insert({
      recipient_email: recipientEmail,
      email_type: emailType,
      email_category: emailType.includes('order') || emailType.includes('shipping') ? 'transactional' : 'operational',
      subject,
      sent_from: from || FROM_EMAIL_CONCIERGE,
      dedup_key: dedupKey,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      delivery_status: 'sent',
      sent_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Email] Failed to log sent email:', err);
  }
}

/**
 * Send email with duplicate prevention
 */
export async function sendTrackedEmail(options: TrackedEmailOptions): Promise<{ success: boolean; error?: string }> {
  const recipientEmail = Array.isArray(options.to) ? options.to[0] : options.to;
  const dedupKey = options.dedupKey || `${options.emailType}:${recipientEmail}:${Date.now()}`;

  // Triple-check duplicates (unless explicitly skipped for transactional)
  if (!options.skipDuplicateCheck) {
    const check = await canSendEmail(recipientEmail, options.emailType, dedupKey);
    if (!check.allowed) {
      console.warn(`[Email] ${check.reason}`);
      return { success: false, error: check.reason };
    }
  }

  // Send the email
  const result = await sendEmail(options);

  // Log if successful
  if (result.success) {
    await logSentEmail(
      recipientEmail,
      options.emailType,
      options.subject,
      dedupKey,
      options.from,
      options.relatedEntityType,
      options.relatedEntityId
    );
  }

  return result;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || FROM_EMAIL_CONCIERGE,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email API error:', response.status, errorText);
      return { success: false, error: `Email API error: ${response.status}` };
    }

    const result = await response.json();
    return { success: true, ...result };
  } catch (err) {
    console.error('Email send exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendFromHenry(options: Omit<EmailOptions, 'from'>): Promise<{ success: boolean; error?: string }> {
  return sendEmail({ ...options, from: FROM_EMAIL_HENRY });
}

export async function sendFromConcierge(options: Omit<EmailOptions, 'from'>): Promise<{ success: boolean; error?: string }> {
  return sendEmail({ ...options, from: FROM_EMAIL_CONCIERGE });
}

export async function sendPartnerApplicationConfirmation(
  email: string,
  businessName: string,
  contactName: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: 'Application Received - Frequency & Form Partner Program',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Thank You for Your Application</h1>
        <p>Dear ${contactName},</p>
        <p>We've received your partner application for <strong>${businessName}</strong> and are excited to review it.</p>
        <p>Our team carefully evaluates each application to ensure alignment with our values of natural fibers, sustainable fashion, and frequency-aligned wellness.</p>
        <h2 style="color: #1a1a1a; font-size: 18px;">What Happens Next?</h2>
        <ul>
          <li>Our team will review your application within 3-5 business days</li>
          <li>We may reach out with additional questions</li>
          <li>You'll receive an email notification once a decision is made</li>
        </ul>
        <p>In the meantime, feel free to explore our <a href="https://frequencyandform.com/about">About page</a> to learn more about our mission.</p>
        <p style="margin-top: 30px;">
          Warm regards,<br>
          <strong>The Frequency & Form Team</strong>
        </p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from Frequency & Form. Please do not reply directly to this email.
        </p>
      </div>
    `,
  });
}

export async function sendPartnerApplicationAdminNotification(
  applicationData: {
    businessName: string;
    contactName: string;
    email: string;
    phone?: string;
    website?: string;
    productTypes: string[];
    message?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Partner Application: ${applicationData.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">New Partner Application</h1>
        <p>A new partner application has been submitted:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Business Name</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${applicationData.businessName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Contact Name</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${applicationData.contactName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${applicationData.email}">${applicationData.email}</a></td>
          </tr>
          ${applicationData.phone ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Phone</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${applicationData.phone}</td>
          </tr>
          ` : ''}
          ${applicationData.website ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Website</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="${applicationData.website}">${applicationData.website}</a></td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Product Types</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${applicationData.productTypes.join(', ')}</td>
          </tr>
        </table>
        ${applicationData.message ? `
        <h3 style="color: #1a1a1a;">Message</h3>
        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${applicationData.message}</p>
        ` : ''}
        <p style="margin-top: 20px;">
          <a href="https://frequencyandform.com/admin/applications" style="background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Review Application</a>
        </p>
      </div>
    `,
  });
}

export async function sendNewProductAdminNotification(
  productData: {
    productName: string;
    sellerName: string;
    sellerEmail: string;
    price: number;
    fabricType?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Product Pending Approval: ${productData.productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">New Product Submission</h1>
        <p>A new product has been submitted for approval:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Product Name</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${productData.productName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Seller</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${productData.sellerName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Seller Email</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${productData.sellerEmail}">${productData.sellerEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Price</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(productData.price / 100).toFixed(2)}</td>
          </tr>
          ${productData.fabricType ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Fabric Type</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${productData.fabricType}</td>
          </tr>
          ` : ''}
        </table>
        <p style="margin-top: 20px;">
          <a href="https://frequencyandform.com/admin/products" style="background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Review Product</a>
        </p>
      </div>
    `,
  });
}

export async function sendSellerWelcomeEmail(
  email: string,
  contactName: string,
  businessName: string,
  temporaryPassword?: string
): Promise<{ success: boolean; error?: string }> {
  return sendTrackedEmail({
    to: email,
    subject: 'Welcome to Frequency & Form - Your Seller Account is Ready',
    emailType: 'seller_welcome',
    dedupKey: `seller_welcome:${email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Welcome to Frequency & Form!</h1>
        <p>Dear ${contactName},</p>
        <p>Great news! Your seller account for <strong>${businessName}</strong> has been created and is ready to use.</p>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Login Details</h3>
          <p><strong>Email:</strong> ${email}</p>
          ${temporaryPassword ? `<p><strong>Temporary Password:</strong> ${temporaryPassword}</p>` : ''}
          <p style="font-size: 12px; color: #666;">Please change your password after your first login.</p>
        </div>

        <h2 style="color: #1a1a1a; font-size: 18px;">Getting Started</h2>
        <ol>
          <li>Log in to your <a href="https://frequencyandform.com/seller/login">Seller Dashboard</a></li>
          <li>Complete your profile and add your brand story</li>
          <li>Upload your first products</li>
          <li>Start earning with every sale!</li>
        </ol>

        <p style="margin-top: 30px;">
          <a href="https://frequencyandform.com/seller/login" style="background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Access Your Dashboard</a>
        </p>

        <p style="margin-top: 30px;">
          Welcome to the family!<br>
          <strong>The Frequency & Form Team</strong>
        </p>
      </div>
    `,
  });
}

// =====================================================
// ORDER & SHIPPING EMAILS
// =====================================================

export async function sendOrderConfirmation(
  email: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: {
      name: string;
      address1: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  }
): Promise<{ success: boolean; error?: string }> {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  return sendTrackedEmail({
    to: email,
    subject: `Order Confirmed - #${orderData.orderNumber}`,
    emailType: 'order_confirmation',
    dedupKey: `order_confirmation:${email}:${orderData.orderNumber}`,
    relatedEntityType: 'order',
    skipDuplicateCheck: true, // Transactional - allow
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1F2937;">
        <div style="text-align: center; padding: 30px 0; border-bottom: 1px solid #E5E7EB;">
          <h1 style="font-size: 24px; font-weight: normal; margin: 0; color: #1F2937;">Frequency & Form</h1>
        </div>

        <div style="padding: 40px 20px;">
          <h2 style="font-size: 20px; font-weight: normal; margin: 0 0 20px;">Thank you for your order</h2>
          <p style="color: #6B7280; margin: 0 0 30px;">Hi ${orderData.customerName}, we've received your order and will notify you when it ships.</p>

          <div style="background: #F6F4EF; padding: 20px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px;"><strong>Order Number:</strong> #${orderData.orderNumber}</p>
          </div>

          <h3 style="font-size: 16px; font-weight: normal; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="text-align: left; color: #6B7280; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 12px 12px 12px 0;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px 0 12px 12px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Subtotal</td>
              <td style="padding: 8px 0; text-align: right;">$${(orderData.subtotal / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Shipping</td>
              <td style="padding: 8px 0; text-align: right;">$${(orderData.shipping / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Tax</td>
              <td style="padding: 8px 0; text-align: right;">$${(orderData.tax / 100).toFixed(2)}</td>
            </tr>
            <tr style="font-size: 18px;">
              <td style="padding: 16px 0 8px; border-top: 1px solid #E5E7EB;"><strong>Total</strong></td>
              <td style="padding: 16px 0 8px; border-top: 1px solid #E5E7EB; text-align: right;"><strong>$${(orderData.total / 100).toFixed(2)}</strong></td>
            </tr>
          </table>

          <h3 style="font-size: 16px; font-weight: normal; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px;">Shipping Address</h3>
          <p style="color: #6B7280; line-height: 1.6;">
            ${orderData.shippingAddress.name}<br>
            ${orderData.shippingAddress.address1}<br>
            ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zip}<br>
            ${orderData.shippingAddress.country}
          </p>
        </div>

        <div style="background: #F6F4EF; padding: 30px 20px; text-align: center;">
          <p style="margin: 0 0 10px; color: #6B7280; font-size: 14px;">Questions about your order?</p>
          <a href="mailto:concierge@frequencyandform.com" style="color: #C8B28A;">concierge@frequencyandform.com</a>
        </div>
      </div>
    `,
  });
}

export async function sendShippingNotification(
  email: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendTrackedEmail({
    to: email,
    subject: `Your Order Has Shipped - #${orderData.orderNumber}`,
    emailType: 'shipping_notification',
    dedupKey: `shipping:${email}:${orderData.orderNumber}:${orderData.trackingNumber || 'no-tracking'}`,
    relatedEntityType: 'order',
    skipDuplicateCheck: true, // Transactional
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1F2937;">
        <div style="text-align: center; padding: 30px 0; border-bottom: 1px solid #E5E7EB;">
          <h1 style="font-size: 24px; font-weight: normal; margin: 0; color: #1F2937;">Frequency & Form</h1>
        </div>

        <div style="padding: 40px 20px;">
          <h2 style="font-size: 20px; font-weight: normal; margin: 0 0 20px;">Your order is on its way!</h2>
          <p style="color: #6B7280; margin: 0 0 30px;">Hi ${orderData.customerName}, great news - your order #${orderData.orderNumber} has shipped.</p>

          ${orderData.trackingNumber ? `
          <div style="background: #F6F4EF; padding: 20px; margin-bottom: 30px;">
            <p style="margin: 0 0 10px; font-size: 14px;"><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>
            ${orderData.carrier ? `<p style="margin: 0 0 10px; font-size: 14px;"><strong>Carrier:</strong> ${orderData.carrier}</p>` : ''}
            ${orderData.estimatedDelivery ? `<p style="margin: 0; font-size: 14px;"><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>` : ''}
          </div>

          ${orderData.trackingUrl ? `
          <p style="text-align: center; margin: 30px 0;">
            <a href="${orderData.trackingUrl}" style="background: #1F2937; color: white; padding: 14px 28px; text-decoration: none; display: inline-block;">Track Your Package</a>
          </p>
          ` : ''}
          ` : `
          <div style="background: #F6F4EF; padding: 20px; margin-bottom: 30px;">
            <p style="margin: 0; font-size: 14px;">Your order is being prepared for shipment. You'll receive tracking information soon.</p>
          </div>
          `}

          <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            Thank you for choosing natural fibers that support your body's frequency. We hope you love your new pieces.
          </p>
        </div>

        <div style="background: #F6F4EF; padding: 30px 20px; text-align: center;">
          <p style="margin: 0 0 10px; color: #6B7280; font-size: 14px;">Questions about your shipment?</p>
          <a href="mailto:concierge@frequencyandform.com" style="color: #C8B28A;">concierge@frequencyandform.com</a>
        </div>
      </div>
    `,
  });
}

// =====================================================
// NEWSLETTER EMAILS
// =====================================================

export async function sendNewsletterWelcome(
  email: string
): Promise<{ success: boolean; error?: string }> {
  return sendTrackedEmail({
    to: email,
    subject: 'Welcome to Frequency & Form',
    emailType: 'newsletter_welcome',
    dedupKey: `newsletter_welcome:${email}`,
    html: `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1F2937;">
        <div style="text-align: center; padding: 30px 0; border-bottom: 1px solid #E5E7EB;">
          <h1 style="font-size: 24px; font-weight: normal; margin: 0; color: #1F2937;">Frequency & Form</h1>
        </div>

        <div style="padding: 40px 20px; text-align: center;">
          <h2 style="font-size: 20px; font-weight: normal; margin: 0 0 20px;">Welcome to the movement</h2>
          <p style="color: #6B7280; margin: 0 0 30px; line-height: 1.8;">
            You've joined a community that understands: what touches your skin matters.
          </p>

          <div style="background: #F6F4EF; padding: 30px; margin: 30px 0; text-align: left;">
            <p style="margin: 0 0 15px; font-size: 14px; color: #6B7280;"><strong style="color: #1F2937;">What to expect:</strong></p>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #6B7280; line-height: 2;">
              <li>New arrivals in natural fibers</li>
              <li>The science behind fabric frequency</li>
              <li>Exclusive early access to collections</li>
              <li>Styling insights for conscious wardrobes</li>
            </ul>
          </div>

          <p style="margin: 30px 0;">
            <a href="https://frequencyandform.com/shop" style="background: #1F2937; color: white; padding: 14px 28px; text-decoration: none; display: inline-block;">Explore the Collection</a>
          </p>

          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Dress with intention.
          </p>
        </div>

        <div style="padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
            <a href="https://frequencyandform.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9CA3AF;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `,
  });
}

// =====================================================
// OUTREACH EMAILS (STRICT DUPLICATE PREVENTION)
// =====================================================

export async function sendOutreachEmail(
  email: string,
  recipientName: string,
  customMessage: string,
  outreachType: 'outreach' | 'follow_up_1' | 'follow_up_2' | 'follow_up_3' = 'outreach'
): Promise<{ success: boolean; error?: string }> {
  const subjects: Record<string, string> = {
    outreach: 'Natural Fibers for Your Collection',
    follow_up_1: 'Following up - Frequency & Form Partnership',
    follow_up_2: 'Quick follow-up - F&F',
    follow_up_3: 'One more thought - Frequency & Form'
  };

  return sendTrackedEmail({
    to: email,
    from: FROM_EMAIL_HENRY,
    subject: subjects[outreachType],
    emailType: outreachType,
    dedupKey: `${outreachType}:${email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <p>Hi ${recipientName},</p>

        ${customMessage}

        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Henry Forbes</strong><br>
          <span style="color: #666;">Frequency & Form</span>
        </p>
      </div>
    `,
  });
}
