import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // F&F tenant

interface CustomerContext {
  name?: string;
  email?: string;
  has_body_scan?: boolean;
  has_color_analysis?: boolean;
  body_measurements?: any;
  color_profile?: any;
  preferred_fabrics?: string[];
  total_orders?: number;
  conversation_count?: number;
}

/**
 * POST /api/bots/annie-chat
 * Annie's customer service chat endpoint
 * NO AI - uses template matching and customer context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, visitorId, context } = body;

    if (!message || !visitorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[Annie Chat] New message:', { conversationId, visitorId, message });

    // Get or create conversation
    const conversation = await getOrCreateConversation(conversationId, visitorId, context);

    // Get customer context (measurements, color profile, order history, etc.)
    const customerContext = await getCustomerContext(visitorId, conversation.user_id);

    // Store customer message
    await supabase.from('annie_messages').insert({
      conversation_id: conversation.id,
      role: 'customer',
      message,
      context,
      created_at: new Date().toISOString(),
    });

    // Generate Annie's response (NO AI - template matching)
    const response = await generateAnnieResponse(message, customerContext, context);

    // Store Annie's response
    await supabase.from('annie_messages').insert({
      conversation_id: conversation.id,
      role: 'annie',
      message: response.text,
      intent: response.intent,
      response_template: response.templateKey,
      created_at: new Date().toISOString(),
    });

    // Update conversation last_message_at
    await supabase
      .from('annie_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // Update customer profile conversation count
    await updateCustomerProfile(visitorId, conversation.user_id, customerContext);

    return NextResponse.json({
      success: true,
      response: response.text,
      conversationId: conversation.conversation_id,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Annie Chat] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get or create conversation
 */
async function getOrCreateConversation(conversationId: string | null, visitorId: string, context: any) {
  // Try to find existing conversation
  if (conversationId) {
    const { data: existing } = await supabase
      .from('annie_conversations')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .eq('conversation_id', conversationId)
      .single();

    if (existing) return existing;
  }

  // Create new conversation
  const newConversationId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const { data: newConv, error } = await supabase
    .from('annie_conversations')
    .insert({
      tenant_id: TENANT_ID,
      conversation_id: newConversationId,
      visitor_id: visitorId,
      page_url: context?.pageUrl || null,
      source: context?.source || 'website',
      status: 'active',
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return newConv;
}

/**
 * Get customer context from database
 */
async function getCustomerContext(visitorId: string, userId: string | null): Promise<CustomerContext> {
  const context: CustomerContext = {};

  // Get customer profile if exists
  const { data: profile } = await supabase
    .from('annie_customer_profiles')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .or(`visitor_id.eq.${visitorId},user_id.eq.${userId}`)
    .single();

  if (profile) {
    context.name = profile.name;
    context.email = profile.email;
    context.has_body_scan = profile.has_body_scan;
    context.has_color_analysis = profile.has_color_analysis;
    context.preferred_fabrics = profile.preferred_fabrics;
    context.total_orders = profile.total_orders;
    context.conversation_count = profile.total_conversations;
  }

  // Get body measurements if available
  if (userId) {
    const { data: bodyData } = await supabase
      .from('ff_body_measurements')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (bodyData) {
      context.has_body_scan = true;
      context.body_measurements = bodyData;
    }

    // Get color profile if available
    const { data: colorData } = await supabase
      .from('ff_color_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (colorData) {
      context.has_color_analysis = true;
      context.color_profile = colorData;
    }
  }

  return context;
}

/**
 * Generate Annie's response using template matching (NO AI)
 */
async function generateAnnieResponse(
  message: string,
  customerContext: CustomerContext,
  pageContext: any
): Promise<{ text: string; intent: string; templateKey: string }> {
  const messageLower = message.toLowerCase();

  // Detect intent based on keywords
  let intent = 'general';
  let templateKey = 'default';

  // Check for greetings
  if (/\b(hi|hello|hey|sup)\b/.test(messageLower)) {
    intent = 'greeting';
    // Use personalized greeting if we have customer name
    if (customerContext.name && customerContext.conversation_count && customerContext.conversation_count > 0) {
      templateKey = 'greeting_returning';
    } else {
      templateKey = 'greeting_new';
    }
  }

  // Check for fabric inquiries
  else if (/\b(linen|breathable|summer)\b/.test(messageLower)) {
    intent = 'fabric_inquiry';
    templateKey = 'fabric_linen';
  }
  else if (/\b(cotton|organic|everyday)\b/.test(messageLower)) {
    intent = 'fabric_inquiry';
    templateKey = 'fabric_organic_cotton';
  }

  // Check for sizing questions
  else if (/\b(size|fit|measurements?|too (big|small))\b/.test(messageLower)) {
    intent = 'sizing_help';
    // Use personalized sizing if we have body scan
    if (customerContext.has_body_scan && customerContext.body_measurements) {
      templateKey = 'sizing_with_scan';
    } else {
      templateKey = 'sizing_help';
    }
  }

  // Check for color questions
  else if (/\b(color|what color|which color|color season)\b/.test(messageLower)) {
    intent = 'color_inquiry';
    // Use personalized color advice if we have color analysis
    if (customerContext.has_color_analysis && customerContext.color_profile) {
      templateKey = 'color_with_analysis';
    } else {
      templateKey = 'color_analysis';
    }
  }

  // Check for custom orders
  else if (/\b(custom|made to order|personalized|tailored)\b/.test(messageLower)) {
    intent = 'custom_order';
    templateKey = 'custom_order';
  }

  // Check for shipping questions
  else if (/\b(shipping|delivery|how long|when will)\b/.test(messageLower)) {
    intent = 'shipping';
    templateKey = 'shipping';
  }

  // Check for returns
  else if (/\b(return|exchange|refund|don'?t like)\b/.test(messageLower)) {
    intent = 'returns';
    templateKey = 'returns';
  }

  // Check for pricing
  else if (/\b(price|cost|how much|expensive)\b/.test(messageLower)) {
    intent = 'pricing';
    templateKey = 'price_inquiry';
  }

  // Check for booking/consultation requests
  else if (/\b(book|schedule|appointment|consultation|call|meet)\b/.test(messageLower)) {
    intent = 'booking';
    // Check what type of service they're asking about
    if (/\b(color|color analysis)\b/.test(messageLower)) {
      templateKey = 'book_color_analysis';
    } else if (/\b(body|body scan|measurements?)\b/.test(messageLower)) {
      templateKey = 'book_body_scan';
    } else {
      templateKey = 'book_consultation';
    }
  }

  // Get template from database
  const { data: template } = await supabase
    .from('annie_response_templates')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('template_key', templateKey)
    .eq('active', true)
    .single();

  if (!template) {
    // Default fallback response
    return {
      text: "I'm here to help! I can answer questions about our natural fiber fabrics, sizing, custom orders, shipping, and more. What would you like to know?",
      intent: 'general',
      templateKey: 'default',
    };
  }

  // Replace variables in template with customer context
  let responseText = template.response_text;

  if (template.requires_context && template.variables) {
    // Replace variables with actual customer data
    template.variables.forEach((variable: string) => {
      const placeholder = `{${variable}}`;
      let value = '';

      switch (variable) {
        case 'customer_name':
          value = customerContext.name || 'there';
          break;
        case 'recommended_size':
          value = customerContext.body_measurements?.recommended_size || 'M';
          break;
        case 'bust':
          value = customerContext.body_measurements?.bust?.toString() || '?';
          break;
        case 'waist':
          value = customerContext.body_measurements?.waist?.toString() || '?';
          break;
        case 'hips':
          value = customerContext.body_measurements?.hips?.toString() || '?';
          break;
        case 'body_type':
          value = customerContext.body_measurements?.body_type?.replace('_', ' ') || 'balanced';
          break;
        case 'recommended_silhouettes':
          value = customerContext.body_measurements?.recommended_silhouettes?.join(', ').replace(/_/g, ' ') || 'A-line, wrap, and fit & flare styles';
          break;
        case 'color_season':
          value = customerContext.color_profile?.color_season || 'Autumn';
          break;
        case 'best_colors':
          value = customerContext.color_profile?.best_colors?.slice(0, 3).map((c: any) => c.name.replace('_', ' ')).join(', ') || 'earthy tones';
          break;
        case 'recommended_color_1':
          value = customerContext.color_profile?.best_colors?.[0]?.name?.replace('_', ' ') || 'Terracotta';
          break;
        case 'recommended_color_2':
          value = customerContext.color_profile?.best_colors?.[1]?.name?.replace('_', ' ') || 'Sage';
          break;
        case 'skin_undertone':
          value = customerContext.color_profile?.skin_undertone || 'warm';
          break;
      }

      responseText = responseText.replace(new RegExp(placeholder, 'g'), value);
    });
  }

  // Update template usage count
  await supabase
    .from('annie_response_templates')
    .update({ usage_count: (template.usage_count || 0) + 1 })
    .eq('id', template.id);

  return {
    text: responseText,
    intent,
    templateKey,
  };
}

/**
 * Update customer profile with conversation data
 */
async function updateCustomerProfile(visitorId: string, userId: string | null, context: CustomerContext) {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('annie_customer_profiles')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .or(`visitor_id.eq.${visitorId}${userId ? `,user_id.eq.${userId}` : ''}`)
    .single();

  if (existing) {
    // Update existing profile
    await supabase
      .from('annie_customer_profiles')
      .update({
        total_conversations: (existing.total_conversations || 0) + 1,
        last_conversation_date: new Date().toISOString(),
        has_body_scan: context.has_body_scan || existing.has_body_scan,
        has_color_analysis: context.has_color_analysis || existing.has_color_analysis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Create new profile
    await supabase.from('annie_customer_profiles').insert({
      tenant_id: TENANT_ID,
      visitor_id: visitorId,
      user_id: userId,
      has_body_scan: context.has_body_scan || false,
      has_color_analysis: context.has_color_analysis || false,
      total_conversations: 1,
      last_conversation_date: new Date().toISOString(),
    });
  }
}
