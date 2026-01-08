/**
 * Match Products to Buyers API
 * Rule-based product-buyer matching (no AI cost)
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { matchProductsToBuyers } = require('../lib/business-matching-engine');

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Product-Buyer Matching] Starting rule-based matching...');

  try {
    const { productId, buyerId, limit, useAI } = req.query;

    const result = await matchProductsToBuyers(tenantId, {
      productId,
      buyerId,
      limit: parseInt(limit) || 10,
      useAI: useAI === 'true' && false // AI disabled until making money
    });

    if (result.success) {
      console.log(`[Product-Buyer Matching] ✅ Found ${result.total_found} matches`);
      console.log(`[Product-Buyer Matching] Top matches:`);
      result.matches.slice(0, 3).forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.buyer_company} → ${m.product_name} (${m.match_score}% match, $${m.estimated_order_value})`);
      });
    }

    res.json({
      success: result.success,
      data: {
        matches: result.matches,
        total_found: result.total_found,
        top_match: result.matches[0] || null
      },
      message: `Found ${result.total_found} product-buyer matches`
    });

  } catch (error) {
    console.error('[Product-Buyer Matching] ❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
