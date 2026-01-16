'use client';

/**
 * FF AI STYLE STUDIO - Unified Flow
 * Step 1: Body Scan → Confirm All
 * Step 2: Color Analysis (face photo)
 * Step 3: Design Studio (choose clothing)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const BodyScanner = dynamic(() => import('@/components/ff/BodyScanner'), {
  ssr: false,
  loading: () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee] text-center">
      <div className="animate-spin w-12 h-12 border-4 border-[#c8b28a] border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-[#6b7280]">Loading Scanner...</p>
    </div>
  ),
});

const ColorAnalyzer = dynamic(() => import('@/components/ff/ColorAnalyzer'), {
  ssr: false,
  loading: () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee] text-center">
      <div className="animate-spin w-12 h-12 border-4 border-[#c8b28a] border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-[#6b7280]">Loading Color Analyzer...</p>
    </div>
  ),
});

const CustomDesignStudio = dynamic(() => import('@/components/ff/CustomDesignStudio'), {
  ssr: false,
  loading: () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-[#f5f3ee] text-center">
      <div className="animate-spin w-12 h-12 border-4 border-[#c8b28a] border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-[#6b7280]">Loading Custom Design Studio...</p>
    </div>
  ),
});

interface BodyMeasurements {
  bust: string;
  waist: string;
  hips: string;
  height_feet: string;
  height_inches: string;
  shoulder_width: string;
  arm_length: string;
  inseam: string;
  leg_length: string;
  torso_length: string;
  body_type?: string;
  torso_type?: 'short' | 'average' | 'long';
  recommended_silhouettes?: string[];
}

interface ColorProfile {
  color_season: string;
  color_season_subtype: string;
  skin_undertone: string;
  skin_depth: string;
  best_colors: Array<{ hex: string; name: string }>;
  best_metals: string[];
  contrast_level: string;
}

type FlowStep = 'body-scan' | 'color-analysis' | 'design-studio';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  budget_tier: string;
  silhouettes: string[];
  best_for_body_types: string[];
  torso_fit: string;
  primary_color: string;
  primary_color_hex: string;
  fabric_type: string;
  frequency_compatible?: boolean;
  image_url: string | null;
  source_url?: string;
  affiliate_url?: string;
  avg_rating: number;
  review_count: number;
}

// Clothing categories for design studio
const CLOTHING_CATEGORIES = [
  { id: 'tops', label: 'Tops', icon: '👚' },
  { id: 'dresses', label: 'Dresses', icon: '👗' },
  { id: 'bottoms', label: 'Bottoms', icon: '👖' },
  { id: 'outerwear', label: 'Outerwear', icon: '🧥' },
];

// Budget tiers
const BUDGET_TIERS = [
  { id: 'all', label: 'All Prices', range: '' },
  { id: 'budget', label: 'Under $50', range: '$50 & under' },
  { id: 'moderate', label: '$50-150', range: '$50-$150' },
  { id: 'premium', label: '$150-300', range: '$150-$300' },
  { id: 'luxury', label: '$300+', range: '$300+' },
];

// Design studio modes
type DesignMode = 'shop' | 'custom';

export default function FFStyleStudioPage() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('body-scan');
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements | null>(null);
  const [colorProfile, setColorProfile] = useState<ColorProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('tops');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [designMode, setDesignMode] = useState<DesignMode>('shop');

  // Load existing profile data
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Load products when in design studio
  useEffect(() => {
    if (currentStep === 'design-studio') {
      loadProducts();
    }
  }, [currentStep, selectedCategory, selectedBudget, bodyMeasurements]);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('category', selectedCategory);
      if (selectedBudget !== 'all') {
        params.set('budget', selectedBudget);
      }
      if (bodyMeasurements?.body_type) {
        params.set('body_type', bodyMeasurements.body_type);
      }

      const res = await fetch(`/api/ff/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
    setProductsLoading(false);
  };

  const loadUserProfile = async () => {
    try {
      const [bodyRes, colorRes] = await Promise.all([
        fetch('/api/ff/body-scan'),
        fetch('/api/ff/color-analysis')
      ]);

      const bodyData = await bodyRes.json();
      const colorData = await colorRes.json();

      if (bodyData.hasMeasurements) {
        setBodyMeasurements(bodyData.data);
        if (colorData.hasProfile) {
          setColorProfile(colorData.data);
          setCurrentStep('design-studio');
        } else {
          setCurrentStep('color-analysis');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setIsLoading(false);
  };

  const handleBodyScanComplete = async (measurements: BodyMeasurements) => {
    try {
      await fetch('/api/ff/body-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...measurements,
          height_total_inches: (parseInt(measurements.height_feet) * 12) + parseInt(measurements.height_inches)
        })
      });
      setBodyMeasurements(measurements);
      setCurrentStep('color-analysis');
    } catch (error) {
      console.error('Error saving measurements:', error);
    }
  };

  const handleColorAnalysisComplete = async (profile: ColorProfile) => {
    try {
      await fetch('/api/ff/color-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      setColorProfile(profile);
      setCurrentStep('design-studio');
    } catch (error) {
      console.error('Error saving color profile:', error);
    }
  };

  const isRecommended = (product: Product) => {
    if (!bodyMeasurements?.body_type) return false;
    return product.best_for_body_types?.includes(bodyMeasurements.body_type);
  };

  const isTorsoMatch = (product: Product) => {
    if (!bodyMeasurements?.torso_type) return false;
    const torsoMap: Record<string, string> = {
      'short': 'short_torso_friendly',
      'long': 'long_torso_friendly'
    };
    return product.torso_fit === torsoMap[bodyMeasurements.torso_type];
  };

  const addToCart = (productId: string) => {
    if (!cart.includes(productId)) {
      setCart([...cart, productId]);
    }
  };

  const handleProductClick = (product: Product) => {
    // Open affiliate or source URL
    const url = product.affiliate_url || product.source_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Progress indicator
  const steps = [
    { id: 'body-scan', label: 'Body Scan', number: 1 },
    { id: 'color-analysis', label: 'Color Analysis', number: 2 },
    { id: 'design-studio', label: 'Design Studio', number: 3 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#c8b28a] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf5]">
      {/* Header */}
      <header className="bg-[#1f2937] text-white py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-[#c8b28a] text-sm tracking-[0.3em] uppercase mb-1 inline-block hover:text-white transition-colors">
            Frequency & Form
          </Link>
          <h1 className="font-serif text-3xl md:text-4xl font-light tracking-wide">
            AI Style Studio
          </h1>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-[#f5f3ee] py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-[#1f2937] text-white'
                      : 'bg-[#f5f3ee] text-[#9ca3af]'
                  }`}>
                    {index < currentStepIndex ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`hidden sm:inline text-sm ${
                    index <= currentStepIndex ? 'text-[#1f2937]' : 'text-[#9ca3af]'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-[#f5f3ee]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        {/* Step 1: Body Scan */}
        {currentStep === 'body-scan' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-[#1f2937] mb-2">Step 1: Body Measurements</h2>
              <p className="text-[#6b7280]">Get accurate measurements for personalized recommendations</p>
            </div>

            <BodyScanner
              onMeasurementsComplete={handleBodyScanComplete}
              onCancel={() => {}}
            />
          </div>
        )}

        {/* Step 2: Color Analysis */}
        {currentStep === 'color-analysis' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-[#1f2937] mb-2">Step 2: Color Analysis</h2>
              <p className="text-[#6b7280]">Discover your perfect color palette</p>
            </div>

            {/* Show body summary */}
            {bodyMeasurements && (
              <div className="bg-[#f5f3ee] p-4 rounded-lg mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#1f2937]">Body Profile Complete</div>
                    <div className="text-xs text-[#6b7280]">
                      {bodyMeasurements.body_type?.replace('_', ' ')} • {bodyMeasurements.torso_type?.replace('_', ' ')} torso
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep('body-scan')}
                  className="text-xs text-[#c8b28a] hover:text-[#1f2937]"
                >
                  Edit
                </button>
              </div>
            )}

            <ColorAnalyzer
              onAnalysisComplete={handleColorAnalysisComplete}
              onCancel={() => setCurrentStep('body-scan')}
            />
          </div>
        )}

        {/* Step 3: Design Studio */}
        {currentStep === 'design-studio' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-[#1f2937] mb-2">Step 3: Choose Your Style</h2>
              <p className="text-[#6b7280]">Shop partner pieces or design your own custom garments</p>
            </div>

            {/* Design Mode Toggle */}
            <div className="flex justify-center gap-2 mb-8">
              <button
                onClick={() => setDesignMode('shop')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  designMode === 'shop'
                    ? 'bg-[#1f2937] text-white shadow-md'
                    : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#c8b28a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Shop Partner Pieces
                </div>
              </button>
              <button
                onClick={() => setDesignMode('custom')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  designMode === 'custom'
                    ? 'bg-[#1f2937] text-white shadow-md'
                    : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#c8b28a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Design Custom
                  <span className="ml-1 px-2 py-0.5 text-xs bg-[#c8b28a] text-white rounded">F&F</span>
                </div>
              </button>
            </div>

            {/* Profile Summary Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Body Profile */}
              {bodyMeasurements && (
                <div className="bg-white p-4 rounded-lg border border-[#f5f3ee]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-[#9ca3af] uppercase tracking-wider">Body Profile</div>
                    <button
                      onClick={() => setCurrentStep('body-scan')}
                      className="text-xs text-[#c8b28a] hover:text-[#1f2937]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-lg font-medium text-[#1f2937] capitalize">
                        {bodyMeasurements.body_type?.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-[#6b7280]">
                        {bodyMeasurements.torso_type === 'short' ? 'Short torso, long legs' :
                         bodyMeasurements.torso_type === 'long' ? 'Long torso, short legs' : 'Balanced proportions'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {bodyMeasurements.recommended_silhouettes?.slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-[#f5f3ee] text-[#6b7280] text-xs rounded capitalize">
                        {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Profile */}
              {colorProfile && (
                <div className="bg-white p-4 rounded-lg border border-[#f5f3ee]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-[#9ca3af] uppercase tracking-wider">Color Profile</div>
                    <button
                      onClick={() => setCurrentStep('color-analysis')}
                      className="text-xs text-[#c8b28a] hover:text-[#1f2937]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-lg font-medium text-[#1f2937] capitalize">
                        {colorProfile.color_season} {colorProfile.color_season_subtype}
                      </div>
                      <div className="text-sm text-[#6b7280] capitalize">
                        {colorProfile.skin_undertone} undertone • {colorProfile.skin_depth}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {colorProfile.best_colors.slice(0, 6).map(c => (
                      <div
                        key={c.hex}
                        className="w-6 h-6 rounded border border-[#e5e7eb]"
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shop Mode - Partner Products */}
            {designMode === 'shop' && (
              <>
                {/* Category Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {CLOTHING_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#1f2937] text-white'
                          : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#c8b28a]'
                      }`}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Budget Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  <span className="text-sm text-[#6b7280] py-2">Budget:</span>
                  {BUDGET_TIERS.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedBudget(tier.id)}
                      className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                        selectedBudget === tier.id
                          ? 'bg-[#c8b28a] text-white'
                          : 'bg-[#f5f3ee] text-[#6b7280] hover:bg-[#e5e7eb]'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>

                {/* Products Loading */}
                {productsLoading && (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-[#c8b28a] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-[#6b7280]">Finding perfect pieces for you...</p>
                  </div>
                )}

                {/* Products Grid */}
                {!productsLoading && products.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-[#f5f3ee]">
                    <p className="text-[#6b7280]">No products found for this category and budget.</p>
                    <button
                      onClick={() => setSelectedBudget('all')}
                      className="mt-4 text-[#c8b28a] hover:text-[#1f2937]"
                    >
                      Clear budget filter
                    </button>
                  </div>
                )}

                {!productsLoading && products.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                      <div
                        key={product.id}
                        className={`bg-white rounded-xl overflow-hidden border transition-all cursor-pointer hover:shadow-lg ${
                          isRecommended(product) ? 'border-[#c8b28a] ring-1 ring-[#c8b28a]' : 'border-[#f5f3ee]'
                        }`}
                        onClick={() => handleProductClick(product)}
                      >
                        {/* Image */}
                        <div className="aspect-[3/4] bg-[#f5f3ee] relative">
                          {/* Recommendation badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {isRecommended(product) && (
                              <div className="px-2 py-1 bg-[#c8b28a] text-white text-xs rounded">
                                Perfect for {bodyMeasurements?.body_type?.replace('_', ' ')}
                              </div>
                            )}
                            {isTorsoMatch(product) && (
                              <div className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                                Great for your proportions
                              </div>
                            )}
                            {product.frequency_compatible && (
                              <div className="px-2 py-1 bg-[#1f2937] text-white text-xs rounded flex items-center gap-1">
                                <span>~</span> High Frequency
                              </div>
                            )}
                          </div>

                          {/* Budget tier badge */}
                          <div className="absolute top-3 right-3">
                            <div className={`px-2 py-1 text-xs rounded ${
                              product.budget_tier === 'luxury' ? 'bg-purple-100 text-purple-700' :
                              product.budget_tier === 'premium' ? 'bg-blue-100 text-blue-700' :
                              product.budget_tier === 'moderate' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {product.budget_tier === 'luxury' ? 'Luxury' :
                               product.budget_tier === 'premium' ? 'Premium' :
                               product.budget_tier === 'moderate' ? '$50-150' :
                               'Under $50'}
                            </div>
                          </div>

                          {/* Placeholder image */}
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div
                                  className="w-16 h-16 rounded-full mx-auto mb-2 border-4 border-[#e5e7eb]"
                                  style={{ backgroundColor: product.primary_color_hex || '#f5f3ee' }}
                                />
                                <span className="text-xs text-[#9ca3af] capitalize">{product.primary_color}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          {/* Brand */}
                          <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">{product.brand}</div>

                          {/* Name */}
                          <h3 className="font-medium text-[#1f2937] mb-2 line-clamp-2">{product.name}</h3>

                          {/* Rating */}
                          {product.avg_rating > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <svg
                                    key={star}
                                    className={`w-3 h-3 ${star <= Math.round(product.avg_rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-xs text-[#6b7280]">({product.review_count})</span>
                            </div>
                          )}

                          {/* Price and action */}
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-medium text-[#1f2937]">${product.price.toFixed(2)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product.id);
                              }}
                              disabled={cart.includes(product.id)}
                              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                                cart.includes(product.id)
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-[#1f2937] text-white hover:bg-[#374151]'
                              }`}
                            >
                              {cart.includes(product.id) ? 'Saved' : 'Save'}
                            </button>
                          </div>

                          {/* Fabric type */}
                          <div className="flex items-center gap-2 mt-3 text-xs text-[#6b7280]">
                            <span className="capitalize">{product.fabric_type}</span>
                            {product.frequency_compatible && (
                              <span className="text-[#c8b28a]">• Natural fiber</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Saved Items Summary */}
                {cart.length > 0 && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1f2937] text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-4 z-20">
                    <div>
                      <div className="font-medium">{cart.length} items saved</div>
                      <div className="text-sm text-[#c8b28a]">Click items to shop</div>
                    </div>
                    <button
                      onClick={() => setCart([])}
                      className="px-4 py-2 bg-[#c8b28a] text-[#1f2937] rounded-lg font-medium hover:bg-[#d4c4a0] transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Custom Mode - F&F Design Studio */}
            {designMode === 'custom' && (
              <CustomDesignStudio
                bodyMeasurements={bodyMeasurements}
                colorProfile={colorProfile}
                onOrderComplete={(order) => {
                  console.log('Custom order placed:', order);
                  // Could show confirmation, redirect, etc.
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-[#1f2937] text-center">
        <p className="text-[#9ca3af] text-sm">Frequency & Form AI Style Studio</p>
        <p className="text-[#c8b28a] text-xs mt-1">Personalized Fashion, Powered by AI</p>
      </footer>
    </div>
  );
}
