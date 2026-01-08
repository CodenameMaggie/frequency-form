/**
 * Lead Qualification API
 * Rule-based lead scoring and qualification (no AI cost)
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { qualifyLeads } = require('../lib/business-matching-engine');

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Lead Qualification] Starting rule-based qualification...');

  try {
    const { leadId, minScore, useAI } = req.query;

    const result = await qualifyLeads(tenantId, {
      leadId,
      minScore: parseInt(minScore) || 50,
      useAI: useAI === 'true' && false // AI disabled until making money
    });

    if (result.success) {
      console.log(`[Lead Qualification] ✅ Qualified ${result.qualified} leads, disqualified ${result.disqualified}`);

      if (result.qualified_leads.length > 0) {
        console.log('[Lead Qualification] Top qualified leads:');
        result.qualified_leads.slice(0, 5).forEach((lead, i) => {
          console.log(`  ${i + 1}. ${lead.company} (${lead.grade}, ${lead.score}%) → ${lead.next_action}`);
        });
      }
    }

    res.json({
      success: result.success,
      data: {
        qualified: result.qualified,
        disqualified: result.disqualified,
        qualified_leads: result.qualified_leads,
        a_grade_leads: result.qualified_leads.filter(l => l.grade.startsWith('A')).length
      },
      message: `Qualified ${result.qualified} leads (${result.disqualified} disqualified)`
    });

  } catch (error) {
    console.error('[Lead Qualification] ❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
