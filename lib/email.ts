const EMAIL_API_URL = 'http://5.78.139.9:3000/api/send-email';

const FROM_EMAIL_CONCIERGE = process.env.FROM_EMAIL_CONCIERGE || 'concierge@frequencyandform.com';
const FROM_EMAIL_HENRY = process.env.FROM_EMAIL_HENRY || 'henry@maggieforbesstrategies.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@frequencyandform.com';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
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
  return sendEmail({
    to: email,
    subject: 'Welcome to Frequency & Form - Your Seller Account is Ready',
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
