/**
 * Annie's Pinterest Content Automation for Frequency & Form
 * Creates and posts Pinterest pins featuring:
 * - European linen fashion inspiration
 * - Natural fiber education
 * - Seasonal styling guides
 * - Fabric frequency science
 * - Designer spotlights
 *
 * Runs: Daily at 9 AM and 3 PM via cron
 * Uses: Pinterest API v5, Atlas knowledge, AI content generation
 */

const { withCronAuth } = require('../../lib/api-wrapper');
const { queryAtlas } = require('./atlas-knowledge');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID; // F&F main board

// Pinterest content pillars from Atlas knowledge
const CONTENT_PILLARS = [
  'european_fashion',
  'natural_fiber_education',
  'seasonal_styling',
  'sustainable_fashion',
  'fabric_frequency_science',
  'designer_spotlight'
];

async function handler(req, res) {
  const tenantId = req.user?.tenant_id || '00000000-0000-0000-0000-000000000001';

  console.log('[Annie Pinterest] Starting Pinterest content generation for Frequency & Form...');

  try {
    // =====================================================================
    // STEP 1: Get current season and context from Atlas
    // =====================================================================

    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    let season = 'spring';
    if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'fall';
    else if (month === 12 || month <= 2) season = 'winter';

    console.log(`[Annie Pinterest] Current season: ${season}`);

    // Get F&F knowledge from Atlas
    const knowledgePrompt = `Retrieve Frequency & Form business knowledge about:
1. Seasonal fabric recommendations for ${season}
2. Pinterest marketing strategy
3. Fabric frequency science (healing tier vs foundation tier)
4. Current product catalog focus

Return a summary to inform Pinterest content creation.`;

    const atlasKnowledge = await queryAtlas(knowledgePrompt, 'marketing', tenantId, {
      sources: ['claude'],
      save_to_memory: false
    });

    if (!atlasKnowledge.success) {
      throw new Error('Failed to retrieve F&F knowledge from Atlas');
    }

    console.log('[Annie Pinterest] Retrieved F&F context from Atlas');

    // =====================================================================
    // STEP 2: Select content pillar for today (rotate through pillars)
    // =====================================================================

    const dayOfWeek = now.getDay(); // 0-6
    const contentPillar = CONTENT_PILLARS[dayOfWeek % CONTENT_PILLARS.length];

    console.log(`[Annie Pinterest] Today's content pillar: ${contentPillar}`);

    // =====================================================================
    // STEP 3: Generate Pinterest pin content using AI
    // =====================================================================

    const pinPrompt = `You are Annie, the personal stylist for Frequency & Form, a curated marketplace for European natural fiber fashion.

CURRENT CONTEXT:
Season: ${season}
Content Pillar: ${contentPillar}

F&F KNOWLEDGE:
${atlasKnowledge.answer}

TASK: Create 3 Pinterest pins for today's content pillar.

PIN TYPES:
1. If european_fashion: Feature European linen/wool fashion looks
2. If natural_fiber_education: Educate about fabric properties (linen, wool, silk, cotton, hemp)
3. If seasonal_styling: ${season} styling with natural fibers
4. If sustainable_fashion: Sustainability benefits of natural fibers
5. If fabric_frequency_science: Healing properties of 5,000 Hz fabrics
6. If designer_spotlight: European designer story

REQUIREMENTS FOR EACH PIN:
- Title: Compelling, 60-100 characters
- Description: Educational + inspiring, 300-500 characters, include call-to-action
- Hashtags: 5-8 relevant hashtags (e.g., #EuropeanLinen #NaturalFibers #SustainableFashion)
- Keywords: 3-5 SEO keywords for Pinterest algorithm
- Link: https://frequencyandform.com (or specific product category)
- Board: Frequency & Form Collection

TONE:
- Sophisticated, educational, inviting
- Focus on quality and wellness benefits
- Not overly salesy - inspire and educate

IMPORTANT:
- Emphasize ${season} appropriateness
- Highlight fabric frequency science (5,000 Hz for healing tier)
- European craftsmanship and natural materials
- Sustainable, conscious fashion choices

Return JSON array:
[
  {
    "title": "Pin title here",
    "description": "Pin description with CTA",
    "hashtags": ["#EuropeanLinen", "#NaturalFibers", "#SustainableFashion"],
    "keywords": ["linen fashion", "natural fiber clothing", "sustainable style"],
    "link": "https://frequencyandform.com/collections/linen",
    "content_pillar": "${contentPillar}",
    "season": "${season}"
  }
]`;

    const pinGeneration = await queryAtlas(pinPrompt, 'marketing', tenantId, {
      sources: ['claude'],
      save_to_memory: false
    });

    if (!pinGeneration.success) {
      throw new Error('AI pin generation failed: ' + pinGeneration.error);
    }

    console.log('[Annie Pinterest] AI generated pin content');

    // Parse pins
    let pins = [];
    try {
      const jsonMatch = pinGeneration.answer.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        pins = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[Annie Pinterest] Failed to parse pins JSON');
      // Create fallback pin
      pins = [{
        title: `${season.charAt(0).toUpperCase() + season.slice(1)} Natural Fiber Fashion | Frequency & Form`,
        description: `Discover European linen and natural fiber fashion perfect for ${season}. Healing properties meet European elegance. Shop conscious fashion at Frequency & Form. 🌿 #NaturalFibers #SustainableFashion`,
        hashtags: ['#NaturalFibers', '#EuropeanFashion', '#LinenStyle', '#SustainableFashion', '#ConsciousLiving'],
        keywords: ['linen fashion', 'natural fiber clothing', 'sustainable fashion'],
        link: 'https://frequencyandform.com',
        content_pillar: contentPillar,
        season: season
      }];
    }

    console.log(`[Annie Pinterest] Generated ${pins.length} pins`);

    // =====================================================================
    // STEP 4: Save pins to social_posts table (status: draft)
    // =====================================================================

    let savedCount = 0;
    const savedPins = [];

    for (const pin of pins) {
      try {
        const { data: savedPin, error: insertError } = await supabase
          .from('social_posts')
          .insert({
            tenant_id: tenantId,
            platform: 'pinterest',
            post_type: 'pin',
            content: pin.description,
            title: pin.title,
            hashtags: pin.hashtags || [],
            status: 'draft', // Requires manual approval or auto-publish if configured
            scheduled_for: new Date(Date.now() + savedCount * 3600000).toISOString(), // Stagger by 1 hour
            metadata: {
              generated_by: 'annie_pinterest_bot',
              content_pillar: pin.content_pillar,
              season: pin.season,
              keywords: pin.keywords,
              link: pin.link,
              board_id: PINTEREST_BOARD_ID,
              generated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Annie Pinterest] Error saving pin:', insertError.message);
        } else {
          savedCount++;
          savedPins.push(savedPin);
          console.log(`[Annie Pinterest] ✅ Saved pin: "${pin.title}"`);
        }

      } catch (error) {
        console.error('[Annie Pinterest] Error processing pin:', error.message);
      }
    }

    // =====================================================================
    // STEP 5: Auto-publish to Pinterest if token configured
    // =====================================================================

    let publishedCount = 0;

    if (PINTEREST_ACCESS_TOKEN && PINTEREST_BOARD_ID) {
      console.log('[Annie Pinterest] Pinterest API configured - attempting auto-publish...');

      for (const pin of savedPins) {
        try {
          const publishResult = await publishToPinterest(pin);

          if (publishResult.success) {
            // Mark as published
            await supabase
              .from('social_posts')
              .update({
                status: 'published',
                published_at: new Date().toISOString(),
                metadata: {
                  ...pin.metadata,
                  pinterest_pin_id: publishResult.pin_id,
                  pinterest_url: publishResult.url
                }
              })
              .eq('id', pin.id);

            publishedCount++;
            console.log(`[Annie Pinterest] ✅ Published pin to Pinterest: ${publishResult.url}`);
          } else {
            console.error(`[Annie Pinterest] Failed to publish pin: ${publishResult.error}`);
          }

        } catch (error) {
          console.error(`[Annie Pinterest] Error publishing pin:`, error.message);
        }
      }
    } else {
      console.log('[Annie Pinterest] Pinterest API not configured - pins saved as drafts for manual posting');
    }

    // Log bot action
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'annie',
        action_type: 'pinterest_content_generation',
        action_description: `Generated ${pins.length} Pinterest pins for ${contentPillar} pillar`,
        status: 'completed',
        metadata: {
          pins_generated: pins.length,
          pins_saved: savedCount,
          pins_published: publishedCount,
          content_pillar: contentPillar,
          season: season,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`[Annie Pinterest] Complete: ${savedCount} pins created, ${publishedCount} published`);

    return res.json({
      success: true,
      data: {
        pins_generated: pins.length,
        pins_saved: savedCount,
        pins_published: publishedCount,
        content_pillar: contentPillar,
        season: season,
        message: publishedCount > 0
          ? `${publishedCount} pins published to Pinterest`
          : 'Pins saved as drafts - configure PINTEREST_ACCESS_TOKEN to auto-publish'
      }
    });

  } catch (error) {
    console.error('[Annie Pinterest] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: tenantId,
        bot_name: 'annie',
        action_type: 'pinterest_content_generation',
        action_description: 'Failed to generate Pinterest pins',
        status: 'failed',
        metadata: {
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
 * Publish pin to Pinterest using API v5
 * Requires: PINTEREST_ACCESS_TOKEN, PINTEREST_BOARD_ID
 */
async function publishToPinterest(pin) {
  if (!PINTEREST_ACCESS_TOKEN || !PINTEREST_BOARD_ID) {
    return {
      success: false,
      error: 'Pinterest API not configured. Set PINTEREST_ACCESS_TOKEN and PINTEREST_BOARD_ID.'
    };
  }

  try {
    const axios = require('axios');

    // Note: Pinterest requires an image. For now, we'll use a placeholder.
    // In production, you'd want to:
    // 1. Generate images using AI (Midjourney, DALL-E, etc.)
    // 2. Store product images in the database
    // 3. Use Cloudinary or similar for hosting

    const pinData = {
      board_id: PINTEREST_BOARD_ID,
      title: pin.title,
      description: pin.content,
      link: pin.metadata.link || 'https://frequencyandform.com',
      media_source: {
        source_type: 'image_url',
        url: pin.metadata.image_url || 'https://frequencyandform.com/images/default-pin.jpg'
      },
      // Optional: Add dominant color for better discovery
      // dominant_color: '#c9a962' // F&F gold color
    };

    const response = await axios.post(
      'https://api.pinterest.com/v5/pins',
      pinData,
      {
        headers: {
          'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      pin_id: response.data.id,
      url: `https://pinterest.com/pin/${response.data.id}`
    };

  } catch (error) {
    console.error('[Pinterest API] Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

module.exports = withCronAuth(handler);
