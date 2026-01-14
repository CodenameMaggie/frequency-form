/**
 * Deal Pipeline Processor
 * Automatically moves deals through pipeline stages
 * Runs every 30 minutes via cron
 * Manages deal progression based on age, activity, and status
 */

const { withCronAuth } = require('../lib/api-wrapper');
const { sendFromHenry } = require('../lib/email-sender');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Deal Pipeline] Starting deal pipeline processing...');

  try {
    // Get all open deals
    const { data: deals, error: fetchError } = await supabase
      .from('deals')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'open')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[Deal Pipeline] Error fetching deals:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch deals'
      });
    }

    if (!deals || deals.length === 0) {
      console.log('[Deal Pipeline] No open deals to process');
      return res.json({
        success: true,
        data: {
          deals_processed: 0,
          deals_advanced: 0,
          deals_stalled: 0
        }
      });
    }

    console.log(`[Deal Pipeline] Processing ${deals.length} open deals`);

    // Pipeline stages in order
    const PIPELINE_STAGES = [
      'prospecting',
      'qualification',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost'
    ];

    // Stage advancement rules (in days)
    const STAGE_AGE_THRESHOLDS = {
      prospecting: 14,    // Move to qualification after 14 days if active
      qualification: 7,   // Move to proposal after 7 days if qualified
      proposal: 14,       // Move to negotiation after 14 days if interest shown
      negotiation: 21     // Close after 21 days of negotiation
    };

    let advancedCount = 0;
    let stalledCount = 0;

    for (const deal of deals) {
      try {
        const now = new Date();
        const createdAt = new Date(deal.created_at);
        const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

        const currentStage = deal.deal_stage || 'prospecting';
        const currentStageIndex = PIPELINE_STAGES.indexOf(currentStage);

        console.log(`[Deal Pipeline] Processing: ${deal.deal_name} (${currentStage}, ${Math.round(ageInDays)} days old)`);

        // Check if deal should advance
        const threshold = STAGE_AGE_THRESHOLDS[currentStage];

        if (threshold && ageInDays > threshold) {
          // Get deal activities to check engagement
          const { data: activities } = await supabase
            .from('deal_activities')
            .select('*')
            .eq('deal_id', deal.id)
            .gte('created_at', new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

          const hasRecentActivity = activities && activities.length > 0;

          if (hasRecentActivity || currentStage === 'prospecting') {
            // Advance to next stage
            const nextStageIndex = Math.min(currentStageIndex + 1, PIPELINE_STAGES.length - 1);
            const nextStage = PIPELINE_STAGES[nextStageIndex];

            // Special handling for final stages
            if (nextStage === 'closed_won' || nextStage === 'closed_lost') {
              // Don't auto-close deals - require manual decision
              console.log(`[Deal Pipeline] ${deal.deal_name} ready to close (manual review required)`);

              // Send notification
              await sendFromHenry({
                to: process.env.FROM_EMAIL_SUPPORT || 'support@maggieforbesstrategies.com',
                subject: `Deal Ready to Close: ${deal.deal_name}`,
                html: `
                  <h2>Deal Ready to Close</h2>
                  <p><strong>Deal:</strong> ${deal.deal_name}</p>
                  <p><strong>Value:</strong> $${deal.deal_value || 'TBD'}</p>
                  <p><strong>Stage:</strong> ${currentStage}</p>
                  <p><strong>Age:</strong> ${Math.round(ageInDays)} days</p>
                  <p><strong>Contact:</strong> ${deal.email || 'N/A'}</p>
                  <p>This deal has been in ${currentStage} for ${Math.round(ageInDays)} days. Please review and manually close as won or lost.</p>
                `
              });

              continue; // Don't auto-advance
            }

            // Update deal stage
            await supabase
              .from('deals')
              .update({
                deal_stage: nextStage,
                probability: getProbabilityForStage(nextStage)
              })
              .eq('id', deal.id);

            // Log activity
            await supabase
              .from('deal_activities')
              .insert({
                tenant_id: tenantId,
                deal_id: deal.id,
                activity_type: 'stage_change',
                description: `Auto-advanced from ${currentStage} to ${nextStage}`,
                old_value: currentStage,
                new_value: nextStage
              });

            advancedCount++;
            console.log(`[Deal Pipeline] ✅ Advanced ${deal.deal_name}: ${currentStage} → ${nextStage}`);

          } else {
            // Mark as stalled (no recent activity)
            console.log(`[Deal Pipeline] ⚠️ ${deal.deal_name} is stalled (no activity in 7 days)`);

            await supabase
              .from('deals')
              .update({
                notes: `${deal.notes || ''}\n\n[Stalled] No activity in last 7 days. Consider follow-up or close as lost. ${now.toISOString()}`
              })
              .eq('id', deal.id);

            stalledCount++;

            // Send stalled deal notification
            await sendFromHenry({
              to: process.env.FROM_EMAIL_SUPPORT || 'support@maggieforbesstrategies.com',
              subject: `Stalled Deal: ${deal.deal_name}`,
              html: `
                <h2>Stalled Deal Alert</h2>
                <p><strong>Deal:</strong> ${deal.deal_name}</p>
                <p><strong>Stage:</strong> ${currentStage}</p>
                <p><strong>Age:</strong> ${Math.round(ageInDays)} days</p>
                <p><strong>Last Activity:</strong> Over 7 days ago</p>
                <p>This deal needs attention. Consider reaching out or closing as lost.</p>
              `
            });
          }
        }

      } catch (error) {
        console.error(`[Deal Pipeline] Error processing deal ${deal.id}:`, error.message);
      }
    }

    // Log processor action
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'System',
        action_type: 'deal_pipeline_processing',
        status: 'success',
        data: {
          deals_processed: deals.length,
          deals_advanced: advancedCount,
          deals_stalled: stalledCount,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`[Deal Pipeline] Complete: ${advancedCount} advanced, ${stalledCount} stalled`);

    return res.json({
      success: true,
      data: {
        deals_processed: deals.length,
        deals_advanced: advancedCount,
        deals_stalled: stalledCount
      }
    });

  } catch (error) {
    console.error('[Deal Pipeline] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'System',
        action_type: 'deal_pipeline_processing',
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

/**
 * Get probability percentage based on deal stage
 */
function getProbabilityForStage(stage) {
  const probabilities = {
    prospecting: 10,
    qualification: 25,
    proposal: 50,
    negotiation: 75,
    closed_won: 100,
    closed_lost: 0
  };

  return probabilities[stage] || 0;
}

module.exports = withCronAuth(handler);
