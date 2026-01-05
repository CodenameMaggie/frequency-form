'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/product/ProductGrid';
import { SlidersHorizontal } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';

function ShopPageContent() {
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [selectedTier, setSelectedTier] = useState<string>(searchParams.get('tier') || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Get unique brands from products
  const brands = useMemo(() => {
    const brandSet = new Set(PRODUCTS.map(p => p.brand));
    return Array.from(brandSet).sort();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...PRODUCTS];

    // Filter by tier
    if (selectedTier !== 'all') {
      filtered = filtered.filter(p => p.tier === selectedTier);
    }

    // Filter by brand
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    // Filter by price
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // In a real app, this would sort by created_at
        filtered.reverse();
        break;
      default:
        // Featured - keep as is
        break;
    }

    return filtered;
  }, [selectedTier, selectedBrand, priceRange, sortBy]);

  const clearFilters = () => {
    setSelectedTier('all');
    setSelectedBrand('all');
    setPriceRange([0, 200000]);
  };

  const hasActiveFilters = selectedTier !== 'all' || selectedBrand !== 'all';

  return (
    <div className="container py-12 px-6">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-primary))] mb-4 font-light">
          Shop
        </h1>
        <p className="text-base md:text-lg text-[rgb(var(--color-text))] opacity-70">
          Curated natural fibers from artisan makers
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full px-6 py-3 border border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))] text-sm tracking-wider flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {mobileFiltersOpen ? 'HIDE FILTERS' : 'SHOW FILTERS'}
          </button>
        </div>

        {/* Filters Sidebar */}
        <aside
          className={`
            lg:block lg:w-64 flex-shrink-0
            ${mobileFiltersOpen ? 'block' : 'hidden'}
          `}
        >
          <div className="sticky top-24">
            {/* Filter Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-sans text-sm tracking-wider uppercase text-[rgb(var(--color-text))] font-medium">
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[rgb(var(--color-accent))] hover:opacity-70"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Frequency Tier Filter */}
            <div className="mb-8">
              <h4 className="font-sans text-xs tracking-wider uppercase text-[rgb(var(--color-text))] opacity-60 mb-3">
                Frequency Tier
              </h4>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'healing', label: 'Healing (5,000 Hz)' },
                  { value: 'foundation', label: 'Foundation (100 Hz)' }
                ].map(option => (
                  <label key={option.value} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="tier"
                      value={option.value}
                      checked={selectedTier === option.value}
                      onChange={(e) => setSelectedTier(e.target.value)}
                      className="mr-3 accent-[rgb(var(--color-primary))]"
                    />
                    <span className="text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="mb-8">
              <h4 className="font-sans text-xs tracking-wider uppercase text-[rgb(var(--color-text))] opacity-60 mb-3">
                Brand
              </h4>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="brand"
                    value="all"
                    checked={selectedBrand === 'all'}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="mr-3 accent-[rgb(var(--color-primary))]"
                  />
                  <span className="text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))]">
                    All Brands
                  </span>
                </label>
                {brands.map(brand => (
                  <label key={brand} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="brand"
                      value={brand}
                      checked={selectedBrand === brand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="mr-3 accent-[rgb(var(--color-primary))]"
                    />
                    <span className="text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))]">
                      {brand}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-8">
              <h4 className="font-sans text-xs tracking-wider uppercase text-[rgb(var(--color-text))] opacity-60 mb-3">
                Price Range
              </h4>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="200000"
                  step="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full accent-[rgb(var(--color-primary))]"
                />
                <p className="text-sm text-[rgb(var(--color-text))]">
                  Up to ${(priceRange[1] / 100).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Sort & Results Count */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[rgb(var(--color-muted))]">
            <p className="text-sm text-[rgb(var(--color-text))] opacity-70">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>

            <div className="flex items-center gap-3">
              <label className="text-xs tracking-wider uppercase text-[rgb(var(--color-text))] opacity-60">
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-[rgb(var(--color-muted))] bg-[rgb(var(--color-background))] text-sm text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <ProductGrid products={filteredProducts} columns={3} />
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="container py-12">
        <div className="text-center">
          <p className="text-[rgb(var(--color-text))] opacity-60">Loading...</p>
        </div>
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
