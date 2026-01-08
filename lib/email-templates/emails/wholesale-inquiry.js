/**
 * B2B Wholesale Inquiry Email Template
 * Sent to retailers/buyers to ask what natural fiber products they need
 */

module.exports = function wholesaleInquiryEmail({
  retailerName,
  contactName,
  retailerType,
  businessSize
}) {
  // Personalize greeting based on what we know
  const greeting = contactName ? `Hi ${contactName}` : `Hi there`;

  // Customize opening based on retailer type
  let openingLine = '';
  if (retailerType === 'shopify_store') {
    openingLine = `I came across your online store and love your focus on conscious/sustainable products.`;
  } else if (retailerType === 'boutique') {
    openingLine = `I came across ${retailerName} and love what you're doing in the wellness/conscious living space.`;
  } else if (retailerType === 'wholesaler') {
    openingLine = `I'm reaching out because ${retailerName} would be a perfect fit for our natural fiber product line.`;
  } else {
    openingLine = `I came across ${retailerName} and think we could be a great fit.`;
  }

  return {
    subject: `Natural fiber sourcing for ${retailerName}?`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #d4c8a8;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .brand {
      font-size: 14px;
      font-weight: 600;
      color: #1e2a3a;
      letter-spacing: 0.5px;
    }
    .content {
      font-size: 15px;
      line-height: 1.8;
    }
    .question {
      background: #f8f6f3;
      padding: 20px;
      border-left: 4px solid #d4c8a8;
      margin: 25px 0;
      font-size: 16px;
      font-weight: 500;
    }
    .products {
      background: #fff;
      padding: 20px;
      border: 1px solid #e8dcc4;
      margin: 20px 0;
    }
    .products h3 {
      margin-top: 0;
      color: #1e2a3a;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .products ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .products li {
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .products li:before {
      content: "✓ ";
      color: #d4c8a8;
      font-weight: bold;
    }
    .cta {
      background: #1e2a3a;
      color: #fff;
      padding: 15px 30px;
      text-decoration: none;
      display: inline-block;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: 600;
    }
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e8dcc4;
      color: #7a8a9a;
      font-size: 14px;
    }
    .value-props {
      background: #f8f6f3;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .value-props ul {
      margin: 10px 0;
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">FREQUENCY & FORM</div>
  </div>

  <div class="content">
    <p>${greeting},</p>

    <p>${openingLine}</p>

    <div class="question">
      Quick question: Do you currently carry natural fiber products
      (linen, organic cotton, wool, hemp) in your store?
    </div>

    <p>
      We work directly with manufacturers to source high-quality natural fiber
      products at wholesale prices. Many retailers tell us they struggle to find
      reliable suppliers for these items.
    </p>

    <div class="products">
      <h3>Products We Can Source</h3>
      <ul>
        <li>Linen bedding, clothing, kitchen textiles</li>
        <li>Organic cotton basics, loungewear, home goods</li>
        <li>Wool blankets, throws, apparel</li>
        <li>Hemp clothing, bags, accessories</li>
        <li>Silk pillowcases, sleepwear</li>
      </ul>
    </div>

    <p>
      <strong>Here's how it works:</strong><br/>
      Tell us what products your customers are asking for → We source them from
      our manufacturer network → You get competitive wholesale pricing with no
      minimum order requirements.
    </p>

    <div class="value-props">
      <strong>Why partner with us?</strong>
      <ul>
        <li>🌿 100% natural fibers (no synthetics ever)</li>
        <li>📦 Flexible minimums (start small, scale up)</li>
        <li>🚚 Direct from manufacturer pricing</li>
        <li>✅ Quality-verified before shipping</li>
        <li>📈 Growing demand for natural/sustainable products</li>
      </ul>
    </div>

    <p>
      If you're interested—or have specific products you wish you could
      source—I'd love to hear about it. Just reply to this email.
    </p>

    <p>Best,<br/>
    Henry</p>

    <div class="signature">
      Henry @ Frequency & Form<br/>
      Natural Fiber Distribution<br/>
      henry@frequencyandform.com
    </div>
  </div>
</body>
</html>
    `,
    text: `
${greeting},

${openingLine}

Quick question: Do you currently carry natural fiber products (linen, organic cotton, wool, hemp) in your store?

We work directly with manufacturers to source high-quality natural fiber products at wholesale prices. Many retailers tell us they struggle to find reliable suppliers for these items.

PRODUCTS WE CAN SOURCE:
• Linen bedding, clothing, kitchen textiles
• Organic cotton basics, loungewear, home goods
• Wool blankets, throws, apparel
• Hemp clothing, bags, accessories
• Silk pillowcases, sleepwear

HERE'S HOW IT WORKS:
Tell us what products your customers are asking for → We source them from our manufacturer network → You get competitive wholesale pricing with no minimum order requirements.

WHY PARTNER WITH US?
🌿 100% natural fibers (no synthetics ever)
📦 Flexible minimums (start small, scale up)
🚚 Direct from manufacturer pricing
✅ Quality-verified before shipping
📈 Growing demand for natural/sustainable products

If you're interested—or have specific products you wish you could source—I'd love to hear about it. Just reply to this email.

Best,
Henry

---
Henry @ Frequency & Form
Natural Fiber Distribution
henry@frequencyandform.com
    `
  };
};
