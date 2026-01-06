/**
 * FF AI STYLE STUDIO - BODY ANALYZER AGENT
 *
 * Uses TensorFlow.js + PoseNet to analyze body measurements from photos
 * Determines body type and provides silhouette recommendations
 *
 * NO BIG TECH DEPENDENCIES - Runs locally with open-source models
 */

const tf = require('@tensorflow/tfjs-node');
const posenet = require('@tensorflow-models/posenet');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Anthropic (for text analysis)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Body type silhouette recommendations
const BODY_TYPE_RECOMMENDATIONS = {
  hourglass: {
    best_silhouettes: ['wrap', 'fit_and_flare', 'belted', 'bodycon', 'sheath'],
    avoid_silhouettes: ['boxy', 'shapeless', 'empire_waist'],
    description: 'Balanced bust and hips with defined waist',
    styling_tips: 'Emphasize your waist, choose fitted styles that follow your natural curves'
  },
  pear: {
    best_silhouettes: ['a-line', 'fit_and_flare', 'empire_waist', 'boat_neck', 'off_shoulder'],
    avoid_silhouettes: ['pencil_skirt', 'skinny_leg', 'drop_waist'],
    description: 'Hips wider than bust, defined waist',
    styling_tips: 'Draw attention upward with interesting necklines, balance proportions with A-line bottoms'
  },
  apple: {
    best_silhouettes: ['empire_waist', 'v_neck', 'a_line', 'wrap', 'tunic'],
    avoid_silhouettes: ['crop_tops', 'bodycon', 'belted_waist'],
    description: 'Broader shoulders and bust, less defined waist',
    styling_tips: 'Create vertical lines with V-necks, empire waists draw eye up and away from midsection'
  },
  rectangle: {
    best_silhouettes: ['peplum', 'belted', 'fit_and_flare', 'ruched', 'tiered'],
    avoid_silhouettes: ['straight_shift', 'boxy', 'shapeless'],
    description: 'Bust, waist, and hips similar measurements',
    styling_tips: 'Create curves with belts, peplums, and strategic ruching'
  },
  inverted_triangle: {
    best_silhouettes: ['a_line', 'wide_leg_pants', 'full_skirt', 'scoop_neck', 'v_neck'],
    avoid_silhouettes: ['boat_neck', 'off_shoulder', 'shoulder_pads', 'skinny_leg'],
    description: 'Broader shoulders than hips',
    styling_tips: 'Balance proportions with volume on bottom, minimize shoulder emphasis'
  }
};

class BodyAnalyzer {
  constructor() {
    this.model = null;
  }

  /**
   * Initialize PoseNet model
   */
  async initialize() {
    if (!this.model) {
      console.log('[BodyAnalyzer] Loading PoseNet model...');
      this.model = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
      });
      console.log('[BodyAnalyzer] PoseNet model loaded successfully');
    }
    return this.model;
  }

  /**
   * Analyze body from image buffer
   * @param {Buffer} imageBuffer - Image buffer (from upload)
   * @param {string} userId - User ID
   * @param {number} heightInches - User's height in inches
   * @returns {Object} Body analysis results
   */
  async analyzeBody(imageBuffer, userId, heightInches) {
    try {
      console.log(`[BodyAnalyzer] Starting analysis for user ${userId}`);

      // Ensure model is loaded
      await this.initialize();

      // Decode image
      const imageTensor = tf.node.decodeImage(imageBuffer, 3);

      // Run PoseNet
      const pose = await this.model.estimateSinglePose(imageTensor, {
        flipHorizontal: false
      });

      // Extract keypoints
      const keypoints = this.extractKeypoints(pose.keypoints);

      // Calculate measurements
      const measurements = this.calculateMeasurements(keypoints, heightInches);

      // Determine body type
      const bodyTypeAnalysis = this.determineBodyType(measurements);

      // Get AI styling recommendations
      const aiRecommendations = await this.getAIRecommendations(measurements, bodyTypeAnalysis);

      // Save to database
      const savedData = await this.saveMeasurements(userId, measurements, bodyTypeAnalysis, aiRecommendations);

      // Clean up tensor
      imageTensor.dispose();

      return {
        success: true,
        measurements,
        bodyType: bodyTypeAnalysis.bodyType,
        confidence: bodyTypeAnalysis.confidence,
        recommendations: aiRecommendations,
        data: savedData
      };

    } catch (error) {
      console.error('[BodyAnalyzer] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract relevant keypoints from PoseNet output
   */
  extractKeypoints(allKeypoints) {
    const keypointMap = {};

    allKeypoints.forEach(kp => {
      if (kp.score > 0.5) { // Only use confident detections
        keypointMap[kp.part] = {
          x: kp.position.x,
          y: kp.position.y,
          score: kp.score
        };
      }
    });

    return keypointMap;
  }

  /**
   * Calculate body measurements from keypoints
   * Uses pixel distances and user's height for calibration
   */
  calculateMeasurements(keypoints, heightInches) {
    // Calculate pixel-to-inch ratio using height
    const headY = keypoints.nose?.y || keypoints.leftEye?.y || 0;
    const feetY = Math.max(keypoints.leftAnkle?.y || 0, keypoints.rightAnkle?.y || 0);
    const bodyHeightPixels = Math.abs(feetY - headY);
    const pixelToInchRatio = heightInches / bodyHeightPixels;

    // Shoulder width
    const shoulderWidth = keypoints.leftShoulder && keypoints.rightShoulder
      ? Math.abs(keypoints.leftShoulder.x - keypoints.rightShoulder.x) * pixelToInchRatio
      : null;

    // Hip width (using hip keypoints)
    const hipWidth = keypoints.leftHip && keypoints.rightHip
      ? Math.abs(keypoints.leftHip.x - keypoints.rightHip.x) * pixelToInchRatio
      : null;

    // Torso length (shoulder to hip)
    const torsoLength = keypoints.leftShoulder && keypoints.leftHip
      ? Math.abs(keypoints.leftShoulder.y - keypoints.leftHip.y) * pixelToInchRatio
      : null;

    // Estimate bust (shoulder width * 1.4 - typical ratio)
    const bust = shoulderWidth ? shoulderWidth * 1.4 : null;

    // Estimate waist (using natural waist position - midpoint between shoulder and hip)
    const waist = shoulderWidth && hipWidth ? (shoulderWidth + hipWidth) / 2 * 0.7 : null;

    // Estimate hips (hip width * 1.5 - typical ratio for full hip circumference)
    const hips = hipWidth ? hipWidth * 1.5 : null;

    // Arm length (shoulder to wrist)
    const armLength = keypoints.leftShoulder && keypoints.leftWrist
      ? Math.sqrt(
          Math.pow(keypoints.leftWrist.x - keypoints.leftShoulder.x, 2) +
          Math.pow(keypoints.leftWrist.y - keypoints.leftShoulder.y, 2)
        ) * pixelToInchRatio
      : null;

    // Inseam (hip to ankle)
    const inseam = keypoints.leftHip && keypoints.leftAnkle
      ? Math.abs(keypoints.leftHip.y - keypoints.leftAnkle.y) * pixelToInchRatio
      : null;

    return {
      bust: bust ? parseFloat(bust.toFixed(2)) : null,
      waist: waist ? parseFloat(waist.toFixed(2)) : null,
      hips: hips ? parseFloat(hips.toFixed(2)) : null,
      shoulder_width: shoulderWidth ? parseFloat(shoulderWidth.toFixed(2)) : null,
      arm_length: armLength ? parseFloat(armLength.toFixed(2)) : null,
      inseam: inseam ? parseFloat(inseam.toFixed(2)) : null,
      torso_length: torsoLength ? parseFloat(torsoLength.toFixed(2)) : null,
      height_inches: heightInches
    };
  }

  /**
   * Determine body type from measurements
   */
  determineBodyType(measurements) {
    const { bust, waist, hips } = measurements;

    if (!bust || !waist || !hips) {
      return {
        bodyType: 'unknown',
        confidence: 0,
        reason: 'Insufficient measurements'
      };
    }

    // Calculate ratios
    const bustToWaist = bust / waist;
    const hipToWaist = hips / waist;
    const bustToHip = bust / hips;
    const shoulderToHip = measurements.shoulder_width / (hips / 1.5); // Convert hips back to width

    let bodyType = 'rectangle';
    let confidence = 0.5;
    let reason = '';

    // Hourglass: Bust and hips similar, waist significantly smaller
    if (Math.abs(bust - hips) <= 2 && bustToWaist >= 1.25 && hipToWaist >= 1.25) {
      bodyType = 'hourglass';
      confidence = 0.85;
      reason = 'Balanced bust and hips with defined waist';
    }
    // Pear: Hips larger than bust, defined waist
    else if (hips - bust >= 2 && hipToWaist >= 1.2) {
      bodyType = 'pear';
      confidence = 0.8;
      reason = 'Hips wider than bust with defined waist';
    }
    // Inverted Triangle: Shoulders/bust larger than hips
    else if (bust - hips >= 2 || shoulderToHip >= 1.15) {
      bodyType = 'inverted_triangle';
      confidence = 0.8;
      reason = 'Broader shoulders and bust than hips';
    }
    // Apple: Bust larger than hips, less defined waist
    else if (bust >= hips && bustToWaist < 1.2) {
      bodyType = 'apple';
      confidence = 0.75;
      reason = 'Fuller midsection with less defined waist';
    }
    // Rectangle: All measurements similar
    else if (Math.abs(bust - waist) <= 5 && Math.abs(waist - hips) <= 5) {
      bodyType = 'rectangle';
      confidence = 0.7;
      reason = 'Bust, waist, and hips are similar measurements';
    }

    const recommendations = BODY_TYPE_RECOMMENDATIONS[bodyType];

    return {
      bodyType,
      confidence,
      reason,
      recommendedSilhouettes: recommendations.best_silhouettes,
      silhouettesToAvoid: recommendations.avoid_silhouettes,
      stylingTips: recommendations.styling_tips
    };
  }

  /**
   * Get AI-powered styling recommendations
   */
  async getAIRecommendations(measurements, bodyTypeAnalysis) {
    try {
      const prompt = `You are a professional personal stylist. Analyze these body measurements and provide personalized styling advice.

Body Type: ${bodyTypeAnalysis.bodyType}
Measurements:
- Bust: ${measurements.bust}"
- Waist: ${measurements.waist}"
- Hips: ${measurements.hips}"
- Height: ${measurements.height_inches}"

Provide 3-5 specific styling tips for this body type that go beyond the basics. Focus on:
1. Specific garment details (necklines, sleeve types, hem lengths)
2. Fabric choices that flatter
3. Color placement strategies
4. Proportion tricks

Keep each tip concise (1-2 sentences).`;

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return message.content[0].text;

    } catch (error) {
      console.error('[BodyAnalyzer] AI recommendations error:', error);
      return bodyTypeAnalysis.stylingTips;
    }
  }

  /**
   * Save measurements to database
   */
  async saveMeasurements(userId, measurements, bodyTypeAnalysis, aiRecommendations) {
    try {
      const { data, error } = await supabase
        .from('ff_body_measurements')
        .insert({
          user_id: userId,
          bust: measurements.bust,
          waist: measurements.waist,
          hips: measurements.hips,
          shoulder_width: measurements.shoulder_width,
          arm_length: measurements.arm_length,
          inseam: measurements.inseam,
          torso_length: measurements.torso_length,
          height_inches: measurements.height_inches,
          body_type: bodyTypeAnalysis.bodyType,
          body_type_confidence: bodyTypeAnalysis.confidence,
          recommended_silhouettes: bodyTypeAnalysis.recommendedSilhouettes,
          silhouettes_to_avoid: bodyTypeAnalysis.silhouettesToAvoid,
          source: 'photo_scan'
        })
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[BodyAnalyzer] Database save error:', error);
      throw error;
    }
  }

  /**
   * Get user's latest body measurements
   */
  async getUserMeasurements(userId) {
    try {
      const { data, error } = await supabase
        .from('ff_body_measurements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('[BodyAnalyzer] Get measurements error:', error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new BodyAnalyzer();
