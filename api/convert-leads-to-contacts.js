/**
 * Convert Leads to Contacts
 * Automatically qualifies leads and converts them to active contacts
 * Runs hourly via cron
 * Uses AI to score and qualify leads based on criteria
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { queryAtlas } = require('./bots/atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Convert Leads] Starting lead qualification and conversion...');

  try {
    // Get leads that need qualification (stage = 'lead')
    const { data: leads, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('stage', 'lead')
      .order('created_at', { ascending: false })
      .limit(50); // Process 50 leads per run

    if (fetchError) {
      console.error('[Convert Leads] Error fetching leads:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch leads'
      });
    }

    if (!leads || leads.length === 0) {
      console.log('[Convert Leads] No leads to qualify');
      return res.json({
        success: true,
        data: {
          leads_processed: 0,
          leads_qualified: 0,
          message: 'No leads to process'
        }
      });
    }

    console.log(`[Convert Leads] Found ${leads.length} leads to qualify`);

    let qualifiedCount = 0;
    let disqualifiedCount = 0;

    // Qualification criteria for B2B natural fiber products
    const qualificationPrompt = `You are a B2B sales qualification AI for Frequency & Form, a natural fiber products company (linen, organic cotton, hemp, wool).

Evaluate if these leads are qualified for B2B wholesale partnerships:

QUALIFICATION CRITERIA:
1. Business Type: Retailer, boutique, wellness center, e-commerce store, wholesale buyer
2. Product Alignment: Sell or interested in sustainable products, natural materials, wellness, fashion, home goods
3. Decision Maker: Owner, buyer, purchasing manager, or founder
4. Business Size: Small-to-medium businesses or large wholesale chains
5. Contact Info: Has website, email, or social media presence

DISQUALIFICATION:
- Individual consumers (not businesses)
- Unrelated industries (tech, finance, automotive, etc.)
- No contact information available
- Obvious spam or fake entries

For each lead, return: {"qualified": true/false, "score": 1-10, "reason": "brief explanation"}`;

    for (const lead of leads) {
      try {
        // Build lead profile for AI evaluation
        const leadProfile = {
          company: lead.company,
          name: lead.full_name || lead.first_name + ' ' + lead.last_name,
          email: lead.email,
          website: lead.website,
          source: lead.source,
          notes: lead.notes
        };

        // Use AI to qualify the lead
        const evaluationPrompt = `${qualificationPrompt}\n\nEvaluate this lead:\n${JSON.stringify(leadProfile, null, 2)}`;

        const atlasResponse = await queryAtlas(evaluationPrompt, 'sales', tenantId, {
          sources: ['claude'],
          save_to_memory: false
        });

        if (!atlasResponse.success) {
          console.error(`[Convert Leads] AI qualification failed for ${lead.company}`);
          continue;
        }

        // Parse AI response
        let qualification = { qualified: false, score: 0, reason: 'Unknown' };
        try {
          const jsonMatch = atlasResponse.answer.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            qualification = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          // Fallback: simple keyword matching
          const answer = atlasResponse.answer.toLowerCase();
          if (answer.includes('qualified') && !answer.includes('not qualified')) {
            qualification.qualified = true;
            qualification.score = 7;
            qualification.reason = 'Matched qualification criteria';
          }
        }

        console.log(`[Convert Leads] ${lead.company}: ${qualification.qualified ? '✅ Qualified' : '❌ Disqualified'} (score: ${qualification.score})`);

        // Update contact based on qualification
        if (qualification.qualified && qualification.score >= 5) {
          // Convert to contact (ready for outreach)
          await supabase
            .from('contacts')
            .update({
              stage: 'contact',
              notes: `${lead.notes || ''}\n\n[Auto-Qualified] Score: ${qualification.score}/10\nReason: ${qualification.reason}\nQualified: ${new Date().toISOString()}`
            })
            .eq('id', lead.id);

          qualifiedCount++;
          console.log(`[Convert Leads] ✅ ${lead.company} converted to contact`);

        } else {
          // Mark as disqualified
          await supabase
            .from('contacts')
            .update({
              stage: 'disqualified',
              notes: `${lead.notes || ''}\n\n[Auto-Disqualified] Score: ${qualification.score}/10\nReason: ${qualification.reason}\nDisqualified: ${new Date().toISOString()}`
            })
            .eq('id', lead.id);

          disqualifiedCount++;
          console.log(`[Convert Leads] ❌ ${lead.company} disqualified`);
        }

      } catch (error) {
        console.error(`[Convert Leads] Error processing ${lead.company}:`, error.message);
      }
    }

    // Log bot action
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'System',
        action_type: 'lead_conversion',
        status: 'success',
        data: {
          leads_processed: leads.length,
          leads_qualified: qualifiedCount,
          leads_disqualified: disqualifiedCount,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`[Convert Leads] Complete: ${qualifiedCount} qualified, ${disqualifiedCount} disqualified`);

    return res.json({
      success: true,
      data: {
        leads_processed: leads.length,
        leads_qualified: qualifiedCount,
        leads_disqualified: disqualifiedCount
      }
    });

  } catch (error) {
    console.error('[Convert Leads] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'System',
        action_type: 'lead_conversion',
        status: 'failed',
        data: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = withCronAuth(handler);
