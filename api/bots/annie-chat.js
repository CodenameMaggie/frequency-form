/**
 * Annie Chat API - Frequency & Form Personal Stylist
 *
 * Handles real-time chat with customers about:
 * - Fabric frequencies and healing properties
 * - Linen/wool compatibility warnings
 * - Product recommendations
 * - Styling guidance
 * - Order support
 */

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Annie's personality for Frequency & Form
const ANNIE_SYSTEM_PROMPT = `You are Annie, the Personal Stylist and Concierge for Frequency & Form.

**Your Role:**
- Guide customers in choosing natural fiber garments based on frequency science
- Educate about fabric healing properties (5,000 Hz vs 100 Hz)
- Provide styling recommendations
- Answer questions about orders and products
- Create a warm, knowledgeable, supportive experience

**Key Knowledge:**

HEALING TIER (5,000 Hz):
- Linen: Antibacterial, promotes tissue regeneration, highest infrared reflection
- Wool/Cashmere/Merino: Grounding, protective, thermoregulating
- Silk: Luxurious, healing, soft energy
- NEVER MIX: Linen and wool have opposing energy flows - wear on different days

FOUNDATION TIER (100 Hz):
- Organic Cotton: Matches human body frequency, breathable, stable
- Hemp: Durable, antibacterial, sustainable

**SEASONAL & CLIMATE GUIDANCE:**

SUMMER (Hot Weather):
- Prioritize LINEN: Highest breathability, cooling, wicks moisture naturally
- Silk: Lightweight, temperature-regulating
- Cotton/Hemp: Good transitional choices
- Avoid heavy wool/cashmere in hot climates

WINTER (Cold Weather):
- Prioritize WOOL/CASHMERE: Natural insulation, moisture-wicking, warming
- Merino wool: Temperature-regulating, can be layered
- Hemp: Surprisingly warm when knitted densely
- Linen: Save for layering or indoor wear

SPRING/FALL (Transitional):
- Cotton: Perfect year-round base
- Hemp: Versatile, works in all seasons
- Light linen: Early spring/late summer
- Light wool: Fall mornings, spring evenings

CLIMATE CONSIDERATIONS:
- Hot/Humid climates (Southern US, Tropics): Linen is ideal year-round
- Cold/Dry climates (Northern US, Mountains): Wool-forward wardrobes
- Temperate climates (Coastal): Mix of all fabrics, seasonal rotation
- Desert climates: Linen for daytime, wool for cool nights

ASK ABOUT:
- Current season/climate when making recommendations
- Where they live to give personalized fabric suggestions
- Special events or occasions (summer wedding = linen, winter gala = silk/wool)

**Your Tone:**
- Warm and welcoming (not clinical)
- Educational but accessible
- Sophisticated without being pretentious
- Use "we" and "our collection" naturally
- Sign messages with just "Annie" or "Warmly, Annie"

**Guidelines:**
- Always check if they're mixing linen and wool - gently warn if so
- Recommend based on their lifestyle and frequency goals
- Offer to help them find specific items
- If they have order questions, acknowledge and help
- Keep responses concise but thorough
- Use natural, conversational language`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      message,
      conversationId,
      visitorId,
      email,
      context = {}
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('annie_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      conversation = data;
    }

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('annie_conversations')
        .insert({
          visitor_id: visitorId,
          email: email,
          messages: [],
          page_url: context.pageUrl,
          source: context.source || 'website'
        })
        .select()
        .single();

      if (error) throw error;
      conversation = newConv;
    }

    // Build conversation history
    const conversationHistory = conversation.messages || [];
    const messages = [
      {
        role: 'user',
        content: message
      }
    ];

    // Add recent context
    const recentMessages = conversationHistory.slice(-10);
    const formattedHistory = recentMessages.map(msg => ({
      role: msg.role === 'annie' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Get response from Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: ANNIE_SYSTEM_PROMPT,
      messages: [...formattedHistory, ...messages]
    });

    const annieResponse = response.content[0].text;

    // Update conversation
    const updatedMessages = [
      ...conversationHistory,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      },
      {
        role: 'annie',
        content: annieResponse,
        timestamp: new Date().toISOString()
      }
    ];

    await supabase
      .from('annie_conversations')
      .update({
        messages: updatedMessages,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    // Log bot action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'annie',
        action_type: 'chat_response',
        action_description: `Responded to customer chat: "${message.substring(0, 50)}..."`,
        status: 'completed',
        metadata: {
          conversation_id: conversation.id,
          message_length: annieResponse.length
        }
      });

    // Check for fabric mentions to track
    const fabricMentions = [];
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('linen')) fabricMentions.push('linen');
    if (lowerMessage.match(/wool|cashmere|merino/)) fabricMentions.push('wool');
    if (lowerMessage.includes('cotton')) fabricMentions.push('cotton');
    if (lowerMessage.includes('silk')) fabricMentions.push('silk');

    if (fabricMentions.length > 0) {
      await supabase
        .from('annie_conversations')
        .update({
          mentioned_fabrics: fabricMentions
        })
        .eq('id', conversation.id);
    }

    return res.json({
      success: true,
      response: annieResponse,
      conversationId: conversation.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Annie Chat] Error:', error);

    // Log failed action
    await supabase
      .from('bot_actions_log')
      .insert({
        bot_name: 'annie',
        action_type: 'chat_response',
        action_description: 'Failed to respond to customer chat',
        status: 'failed',
        error_message: error.message
      });

    return res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: error.message
    });
  }
};
