/**
 * Dan's Pinterest Content Poster for Frequency & Form
 * Uses proven templates (NO AI costs) for fabric frequency education
 * Dual-writes to F&F database and MFS central
 *
 * Runs: Daily at 9 AM and 3 PM via cron
 * Cost: $0 (no AI, just template rotation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPinTemplates } from '@/lib/ff-content-templates';

const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // F&F tenant

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Dan Pinterest] Starting Pinterest content generation...');

    // Create Supabase clients
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const mfsSupabase = createClient(
      process.env.MFS_SUPABASE_URL!,
      process.env.MFS_SUPABASE_SERVICE_ROLE_KEY!
    );

    const PINTEREST_ACCESS_TOKEN = process.env.PINTEREST_ACCESS_TOKEN;
    const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID;

    // Get current day for template rotation
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);

    // Generate 3 pins using proven templates (no AI cost)
    const pins = getPinTemplates(3, dayOfYear);
    console.log(`[Dan Pinterest] Selected ${pins.length} proven templates`);

    // =====================================================================
    // Save pins to F&F database
    // =====================================================================

    let savedCount = 0;
    const savedPins = [];

    for (const pin of pins) {
      try {
        const { data: savedPin, error: insertError } = await supabase
          .from('social_posts')
          .insert({
            tenant_id: TENANT_ID,
            platform: 'pinterest',
            post_type: 'pin',
            content: pin.description,
            title: pin.title,
            hashtags: pin.hashtags || [],
            status: 'draft',
            scheduled_for: new Date(Date.now() + savedCount * 3600000).toISOString(), // Stagger by 1 hour
            metadata: {
              generated_by: 'dan_pinterest_bot',
              content_pillar: pin.content_pillar,
              keywords: pin.keywords,
              link: pin.link,
              board_id: PINTEREST_BOARD_ID,
              template_based: true, // Flag as template (not AI)
              generated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Dan Pinterest] Error saving pin to F&F:', insertError.message);
        } else {
          savedCount++;
          savedPins.push(savedPin);
          console.log(`[Dan Pinterest] ✅ Saved to F&F: "${pin.title}"`);
        }

      } catch (error: any) {
        console.error('[Dan Pinterest] Error processing pin:', error.message);
      }
    }

    // =====================================================================
    // Auto-publish to Pinterest if token configured
    // =====================================================================

    let publishedCount = 0;
    const publishedPins = [];

    if (PINTEREST_ACCESS_TOKEN && PINTEREST_BOARD_ID) {
      console.log('[Dan Pinterest] Pinterest API configured - attempting auto-publish...');

      for (const pin of savedPins) {
        try {
          const publishResult = await publishToPinterest(pin);

          if (publishResult.success) {
            // Mark as published in F&F database
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
            publishedPins.push({
              ...pin,
              pinterest_url: publishResult.url
            });
            console.log(`[Dan Pinterest] ✅ Published to Pinterest: ${publishResult.url}`);
          } else {
            console.error(`[Dan Pinterest] Failed to publish pin: ${publishResult.error}`);
          }

        } catch (error: any) {
          console.error(`[Dan Pinterest] Error publishing pin:`, error.message);
        }
      }
    } else {
      console.log('[Dan Pinterest] Pinterest API not configured - pins saved as drafts');
    }

    // =====================================================================
    // Write to MFS central database (FF_pinterest tag)
    // =====================================================================

    let mfsCount = 0;

    if (publishedCount > 0) {
      console.log('[Dan Pinterest] Writing published pins to MFS central...');

      for (const pin of publishedPins) {
        try {
          const { error: mfsError } = await mfsSupabase
            .from('social_posts')
            .insert({
              source: 'FF_pinterest',
              platform: 'pinterest',
              title: pin.title,
              content: pin.content,
              post_url: pin.metadata.pinterest_url,
              published_at: pin.published_at,
              engagement_metrics: {
                initial_post: true,
                content_pillar: pin.metadata.content_pillar
              },
              metadata: {
                business: 'Frequency & Form',
                template_based: true,
                board_id: PINTEREST_BOARD_ID
              }
            });

          if (mfsError) {
            console.error(`[Dan Pinterest] Error writing to MFS central: ${mfsError.message}`);
          } else {
            mfsCount++;
            console.log(`[Dan Pinterest] ✅ Wrote to MFS central: "${pin.title}"`);
          }

        } catch (error: any) {
          console.error(`[Dan Pinterest] Error writing to MFS:`, error.message);
        }
      }
    }

    // Log bot action
    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: TENANT_ID,
        bot_name: 'dan',
        action_type: 'pinterest_content_generation',
        action_description: `Generated ${pins.length} Pinterest pins using proven templates`,
        status: 'completed',
        metadata: {
          pins_generated: pins.length,
          pins_saved_ff: savedCount,
          pins_published: publishedCount,
          pins_saved_mfs: mfsCount,
          template_based: true,
          cost: '$0 (no AI)',
          timestamp: new Date().toISOString()
        }
      });

    console.log(`[Dan Pinterest] Complete: ${savedCount} saved to F&F, ${publishedCount} published to Pinterest, ${mfsCount} tracked in MFS central`);

    return NextResponse.json({
      success: true,
      data: {
        pins_generated: pins.length,
        pins_saved_ff: savedCount,
        pins_published: publishedCount,
        pins_saved_mfs: mfsCount,
        template_based: true,
        cost: '$0',
        message: publishedCount > 0
          ? `${publishedCount} pins published to Pinterest and tracked in MFS central`
          : 'Pins saved as drafts - configure PINTEREST_ACCESS_TOKEN to auto-publish'
      }
    });

  } catch (error: any) {
    console.error('[Dan Pinterest] Error:', error);

    await supabase
      .from('bot_actions_log')
      .insert({
        tenant_id: TENANT_ID,
        bot_name: 'dan',
        action_type: 'pinterest_content_generation',
        action_description: 'Failed to generate Pinterest pins',
        status: 'failed',
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Publish pin to Pinterest using API v5
 */
async function publishToPinterest(pin: any) {
  if (!PINTEREST_ACCESS_TOKEN || !PINTEREST_BOARD_ID) {
    return {
      success: false,
      error: 'Pinterest API not configured'
    };
  }

  try {
    // Note: Pinterest requires an image URL
    // You'll need to either:
    // 1. Create pin images in Canva and host on Cloudinary
    // 2. Use product photos from your catalog
    // 3. Generate images with AI when budget allows

    const imageUrl = pin.metadata.image_url || 'https://frequencyandform.com/images/default-pin.jpg';

    const response = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        board_id: PINTEREST_BOARD_ID,
        title: pin.title,
        description: pin.content,
        link: pin.metadata.link || 'https://frequencyandform.com',
        media_source: {
          source_type: 'image_url',
          url: imageUrl
        },
        // Optional: F&F brand color
        dominant_color: '#c9a962'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Pinterest API error');
    }

    return {
      success: true,
      pin_id: data.id,
      url: `https://pinterest.com/pin/${data.id}`
    };

  } catch (error: any) {
    console.error('[Pinterest API] Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
