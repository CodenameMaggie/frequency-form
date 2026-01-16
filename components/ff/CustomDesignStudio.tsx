'use client';

/**
 * F&F Custom Design Studio
 * Visual garment customizer for made-to-measure pieces
 */

import { useState, useEffect } from 'react';

interface CustomizableOption {
  options: (string | boolean)[];
  default: string | boolean;
  price_adj?: Record<string, number>;
}

interface Design {
  id: string;
  name: string;
  slug: string;
  collection: string;
  category: string;
  garment_type: string;
  description: string;
  design_story: string;
  silhouette: string;
  fit: string;
  best_for_body_types: string[];
  best_for_torso: string;
  best_for_occasions: string[];
  customizable_options: Record<string, CustomizableOption>;
  base_price: number;
  complexity: string;
  featured?: boolean;
  bestseller?: boolean;
}

interface Fabric {
  id: string;
  name: string;
  type: string;
  price_per_yard: number;
  frequency_hz: number;
  available_colors: Array<{ name: string; hex: string }>;
}

interface BodyMeasurements {
  bust: string;
  waist: string;
  hips: string;
  height_feet: string;
  height_inches: string;
  body_type?: string;
  torso_type?: string;
}

interface ColorProfile {
  color_season: string;
  best_colors: Array<{ hex: string; name: string }>;
}

interface CustomDesignStudioProps {
  bodyMeasurements: BodyMeasurements | null;
  colorProfile: ColorProfile | null;
  onOrderComplete?: (order: any) => void;
}

// Sample fabrics
const FABRICS: Fabric[] = [
  {
    id: 'fab-1',
    name: 'Irish Linen Premium',
    type: 'linen',
    price_per_yard: 45.00,
    frequency_hz: 5000,
    available_colors: [
      { name: 'Natural', hex: '#E8DCC8' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#1B2951' },
      { name: 'Sage', hex: '#9CAF88' },
      { name: 'Blush', hex: '#E8C4C4' }
    ]
  },
  {
    id: 'fab-2',
    name: 'Mulberry Silk Charmeuse',
    type: 'silk',
    price_per_yard: 85.00,
    frequency_hz: 4500,
    available_colors: [
      { name: 'Champagne', hex: '#F7E7CE' },
      { name: 'Ivory', hex: '#FFFFF0' },
      { name: 'Black', hex: '#000000' },
      { name: 'Rose', hex: '#E8B4B8' },
      { name: 'Forest', hex: '#2E4A3E' }
    ]
  },
  {
    id: 'fab-3',
    name: 'Organic Cotton Sateen',
    type: 'cotton',
    price_per_yard: 28.00,
    frequency_hz: 3500,
    available_colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Cream', hex: '#FFFDD0' },
      { name: 'Navy', hex: '#1B2951' },
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Dusty Rose', hex: '#DCAE96' }
    ]
  },
  {
    id: 'fab-4',
    name: 'Merino Wool Fine',
    type: 'wool',
    price_per_yard: 65.00,
    frequency_hz: 4800,
    available_colors: [
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Navy', hex: '#1B2951' },
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Forest', hex: '#1E3D33' },
      { name: 'Burgundy', hex: '#722F37' }
    ]
  }
];

export default function CustomDesignStudio({ bodyMeasurements, colorProfile, onOrderComplete }: CustomDesignStudioProps) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [customizations, setCustomizations] = useState<Record<string, string | boolean>>({});
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [step, setStep] = useState<'browse' | 'customize' | 'fabric' | 'review'>('browse');
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      const res = await fetch('/api/ff/custom-designs');
      const data = await res.json();
      setDesigns(data.designs || []);
    } catch (error) {
      console.error('Error loading designs:', error);
    }
    setLoading(false);
  };

  const selectDesign = (design: Design) => {
    setSelectedDesign(design);
    // Initialize customizations with defaults
    const defaults: Record<string, string | boolean> = {};
    Object.entries(design.customizable_options).forEach(([key, option]) => {
      defaults[key] = option.default;
    });
    setCustomizations(defaults);
    setStep('customize');
  };

  const calculatePrice = () => {
    if (!selectedDesign) return 0;

    let price = selectedDesign.base_price;

    // Add customization fees
    Object.entries(customizations).forEach(([key, value]) => {
      const option = selectedDesign.customizable_options[key];
      if (option?.price_adj && option.price_adj[String(value)]) {
        price += option.price_adj[String(value)];
      }
    });

    // Add fabric cost (estimated 3 yards for dress, 2 for top, etc.)
    if (selectedFabric) {
      const yardsNeeded = selectedDesign.category === 'dresses' ? 3 :
                          selectedDesign.category === 'outerwear' ? 4 :
                          selectedDesign.category === 'bottoms' ? 2 : 1.5;
      price += selectedFabric.price_per_yard * yardsNeeded;
    }

    return price;
  };

  const getLeadTime = () => {
    if (!selectedDesign) return '3-4 weeks';
    switch (selectedDesign.complexity) {
      case 'simple': return '2-3 weeks';
      case 'moderate': return '3-4 weeks';
      case 'complex': return '4-5 weeks';
      default: return '3-4 weeks';
    }
  };

  const isRecommendedForUser = (design: Design) => {
    if (!bodyMeasurements?.body_type) return false;
    return design.best_for_body_types.includes(bodyMeasurements.body_type);
  };

  const isTorsoMatch = (design: Design) => {
    if (!bodyMeasurements?.torso_type) return false;
    return design.best_for_torso === bodyMeasurements.torso_type || design.best_for_torso === 'all';
  };

  const filteredDesigns = designs.filter(d =>
    selectedCollection === 'all' || d.collection === selectedCollection
  );

  // Browse Designs
  if (step === 'browse') {
    return (
      <div>
        {/* Header */}
        <div className="bg-white p-6 rounded-xl border border-[#f5f3ee] mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#c8b28a]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-[#c8b28a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-xl text-[#1f2937]">F&F Custom Collection</h3>
              <p className="text-sm text-[#6b7280]">Made-to-measure pieces, crafted by skilled seamstresses in natural, high-frequency fabrics</p>
            </div>
          </div>
        </div>

        {/* Collection Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'essentials', 'elevated', 'signature'].map(collection => (
            <button
              key={collection}
              onClick={() => setSelectedCollection(collection)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors capitalize ${
                selectedCollection === collection
                  ? 'bg-[#1f2937] text-white'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#c8b28a]'
              }`}
            >
              {collection === 'all' ? 'All Designs' : collection}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[#c8b28a] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#6b7280]">Loading F&F Collection...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigns.map(design => (
              <div
                key={design.id}
                onClick={() => selectDesign(design)}
                className={`bg-white rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                  isRecommendedForUser(design) ? 'border-[#c8b28a]' : 'border-[#f5f3ee]'
                }`}
              >
                {/* Preview placeholder */}
                <div className="aspect-[3/4] bg-gradient-to-b from-[#f5f3ee] to-[#e5e7eb] relative">
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {isRecommendedForUser(design) && (
                      <span className="px-2 py-1 bg-[#c8b28a] text-white text-xs rounded">
                        Perfect for You
                      </span>
                    )}
                    {isTorsoMatch(design) && bodyMeasurements?.torso_type !== 'average' && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                        {bodyMeasurements?.torso_type === 'short' ? 'Short Torso Friendly' : 'Long Torso Friendly'}
                      </span>
                    )}
                    {design.bestseller && (
                      <span className="px-2 py-1 bg-[#1f2937] text-white text-xs rounded">
                        Bestseller
                      </span>
                    )}
                  </div>

                  {/* Collection badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs rounded capitalize ${
                      design.collection === 'signature' ? 'bg-purple-100 text-purple-700' :
                      design.collection === 'elevated' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {design.collection}
                    </span>
                  </div>

                  {/* Garment silhouette placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-24 h-24 mx-auto text-[#c8b28a]/30" fill="currentColor" viewBox="0 0 24 24">
                        {design.category === 'dresses' ? (
                          <path d="M12 2L8 6V8L6 10V22H18V10L16 8V6L12 2ZM10 8H14V10H10V8Z" />
                        ) : design.category === 'tops' ? (
                          <path d="M12 2L6 6V14H18V6L12 2ZM10 8H14V10H10V8Z" />
                        ) : design.category === 'bottoms' ? (
                          <path d="M8 4H16V8L18 22H14L12 12L10 22H6L8 8V4Z" />
                        ) : (
                          <path d="M12 2L4 8V22H20V8L12 2ZM10 10H14V14H10V10Z" />
                        )}
                      </svg>
                      <span className="text-sm text-[#9ca3af] capitalize mt-2 block">{design.silhouette.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-serif text-lg text-[#1f2937] mb-1">{design.name}</h3>
                  <p className="text-sm text-[#6b7280] mb-3 line-clamp-2">{design.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-medium text-[#1f2937]">From ${design.base_price}</span>
                      <span className="text-xs text-[#9ca3af] block">Made to measure</span>
                    </div>
                    <button className="px-3 py-1.5 bg-[#1f2937] text-white text-sm rounded hover:bg-[#374151] transition-colors">
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Customize Design
  if (step === 'customize' && selectedDesign) {
    return (
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="bg-white rounded-xl p-6 border border-[#f5f3ee]">
          <div className="aspect-[3/4] bg-gradient-to-b from-[#f5f3ee] to-[#e5e7eb] rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <svg className="w-32 h-32 mx-auto text-[#c8b28a]/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L6 6V14H8V22H16V14H18V6L12 2Z" />
              </svg>
              <p className="text-[#9ca3af] mt-2">Design Preview</p>
            </div>
          </div>

          {/* Current selections summary */}
          <div className="bg-[#f5f3ee] rounded-lg p-4">
            <h4 className="text-sm font-medium text-[#1f2937] mb-2">Your Selections</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(customizations).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-[#6b7280] capitalize">{key.replace('_', ' ')}:</span>
                  <span className="text-[#1f2937] capitalize">{String(value).replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-2xl text-[#1f2937]">{selectedDesign.name}</h3>
              <p className="text-[#6b7280]">Customize your design</p>
            </div>
            <button
              onClick={() => { setStep('browse'); setSelectedDesign(null); }}
              className="text-[#c8b28a] hover:text-[#1f2937]"
            >
              ← Back
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(selectedDesign.customizable_options).map(([key, option]) => (
              <div key={key} className="bg-white rounded-lg p-4 border border-[#f5f3ee]">
                <label className="block text-sm font-medium text-[#1f2937] mb-3 capitalize">
                  {key.replace('_', ' ')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {option.options.map((opt) => {
                    const optValue = String(opt);
                    const isSelected = String(customizations[key]) === optValue;
                    const priceAdj = option.price_adj?.[optValue];

                    return (
                      <button
                        key={optValue}
                        onClick={() => setCustomizations({ ...customizations, [key]: opt })}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-[#1f2937] text-white'
                            : 'bg-[#f5f3ee] text-[#6b7280] hover:bg-[#e5e7eb]'
                        }`}
                      >
                        <span className="capitalize">{optValue === 'true' ? 'Yes' : optValue === 'false' ? 'No' : optValue.replace('_', ' ')}</span>
                        {priceAdj && priceAdj > 0 && (
                          <span className="ml-1 text-xs opacity-75">+${priceAdj}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Price summary */}
          <div className="mt-6 bg-[#1f2937] text-white rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-[#c8b28a]">Current Price</div>
                <div className="text-2xl font-medium">${calculatePrice().toFixed(2)}</div>
                <div className="text-xs text-white/60">(fabric not yet selected)</div>
              </div>
              <button
                onClick={() => setStep('fabric')}
                className="px-6 py-3 bg-[#c8b28a] text-[#1f2937] rounded-lg font-medium hover:bg-[#d4c4a0] transition-colors"
              >
                Choose Fabric →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Select Fabric
  if (step === 'fabric' && selectedDesign) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-2xl text-[#1f2937]">Choose Your Fabric</h3>
            <p className="text-[#6b7280]">Select from our high-frequency natural fabrics</p>
          </div>
          <button
            onClick={() => setStep('customize')}
            className="text-[#c8b28a] hover:text-[#1f2937]"
          >
            ← Back to Design
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {FABRICS.map(fabric => (
            <div
              key={fabric.id}
              onClick={() => { setSelectedFabric(fabric); setSelectedColor(null); }}
              className={`bg-white rounded-xl p-6 border-2 cursor-pointer transition-all ${
                selectedFabric?.id === fabric.id ? 'border-[#c8b28a] ring-2 ring-[#c8b28a]/20' : 'border-[#f5f3ee] hover:border-[#c8b28a]'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-[#1f2937]">{fabric.name}</h4>
                  <p className="text-sm text-[#6b7280] capitalize">{fabric.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium text-[#1f2937]">${fabric.price_per_yard}/yd</div>
                  <div className="flex items-center gap-1 text-xs text-[#c8b28a]">
                    <span>~</span>
                    <span>{fabric.frequency_hz} Hz</span>
                  </div>
                </div>
              </div>

              {/* Color swatches */}
              <div>
                <p className="text-xs text-[#9ca3af] mb-2">Available Colors</p>
                <div className="flex gap-2 flex-wrap">
                  {fabric.available_colors.map(color => (
                    <button
                      key={color.hex}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFabric(fabric);
                        setSelectedColor(color.hex);
                      }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedFabric?.id === fabric.id && selectedColor === color.hex
                          ? 'border-[#1f2937] ring-2 ring-[#c8b28a]'
                          : 'border-[#e5e7eb] hover:border-[#c8b28a]'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {selectedFabric?.id === fabric.id && selectedColor && (
                <div className="mt-4 pt-4 border-t border-[#f5f3ee]">
                  <p className="text-sm text-[#1f2937]">
                    Selected: <span className="font-medium">{fabric.available_colors.find(c => c.hex === selectedColor)?.name}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Continue button */}
        <div className="bg-[#1f2937] text-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-[#c8b28a]">Total Price</div>
              <div className="text-2xl font-medium">${calculatePrice().toFixed(2)}</div>
              <div className="text-xs text-white/60">Estimated delivery: {getLeadTime()}</div>
            </div>
            <button
              onClick={() => setStep('review')}
              disabled={!selectedFabric || !selectedColor}
              className="px-6 py-3 bg-[#c8b28a] text-[#1f2937] rounded-lg font-medium hover:bg-[#d4c4a0] transition-colors disabled:opacity-50"
            >
              Review Order →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review Order
  if (step === 'review' && selectedDesign && selectedFabric) {
    const colorName = selectedFabric.available_colors.find(c => c.hex === selectedColor)?.name;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="font-serif text-2xl text-[#1f2937] mb-2">Review Your Custom Order</h3>
          <p className="text-[#6b7280]">Made-to-measure, just for you</p>
        </div>

        <div className="bg-white rounded-xl border border-[#f5f3ee] overflow-hidden mb-6">
          {/* Design summary */}
          <div className="p-6 border-b border-[#f5f3ee]">
            <div className="flex items-start gap-4">
              <div className="w-24 h-32 bg-[#f5f3ee] rounded-lg flex items-center justify-center">
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: selectedColor || '#f5f3ee' }}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-serif text-xl text-[#1f2937]">{selectedDesign.name}</h4>
                <p className="text-sm text-[#6b7280] capitalize">{selectedDesign.collection} Collection</p>
                <div className="mt-2 text-sm">
                  <span className="text-[#1f2937]">{selectedFabric.name}</span>
                  <span className="text-[#6b7280]"> in </span>
                  <span className="text-[#1f2937]">{colorName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customizations */}
          <div className="p-6 border-b border-[#f5f3ee]">
            <h5 className="text-sm font-medium text-[#9ca3af] uppercase tracking-wider mb-3">Customizations</h5>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(customizations).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-[#6b7280] capitalize">{key.replace('_', ' ')}</span>
                  <span className="text-[#1f2937] capitalize">{String(value).replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Measurements */}
          {bodyMeasurements && (
            <div className="p-6 border-b border-[#f5f3ee]">
              <h5 className="text-sm font-medium text-[#9ca3af] uppercase tracking-wider mb-3">Your Measurements</h5>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-medium text-[#1f2937]">{bodyMeasurements.bust}"</div>
                  <div className="text-xs text-[#6b7280]">Bust</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-[#1f2937]">{bodyMeasurements.waist}"</div>
                  <div className="text-xs text-[#6b7280]">Waist</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-[#1f2937]">{bodyMeasurements.hips}"</div>
                  <div className="text-xs text-[#6b7280]">Hips</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-[#1f2937]">{bodyMeasurements.height_feet}'{bodyMeasurements.height_inches}"</div>
                  <div className="text-xs text-[#6b7280]">Height</div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="p-6 bg-[#f5f3ee]">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Base design</span>
                <span className="text-[#1f2937]">${selectedDesign.base_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Customizations</span>
                <span className="text-[#1f2937]">${(calculatePrice() - selectedDesign.base_price - (selectedFabric.price_per_yard * 3)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Fabric (~3 yards)</span>
                <span className="text-[#1f2937]">${(selectedFabric.price_per_yard * 3).toFixed(2)}</span>
              </div>
              <div className="border-t border-[#e5e7eb] pt-2 mt-2">
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-[#1f2937]">Total</span>
                  <span className="text-[#1f2937]">${calculatePrice().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-[#6b7280] mb-4">
              <p>Estimated delivery: <span className="text-[#1f2937] font-medium">{getLeadTime()}</span></p>
              <p>Made by a verified F&F seamstress partner</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setStep('fabric')}
            className="flex-1 py-3 border border-[#e5e7eb] text-[#6b7280] rounded-lg hover:bg-[#f5f3ee] transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              // Create order
              const order = {
                design: selectedDesign,
                customizations,
                fabric: selectedFabric,
                color: colorName,
                measurements: bodyMeasurements,
                total: calculatePrice(),
                leadTime: getLeadTime()
              };
              onOrderComplete?.(order);
              alert('Order submitted! A seamstress will be assigned to your custom piece.');
            }}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Place Order - ${calculatePrice().toFixed(2)}
          </button>
        </div>

        <p className="text-center text-xs text-[#9ca3af] mt-4">
          By placing this order, you agree to our terms. Payment is processed securely via Stripe.
        </p>
      </div>
    );
  }

  return null;
}
