/**
 * FREQUENCY & FORM - Content Templates
 * Pre-written, proven Pinterest pins and social content
 * NO AI costs - just template rotation
 */

const FABRIC_DATA = {
  linen: { hz: 5000, benefits: ['healing', 'energy boosting', 'antibacterial', 'temperature regulating'] },
  wool: { hz: 5000, benefits: ['grounding', 'moisture wicking', 'naturally flame resistant'] },
  organic_cotton: { hz: 100, benefits: ['breathable', 'soft', 'hypoallergenic'] },
  silk: { hz: 10, benefits: ['luxurious', 'temperature regulating', 'gentle on skin'] },
  polyester: { hz: 0, benefits: [] },
  synthetic: { hz: 0, benefits: [] }
};

const PIN_TEMPLATES = [
  {
    title: "Why Linen Vibrates at 5000 Hz",
    description: "Did you know? Linen fabric measures at 5000 Hz - the same frequency as a healthy human body. This is why you feel so good wearing natural fibers. Synthetic fabrics? 0 Hz. Choose clothes that energize you, not drain you. #LinenClothing #NaturalFibers #FrequencyFashion",
    hashtags: ['#LinenClothing', '#NaturalFibers', '#FrequencyFashion', '#SustainableFashion', '#ConsciousLiving'],
    keywords: ['linen frequency', 'fabric vibration', 'natural fiber clothing'],
    content_pillar: 'fabric_frequency_science',
    link: 'https://frequencyandform.com'
  },
  {
    title: "The Science of Fabric Frequency",
    description: "Dr. Heidi Yellen's research showed that the human body has a signature frequency of 100 Hz when healthy. Wearing fabrics below this can actually lower your energy. Linen and wool at 5000 Hz? They BOOST your frequency. #FabricScience #WellnessWardrobe",
    hashtags: ['#FabricScience', '#WellnessWardrobe', '#EnergyHealing', '#NaturalFibers', '#ConsciousFashion'],
    keywords: ['fabric frequency science', 'wellness clothing', 'energy boosting fabrics'],
    content_pillar: 'fabric_frequency_science',
    link: 'https://frequencyandform.com'
  },
  {
    title: "What You Wear Matters More Than You Think",
    description: "Your clothes are touching your skin 24/7. Linen: 5000 Hz ✨ Wool: 5000 Hz ✨ Organic Cotton: 100 Hz ✓ Polyester: 0 Hz ✗ Upgrade your wardrobe, upgrade your energy. #FrequencyAndForm #NaturalLiving",
    hashtags: ['#FrequencyAndForm', '#NaturalLiving', '#EnergyFashion', '#LinenLife', '#WoolWear'],
    keywords: ['high frequency fabrics', 'energetic clothing', 'natural fiber benefits'],
    content_pillar: 'natural_fiber_education',
    link: 'https://frequencyandform.com'
  },
  {
    title: "Linen: The Ancient Healing Fabric",
    description: "Egyptians wrapped mummies in linen. Priests wore only linen. Why? They knew something we forgot - linen has healing properties science is only now confirming. 5000 Hz of pure, natural energy. #LinenLove #AncientWisdom",
    hashtags: ['#LinenLove', '#AncientWisdom', '#HealingFabrics', '#NaturalHealing', '#LinenClothing'],
    keywords: ['linen healing properties', 'ancient linen', 'healing fabrics'],
    content_pillar: 'european_fashion',
    link: 'https://frequencyandform.com/collections/linen'
  },
  {
    title: "Stop Wearing Dead Fabric",
    description: "Synthetic fabrics measure at 0 Hz - they're energetically dead. Your body has to work harder just to maintain its natural frequency. Switch to linen, wool, or organic cotton and feel the difference. #ConsciousClothing #SlowFashion",
    hashtags: ['#ConsciousClothing', '#SlowFashion', '#NaturalFibers', '#SustainableStyle', '#EnergyHealing'],
    keywords: ['natural vs synthetic fabrics', 'fabric energy', 'conscious fashion'],
    content_pillar: 'sustainable_fashion',
    link: 'https://frequencyandform.com'
  },
  {
    title: "Your Wardrobe is Either Raising or Lowering Your Frequency",
    description: "There's no neutral when it comes to fabric frequency. Every piece you wear either supports your energy or drains it. Linen and wool at 5000 Hz actively boost your vitality. Synthetic fabrics at 0 Hz? Energy vampires. #FrequencyFashion #EnergeticClothing",
    hashtags: ['#FrequencyFashion', '#EnergeticClothing', '#LinenLife', '#NaturalFibers', '#WellnessWardrobe'],
    keywords: ['frequency raising fabrics', 'energetic clothing', 'vitality fashion'],
    content_pillar: 'fabric_frequency_science',
    link: 'https://frequencyandform.com'
  },
  {
    title: "The 5000 Hz Difference in Your Wardrobe",
    description: "Feel tired in synthetic clothes? Science explains why. Polyester: 0 Hz. Your body: 100 Hz when healthy. Linen: 5000 Hz. The math is simple - wear fabrics that energize you. #NaturalFibers #LinenClothing #FrequencyHealing",
    hashtags: ['#NaturalFibers', '#LinenClothing', '#FrequencyHealing', '#WellnessFashion', '#EnergyClothing'],
    keywords: ['high frequency clothing', 'linen energy', 'fabric wellness'],
    content_pillar: 'fabric_frequency_science',
    link: 'https://frequencyandform.com'
  },
  {
    title: "European Linen: Luxury That Heals",
    description: "Not all linen is created equal. European linen from Belgium and France offers the highest quality at 5000 Hz. Breathable, antibacterial, gets softer with every wash. This is linen that loves you back. #EuropeanLinen #LuxuryLinen #NaturalFabric",
    hashtags: ['#EuropeanLinen', '#LuxuryLinen', '#NaturalFabric', '#BelgianLinen', '#FrenchLinen'],
    keywords: ['European linen', 'luxury natural fabrics', 'Belgian linen'],
    content_pillar: 'european_fashion',
    link: 'https://frequencyandform.com/collections/linen'
  },
  {
    title: "Temperature Regulating Magic of Natural Fibers",
    description: "Linen keeps you cool when it's hot, warm when it's cool. How? 5000 Hz fabric works with your body's natural thermoregulation, not against it. Synthetic fabrics trap heat and moisture. Choose smart. #LinenStyle #NaturalFashion",
    hashtags: ['#LinenStyle', '#NaturalFashion', '#TemperatureRegulating', '#LinenClothing', '#SmartFabric'],
    keywords: ['temperature regulating fabrics', 'linen benefits', 'natural fiber properties'],
    content_pillar: 'natural_fiber_education',
    link: 'https://frequencyandform.com'
  },
  {
    title: "Wool: The Other 5000 Hz Superstar",
    description: "Merino wool vibrates at the same 5000 Hz as linen. Naturally odor-resistant, moisture-wicking, and incredibly soft. No synthetic performance gear needed when you have wool. Nature got it right. #MerinoWool #NaturalPerformance #WoolClothing",
    hashtags: ['#MerinoWool', '#NaturalPerformance', '#WoolClothing', '#SustainableFashion', '#HighFrequencyFabric'],
    keywords: ['merino wool benefits', 'wool frequency', 'natural performance fabric'],
    content_pillar: 'natural_fiber_education',
    link: 'https://frequencyandform.com/collections/wool'
  }
];

const PRODUCT_DESCRIPTIONS = {
  linen_dress: "Crafted from 100% European linen (5000 Hz), this dress doesn't just look beautiful - it actively supports your body's natural energy. Breathable, antibacterial, and temperature-regulating. Feel the frequency difference.",
  linen_shirt: "Pure linen at 5000 Hz meets timeless design. This shirt keeps you cool when it's hot, warm when it's cool, and energized all day. The fabric your body has been craving.",
  wool_sweater: "Merino wool vibrating at 5000 Hz - the same frequency as linen. Naturally moisture-wicking, odor-resistant, and incredibly soft. Luxury that loves you back.",
  linen_pants: "European linen at its finest. 5000 Hz frequency supports your body's natural energy while you move through your day. Sophisticated, breathable, and endlessly versatile.",
  linen_top: "Lightweight European linen (5000 Hz) that gets softer with every wash. The antibacterial properties mean you stay fresh all day. Elevate your energy, elevate your style."
};

const INSTAGRAM_CAPTIONS = [
  "Your wardrobe is either raising your frequency or lowering it. There's no neutral. 💫\n\nLinen: 5000 Hz\nWool: 5000 Hz\nOrganic Cotton: 100 Hz\nPolyester: 0 Hz\n\nChoose wisely. #FrequencyAndForm #LinenLife #NaturalFibers",
  "POV: You stopped wearing synthetic fabrics and suddenly have more energy than you've had in years 🌿\n\n#LinenDress #NaturalLiving #FrequencyFashion",
  "The ancient Egyptians knew. The science now confirms. Linen heals. ✨\n\n5000 Hz of pure, natural frequency in every thread. #LinenLove #ConsciousClothing",
  "Why you feel exhausted in your polyester workout clothes:\n\nYour body: 100 Hz\nPolyester: 0 Hz\n\nYour body literally has to work harder just to maintain its frequency. Switch to natural fibers and feel the difference. 🌱"
];

/**
 * Get next pin template (rotates through all templates)
 * @param {number} dayIndex - Day-based index for rotation
 * @returns {object} Pin template
 */
function getPinTemplate(dayIndex) {
  const index = dayIndex % PIN_TEMPLATES.length;
  return PIN_TEMPLATES[index];
}

/**
 * Get multiple pin templates for batch generation
 * @param {number} count - Number of pins to generate
 * @param {number} startIndex - Starting index for rotation
 * @returns {array} Array of pin templates
 */
function getPinTemplates(count = 3, startIndex = 0) {
  const pins = [];
  for (let i = 0; i < count; i++) {
    const index = (startIndex + i) % PIN_TEMPLATES.length;
    pins.push(PIN_TEMPLATES[index]);
  }
  return pins;
}

/**
 * Get product description template
 * @param {string} type - Product type
 * @returns {string} Product description
 */
function getProductDescription(type) {
  return PRODUCT_DESCRIPTIONS[type] || PRODUCT_DESCRIPTIONS.linen_dress;
}

/**
 * Get Instagram caption
 * @param {number} index - Caption index
 * @returns {string} Instagram caption
 */
function getInstagramCaption(index = 0) {
  const captionIndex = index % INSTAGRAM_CAPTIONS.length;
  return INSTAGRAM_CAPTIONS[captionIndex];
}

module.exports = {
  FABRIC_DATA,
  PIN_TEMPLATES,
  PRODUCT_DESCRIPTIONS,
  INSTAGRAM_CAPTIONS,
  getPinTemplate,
  getPinTemplates,
  getProductDescription,
  getInstagramCaption
};
