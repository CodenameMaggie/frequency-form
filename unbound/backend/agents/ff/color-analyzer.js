/**
 * FF AI STYLE STUDIO - COLOR ANALYZER AGENT
 *
 * Analyzes skin tone, undertone, and determines personal color season
 * Creates customized color palettes using color theory
 *
 * NO BIG TECH DEPENDENCIES - Uses open-source color analysis
 */

const { createCanvas, loadImage } = require('canvas');
const ColorThief = require('colorthief');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Color season palettes (12 core colors per season)
const SEASON_PALETTES = {
  spring: {
    description: 'Warm, clear, bright colors',
    subtypes: ['light_spring', 'warm_spring', 'clear_spring'],
    best_colors: [
      { name: 'peach', hex: '#FFE5B4', category: 'neutral' },
      { name: 'coral', hex: '#FF7F50', category: 'accent' },
      { name: 'warm_pink', hex: '#FFB6C1', category: 'accent' },
      { name: 'golden_yellow', hex: '#FFD700', category: 'accent' },
      { name: 'aqua', hex: '#7FFFD4', category: 'cool' },
      { name: 'warm_teal', hex: '#008B8B', category: 'cool' },
      { name: 'camel', hex: '#C19A6B', category: 'neutral' },
      { name: 'warm_gray', hex: '#8C8C8C', category: 'neutral' },
      { name: 'ivory', hex: '#FFFFF0', category: 'neutral' },
      { name: 'light_navy', hex: '#4A5568', category: 'dark' },
      { name: 'warm_green', hex: '#8FBC8F', category: 'cool' },
      { name: 'apricot', hex: '#FBCEB1', category: 'accent' }
    ],
    avoid_colors: [
      { name: 'black', hex: '#000000', reason: 'Too harsh' },
      { name: 'cool_pink', hex: '#FF69B4', reason: 'Too cool-toned' },
      { name: 'icy_blue', hex: '#B0E0E6', reason: 'Too icy' }
    ],
    best_metals: ['gold', 'rose_gold', 'brass'],
    avoid_metals: ['silver', 'platinum', 'white_gold']
  },
  summer: {
    description: 'Cool, soft, muted colors',
    subtypes: ['light_summer', 'cool_summer', 'soft_summer'],
    best_colors: [
      { name: 'dusty_rose', hex: '#C4A4A2', category: 'accent' },
      { name: 'lavender', hex: '#E6E6FA', category: 'accent' },
      { name: 'periwinkle', hex: '#CCCCFF', category: 'cool' },
      { name: 'powder_blue', hex: '#B0E0E6', category: 'cool' },
      { name: 'soft_teal', hex: '#81C6D6', category: 'cool' },
      { name: 'mauve', hex: '#E0B0FF', category: 'accent' },
      { name: 'soft_gray', hex: '#D3D3D3', category: 'neutral' },
      { name: 'cocoa', hex: '#87654E', category: 'neutral' },
      { name: 'cool_pink', hex: '#FFB6E1', category: 'accent' },
      { name: 'charcoal', hex: '#36454F', category: 'dark' },
      { name: 'slate_blue', hex: '#6A5ACD', category: 'cool' },
      { name: 'soft_white', hex: '#FAF0E6', category: 'neutral' }
    ],
    avoid_colors: [
      { name: 'orange', hex: '#FF8C00', reason: 'Too warm' },
      { name: 'black', hex: '#000000', reason: 'Too harsh' },
      { name: 'bright_yellow', hex: '#FFFF00', reason: 'Too bright' }
    ],
    best_metals: ['silver', 'platinum', 'white_gold'],
    avoid_metals: ['yellow_gold', 'brass', 'copper']
  },
  autumn: {
    description: 'Warm, deep, muted colors',
    subtypes: ['soft_autumn', 'warm_autumn', 'deep_autumn'],
    best_colors: [
      { name: 'rust', hex: '#B7410E', category: 'accent' },
      { name: 'olive', hex: '#808000', category: 'cool' },
      { name: 'burnt_orange', hex: '#CC5500', category: 'accent' },
      { name: 'terracotta', hex: '#E2725B', category: 'accent' },
      { name: 'forest_green', hex: '#228B22', category: 'cool' },
      { name: 'mustard', hex: '#FFDB58', category: 'accent' },
      { name: 'chocolate', hex: '#7B3F00', category: 'dark' },
      { name: 'warm_beige', hex: '#D9BF77', category: 'neutral' },
      { name: 'brick_red', hex: '#CB4154', category: 'accent' },
      { name: 'teal', hex: '#008080', category: 'cool' },
      { name: 'cream', hex: '#FFFDD0', category: 'neutral' },
      { name: 'coffee', hex: '#6F4E37', category: 'dark' }
    ],
    avoid_colors: [
      { name: 'black', hex: '#000000', reason: 'Too harsh' },
      { name: 'pastel_pink', hex: '#FFD1DC', reason: 'Too light and cool' },
      { name: 'icy_blue', hex: '#99CCFF', reason: 'Too icy' }
    ],
    best_metals: ['gold', 'bronze', 'copper'],
    avoid_metals: ['silver', 'platinum']
  },
  winter: {
    description: 'Cool, clear, bright or deep colors',
    subtypes: ['cool_winter', 'clear_winter', 'deep_winter'],
    best_colors: [
      { name: 'true_black', hex: '#000000', category: 'dark' },
      { name: 'pure_white', hex: '#FFFFFF', category: 'neutral' },
      { name: 'royal_blue', hex: '#4169E1', category: 'cool' },
      { name: 'emerald', hex: '#50C878', category: 'cool' },
      { name: 'magenta', hex: '#FF00FF', category: 'accent' },
      { name: 'icy_pink', hex: '#FF69B4', category: 'accent' },
      { name: 'burgundy', hex: '#800020', category: 'dark' },
      { name: 'navy', hex: '#000080', category: 'dark' },
      { name: 'cool_gray', hex: '#8B8D8E', category: 'neutral' },
      { name: 'bright_red', hex: '#FF0000', category: 'accent' },
      { name: 'purple', hex: '#800080', category: 'accent' },
      { name: 'icy_blue', hex: '#7DF9FF', category: 'cool' }
    ],
    avoid_colors: [
      { name: 'orange', hex: '#FFA500', reason: 'Too warm' },
      { name: 'camel', hex: '#C19A6B', reason: 'Too muted and warm' },
      { name: 'peach', hex: '#FFE5B4', reason: 'Too warm' }
    ],
    best_metals: ['silver', 'platinum', 'white_gold'],
    avoid_metals: ['yellow_gold', 'brass']
  }
};

class ColorAnalyzer {
  constructor() {
    this.colorThief = new ColorThief();
  }

  /**
   * Analyze color profile from face photo
   * @param {Buffer} imageBuffer - Face photo buffer
   * @param {string} userId - User ID
   * @returns {Object} Color analysis results
   */
  async analyzeColors(imageBuffer, userId) {
    try {
      console.log(`[ColorAnalyzer] Starting color analysis for user ${userId}`);

      // Load image
      const image = await loadImage(imageBuffer);

      // Extract dominant colors
      const dominantColors = await this.extractDominantColors(imageBuffer);

      // Analyze skin tone
      const skinAnalysis = this.analyzeSkinTone(dominantColors);

      // Determine color season
      const seasonAnalysis = this.determineColorSeason(skinAnalysis);

      // Get personalized palette
      const personalPalette = this.createPersonalPalette(seasonAnalysis);

      // Get AI color recommendations
      const aiRecommendations = await this.getAIColorRecommendations(skinAnalysis, seasonAnalysis);

      // Save to database
      const savedData = await this.saveColorProfile(userId, skinAnalysis, seasonAnalysis, personalPalette);

      return {
        success: true,
        skinUndertone: skinAnalysis.undertone,
        skinDepth: skinAnalysis.depth,
        colorSeason: seasonAnalysis.season,
        colorSeasonSubtype: seasonAnalysis.subtype,
        bestColors: personalPalette.best,
        avoidColors: personalPalette.avoid,
        bestMetals: personalPalette.metals.best,
        avoidMetals: personalPalette.metals.avoid,
        aiRecommendations,
        data: savedData
      };

    } catch (error) {
      console.error('[ColorAnalyzer] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract dominant colors from image
   */
  async extractDominantColors(imageBuffer) {
    try {
      // Get palette of 8 dominant colors
      const palette = await this.colorThief.getPalette(imageBuffer, 8);

      // Get single dominant color
      const dominant = await this.colorThief.getColor(imageBuffer);

      return {
        dominant: this.rgbToHex(dominant),
        palette: palette.map(rgb => this.rgbToHex(rgb))
      };

    } catch (error) {
      console.error('[ColorAnalyzer] Color extraction error:', error);
      throw error;
    }
  }

  /**
   * Analyze skin tone undertone and depth
   */
  analyzeSkinTone(colors) {
    const dominantRgb = this.hexToRgb(colors.dominant);

    // Calculate undertone (warm vs cool)
    const r = dominantRgb.r;
    const g = dominantRgb.g;
    const b = dominantRgb.b;

    // Warm undertones have more red/yellow
    // Cool undertones have more blue/pink
    const warmScore = (r + (255 - b)) / 2;
    const coolScore = (b + (255 - r)) / 2;
    const neutralThreshold = 20;

    let undertone = 'neutral';
    if (Math.abs(warmScore - coolScore) > neutralThreshold) {
      undertone = warmScore > coolScore ? 'warm' : 'cool';
    }

    // Calculate skin depth (fair to deep)
    const brightness = (r + g + b) / 3;

    let depth = 'medium';
    if (brightness >= 200) depth = 'fair';
    else if (brightness >= 170) depth = 'light';
    else if (brightness >= 130) depth = 'medium';
    else if (brightness >= 90) depth = 'tan';
    else depth = 'deep';

    return {
      undertone,
      depth,
      skinHex: colors.dominant,
      warmScore: parseFloat(warmScore.toFixed(2)),
      coolScore: parseFloat(coolScore.toFixed(2)),
      brightness: parseFloat(brightness.toFixed(2))
    };
  }

  /**
   * Determine color season based on undertone and depth
   */
  determineColorSeason(skinAnalysis) {
    const { undertone, depth, warmScore, coolScore } = skinAnalysis;

    let season = 'summer'; // Default
    let subtype = 'soft_summer';
    let confidence = 0.6;

    // Spring: Warm + Light to Medium
    if (undertone === 'warm' && ['fair', 'light', 'medium'].includes(depth)) {
      season = 'spring';
      if (depth === 'fair') subtype = 'light_spring';
      else if (warmScore > 180) subtype = 'warm_spring';
      else subtype = 'clear_spring';
      confidence = 0.8;
    }
    // Summer: Cool + Light to Medium
    else if (undertone === 'cool' && ['fair', 'light', 'medium'].includes(depth)) {
      season = 'summer';
      if (depth === 'fair') subtype = 'light_summer';
      else if (coolScore > 180) subtype = 'cool_summer';
      else subtype = 'soft_summer';
      confidence = 0.8;
    }
    // Autumn: Warm + Medium to Deep
    else if (undertone === 'warm' && ['medium', 'tan', 'deep'].includes(depth)) {
      season = 'autumn';
      if (depth === 'deep') subtype = 'deep_autumn';
      else if (warmScore > 180) subtype = 'warm_autumn';
      else subtype = 'soft_autumn';
      confidence = 0.85;
    }
    // Winter: Cool + Medium to Deep
    else if (undertone === 'cool' && ['medium', 'tan', 'deep'].includes(depth)) {
      season = 'winter';
      if (depth === 'deep') subtype = 'deep_winter';
      else if (coolScore > 180) subtype = 'cool_winter';
      else subtype = 'clear_winter';
      confidence = 0.85;
    }
    // Neutral undertone - go by depth
    else if (undertone === 'neutral') {
      if (['fair', 'light'].includes(depth)) {
        season = 'summer';
        subtype = 'soft_summer';
      } else {
        season = 'autumn';
        subtype = 'soft_autumn';
      }
      confidence = 0.65;
    }

    return {
      season,
      subtype,
      confidence,
      description: SEASON_PALETTES[season].description
    };
  }

  /**
   * Create personalized color palette
   */
  createPersonalPalette(seasonAnalysis) {
    const seasonData = SEASON_PALETTES[seasonAnalysis.season];

    return {
      best: seasonData.best_colors,
      avoid: seasonData.avoid_colors,
      metals: {
        best: seasonData.best_metals,
        avoid: seasonData.avoid_metals
      }
    };
  }

  /**
   * Get AI-powered color recommendations
   */
  async getAIColorRecommendations(skinAnalysis, seasonAnalysis) {
    try {
      const prompt = `You are a professional color consultant. Provide personalized color advice for a client.

Skin Undertone: ${skinAnalysis.undertone}
Skin Depth: ${skinAnalysis.depth}
Color Season: ${seasonAnalysis.season} (${seasonAnalysis.subtype})

Provide:
1. Top 3 colors this client should build their wardrobe around
2. 2 unexpected colors they might not know work for them
3. 1 color combination they should try
4. How to use neutrals effectively

Keep advice concise and specific.`;

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;

    } catch (error) {
      console.error('[ColorAnalyzer] AI recommendations error:', error);
      return SEASON_PALETTES[seasonAnalysis.season].description;
    }
  }

  /**
   * Save color profile to database
   */
  async saveColorProfile(userId, skinAnalysis, seasonAnalysis, palette) {
    try {
      const { data, error } = await supabase
        .from('ff_color_profiles')
        .insert({
          user_id: userId,
          skin_undertone: skinAnalysis.undertone,
          skin_depth: skinAnalysis.depth,
          skin_hex: skinAnalysis.skinHex,
          color_season: seasonAnalysis.season,
          color_season_subtype: seasonAnalysis.subtype,
          best_colors: palette.best,
          avoid_colors: palette.avoid,
          best_metals: palette.metals.best,
          avoid_metals: palette.metals.avoid
        })
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[ColorAnalyzer] Database save error:', error);
      throw error;
    }
  }

  /**
   * Get user's color profile
   */
  async getUserColorProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('ff_color_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[ColorAnalyzer] Get color profile error:', error);
      return null;
    }
  }

  /**
   * Check if a color works for a user
   */
  async checkColorMatch(userId, colorHex) {
    try {
      const profile = await this.getUserColorProfile(userId);
      if (!profile) return { match: false, reason: 'No color profile found' };

      // Check if color is in best colors
      const inBestColors = profile.best_colors.some(c => c.hex.toLowerCase() === colorHex.toLowerCase());
      if (inBestColors) {
        return { match: true, reason: 'This color is in your best colors palette!' };
      }

      // Check if color is in avoid colors
      const inAvoidColors = profile.avoid_colors.some(c => c.hex.toLowerCase() === colorHex.toLowerCase());
      if (inAvoidColors) {
        const avoidColor = profile.avoid_colors.find(c => c.hex.toLowerCase() === colorHex.toLowerCase());
        return { match: false, reason: avoidColor.reason };
      }

      // Calculate color temperature to give advice
      const rgb = this.hexToRgb(colorHex);
      const isWarm = (rgb.r + (255 - rgb.b)) / 2 > (rgb.b + (255 - rgb.r)) / 2;
      const userIsWarm = profile.skin_undertone === 'warm';

      if (isWarm === userIsWarm) {
        return { match: true, reason: `This ${isWarm ? 'warm' : 'cool'} color complements your undertone` };
      } else {
        return { match: false, reason: `This color may clash with your ${profile.skin_undertone} undertone` };
      }

    } catch (error) {
      console.error('[ColorAnalyzer] Color match error:', error);
      return { match: false, reason: 'Error checking color match' };
    }
  }

  // Helper functions
  rgbToHex(rgb) {
    const [r, g, b] = rgb;
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// Export singleton instance
module.exports = new ColorAnalyzer();
