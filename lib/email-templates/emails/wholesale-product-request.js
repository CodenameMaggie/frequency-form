/**
 * B2B Wholesale Product Request Follow-up
 * Sent when retailer responds - asks what specific products they need
 */

module.exports = function wholesaleProductRequestEmail({
  retailerName,
  contactName
}) {
  const greeting = contactName ? `${contactName}` : `there`;

  return {
    subject: `Re: What natural fiber products do you need?`,
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
    .questions {
      background: #f8f6f3;
      padding: 25px;
      border-left: 4px solid #d4c8a8;
      margin: 25px 0;
    }
    .questions h3 {
      margin-top: 0;
      color: #1e2a3a;
      font-size: 16px;
    }
    .questions ul {
      margin: 15px 0;
      padding-left: 20px;
    }
    .questions li {
      margin: 10px 0;
      color: #2c3e50;
    }
    .timeline {
      background: #fff;
      border: 1px solid #e8dcc4;
      padding: 20px;
      margin: 20px 0;
    }
    .timeline h3 {
      margin-top: 0;
      color: #1e2a3a;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .timeline-step {
      display: flex;
      margin: 15px 0;
      align-items: flex-start;
    }
    .timeline-number {
      background: #d4c8a8;
      color: #fff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      flex-shrink: 0;
      margin-right: 12px;
    }
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e8dcc4;
      color: #7a8a9a;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">FREQUENCY & FORM</div>
  </div>

  <div class="content">
    <p>Hey ${greeting},</p>

    <p>Awesome—glad you're interested!</p>

    <p>Quick questions so I can get you the right pricing:</p>

    <div class="questions">
      <h3>What do you need?</h3>
      <ul>
        <li><strong>Products you're interested in?</strong><br/>
        (linen bedding, organic cotton basics, wool blankets, hemp bags, etc.)
        </li>

        <li><strong>What sells best in your store now?</strong></li>

        <li><strong>Typical order volume?</strong><br/>
        (50-100 units, 100-500, or 500+)
        </li>

        <li><strong>Price range for your customers?</strong><br/>
        ($20-50, $50-100, $100-200)
        </li>

        <li><strong>Anything specific you've been searching for but can't find?</strong></li>
      </ul>
    </div>

    <p><strong>What happens next:</strong></p>
    <ul class="products">
      <li>I'll get you wholesale pricing (usually 40-50% below retail)</li>
      <li>Send samples if you want to check quality first</li>
      <li>Start with a small test order (no crazy minimums)</li>
      <li>If it works, we'll set up recurring orders</li>
    </ul>

    <p>
      <strong>Timeline:</strong> 7-10 days for most requests. Need it faster? Let me know.
    </p>

    <p>
      Just hit reply with your answers. Or call if that's easier.
    </p>

    <p>Talk soon,<br/>
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
Hey ${greeting},

Awesome—glad you're interested!

Quick questions so I can get you the right pricing:

WHAT DO YOU NEED?

• Products you're interested in?
  (linen bedding, organic cotton basics, wool blankets, hemp bags, etc.)

• What sells best in your store now?

• Typical order volume?
  (50-100 units, 100-500, or 500+)

• Price range for your customers?
  ($20-50, $50-100, $100-200)

• Anything specific you've been searching for but can't find?

WHAT HAPPENS NEXT:
• I'll get you wholesale pricing (usually 40-50% below retail)
• Send samples if you want to check quality first
• Start with a small test order (no crazy minimums)
• If it works, we'll set up recurring orders

TIMELINE: 7-10 days for most requests. Need it faster? Let me know.

Just hit reply with your answers. Or call if that's easier.

Talk soon,
Henry

---
Henry @ Frequency & Form
Natural Fiber Distribution
henry@frequencyandform.com
    `
  };
};
