/**
 * Frequency & Form - Fabric Frequency Calculator
 * Based on Dr. Heidi Yellen's research
 */

export interface FabricComponent {
  material: string;
  percentage: number;
}

export interface FrequencyResult {
  frequency: number; // In Hz
  tier: 'healing' | 'foundation' | 'depleting' | 'mixed';
  tierName: string;
  isVerified: boolean;
  message: string;
  blocked?: boolean; // True if contains prohibited materials
}

// Fabric frequency mapping from Dr. Heidi Yellen's research
const FABRIC_FREQUENCIES: Record<string, number> = {
  // Healing Tier (5,000 Hz)
  'linen': 5000,
  'wool': 5000,
  'merino wool': 5000,
  'cashmere': 5000,
  'hemp': 5000,
  'silk': 5000,
  'alpaca': 5000,
  'mohair': 5000,
  'angora': 5000,

  // Foundation Tier (100 Hz)
  'organic cotton': 100,
  'cotton': 100, // Treat regular cotton as 100 Hz
  'bamboo': 100, // Natural bamboo fiber

  // Depleting/Prohibited (0-15 Hz)
  'polyester': 15,
  'nylon': 15,
  'acrylic': 15,
  'rayon': 15,
  'spandex': 15,
  'elastane': 15,
  'lycra': 15,
  'viscose': 15,
  'modal': 15,
  'acetate': 15,
};

// Prohibited synthetic materials (auto-reject)
const PROHIBITED_MATERIALS = [
  'polyester',
  'nylon',
  'acrylic',
  'rayon',
  'spandex',
  'elastane',
  'lycra',
  'viscose',
  'modal',
  'acetate',
];

/**
 * Calculate frequency from fabric composition
 */
export function calculateFrequency(components: FabricComponent[]): FrequencyResult {
  // Validate total percentage
  const totalPercentage = components.reduce((sum, c) => sum + c.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.1) {
    return {
      frequency: 0,
      tier: 'mixed',
      tierName: 'Invalid',
      isVerified: false,
      message: `Fabric percentages must add up to 100% (currently ${totalPercentage}%)`,
    };
  }

  // Check for prohibited materials
  const prohibitedFound = components.find(c =>
    PROHIBITED_MATERIALS.includes(c.material.toLowerCase().trim())
  );

  if (prohibitedFound) {
    return {
      frequency: 15,
      tier: 'depleting',
      tierName: 'Prohibited',
      isVerified: true,
      blocked: true,
      message: `This product contains ${prohibitedFound.material}, which measures at the same frequency as diseased tissue (15 Hz). We do not list synthetic materials on Frequency & Form.`,
    };
  }

  // Calculate weighted average frequency
  let weightedFrequency = 0;
  let hasUnknown = false;

  for (const component of components) {
    const materialKey = component.material.toLowerCase().trim();
    const frequency = FABRIC_FREQUENCIES[materialKey];

    if (frequency === undefined) {
      hasUnknown = true;
      continue;
    }

    weightedFrequency += (frequency * component.percentage) / 100;
  }

  if (hasUnknown) {
    return {
      frequency: weightedFrequency,
      tier: 'mixed',
      tierName: 'Unverified',
      isVerified: false,
      message: 'Some materials are not in our frequency database. Please provide seller-verified frequency or contact us for verification.',
    };
  }

  // Determine tier
  let tier: 'healing' | 'foundation' | 'depleting' | 'mixed' = 'mixed';
  let tierName = 'Mixed';
  let message = '';

  if (weightedFrequency >= 5000) {
    tier = 'healing';
    tierName = 'Healing Tier';
    message = `This garment resonates at ${weightedFrequency} Hz - 50× your body's natural frequency. Pure healing energy.`;
  } else if (weightedFrequency >= 100 && weightedFrequency < 5000) {
    // Mixed natural fibers
    if (weightedFrequency >= 2500) {
      tier = 'healing';
      tierName = 'Healing Tier (Blend)';
      message = `This natural fiber blend resonates at ${weightedFrequency.toFixed(0)} Hz, elevating your energy.`;
    } else {
      tier = 'foundation';
      tierName = 'Foundation Tier';
      message = `This garment resonates at ${weightedFrequency.toFixed(0)} Hz, harmonizing with your body's natural frequency.`;
    }
  } else {
    tier = 'depleting';
    tierName = 'Depleting';
    message = `This fabric measures below 100 Hz and may not support optimal energy.`;
  }

  return {
    frequency: Math.round(weightedFrequency),
    tier,
    tierName,
    isVerified: true,
    message,
  };
}

/**
 * Parse fabric composition string into components
 * Example: "95% Organic Cotton, 5% Spandex" -> [{material: 'organic cotton', percentage: 95}, {material: 'spandex', percentage: 5}]
 */
export function parseFabricComposition(compositionString: string): FabricComponent[] {
  const components: FabricComponent[] = [];
  const parts = compositionString.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    const match = trimmed.match(/(\d+(?:\.\d+)?)\s*%?\s*(.+)/);

    if (match) {
      const percentage = parseFloat(match[1]);
      const material = match[2].trim();
      components.push({ material, percentage });
    }
  }

  return components;
}

/**
 * Check if linen and wool are mixed (ancient prohibition)
 */
export function hasLinenWoolMix(components: FabricComponent[]): boolean {
  const hasLinen = components.some(c => c.material.toLowerCase().includes('linen'));
  const hasWool = components.some(c =>
    c.material.toLowerCase().includes('wool') ||
    c.material.toLowerCase().includes('cashmere') ||
    c.material.toLowerCase().includes('merino')
  );

  return hasLinen && hasWool;
}

/**
 * Validate fabric composition meets F&F standards
 */
export function validateFabric(compositionString: string): { valid: boolean; message: string; result?: FrequencyResult } {
  const components = parseFabricComposition(compositionString);

  if (components.length === 0) {
    return { valid: false, message: 'Please provide fabric composition (e.g., "100% Linen" or "95% Cotton, 5% Elastane")' };
  }

  // Check for linen/wool mix
  if (hasLinenWoolMix(components)) {
    return {
      valid: false,
      message: 'Linen and wool cannot be mixed. Their energy flows in opposite directions and cancel to zero.'
    };
  }

  // Calculate frequency
  const result = calculateFrequency(components);

  if (result.blocked) {
    return { valid: false, message: result.message, result };
  }

  if (!result.isVerified) {
    return { valid: false, message: result.message, result };
  }

  return { valid: true, message: result.message, result };
}

/**
 * Get frequency badge color based on tier
 */
export function getFrequencyBadgeColor(tier: string): string {
  switch (tier) {
    case 'healing':
      return 'bg-[#10b981] text-white'; // Green
    case 'foundation':
      return 'bg-[#3b82f6] text-white'; // Blue
    case 'depleting':
      return 'bg-[#ef4444] text-white'; // Red
    default:
      return 'bg-gray-400 text-white'; // Gray
  }
}
