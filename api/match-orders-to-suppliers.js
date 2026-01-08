/**
 * Order-Supplier Matching API
 * Rule-based order fulfillment routing (no AI cost)
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { matchOrdersToSuppliers } = require('../lib/business-matching-engine');

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Order-Supplier Matching] Starting rule-based matching...');

  try {
    const { orderId, useAI } = req.query;

    const result = await matchOrdersToSuppliers(tenantId, {
      orderId,
      useAI: useAI === 'true' && false // AI disabled until making money
    });

    if (result.success) {
      console.log(`[Order-Supplier Matching] ✅ Matched ${result.matches_found} orders to suppliers`);
      console.log(`[Order-Supplier Matching] Auto-assigned: ${result.auto_assigned}`);

      if (result.matches.length > 0) {
        console.log('[Order-Supplier Matching] Top matches:');
        result.matches.slice(0, 3).forEach((match, i) => {
          console.log(`  ${i + 1}. Order #${match.order_number} → ${match.supplier_name} (${match.match_score}% match, $${match.estimated_cost})`);
        });
      }
    }

    res.json({
      success: result.success,
      data: {
        matches_found: result.matches_found,
        auto_assigned: result.auto_assigned,
        matches: result.matches
      },
      message: `Matched ${result.matches_found} orders (${result.auto_assigned} auto-assigned)`
    });

  } catch (error) {
    console.error('[Order-Supplier Matching] ❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
