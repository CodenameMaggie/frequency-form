/**
 * Henry's Support Ticket Monitor
 * Monitors support tickets for SLA violations and escalations
 * Runs every 3 hours via cron
 * Alerts team about urgent or overdue tickets
 */

const { withCronAuth } = require('../../lib/api-wrapper');
const { sendFromConcierge } = require('../../lib/email-sender');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Henry Ticket Monitor] Starting support ticket monitoring...');

  try {
    // Define SLA thresholds (in hours)
    const SLA = {
      high: 4,    // 4 hours for high priority
      medium: 24, // 24 hours for medium priority
      low: 72     // 72 hours for low priority
    };

    // Get all open tickets
    const { data: tickets, error: fetchError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('[Henry Ticket Monitor] Error fetching tickets:', fetchError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch tickets'
      });
    }

    if (!tickets || tickets.length === 0) {
      console.log('[Henry Ticket Monitor] No open tickets to monitor');
      return res.json({
        success: true,
        data: {
          tickets_monitored: 0,
          sla_violations: 0,
          escalations: 0
        }
      });
    }

    console.log(`[Henry Ticket Monitor] Monitoring ${tickets.length} open tickets`);

    const now = new Date();
    const violations = [];
    const escalations = [];

    for (const ticket of tickets) {
      const createdAt = new Date(ticket.created_at);
      const ageHours = (now - createdAt) / (1000 * 60 * 60);

      const priority = ticket.priority || 'medium';
      const slaThreshold = SLA[priority] || SLA.medium;

      // Check for SLA violation
      if (ageHours > slaThreshold) {
        violations.push({
          id: ticket.id,
          title: ticket.title,
          priority: priority,
          age_hours: Math.round(ageHours),
          sla_threshold: slaThreshold,
          customer: ticket.contact_id ? 'Known customer' : 'Anonymous'
        });

        console.log(`[Henry Ticket Monitor] ⚠️ SLA Violation: Ticket #${ticket.id} (${Math.round(ageHours)}h old, ${priority} priority)`);

        // Auto-escalate if severely overdue
        if (ageHours > slaThreshold * 2) {
          escalations.push(ticket);

          // Update ticket to high priority if not already
          if (ticket.priority !== 'high') {
            await supabase
              .from('support_tickets')
              .update({
                priority: 'high',
                notes: `${ticket.notes || ''}\n\n[Auto-Escalated] Ticket overdue by ${Math.round(ageHours - slaThreshold)} hours. Original priority: ${priority}. Escalated: ${now.toISOString()}`
              })
              .eq('id', ticket.id);

            console.log(`[Henry Ticket Monitor] ⚠️ Escalated ticket #${ticket.id} to HIGH priority`);
          }
        }
      }

      // Check for bug tickets that need immediate attention
      if (ticket.is_bug && ticket.priority !== 'high') {
        escalations.push(ticket);

        await supabase
          .from('support_tickets')
          .update({
            priority: 'high'
          })
          .eq('id', ticket.id);

        console.log(`[Henry Ticket Monitor] 🐛 Bug ticket #${ticket.id} escalated to HIGH priority`);
      }
    }

    // Send alert email if there are violations or escalations
    if (violations.length > 0 || escalations.length > 0) {
      const alertEmail = `
        <h2>Support Ticket Alert - ${new Date().toLocaleString()}</h2>

        <h3>Summary</h3>
        <ul>
          <li><strong>Total Open Tickets:</strong> ${tickets.length}</li>
          <li><strong>SLA Violations:</strong> ${violations.length}</li>
          <li><strong>Escalations:</strong> ${escalations.length}</li>
        </ul>

        ${violations.length > 0 ? `
        <h3>⚠️ SLA Violations (${violations.length})</h3>
        <table border="1" cellpadding="8" style="border-collapse: collapse;">
          <tr>
            <th>Ticket ID</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Age (hours)</th>
            <th>SLA Threshold</th>
          </tr>
          ${violations.map(v => `
          <tr>
            <td>#${v.id.slice(0, 8)}</td>
            <td>${v.title}</td>
            <td>${v.priority.toUpperCase()}</td>
            <td>${v.age_hours}</td>
            <td>${v.sla_threshold}h</td>
          </tr>
          `).join('')}
        </table>
        ` : ''}

        ${escalations.length > 0 ? `
        <h3>🚨 Auto-Escalated Tickets (${escalations.length})</h3>
        <ul>
          ${escalations.map(t => `<li>Ticket #${t.id.slice(0, 8)}: ${t.title} (${t.is_bug ? 'BUG' : 'Overdue'})</li>`).join('')}
        </ul>
        ` : ''}

        <p><em>This is an automated alert from Henry's Ticket Monitor.</em></p>
      `;

      // Send to support team (configured email)
      const supportEmail = process.env.FROM_EMAIL_SUPPORT || 'support@maggieforbesstrategies.com';

      await sendFromConcierge({
        to: supportEmail,
        subject: `⚠️ Support Ticket Alert: ${violations.length} SLA Violations, ${escalations.length} Escalations`,
        html: alertEmail
      });

      console.log('[Henry Ticket Monitor] ✉️ Alert email sent to support team');
    }

    // Log bot action
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'Henry',
        action_type: 'ticket_monitoring',
        status: 'success',
        data: {
          tickets_monitored: tickets.length,
          sla_violations: violations.length,
          escalations: escalations.length,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`[Henry Ticket Monitor] Complete: ${violations.length} violations, ${escalations.length} escalations`);

    return res.json({
      success: true,
      data: {
        tickets_monitored: tickets.length,
        sla_violations: violations.length,
        escalations: escalations.length,
        violations: violations
      }
    });

  } catch (error) {
    console.error('[Henry Ticket Monitor] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'Henry',
        action_type: 'ticket_monitoring',
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
