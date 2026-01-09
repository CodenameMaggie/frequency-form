/**
 * Business Logic Matching Engine
 * Zero-cost rule-based matching system for:
 * 1. Products → Buyers (match inventory to wholesale buyers)
 * 2. Leads → Criteria (qualify leads with business rules)
 * 3. Orders → Suppliers (route orders to fulfillment)
 *
 * Hybrid approach: Rules first, AI only when making money
 */

const { createClient } = require('@supabase/supabase-js');
const { askAtlas, getAtlasSupport } = require('./atlas-helper');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.FF_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.FF_SUPABASE_SERVICE_ROLE_KEY
);

// =============================================================================
// 1. PRODUCT → BUYER MATCHING
// =============================================================================

/**
 * Match products to wholesale buyers based on business rules
 * No AI cost - pure database queries and logic
 */
async function matchProductsToBuyers(tenantId, options = {}) {
  const { productId, buyerId, limit = 10, useAI = false } = options;

  try {
    // Get products (either specific one or all available)
    const productsQuery = supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (productId) {
      productsQuery.eq('id', productId);
    }

    const { data: products, error: productsError } = await productsQuery;
    if (productsError) throw productsError;

    // Get buyers (contacts with company info)
    const buyersQuery = supabase
      .from('contacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('company', 'is', null)
      .in('contact_type', ['lead', 'prospect', 'customer']);

    if (buyerId) {
      buyersQuery.eq('id', buyerId);
    }

    const { data: buyers, error: buyersError } = await buyersQuery.limit(100);
    if (buyersError) throw buyersError;

    // Rule-based matching logic
    const matches = [];

    for (const product of products || []) {
      for (const buyer of buyers || []) {
        const score = calculateProductBuyerScore(product, buyer);

        if (score.total >= 30) { // Minimum 30% match
          matches.push({
            product_id: product.id,
            product_name: product.name,
            buyer_id: buyer.id,
            buyer_name: buyer.name,
            buyer_company: buyer.company,
            match_score: score.total,
            match_reasons: score.reasons,
            recommended_action: score.total >= 70 ? 'immediate_outreach' : 'add_to_queue',
            estimated_order_value: estimateOrderValue(product, buyer, score.total)
          });
        }
      }
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.match_score - a.match_score);

    // If AI is enabled and we're making money, enhance top matches
    if (useAI && matches.length > 0) {
      // TODO: Add AI enhancement when profitable
      // const enhanced = await enhanceMatchesWithAI(matches.slice(0, 5));
    }

    return {
      success: true,
      matches: matches.slice(0, limit),
      total_found: matches.length,
      using_ai: useAI && false // Not using AI yet
    };

  } catch (error) {
    console.error('[Product-Buyer Matching] Error:', error);

    // Ask Atlas for support if matching fails
    const support = await getAtlasSupport(
      'Product-Buyer matching engine encountered an error',
      tenantId,
      {
        error: error.message,
        stack: error.stack,
        context: { productId, buyerId }
      }
    );

    if (support.success) {
      console.log('[Product-Buyer Matching] Atlas support:', support.solution);
    }

    return {
      success: false,
      error: error.message,
      matches: [],
      atlas_support: support.solution
    };
  }
}

/**
 * Calculate match score between product and buyer (0-100)
 * Pure business logic, no AI
 */
function calculateProductBuyerScore(product, buyer) {
  let score = 0;
  const reasons = [];

  // Industry match (30 points)
  if (buyer.industry && product.target_industries) {
    const buyerIndustry = buyer.industry.toLowerCase();
    const targetIndustries = product.target_industries.toLowerCase();

    if (targetIndustries.includes(buyerIndustry)) {
      score += 30;
      reasons.push(`Industry match: ${buyer.industry}`);
    } else if (
      (buyerIndustry.includes('wellness') || buyerIndustry.includes('sustainable')) &&
      (product.name.includes('linen') || product.name.includes('organic'))
    ) {
      score += 20;
      reasons.push('Related industry: wellness/sustainable');
    }
  }

  // Company size match (25 points)
  if (buyer.company_size && product.min_order_quantity) {
    const sizeScore = matchCompanySize(buyer.company_size, product.min_order_quantity);
    score += sizeScore;
    if (sizeScore > 0) {
      reasons.push(`Company size fit: ${buyer.company_size}`);
    }
  }

  // Price range match (20 points)
  if (buyer.budget_range && product.wholesale_price) {
    const priceScore = matchPriceRange(buyer.budget_range, product.wholesale_price);
    score += priceScore;
    if (priceScore > 0) {
      reasons.push('Price range match');
    }
  }

  // Location preference (10 points)
  if (buyer.location && product.preferred_locations) {
    if (product.preferred_locations.includes(buyer.location)) {
      score += 10;
      reasons.push(`Location: ${buyer.location}`);
    }
  }

  // Previous purchase history (15 points)
  if (buyer.last_purchase_date) {
    const daysSinceLastPurchase = Math.floor(
      (Date.now() - new Date(buyer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastPurchase < 30) {
      score += 15;
      reasons.push('Recent customer (high engagement)');
    } else if (daysSinceLastPurchase < 90) {
      score += 10;
      reasons.push('Active customer');
    }
  }

  return { total: Math.min(score, 100), reasons };
}

function matchCompanySize(companySize, minOrderQty) {
  const sizeMap = {
    'small': { min: 10, max: 100 },
    'medium': { min: 50, max: 500 },
    'large': { min: 200, max: 2000 },
    'enterprise': { min: 1000, max: 10000 }
  };

  const range = sizeMap[companySize] || { min: 0, max: 0 };

  if (minOrderQty >= range.min && minOrderQty <= range.max) {
    return 25;
  } else if (minOrderQty < range.max * 2) {
    return 15;
  }

  return 0;
}

function matchPriceRange(budgetRange, wholesalePrice) {
  // budgetRange format: "$1000-$5000"
  const match = budgetRange.match(/\$?([\d,]+)-\$?([\d,]+)/);
  if (!match) return 0;

  const minBudget = parseInt(match[1].replace(/,/g, ''));
  const maxBudget = parseInt(match[2].replace(/,/g, ''));

  if (wholesalePrice >= minBudget && wholesalePrice <= maxBudget) {
    return 20;
  } else if (wholesalePrice <= maxBudget * 1.2) {
    return 10;
  }

  return 0;
}

function estimateOrderValue(product, buyer, matchScore) {
  // Base estimate on product wholesale price and buyer size
  let baseValue = product.wholesale_price || 100;
  let multiplier = 10; // Default 10 units

  if (buyer.company_size === 'large') multiplier = 50;
  if (buyer.company_size === 'enterprise') multiplier = 200;

  // Adjust by match score
  const scoreMultiplier = matchScore / 100;

  return Math.round(baseValue * multiplier * scoreMultiplier);
}

// =============================================================================
// 2. LEAD → CRITERIA QUALIFICATION
// =============================================================================

/**
 * Qualify leads based on business rules
 * Assigns scores and qualification status
 */
async function qualifyLeads(tenantId, options = {}) {
  const { leadId, minScore = 50, useAI = false } = options;

  try {
    // Get leads to qualify
    const leadsQuery = supabase
      .from('contacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('contact_type', 'lead');

    if (leadId) {
      leadsQuery.eq('id', leadId);
    }

    const { data: leads, error: leadsError } = await leadsQuery.limit(100);
    if (leadsError) throw leadsError;

    const qualified = [];
    const disqualified = [];

    for (const lead of leads || []) {
      const qualification = calculateLeadScore(lead);

      if (qualification.score >= minScore) {
        qualified.push({
          lead_id: lead.id,
          name: lead.name,
          company: lead.company,
          score: qualification.score,
          grade: qualification.grade,
          reasons: qualification.reasons,
          next_action: qualification.next_action,
          estimated_value: qualification.estimated_value
        });

        // Update lead in database
        await supabase
          .from('contacts')
          .update({
            lead_score: qualification.score,
            lead_grade: qualification.grade,
            qualification_status: 'qualified',
            qualified_at: new Date().toISOString()
          })
          .eq('id', lead.id);

      } else {
        disqualified.push({
          lead_id: lead.id,
          name: lead.name,
          score: qualification.score,
          disqualification_reasons: qualification.reasons
        });
      }
    }

    return {
      success: true,
      qualified: qualified.length,
      disqualified: disqualified.length,
      qualified_leads: qualified,
      disqualified_leads: disqualified
    };

  } catch (error) {
    console.error('[Lead Qualification] Error:', error);

    // Ask Atlas for support if qualification fails
    const support = await getAtlasSupport(
      'Lead qualification engine encountered an error',
      tenantId,
      {
        error: error.message,
        stack: error.stack,
        context: { leadId, minScore }
      }
    );

    if (support.success) {
      console.log('[Lead Qualification] Atlas support:', support.solution);
    }

    return {
      success: false,
      error: error.message,
      atlas_support: support.solution
    };
  }
}

/**
 * Calculate lead qualification score (0-100)
 */
function calculateLeadScore(lead) {
  let score = 0;
  const reasons = [];

  // Has company (20 points - REQUIRED)
  if (lead.company && lead.company.trim().length > 0) {
    score += 20;
    reasons.push('Has company name');
  } else {
    return { score: 0, grade: 'F', reasons: ['Missing company name - auto disqualified'], next_action: 'discard', estimated_value: 0 };
  }

  // Has email (15 points - REQUIRED)
  if (lead.email && lead.email.includes('@')) {
    score += 15;
    reasons.push('Valid email');
  } else {
    return { score: 0, grade: 'F', reasons: ['Missing valid email - auto disqualified'], next_action: 'discard', estimated_value: 0 };
  }

  // Industry match (25 points)
  if (lead.industry) {
    const relevantIndustries = ['retail', 'wholesale', 'wellness', 'sustainable', 'fashion', 'home goods', 'gifts'];
    if (relevantIndustries.some(ind => lead.industry.toLowerCase().includes(ind))) {
      score += 25;
      reasons.push(`Relevant industry: ${lead.industry}`);
    } else {
      score += 10;
      reasons.push('Has industry listed');
    }
  }

  // Company size (20 points)
  if (lead.company_size) {
    if (lead.company_size === 'large' || lead.company_size === 'enterprise') {
      score += 20;
      reasons.push('Large company (high value)');
    } else if (lead.company_size === 'medium') {
      score += 15;
      reasons.push('Medium company');
    } else {
      score += 10;
      reasons.push('Small company');
    }
  }

  // Budget indicated (10 points)
  if (lead.budget_range && lead.budget_range !== 'unknown') {
    score += 10;
    reasons.push('Budget range provided');
  }

  // Engagement level (10 points)
  if (lead.last_activity_date) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lead.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity < 7) {
      score += 10;
      reasons.push('Active in last week');
    } else if (daysSinceActivity < 30) {
      score += 5;
      reasons.push('Active in last month');
    }
  }

  // Determine grade and next action
  let grade = 'F';
  let next_action = 'discard';
  let estimated_value = 0;

  if (score >= 90) {
    grade = 'A+';
    next_action = 'immediate_call';
    estimated_value = 50000;
  } else if (score >= 80) {
    grade = 'A';
    next_action = 'priority_email';
    estimated_value = 25000;
  } else if (score >= 70) {
    grade = 'B';
    next_action = 'personalized_email';
    estimated_value = 10000;
  } else if (score >= 60) {
    grade = 'C';
    next_action = 'standard_email';
    estimated_value = 5000;
  } else if (score >= 50) {
    grade = 'D';
    next_action = 'nurture_campaign';
    estimated_value = 2000;
  } else {
    next_action = 'disqualify';
  }

  return { score, grade, reasons, next_action, estimated_value };
}

// =============================================================================
// 3. ORDER → SUPPLIER MATCHING
// =============================================================================

/**
 * Match incoming orders to suppliers who can fulfill them
 */
async function matchOrdersToSuppliers(tenantId, options = {}) {
  const { orderId, useAI = false } = options;

  try {
    // Get pending orders
    const ordersQuery = supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('tenant_id', tenantId)
      .in('fulfillment_status', ['pending', 'unfulfilled']);

    if (orderId) {
      ordersQuery.eq('id', orderId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // Get active suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (suppliersError) throw suppliersError;

    const matches = [];

    for (const order of orders || []) {
      const bestSupplier = findBestSupplier(order, suppliers);

      if (bestSupplier) {
        matches.push({
          order_id: order.id,
          order_number: order.order_number,
          supplier_id: bestSupplier.supplier.id,
          supplier_name: bestSupplier.supplier.name,
          match_score: bestSupplier.score,
          match_reasons: bestSupplier.reasons,
          estimated_cost: bestSupplier.estimated_cost,
          estimated_delivery: bestSupplier.estimated_delivery,
          recommended_action: bestSupplier.score >= 80 ? 'auto_assign' : 'review_first'
        });

        // If high confidence match, auto-assign
        if (bestSupplier.score >= 80) {
          await supabase
            .from('orders')
            .update({
              supplier_id: bestSupplier.supplier.id,
              fulfillment_status: 'assigned',
              assigned_at: new Date().toISOString()
            })
            .eq('id', order.id);
        }
      }
    }

    return {
      success: true,
      matches_found: matches.length,
      matches,
      auto_assigned: matches.filter(m => m.recommended_action === 'auto_assign').length
    };

  } catch (error) {
    console.error('[Order-Supplier Matching] Error:', error);

    // Ask Atlas for support if matching fails
    const support = await getAtlasSupport(
      'Order-Supplier matching engine encountered an error',
      tenantId,
      {
        error: error.message,
        stack: error.stack,
        context: { orderId }
      }
    );

    if (support.success) {
      console.log('[Order-Supplier Matching] Atlas support:', support.solution);
    }

    return {
      success: false,
      error: error.message,
      matches: [],
      atlas_support: support.solution
    };
  }
}

/**
 * Find best supplier for an order based on business rules
 */
function findBestSupplier(order, suppliers) {
  let bestMatch = null;
  let highestScore = 0;

  for (const supplier of suppliers) {
    const score = calculateSupplierScore(order, supplier);

    if (score.total > highestScore) {
      highestScore = score.total;
      bestMatch = {
        supplier,
        score: score.total,
        reasons: score.reasons,
        estimated_cost: score.estimated_cost,
        estimated_delivery: score.estimated_delivery
      };
    }
  }

  return highestScore >= 50 ? bestMatch : null; // Minimum 50% match
}

function calculateSupplierScore(order, supplier) {
  let score = 0;
  const reasons = [];
  let estimated_cost = 0;
  let estimated_delivery = '7-14 days';

  // Product availability (40 points)
  if (supplier.products_offered && order.order_items) {
    const itemsCount = order.order_items.length;
    const availableItems = order.order_items.filter(item =>
      supplier.products_offered.includes(item.product_id)
    ).length;

    const availabilityRate = availableItems / itemsCount;
    score += Math.round(availabilityRate * 40);

    if (availabilityRate === 1) {
      reasons.push('All products available');
    } else if (availabilityRate >= 0.8) {
      reasons.push(`${Math.round(availabilityRate * 100)}% products available`);
    }
  }

  // Price competitiveness (25 points)
  if (supplier.price_tier) {
    if (supplier.price_tier === 'budget') {
      score += 25;
      reasons.push('Most competitive pricing');
      estimated_cost = order.total_amount * 0.6; // 40% margin
    } else if (supplier.price_tier === 'mid') {
      score += 20;
      reasons.push('Competitive pricing');
      estimated_cost = order.total_amount * 0.7; // 30% margin
    } else {
      score += 10;
      reasons.push('Premium pricing');
      estimated_cost = order.total_amount * 0.8; // 20% margin
    }
  }

  // Delivery speed (20 points)
  if (supplier.avg_delivery_days) {
    if (supplier.avg_delivery_days <= 5) {
      score += 20;
      reasons.push('Fast delivery (5 days)');
      estimated_delivery = '3-5 days';
    } else if (supplier.avg_delivery_days <= 10) {
      score += 15;
      reasons.push('Standard delivery (7-10 days)');
      estimated_delivery = '7-10 days';
    } else {
      score += 5;
      estimated_delivery = '14+ days';
    }
  }

  // Reliability score (15 points)
  if (supplier.reliability_score) {
    score += Math.round(supplier.reliability_score * 15 / 100);
    if (supplier.reliability_score >= 90) {
      reasons.push('Highly reliable supplier');
    }
  }

  return {
    total: Math.min(score, 100),
    reasons,
    estimated_cost,
    estimated_delivery
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Product-Buyer matching
  matchProductsToBuyers,

  // Lead qualification
  qualifyLeads,
  calculateLeadScore,

  // Order-Supplier matching
  matchOrdersToSuppliers,

  // Utility exports for testing
  calculateProductBuyerScore,
  findBestSupplier
};
