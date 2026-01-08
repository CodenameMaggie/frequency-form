/**
 * B2B Wholesale Product Request Follow-up
 * Sent when retailer responds - asks what specific products they need
 */

module.exports = function wholesaleProductRequestEmail({
  retailerName,
  contactName
}) {
  const greeting = contactName ? `Hi ${contactName}` : `Hi`;

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
    <p>${greeting},</p>

    <p>
      Great to hear you're interested in sourcing natural fiber products!
    </p>

    <p>
      To get you the best wholesale pricing and ensure we source exactly what
      you need, I have a few quick questions:
    </p>

    <div class="questions">
      <h3>📋 Product Needs Assessment</h3>
      <ul>
        <li><strong>What products are you most interested in?</strong><br/>
        (e.g., linen bedding, organic cotton basics, wool blankets, hemp bags, silk pillowcases)
        </li>

        <li><strong>What sells best in your store currently?</strong><br/>
        (Helps us recommend similar items in natural fibers)
        </li>

        <li><strong>What's your typical order volume?</strong><br/>
        (e.g., 50-100 units, 100-500 units, 500+ units)
        </li>

        <li><strong>What price range works for your customers?</strong><br/>
        (e.g., $20-50, $50-100, $100-200)
        </li>

        <li><strong>Any specific products you've been searching for but can't find?</strong></li>
      </ul>
    </div>

    <p>
      Once I know what you're looking for, I can:
    </p>

    <div class="timeline">
      <h3>Next Steps</h3>

      <div class="timeline-step">
        <div class="timeline-number">1</div>
        <div>Get you wholesale pricing from our manufacturers (usually 40-50% below retail)</div>
      </div>

      <div class="timeline-step">
        <div class="timeline-number">2</div>
        <div>Send product samples if you'd like to see/feel quality first</div>
      </div>

      <div class="timeline-step">
        <div class="timeline-number">3</div>
        <div>Start with a small test order (no huge minimums required)</div>
      </div>

      <div class="timeline-step">
        <div class="timeline-number">4</div>
        <div>If it sells well, set up recurring orders at locked-in pricing</div>
      </div>
    </div>

    <p>
      <strong>Timeline:</strong> Most sourcing requests are fulfilled within 7-10 days.
      If you need something faster, let me know and we'll prioritize it.
    </p>

    <p>
      Just reply to this email with your answers, or we can hop on a quick call
      if that's easier.
    </p>

    <p>Looking forward to working together!</p>

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

Great to hear you're interested in sourcing natural fiber products!

To get you the best wholesale pricing and ensure we source exactly what you need, I have a few quick questions:

📋 PRODUCT NEEDS ASSESSMENT:

1. What products are you most interested in?
   (e.g., linen bedding, organic cotton basics, wool blankets, hemp bags, silk pillowcases)

2. What sells best in your store currently?
   (Helps us recommend similar items in natural fibers)

3. What's your typical order volume?
   (e.g., 50-100 units, 100-500 units, 500+ units)

4. What price range works for your customers?
   (e.g., $20-50, $50-100, $100-200)

5. Any specific products you've been searching for but can't find?

NEXT STEPS:

1. Get you wholesale pricing from our manufacturers (usually 40-50% below retail)
2. Send product samples if you'd like to see/feel quality first
3. Start with a small test order (no huge minimums required)
4. If it sells well, set up recurring orders at locked-in pricing

TIMELINE: Most sourcing requests are fulfilled within 7-10 days. If you need something faster, let me know and we'll prioritize it.

Just reply to this email with your answers, or we can hop on a quick call if that's easier.

Looking forward to working together!

Best,
Henry

---
Henry @ Frequency & Form
Natural Fiber Distribution
henry@frequencyandform.com
    `
  };
};
