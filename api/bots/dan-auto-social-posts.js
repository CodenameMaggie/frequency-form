/**
 * Dan's Auto Social Posts Generator
 * Creates AI-generated social media posts for B2B marketing
 * Runs daily at 9 AM via cron
 * Generates posts for LinkedIn, Twitter, and Facebook
 */

const { withCronAuth } = require('../../lib/api-wrapper');
const { queryAtlas } = require('./atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Dan Auto Social] Starting daily social media post generation...');

  try {
    // Get recent campaigns and activities for context
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('name, description, target_audience')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .limit(5);

    const { data: recentActions } = await supabase
      .from('bot_actions_log')
      .select('action_type, data')
      .eq('tenant_id', tenantId)
      .eq('bot_name', 'Dan')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // Analyze recent activities for post ideas
    const leadStats = {
      discovered: 0,
      contacted: 0,
      replied: 0
    };

    (recentActions || []).forEach(action => {
      if (action.action_type === 'wholesale_discovery') {
        leadStats.discovered += action.data?.leads_added || 0;
      } else if (action.action_type === 'outreach') {
        leadStats.contacted += action.data?.emails_sent || 0;
      } else if (action.action_type === 'reply_processing') {
        leadStats.replied += action.data?.replies_processed || 0;
      }
    });

    console.log('[Dan Auto Social] Lead stats:', leadStats);

    // Use AI to generate social posts
    const postPrompt = `You are Dan, the marketing bot for Frequency & Form, a B2B natural fiber products company.

BUSINESS:
- We source natural fiber products (linen, organic cotton, hemp, wool, silk) for B2B clients
- We help retailers find exactly what their customers want
- Business model: "Ask what you need, we'll source it" (40-50% margins)
- Target audience: Sustainable retailers, boutiques, wellness centers, wholesale buyers

RECENT ACTIVITY:
- Discovered ${leadStats.discovered} new B2B leads this week
- Contacted ${leadStats.contacted} potential partners
- Received ${leadStats.replied} responses

ACTIVE CAMPAIGNS:
${(campaigns || []).map(c => `- ${c.name}: ${c.description}`).join('\n')}

TASK: Generate 5 social media posts (1 per weekday) for next week.

POST TYPES TO CREATE:
1. LinkedIn: Thought leadership about B2B natural fiber market trends
2. Twitter: Quick tip for sustainable retailers
3. LinkedIn: Success story or case study (can be aspirational)
4. Twitter: Industry insight or statistic
5. LinkedIn: Value proposition post about our sourcing capabilities

REQUIREMENTS:
- Professional, helpful tone (not salesy)
- Include relevant hashtags (3-5 per post)
- Keep Twitter posts under 280 characters
- LinkedIn posts 100-200 words
- Focus on value to retailers/buyers (not end consumers)
- No direct product pitches - focus on education and partnerships

Return as JSON array with objects: {platform, content, hashtags, scheduled_time (date relative to today), post_type}`;

    const atlasResponse = await queryAtlas(postPrompt, 'marketing', tenantId, {
      sources: ['claude'],
      save_to_memory: false
    });

    if (!atlasResponse.success) {
      throw new Error('AI post generation failed: ' + atlasResponse.error);
    }

    console.log('[Dan Auto Social] AI generated posts');

    // Parse posts
    let posts = [];
    try {
      const jsonMatch = atlasResponse.answer.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        posts = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[Dan Auto Social] Failed to parse posts JSON');
      // Create fallback posts
      posts = [
        {
          platform: 'linkedin',
          content: 'Building sustainable B2B partnerships starts with understanding what your customers truly value. At Frequency & Form, we help retailers source exactly what their wellness-conscious customers are looking for in natural fiber products. Let\'s talk about how we can support your business growth.',
          hashtags: ['#B2B', '#SustainableBusiness', '#NaturalFibers', '#RetailPartners', '#WholesaleBuyers'],
          scheduled_time: 'tomorrow 9am',
          post_type: 'value_proposition'
        }
      ];
    }

    console.log(`[Dan Auto Social] Generated ${posts.length} posts`);

    // Save posts to database (status: draft for manual review)
    let savedCount = 0;
    for (const post of posts) {
      try {
        // Calculate scheduled time
        let scheduledFor = new Date();
        if (post.scheduled_time && post.scheduled_time.includes('tomorrow')) {
          scheduledFor.setDate(scheduledFor.getDate() + 1);
        }
        scheduledFor.setHours(9, 0, 0, 0); // Default to 9 AM

        const { error: insertError } = await supabase
          .from('social_posts')
          .insert({
            tenant_id: tenantId,
            platform: post.platform,
            post_type: 'ai_generated',
            content: post.content,
            hashtags: post.hashtags || [],
            status: 'draft', // Requires manual approval before publishing
            scheduled_for: scheduledFor.toISOString(),
            metadata: {
              generated_by: 'dan_ai',
              post_type: post.post_type,
              generated_at: new Date().toISOString()
            }
          });

        if (insertError) {
          console.error('[Dan Auto Social] Error saving post:', insertError.message);
        } else {
          savedCount++;
          console.log(`[Dan Auto Social] ✅ Saved ${post.platform} post`);
        }

      } catch (error) {
        console.error('[Dan Auto Social] Error processing post:', error.message);
      }
    }

    // Log bot action
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'Dan',
        action_type: 'social_post_generation',
        status: 'success',
        data: {
          posts_generated: posts.length,
          posts_saved: savedCount,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`[Dan Auto Social] Complete: ${savedCount} posts created (pending approval)`);

    return res.json({
      success: true,
      data: {
        posts_generated: posts.length,
        posts_saved: savedCount,
        message: 'Posts created in draft status - review and approve before publishing'
      }
    });

  } catch (error) {
    console.error('[Dan Auto Social] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'Dan',
        action_type: 'social_post_generation',
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
