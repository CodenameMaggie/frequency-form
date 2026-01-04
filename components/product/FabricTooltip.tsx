'use client';

import { useState } from 'react';

type FabricType = 'linen' | 'wool' | 'cashmere' | 'silk' | 'cotton' | 'hemp' | 'fur';

type FabricInfo = {
  name: string;
  frequency: string;
  tier: string;
  properties: string;
};

const FABRIC_DATA: Record<FabricType, FabricInfo> = {
  linen: {
    name: 'Linen',
    frequency: '5,000 Hz',
    tier: 'Healing Tier',
    properties: 'Antibacterial, promotes tissue regeneration, highest infrared reflection. Excellent for summer wear.'
  },
  wool: {
    name: 'Wool',
    frequency: '5,000 Hz',
    tier: 'Healing Tier',
    properties: 'Grounding, protective, thermoregulating. Excellent for winter layering. Never blend with linen.'
  },
  cashmere: {
    name: 'Cashmere',
    frequency: '5,000 Hz',
    tier: 'Healing Tier',
    properties: 'Promotes relaxation, emotional stability, luxurious comfort. Ultimate luxury natural fiber.'
  },
  silk: {
    name: 'Silk',
    frequency: '5,000 Hz',
    tier: 'Healing Tier',
    properties: 'Spiritual protection, purity. Frequency can reach 10,000 Hz when unprocessed. Hypoallergenic.'
  },
  cotton: {
    name: 'Organic Cotton',
    frequency: '100 Hz',
    tier: 'Foundation Tier',
    properties: 'Matches human body frequency. Breathable, comfortable, versatile for everyday basics.'
  },
  hemp: {
    name: 'Hemp',
    frequency: '100 Hz',
    tier: 'Foundation Tier',
    properties: 'Durable, sustainable, antibacterial, UV resistant. Softens with each wash.'
  },
  fur: {
    name: 'Natural Fur',
    frequency: '5,000 Hz',
    tier: 'Healing Tier',
    properties: 'Same biological origin as wool and cashmere. Lifespan of 50+ years when cared for properly.'
  }
};

type FabricTooltipProps = {
  fabricType: FabricType;
  children: React.ReactNode;
};

export default function FabricTooltip({ fabricType, children }: FabricTooltipProps) {
  const [isHovering, setIsHovering] = useState(false);
  const fabricInfo = FABRIC_DATA[fabricType];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span className="cursor-help border-b border-dotted border-[rgb(var(--color-text))]">
        {children}
      </span>

      {/* Tooltip */}
      {isHovering && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-4 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] rounded shadow-lg">
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[rgb(var(--color-primary))]" />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif text-lg text-[rgb(var(--color-background))]">
                {fabricInfo.name}
              </h4>
              <span className="text-xs tracking-wider bg-[rgb(var(--color-accent))] text-[rgb(var(--color-primary))] px-2 py-0.5">
                {fabricInfo.frequency}
              </span>
            </div>
            <p className="text-xs text-[rgb(var(--color-background))] opacity-70 mb-2">
              {fabricInfo.tier}
            </p>
            <p className="text-sm text-[rgb(var(--color-background))] opacity-90 leading-relaxed">
              {fabricInfo.properties}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
