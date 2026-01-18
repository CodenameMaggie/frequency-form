/**
 * MFS Unified Bot Communications Client
 * Connects F&F bots to the central Forbes Command bot-comms system
 *
 * System: http://5.78.139.9:3000/api/bot-comms
 *
 * C-Suite: MIRA, HENRY, DAVE, DAN, JORDAN, ALEX, ANNIE
 * Businesses: MFS, IC, IA, FF, SH, TH, YPEC, SS
 * Channels: ALL, CSUITE, LEADS, OUTREACH, REVENUE, CONTENT, SUPPORT
 */

const MFS_BOT_COMMS_URL = process.env.MFS_BOT_COMMS_URL || 'http://5.78.139.9:3000/api/bot-comms';

export type Priority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BATCH';
export type Channel = 'ALL' | 'CSUITE' | 'LEADS' | 'OUTREACH' | 'REVENUE' | 'CONTENT' | 'SUPPORT' | string;
export type CSuiteBot = 'MIRA' | 'HENRY' | 'DAVE' | 'DAN' | 'JORDAN' | 'ALEX' | 'ANNIE';

// Map F&F bot names to MFS C-suite names
export const FF_TO_MFS_BOT: Record<string, string> = {
  'atlas': 'MIRA',      // Atlas → MIRA (CEO)
  'dave': 'DAVE',       // Same
  'henry': 'HENRY',     // Same
  'dan': 'DAN',         // Same
  'maggie': 'ALEX',     // Maggie → ALEX (closest match for community/marketing)
  'annie': 'ANNIE',     // Same
  'jordan': 'JORDAN'    // Same
};

export interface BotMessage {
  type: 'report' | 'request' | 'alert' | 'update' | 'response';
  subject: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

export interface QueueStats {
  pending: number;
  delivered: number;
  processed: number;
  queue_size: number;
  subscriptions_count: number;
}

/**
 * Send a message from an F&F bot to the unified MFS bot-comms system
 */
export async function sendBotMessage(
  from: string,
  to: string | CSuiteBot,
  message: BotMessage,
  options: {
    channel?: Channel;
    priority?: Priority;
    business?: string;
  } = {}
): Promise<SendResult> {
  const {
    channel = 'CSUITE',
    priority = 'NORMAL',
    business = 'FF'
  } = options;

  // Convert F&F bot names to MFS format
  const mfsFrom = FF_TO_MFS_BOT[from.toLowerCase()] || `${business}:${from.toUpperCase()}`;
  const mfsTo = FF_TO_MFS_BOT[to.toLowerCase()] || to.toUpperCase();

  try {
    const response = await fetch(MFS_BOT_COMMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        from: mfsFrom,
        to: mfsTo,
        channel,
        priority,
        message
      })
    });

    const data = await response.json();
    return {
      success: data.success,
      message_id: data.message_id,
      error: data.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Broadcast a message to a channel
 */
export async function broadcastMessage(
  from: string,
  message: BotMessage,
  options: {
    channel?: Channel;
    priority?: Priority;
    business?: string;
  } = {}
): Promise<SendResult> {
  const {
    channel = 'CSUITE',
    priority = 'NORMAL',
    business = 'FF'
  } = options;

  const mfsFrom = FF_TO_MFS_BOT[from.toLowerCase()] || `${business}:${from.toUpperCase()}`;

  try {
    const response = await fetch(MFS_BOT_COMMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'broadcast',
        from: mfsFrom,
        channel,
        priority,
        message
      })
    });

    const data = await response.json();
    return {
      success: data.success,
      message_id: data.message_id,
      error: data.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Receive pending messages for a bot
 */
export async function receiveMessages(bot: string): Promise<{
  success: boolean;
  messages: Array<{
    id: string;
    from: string;
    channel: string;
    priority: string;
    message: BotMessage;
    timestamp: string;
  }>;
  error?: string;
}> {
  const mfsBot = FF_TO_MFS_BOT[bot.toLowerCase()] || bot.toUpperCase();

  try {
    const response = await fetch(MFS_BOT_COMMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'receive',
        bot: mfsBot
      })
    });

    const data = await response.json();
    return {
      success: data.success,
      messages: data.messages || [],
      error: data.error
    };
  } catch (error) {
    return {
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Acknowledge a message as processed
 */
export async function acknowledgeMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(MFS_BOT_COMMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ack',
        message_id: messageId
      })
    });

    const data = await response.json();
    return { success: data.success, error: data.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{ success: boolean; stats?: QueueStats; error?: string }> {
  try {
    const response = await fetch(MFS_BOT_COMMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'queue_stats' })
    });

    const data = await response.json();
    return {
      success: data.success,
      stats: data.stats,
      error: data.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Route a lead to the appropriate business intake
 */
export async function routeLead(
  lead: {
    email: string;
    name?: string;
    company?: string;
    source?: string;
    notes?: string;
  },
  business: string = 'FF'
): Promise<SendResult> {
  try {
    const response = await fetch(MFS_BOT_COMMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'route_lead',
        business,
        lead
      })
    });

    const data = await response.json();
    return {
      success: data.success,
      message_id: data.message_id,
      error: data.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Query data across businesses
 */
export async function crossQuery(
  query: string,
  businesses: string[] = ['FF']
): Promise<{ success: boolean; results?: unknown[]; error?: string }> {
  try {
    const response = await fetch(MFS_BOT_COMMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cross_query',
        query,
        businesses
      })
    });

    const data = await response.json();
    return {
      success: data.success,
      results: data.results,
      error: data.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
