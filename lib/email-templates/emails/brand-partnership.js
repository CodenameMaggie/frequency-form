/**
 * Brand Partnership Outreach Email Template
 * For Frequency & Form Founding Partner recruitment
 */

module.exports = {
  subject: (data) => {
    return `Founding Partner invitation for ${data.brandName}`;
  },

  preheader: (data) => {
    return `Join the first 50 Founding Partners (15% commission locked forever)`;
  },

  template: (data) => {
    const {
      contactName = 'there',
      brandName,
      specificProduct,
      storyElement,
      currentPartnerCount = 12
    } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      margin-bottom: 30px;
    }
    .content {
      font-size: 16px;
    }
    .benefits {
      background: #f9f7f4;
      border-left: 4px solid #8b7355;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .benefits ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .benefits li {
      margin: 8px 0;
    }
    .cta {
      background: #8b7355;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      margin: 20px 0;
      font-weight: 600;
    }
    .signature {
      margin-top: 30px;
      color: #666;
    }
    .ps {
      margin-top: 25px;
      font-size: 14px;
      color: #666;
      font-style: italic;
      border-top: 1px solid #e0e0e0;
      padding-top: 15px;
    }
    strong {
      color: #8b7355;
    }
  </style>
</head>
<body>
  <div class="content">
    <p>Hi ${contactName},</p>

    <p>I came across <strong>${brandName}</strong>${specificProduct ? ` and was immediately drawn to your <strong>${specificProduct}</strong>` : ''}${storyElement ? `. ${storyElement} really resonates with what we're building` : ''}.</p>

    <p>I'm reaching out because we're launching <strong>Frequency & Form</strong> – a curated marketplace for natural fiber brands – and I'd love ${brandName} to be one of our <strong>Founding Partners</strong>.</p>

    <div class="benefits">
      <p><strong>Why this matters:</strong></p>
      <p>We're only accepting 50 Founding Partners, and they get:</p>
      <ul>
        <li><strong>15% commission (locked in forever)</strong> vs our standard 20%</li>
        <li>Featured homepage placement + "Founding Partner" badge</li>
        <li>Access to customers who understand frequency science and natural fibers</li>
        <li>Weekly payouts, transparent reporting</li>
        <li>We handle marketing (SEO, social media, email campaigns)</li>
      </ul>
    </div>

    <p><strong>What makes us different:</strong></p>

    <p>Unlike Etsy or Amazon, we ONLY accept natural fibers. No synthetics, ever. Our customers are wellness-conscious buyers who actively seek out healing-frequency textiles${specificProduct ? ` – people who will appreciate ${specificProduct}` : ''}.</p>

    <p><strong>Next step:</strong></p>

    <p>If you're interested in being one of the first 50, the application takes 5 minutes:</p>

    <a href="https://frequencyandform.com/partners/apply" class="cta">Apply as Founding Partner</a>

    <div class="signature">
      <p>Looking forward to potentially partnering,</p>
      <p><strong>Henry</strong><br>
      Frequency & Form<br>
      henry@frequencyandform.com</p>
    </div>

    <div class="ps">
      <p>P.S. We're at ${currentPartnerCount} Founding Partners approved so far – spots are filling up.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
};
