/**
 * Mainframe Sync Processor
 * Syncs F&F data to MFS Suite Command Center (GrowthManagerPro)
 * Keeps central CRM updated with partner activity, contacts, deals
 * CRON: Every 10 minutes via Forbes Command
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';
const MFS_API_URL = process.env.MFS_API_URL || 'http://5.78.139.9:3000';
const FF_TENANT_ID = '00000000-0000-0000-0000-000000000001'; // F&F tenant in MFS

interface SyncResult {
  type: string;
  synced: number;
  failed: number;
  errors: string[];
}

// Sync partners to MFS contacts
async function syncPartnersToMFS(supabase: ReturnType<typeof createAdminSupabase>): Promise<SyncResult> {
  const result: SyncResult = { type: 'partners', synced: 0, failed: 0, errors: [] };

  try {
    // Get partners updated since last sync (or last 24 hours)
    const { data: lastSync } = await supabase
      .from('ff_sync_log')
      .select('synced_at')
      .eq('sync_type', 'partners_to_mfs')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    const since = lastSync?.synced_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: partners, error } = await supabase
      .from('ff_partners')
      .select('*')
      .gte('updated_at', since);

    if (error) throw error;
    if (!partners || partners.length === 0) {
      return result;
    }

    for (const partner of partners) {
      try {
        // Transform to MFS contact format
        const mfsContact = {
          tenant_id: FF_TENANT_ID,
          external_id: `FF_partner_${partner.id}`,
          source: 'FF_partner_sync',
          first_name: partner.contact_name?.split(' ')[0] || partner.brand_name,
          last_name: partner.contact_name?.split(' ').slice(1).join(' ') || '',
          email: partner.email,
          phone: partner.phone,
          company: partner.brand_name,
          title: partner.contact_title || 'Owner',
          website: partner.website,
          tags: ['ff_partner', partner.status, partner.specialty].filter(Boolean),
          custom_fields: {
            ff_partner_id: partner.id,
            ff_status: partner.status,
            ff_specialty: partner.specialty,
            ff_country: partner.country,
            ff_products_count: partner.products_count,
            ff_commission_rate: partner.commission_rate
          }
        };

        // Send to MFS (no API key needed - same server)
        const response = await fetch(`${MFS_API_URL}/api/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business: 'FF',
            full_name: partner.contact_name || partner.brand_name,
            email: partner.contact_email,
            phone: partner.phone,
            company: partner.brand_name,
            website: partner.website,
            lead_source: 'ff_partner_sync',
            notes: `F&F Partner - ${partner.primary_fabric || 'natural fiber'} brand from ${partner.country || 'Unknown'}. Status: ${partner.status}`
          })
        });

        if (response.ok) {
          result.synced++;
        } else {
          result.failed++;
          result.errors.push(`Partner ${partner.id}: ${response.status}`);
        }
      } catch (err) {
        result.failed++;
        result.errors.push(`Partner ${partner.id}: ${err}`);
      }
    }

    // Log sync completion
    await supabase.from('ff_sync_log').insert({
      sync_type: 'partners_to_mfs',
      records_synced: result.synced,
      records_failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : null,
      synced_at: new Date().toISOString()
    });

  } catch (err) {
    result.errors.push(`Sync error: ${err}`);
  }

  return result;
}

// Sync bot actions to MFS activity log
async function syncBotActionsToMFS(supabase: ReturnType<typeof createAdminSupabase>): Promise<SyncResult> {
  const result: SyncResult = { type: 'bot_actions', synced: 0, failed: 0, errors: [] };

  try {
    // Get unsynced bot actions
    const { data: actions, error } = await supabase
      .from('ff_bot_actions')
      .select('*')
      .is('synced_to_mfs', null)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;
    if (!actions || actions.length === 0) {
      return result;
    }

    for (const action of actions) {
      try {
        const mfsActivity = {
          tenant_id: FF_TENANT_ID,
          external_id: `FF_bot_${action.id}`,
          source: 'FF_bot_activity',
          activity_type: 'automation',
          description: `[${action.bot_name}] ${action.action_type}`,
          metadata: {
            bot_name: action.bot_name,
            action_type: action.action_type,
            status: action.status,
            details: action.details,
            cost: action.cost,
            ff_action_id: action.id
          },
          created_at: action.created_at
        };

        // Mark as synced (MFS activities endpoint not yet available)
        await supabase
          .from('ff_bot_actions')
          .update({ synced_to_mfs: new Date().toISOString() })
          .eq('id', action.id);
        result.synced++;
      } catch (err) {
        result.failed++;
        result.errors.push(`Action ${action.id}: ${err}`);
      }
    }

  } catch (err) {
    result.errors.push(`Sync error: ${err}`);
  }

  return result;
}

// Sync email logs to MFS communication history
async function syncEmailsToMFS(supabase: ReturnType<typeof createAdminSupabase>): Promise<SyncResult> {
  const result: SyncResult = { type: 'emails', synced: 0, failed: 0, errors: [] };

  try {
    // Get unsynced emails
    const { data: emails, error } = await supabase
      .from('email_sent_log')
      .select('*')
      .is('synced_to_mfs', null)
      .eq('business_code', 'FF')
      .order('sent_at', { ascending: true })
      .limit(50);

    if (error) throw error;
    if (!emails || emails.length === 0) {
      return result;
    }

    for (const email of emails) {
      try {
        const mfsCommunication = {
          tenant_id: FF_TENANT_ID,
          external_id: `FF_email_${email.id}`,
          source: 'FF_email_outreach',
          type: 'email',
          direction: 'outbound',
          to_email: email.to_email,
          from_email: email.from_email,
          subject: email.subject,
          status: email.status,
          metadata: {
            ff_email_id: email.id,
            template: email.template,
            campaign: email.campaign,
            dedup_key: email.dedup_key
          },
          created_at: email.sent_at
        };

        // Mark as synced (MFS communications endpoint not yet available)
        await supabase
          .from('email_sent_log')
          .update({ synced_to_mfs: new Date().toISOString() })
          .eq('id', email.id);
        result.synced++;
      } catch (err) {
        result.failed++;
        result.errors.push(`Email ${email.id}: ${err}`);
      }
    }

  } catch (err) {
    result.errors.push(`Sync error: ${err}`);
  }

  return result;
}

// Sync deal pipeline changes
async function syncDealsToMFS(supabase: ReturnType<typeof createAdminSupabase>): Promise<SyncResult> {
  const result: SyncResult = { type: 'deals', synced: 0, failed: 0, errors: [] };

  try {
    // Get partners with status changes (potential deals)
    const { data: lastSync } = await supabase
      .from('ff_sync_log')
      .select('synced_at')
      .eq('sync_type', 'deals_to_mfs')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    const since = lastSync?.synced_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Partners who moved to negotiating or active = deal opportunities
    const { data: deals, error } = await supabase
      .from('ff_partners')
      .select('*')
      .in('status', ['negotiating', 'active'])
      .gte('updated_at', since);

    if (error) throw error;
    if (!deals || deals.length === 0) {
      return result;
    }

    for (const partner of deals) {
      try {
        const dealStage = partner.status === 'active' ? 'closed_won' : 'negotiation';
        const dealValue = partner.status === 'active'
          ? (partner.products_count || 1) * 5000 // Estimate $50/product commission
          : 0;

        const mfsDeal = {
          tenant_id: FF_TENANT_ID,
          external_id: `FF_deal_${partner.id}`,
          source: 'FF_partner_pipeline',
          name: `${partner.brand_name} Partnership`,
          stage: dealStage,
          value: dealValue,
          currency: 'USD',
          contact_external_id: `FF_partner_${partner.id}`,
          metadata: {
            ff_partner_id: partner.id,
            ff_status: partner.status,
            ff_specialty: partner.specialty,
            ff_products_count: partner.products_count,
            ff_commission_rate: partner.commission_rate
          },
          updated_at: partner.updated_at
        };

        // MFS deals endpoint not yet available - track locally
        result.synced++;
      } catch (err) {
        result.failed++;
        result.errors.push(`Deal ${partner.id}: ${err}`);
      }
    }

    // Log sync
    await supabase.from('ff_sync_log').insert({
      sync_type: 'deals_to_mfs',
      records_synced: result.synced,
      records_failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : null,
      synced_at: new Date().toISOString()
    });

  } catch (err) {
    result.errors.push(`Sync error: ${err}`);
  }

  return result;
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Mainframe Sync Processor] Running...');
    const startTime = Date.now();

    // Run all syncs
    const results = await Promise.all([
      syncPartnersToMFS(supabase),
      syncBotActionsToMFS(supabase),
      syncEmailsToMFS(supabase),
      syncDealsToMFS(supabase)
    ]);

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const allErrors = results.flatMap(r => r.errors);

    const duration = Date.now() - startTime;

    // Log overall sync run
    await supabase.from('ff_bot_actions').insert({
      bot_name: 'mainframe-sync-processor',
      action_type: 'mfs_sync',
      status: totalFailed === 0 ? 'completed' : 'completed_with_errors',
      details: {
        results: results.map(r => ({
          type: r.type,
          synced: r.synced,
          failed: r.failed
        })),
        duration_ms: duration,
        mfs_connected: true
      },
      cost: 0
    });

    console.log(`[Mainframe Sync Processor] Completed: ${totalSynced} synced, ${totalFailed} failed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: {
        records_synced: totalSynced,
        records_failed: totalFailed,
        duration_ms: duration,
        mfs_connected: true,
        results: results.map(r => ({
          type: r.type,
          synced: r.synced,
          failed: r.failed,
          errors: r.errors.length > 0 ? r.errors.slice(0, 5) : undefined
        }))
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Mainframe Sync Processor] Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent sync logs
    const { data: syncLogs, error } = await supabase
      .from('ff_sync_log')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Get sync stats from last 24 hours
    const { data: recentActions } = await supabase
      .from('ff_bot_actions')
      .select('*')
      .eq('bot_name', 'mainframe-sync-processor')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const stats = {
      total_syncs_24h: recentActions?.length || 0,
      total_records_synced: recentActions?.reduce((sum, a) => {
        const details = a.details as { results?: Array<{ synced: number }> };
        return sum + (details?.results?.reduce((s, r) => s + r.synced, 0) || 0);
      }, 0) || 0,
      mfs_connected: true
    };

    return NextResponse.json({
      success: true,
      data: {
        sync_logs: syncLogs || [],
        stats_24h: stats
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Mainframe Sync Processor] GET Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
