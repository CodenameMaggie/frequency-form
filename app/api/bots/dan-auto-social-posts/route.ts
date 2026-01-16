/**
 * Dan Auto Social Posts Bot
 * Creates social media content for Twitter/LinkedIn/Facebook/Pinterest
 * Template-based - NO AI costs
 * CRON: Daily at 9 AM via Forbes Command
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

const CRON_SECRET = process.env.FORBES_COMMAND_CRON || 'forbes-command-cron-2024';

// Social post templates by category
const POST_TEMPLATES = {
  new_partner: [
    {
      twitter: "Welcome to the F&F family, {brand_name}! Their {specialty} pieces vibrate at 5,000 Hz - the healing frequency. Shop now: {link} #NaturalFibers #SustainableFashion",
      linkedin: "Exciting news! We've partnered with {brand_name}, artisans of exceptional {specialty}. Their commitment to natural fibers aligns perfectly with our mission of bringing healing-tier fabrics to conscious consumers.\n\nDiscover their collection: {link}",
      facebook: "Meet our newest partner: {brand_name}! Known for their beautiful {specialty}, every piece is crafted from natural fibers that resonate at 5,000 Hz.\n\nShop the collection: {link}"
    },
    {
      twitter: "New drop alert! {brand_name} just joined Frequency & Form with stunning {specialty}. Natural fibers only. Always. {link} #LinenLove #ConsciousFashion",
      linkedin: "We're thrilled to announce our partnership with {brand_name}.\n\nTheir {specialty} exemplify what we believe in: quality natural fibers that elevate your energy, not deplete it.\n\nExplore: {link}",
      facebook: "Big news! {brand_name} is now part of the F&F marketplace. Their {specialty} are made from pure natural fibers - no synthetics, ever.\n\nShop: {link}"
    }
  ],
  fabric_education: [
    {
      twitter: "Did you know? Linen vibrates at 5,000 Hz while polyester measures just 10 Hz. What touches your skin matters. Choose natural. #FabricFrequency #NaturalFibers",
      linkedin: "The Science of Fabric Frequency:\n\nIn 2003, Dr. Heidi Yellen discovered that fabrics have measurable electromagnetic frequencies:\n\n- Linen & Wool: 5,000 Hz (Healing)\n- Organic Cotton: 100 Hz (Neutral)\n- Polyester: 10 Hz (Depleting)\n\nYour body resonates at 100 Hz. Choose fabrics that elevate, not deplete.",
      facebook: "Ever wonder why you feel better in certain clothes?\n\nIt's science! Natural fibers like linen vibrate at 5,000 Hz - 50x your body's natural frequency. Synthetics? Just 10-15 Hz.\n\nDress in alignment. Choose natural."
    },
    {
      twitter: "Ancient wisdom meets modern science: Linen and wool should never be worn together. Their frequencies cancel to zero. The ancients knew this. #FabricScience",
      linkedin: "The Linen & Wool Rule:\n\nAncient texts warned against mixing linen and wool. Modern science explains why: these fabrics have opposite energy flows that cancel each other out.\n\nAt Frequency & Form, our AI ensures you never accidentally pair them.",
      facebook: "Fun fact: There's an ancient rule about never wearing linen and wool together. Scientists now know why - their electromagnetic frequencies flow in opposite directions and cancel out!\n\nOur Style Studio keeps track so you don't have to."
    },
    {
      twitter: "Your skin is your largest organ. Every day, it's in contact with fabric for 16+ hours. Make those hours count. Choose natural fibers. #SkinHealth #NaturalFashion",
      linkedin: "Consider this:\n\nYour skin absorbs up to 60% of what it touches. You spend 16+ hours daily in direct contact with fabric.\n\nAre those fabrics elevating your energy or depleting it?\n\nAt F&F, we only carry natural fibers that support your body's natural frequency.",
      facebook: "Your skin absorbs what it touches. You wear clothes 16+ hours a day. Why would you choose synthetic fabrics that vibrate at just 10 Hz when linen vibrates at 5,000 Hz?\n\nDress in alignment with Frequency & Form."
    }
  ],
  style_studio: [
    {
      twitter: "Your perfect color palette exists. Our AI Style Studio finds it in minutes. Body scan + color analysis = clothes that actually work for YOU. Try free: {link}",
      linkedin: "Introducing the F&F AI Style Studio:\n\n1. Body Scan - AI analyzes your proportions\n2. Color Analysis - Discover your seasonal palette\n3. Smart Curation - Pieces matched to YOUR body and colors\n\nNo more guessing. No more returns. Just clothes that work.\n\nTry it: {link}",
      facebook: "Tired of buying clothes that don't quite work?\n\nOur AI Style Studio analyzes your body proportions and skin tone to recommend pieces that actually flatter YOU.\n\n- Body scan in minutes\n- Personal color palette\n- AI-curated recommendations\n\nTry free: {link}"
    },
    {
      twitter: "Stop buying clothes that don't fit. Our AI Style Studio knows your body type, your colors, your style. Curated just for you: {link} #PersonalStylist #AIFashion",
      linkedin: "The future of fashion is personalized.\n\nOur AI Style Studio doesn't just show you clothes - it shows you YOUR clothes. Pieces selected based on:\n\n- Your exact body measurements\n- Your skin undertone and color season\n- Your preferred styles and budget\n\nExperience it: {link}",
      facebook: "What if every piece in your feed was perfect for YOUR body and YOUR colors?\n\nThat's the F&F Style Studio. AI-powered personalization meets natural fiber fashion.\n\nDiscover yours: {link}"
    }
  ],
  seasonal: [
    {
      twitter: "Spring calls for breathable linen. Light, airy, and vibrating at 5,000 Hz. Shop spring essentials: {link} #SpringFashion #LinenSeason",
      linkedin: "Spring Wardrobe Refresh:\n\nAs temperatures rise, your body craves breathable natural fibers. Linen isn't just comfortable - it's scientifically proven to resonate at healing frequencies.\n\nShop our spring collection: {link}",
      facebook: "Spring is linen season! Light, breathable, and naturally antibacterial. Plus, it vibrates at 5,000 Hz - the healing frequency.\n\nRefresh your wardrobe: {link}"
    },
    {
      twitter: "Cashmere season is here. Soft, warm, sustainable - and 5,000 Hz of pure comfort. Shop winter luxe: {link} #CashmereLove #WinterWardrobe",
      linkedin: "Winter Luxury, Naturally:\n\nCashmere isn't just soft - it's one of the highest frequency fabrics you can wear. Sustainable, biodegradable, and incredibly warm.\n\nShop cashmere: {link}",
      facebook: "Nothing beats cashmere in winter. Incredibly soft, naturally warm, and vibrating at healing frequencies.\n\nTreat yourself: {link}"
    }
  ],
  client_model: [
    {
      twitter: "Real customers, real style. Join our Client Model Program and get featured wearing F&F pieces. Apply: {link} #ClientModel #RealFashion",
      linkedin: "Introducing the F&F Client Model Program:\n\nWe believe in real people wearing real clothes. Join our community of style ambassadors and:\n\n- Get featured in our lookbooks\n- Receive exclusive styling sessions\n- Shape future collections with your feedback\n\nApply: {link}",
      facebook: "Want to be featured in our lookbooks? Join the F&F Client Model Program!\n\nReal customers, real bodies, real style. No professional models - just people who love natural fibers.\n\nApply today: {link}"
    }
  ]
};

// Get current season
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

// Select random template from category
function selectTemplate(category: keyof typeof POST_TEMPLATES): { twitter: string; linkedin: string; facebook: string } {
  const templates = POST_TEMPLATES[category];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Replace placeholders in template
function fillTemplate(template: string, data: Record<string, string>): string {
  let filled = template;
  for (const [key, value] of Object.entries(data)) {
    filled = filled.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return filled;
}

export async function POST(request: NextRequest) {
  const supabase = createAdminSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Dan Auto Social Posts] Running...');

    const postsCreated: Array<{
      platform: string;
      category: string;
      content: string;
      status: string;
    }> = [];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://frequencyandform.com';

    // 1. Check for new partners to announce (joined in last 24 hours)
    const { data: newPartners } = await supabase
      .from('ff_partners')
      .select('id, brand_name, specialty, website')
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(3);

    if (newPartners && newPartners.length > 0) {
      for (const partner of newPartners) {
        const template = selectTemplate('new_partner');
        const data = {
          brand_name: partner.brand_name,
          specialty: partner.specialty || 'natural fiber',
          link: `${baseUrl}/partners?ref=${partner.id}`
        };

        // Create posts for each platform
        for (const platform of ['twitter', 'linkedin', 'facebook'] as const) {
          const content = fillTemplate(template[platform], data);

          // Save to database
          await supabase.from('ff_social_posts').insert({
            platform,
            category: 'new_partner',
            content,
            partner_id: partner.id,
            status: 'pending',
            scheduled_for: new Date().toISOString()
          });

          postsCreated.push({
            platform,
            category: 'new_partner',
            content: content.substring(0, 100) + '...',
            status: 'pending'
          });
        }
      }
    }

    // 2. Create daily educational content (rotate through categories)
    const dayOfWeek = new Date().getDay();
    const educationCategories: (keyof typeof POST_TEMPLATES)[] = [
      'fabric_education',  // Sunday
      'style_studio',      // Monday
      'fabric_education',  // Tuesday
      'client_model',      // Wednesday
      'fabric_education',  // Thursday
      'style_studio',      // Friday
      'seasonal'           // Saturday
    ];

    const todayCategory = educationCategories[dayOfWeek];
    const educationTemplate = selectTemplate(todayCategory);
    const educationData = {
      link: todayCategory === 'style_studio'
        ? `${baseUrl}/ff/style-studio?utm_source=social&utm_medium=organic`
        : todayCategory === 'client_model'
        ? `${baseUrl}/partners/apply?utm_source=social&utm_medium=organic`
        : `${baseUrl}/shop?utm_source=social&utm_medium=organic`
    };

    for (const platform of ['twitter', 'linkedin', 'facebook'] as const) {
      const content = fillTemplate(educationTemplate[platform], educationData);

      await supabase.from('ff_social_posts').insert({
        platform,
        category: todayCategory,
        content,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });

      postsCreated.push({
        platform,
        category: todayCategory,
        content: content.substring(0, 100) + '...',
        status: 'pending'
      });
    }

    // 3. Log bot action
    await supabase.from('ff_bot_actions').insert({
      bot_name: 'dan-auto-social-posts',
      action_type: 'social_content_generation',
      status: 'completed',
      details: {
        posts_created: postsCreated.length,
        categories: [...new Set(postsCreated.map(p => p.category))],
        platforms: [...new Set(postsCreated.map(p => p.platform))]
      },
      cost: 0 // No AI costs - template based
    });

    console.log(`[Dan Auto Social Posts] Created ${postsCreated.length} posts`);

    return NextResponse.json({
      success: true,
      data: {
        posts_created: postsCreated.length,
        posts: postsCreated,
        message: `Generated ${postsCreated.length} social posts for review`
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dan Auto Social Posts] Error:', error);
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

    // Get recent posts
    const { data: recentPosts, error } = await supabase
      .from('ff_social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    // Get stats
    const { data: stats } = await supabase
      .from('ff_social_posts')
      .select('status, platform')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const statusCounts = {
      pending: 0,
      published: 0,
      failed: 0
    };

    const platformCounts: Record<string, number> = {};

    if (stats) {
      for (const post of stats) {
        statusCounts[post.status as keyof typeof statusCounts]++;
        platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        recent_posts: recentPosts || [],
        stats_last_7_days: {
          by_status: statusCounts,
          by_platform: platformCounts,
          total: stats?.length || 0
        }
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dan Auto Social Posts] GET Error:', error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
