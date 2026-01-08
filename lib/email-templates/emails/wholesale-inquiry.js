/**
 * B2B Wholesale Inquiry Email Template
 * Sent to retailers/buyers to ask what natural fiber products they need
 * SHORT, PUNCHY, EASY TO REPLY
 */

module.exports = function wholesaleInquiryEmail({
  retailerName,
  contactName,
  retailerType,
  businessSize
}) {
  // Personalize greeting
  const greeting = contactName ? `${contactName}` : `there`;

  // Customize opening based on retailer type
  let openingLine = '';
  let specificHook = '';

  if (retailerType === 'shopify_store') {
    openingLine = `I came across your store—love the sustainable focus.`;
    specificHook = `Your customers are probably asking for natural fiber products. We can help source them.`;
  } else if (retailerType === 'boutique') {
    openingLine = `Love what you're doing at ${retailerName}.`;
    specificHook = `Natural fiber products (linen, organic cotton, wool) are selling like crazy right now. We can help you stock them.`;
  } else if (retailerType === 'wholesaler' || retailerType === 'department_store') {
    openingLine = `Quick question for your buying team.`;
    specificHook = `We source natural fiber home goods and apparel at competitive wholesale prices. Volume orders welcome.`;
  } else {
    openingLine = `I think we could help ${retailerName}.`;
    specificHook = `We source natural fiber products for retailers—linen, organic cotton, wool, hemp.`;
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
      line-height: 1.7;
      color: #2c3e50;
      max-width: 550px;
      margin: 0 auto;
      padding: 20px;
      font-size: 15px;
    }
    .content {
      margin: 20px 0;
    }
    p {
      margin: 15px 0;
    }
    .highlight {
      background: #f8f6f3;
      padding: 18px;
      border-left: 3px solid #d4c8a8;
      margin: 20px 0;
      font-weight: 500;
    }
    .products {
      margin: 20px 0;
      padding: 0;
      list-style: none;
    }
    .products li {
      padding: 6px 0;
      padding-left: 20px;
      position: relative;
    }
    .products li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #d4c8a8;
      font-weight: bold;
      font-size: 18px;
    }
    .cta {
      background: #1e2a3a;
      color: #fff !important;
      padding: 12px 28px;
      text-decoration: none;
      display: inline-block;
      border-radius: 3px;
      margin: 20px 0;
      font-weight: 600;
      font-size: 14px;
    }
    .signature {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e8dcc4;
      color: #6a7a8a;
      font-size: 13px;
      line-height: 1.5;
    }
    strong {
      color: #1e2a3a;
    }
  </style>
</head>
<body>
  <div class="content">
    <p>Hi ${greeting},</p>

    <p>${openingLine}</p>

    <p>${specificHook}</p>

    <div class="highlight">
      <strong>Quick question:</strong> Are you currently looking to source natural fiber products for your store?
    </div>

    <p><strong>What we do:</strong></p>
    <ul class="products">
      <li>Source linen bedding, apparel & kitchen goods</li>
      <li>Organic cotton basics & loungewear</li>
      <li>Wool blankets, throws & accessories</li>
      <li>Hemp bags, clothing & home goods</li>
    </ul>

    <p><strong>The deal:</strong></p>
    <ul class="products">
      <li>Competitive wholesale pricing (40-60% off retail)</li>
      <li>Flexible minimums (start with 50-100 units)</li>
      <li>Quality verified, 100% natural fibers</li>
      <li>Fast turnaround (7-14 days)</li>
    </ul>

    <p>
      <strong>Interested?</strong> Just reply and tell me what products you're looking for. I'll get you pricing within 24 hours.
    </p>

    <p>Or if you have specific items your customers keep asking for that you can't find—let me know. We can probably source them.</p>

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
Hi ${greeting},

${openingLine}

${specificHook}

>> Quick question: Are you currently looking to source natural fiber products for your store?

WHAT WE DO:
• Source linen bedding, apparel & kitchen goods
• Organic cotton basics & loungewear
• Wool blankets, throws & accessories
• Hemp bags, clothing & home goods

THE DEAL:
• Competitive wholesale pricing (40-60% off retail)
• Flexible minimums (start with 50-100 units)
• Quality verified, 100% natural fibers
• Fast turnaround (7-14 days)

INTERESTED? Just reply and tell me what products you're looking for. I'll get you pricing within 24 hours.

Or if you have specific items your customers keep asking for that you can't find—let me know. We can probably source them.

Best,
Henry

---
Henry @ Frequency & Form
Natural Fiber Distribution
henry@frequencyandform.com
    `
  };
};
