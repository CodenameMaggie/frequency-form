'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Import existing products
import { PRODUCTS } from '@/lib/products';
import { useCartStore } from '@/lib/cart-store';

interface LookbookPage {
  id: string;
  type: 'cover' | 'spread' | 'product' | 'science' | 'cta' | 'lifestyle';
  layout: string;
  headline?: string;
  subheadline?: string;
  body?: string;
  products?: typeof PRODUCTS;
  backgroundColor?: string;
  backgroundImage?: string;
}

// Sample lookbook data - connects to existing products
const SPRING_2026_LOOKBOOK: LookbookPage[] = [
  {
    id: 'cover',
    type: 'cover',
    layout: 'full',
    headline: 'Spring 2026',
    subheadline: 'Investment Pieces',
    backgroundColor: '#1f2937'
  },
  {
    id: 'philosophy',
    type: 'spread',
    layout: 'split',
    headline: 'The Capsule Philosophy',
    body: 'Timeless neutrals that mix and match effortlessly. Built to last, designed to elevate your frequency.',
    backgroundColor: '#fcfaf5'
  },
  {
    id: 'products-1',
    type: 'product',
    layout: 'grid-2',
    headline: 'Hero Pieces',
    products: PRODUCTS.slice(0, 2),
    backgroundColor: '#f5f3ee'
  },
  {
    id: 'science',
    type: 'science',
    layout: 'full',
    headline: 'The Frequency of Fabric',
    body: 'In 2003, Dr. Heidi Yellen measured the bioenergetic frequencies of fabrics. Linen measures at 5,000 Hz—fifty times your body\'s natural frequency.',
    backgroundColor: '#1f2937'
  },
  {
    id: 'products-2',
    type: 'product',
    layout: 'grid-2',
    headline: 'Foundation Pieces',
    products: PRODUCTS.slice(2, 4),
    backgroundColor: '#fcfaf5'
  },
  {
    id: 'products-3',
    type: 'product',
    layout: 'grid-4',
    headline: 'Complete Your Wardrobe',
    products: PRODUCTS.slice(4, 8),
    backgroundColor: '#f5f3ee'
  },
  {
    id: 'cta',
    type: 'cta',
    layout: 'full',
    headline: 'Request an Invitation',
    body: 'Join the circle of women and men who understand that what touches your skin shapes your energy.',
    backgroundColor: '#1f2937'
  }
];

function LookbookContent() {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(0);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [userTier, setUserTier] = useState<'aligned' | 'elevated' | 'sovereign'>('aligned');
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const { addItem, openCart } = useCartStore();

  const lookbook = SPRING_2026_LOOKBOOK;
  const totalPages = lookbook.length;
  const page = lookbook[currentPage];

  // Track page view
  useEffect(() => {
    trackInteraction('page_view', { page_number: currentPage, page_id: page.id });
  }, [currentPage, page.id]);

  // Track lookbook open
  useEffect(() => {
    const source = searchParams.get('utm_source') || 'direct';
    trackLookbookOpen(source);
    loadUserProfile();
  }, [searchParams]);

  const trackLookbookOpen = async (source: string) => {
    try {
      await fetch('/api/ff/lookbook/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'lookbook_open',
          lookbook_id: 'spring-2026',
          session_id: sessionId,
          source,
          utm_source: searchParams.get('utm_source'),
          utm_medium: searchParams.get('utm_medium'),
          utm_campaign: searchParams.get('utm_campaign')
        })
      });
    } catch (e) {
      console.error('Tracking error:', e);
    }
  };

  const trackInteraction = async (type: string, metadata: any) => {
    try {
      await fetch('/api/ff/lookbook/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'interaction',
          interaction_type: type,
          lookbook_id: 'spring-2026',
          session_id: sessionId,
          ...metadata
        })
      });
    } catch (e) {
      console.error('Tracking error:', e);
    }
  };

  const loadUserProfile = async () => {
    try {
      const res = await fetch('/api/ff/lookbook/personalize');
      if (res.ok) {
        const data = await res.json();
        setUserTier(data.tier || 'aligned');
        setAiRecommendations(data.recommendations);
      }
    } catch (e) {
      console.error('Profile load error:', e);
    }
  };

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    setAddedToCart(product.id.toString());
    setTimeout(() => setAddedToCart(null), 2000);
    trackInteraction('add_to_cart', { product_id: product.id, product_name: product.name });
    setTimeout(() => openCart(), 300);
  };

  const handleProductClick = (product: any) => {
    trackInteraction('product_click', { product_id: product.id, product_name: product.name });
  };

  const goToPage = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToPage('next');
      if (e.key === 'ArrowLeft') goToPage('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  // Touch/swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToPage('next');
      else goToPage('prev');
    }
    setTouchStart(null);
  };

  // Render different page types
  const renderPage = () => {
    switch (page.type) {
      case 'cover':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8" style={{ backgroundColor: page.backgroundColor }}>
            <div className="w-px h-16 bg-gradient-to-b from-transparent to-[#c8b28a] mb-8"></div>
            <p className="text-[#c8b28a] text-[10px] tracking-[0.4em] uppercase mb-4 font-sans">Frequency & Form</p>
            <h1 className="text-white text-4xl md:text-6xl font-serif font-light tracking-[0.15em] mb-4">{page.headline}</h1>
            <p className="text-[#c8b28a] text-xl font-serif italic">{page.subheadline}</p>
            <div className="flex items-center gap-4 mt-12">
              <span className="w-12 h-px bg-[#c8b28a]"></span>
              <div className="w-2 h-2 rounded-full bg-[#c8b28a]"></div>
              <span className="w-12 h-px bg-[#c8b28a]"></span>
            </div>
            <p className="text-[#6b7280] text-xs mt-8 font-sans">Swipe or use arrow keys</p>
          </div>
        );

      case 'spread':
        return (
          <div className="w-full h-full flex flex-col md:flex-row" style={{ backgroundColor: page.backgroundColor }}>
            <div className="w-full md:w-1/2 h-1/2 md:h-full bg-[#f5f3ee] flex items-center justify-center">
              <div className="w-32 h-32 border border-[#c8b28a] rounded-full flex items-center justify-center">
                <span className="text-5xl text-[#c8b28a]">&#10022;</span>
              </div>
            </div>
            <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center p-8 md:p-12">
              <p className="text-[10px] uppercase text-[#c8b28a] tracking-[0.4em] mb-3 font-sans">The Philosophy</p>
              <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1f2937] mb-6">{page.headline}</h2>
              <p className="text-[#6b7280] font-sans text-sm leading-relaxed">{page.body}</p>
            </div>
          </div>
        );

      case 'product':
        const gridCols = page.layout === 'grid-4' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2';
        return (
          <div className="w-full h-full p-6 md:p-12 overflow-auto" style={{ backgroundColor: page.backgroundColor }}>
            <div className="text-center mb-8">
              <p className="text-[10px] uppercase text-[#c8b28a] tracking-[0.4em] mb-2 font-sans">Shop the Look</p>
              <h2 className="text-2xl md:text-3xl font-serif font-light text-[#1f2937]">{page.headline}</h2>
            </div>
            <div className={`grid ${gridCols} gap-4 md:gap-6 max-w-5xl mx-auto`}>
              {page.products?.map((product) => (
                <div key={product.id} className="group cursor-pointer" onClick={() => handleProductClick(product)}>
                  <Link href={`/shop/${product.slug}`}>
                    <div className="aspect-[3/4] bg-[#1f2937] relative overflow-hidden mb-3">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white/40 font-serif">{product.name}</span>
                        </div>
                      )}
                      {/* Interactive Add to Cart Button */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                        className={`absolute bottom-3 left-3 right-3 py-3 text-[10px] font-sans font-semibold tracking-[0.2em] uppercase transition-all ${
                          addedToCart === product.id.toString()
                            ? 'bg-green-500 text-white opacity-100'
                            : 'bg-[#c8b28a] text-[#1f2937] opacity-0 group-hover:opacity-100 hover:bg-white'
                        }`}
                      >
                        {addedToCart === product.id.toString() ? 'Added!' : 'Add to Cart'}
                      </button>
                      {/* Hotspot indicator */}
                      <div className="absolute top-3 right-3 w-8 h-8 bg-[#c8b28a] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[#1f2937] text-sm">+</span>
                      </div>
                    </div>
                  </Link>
                  <p className="text-[9px] uppercase text-[#c8b28a] tracking-[0.3em] mb-1 font-sans">
                    {product.tier === 'healing' ? '5,000 Hz' : '100 Hz'}
                  </p>
                  <h3 className="font-serif text-lg text-[#1f2937]">{product.name}</h3>
                  <p className="font-sans text-sm text-[#1f2937] font-medium">${(product.price / 100).toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'science':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 md:p-16 text-center" style={{ backgroundColor: page.backgroundColor }}>
            <p className="text-[#c8b28a] text-[10px] tracking-[0.4em] uppercase mb-4 font-sans">The Science</p>
            <h2 className="text-2xl md:text-4xl font-serif font-light text-white mb-6">{page.headline}</h2>
            <p className="text-[#9ca3af] font-sans text-sm md:text-base max-w-xl mb-10">{page.body}</p>
            <div className="w-full max-w-lg space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-serif text-2xl text-white w-24 text-right">5,000 Hz</span>
                <div className="flex-1 h-3 bg-[#374151] rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-[#c8b28a] to-[#d4c4a0] rounded-full"></div>
                </div>
                <span className="text-[10px] text-[#c8b28a] w-20 uppercase tracking-wider">Elevating</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-serif text-2xl text-white w-24 text-right">100 Hz</span>
                <div className="flex-1 h-3 bg-[#374151] rounded-full overflow-hidden">
                  <div className="h-full w-[40%] bg-gradient-to-r from-[#9ca3af] to-[#b8b4b0] rounded-full"></div>
                </div>
                <span className="text-[10px] text-[#9ca3af] w-20 uppercase tracking-wider">Harmonizing</span>
              </div>
              <div className="flex items-center gap-4 opacity-50">
                <span className="font-serif text-2xl text-[#6b7280] w-24 text-right">0-15 Hz</span>
                <div className="flex-1 h-3 bg-[#374151] rounded-full overflow-hidden">
                  <div className="h-full w-[5%] bg-[#4b5563] rounded-full"></div>
                </div>
                <span className="text-[10px] text-[#6b7280] w-20 uppercase tracking-wider">Never</span>
              </div>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 md:p-16 text-center" style={{ backgroundColor: page.backgroundColor }}>
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-[#c8b28a] mb-8"></div>
            <p className="text-[#c8b28a] text-[10px] tracking-[0.4em] uppercase mb-4 font-sans">Join the Circle</p>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-6">{page.headline}</h2>
            <p className="text-[#9ca3af] font-sans text-base max-w-md mb-8">{page.body}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop" className="px-10 py-4 bg-[#c8b28a] text-[#1f2937] text-[11px] font-sans font-semibold tracking-[0.25em] uppercase hover:bg-white transition-colors">
                Shop Collection
              </Link>
              <Link href="/ff/style-studio" className="px-10 py-4 border border-[#c8b28a] text-[#c8b28a] text-[11px] font-sans font-semibold tracking-[0.25em] uppercase hover:bg-[#c8b28a] hover:text-[#1f2937] transition-colors">
                Style Studio
              </Link>
            </div>
            {userTier === 'sovereign' && aiRecommendations && (
              <div className="mt-10 p-6 bg-[#374151] rounded-lg max-w-md">
                <p className="text-[#c8b28a] text-[10px] tracking-[0.3em] uppercase mb-2">Personalized for You</p>
                <p className="text-white font-sans text-sm">{aiRecommendations.message}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col">
      {/* Header */}
      <header className="bg-[#111827] py-4 px-6 flex justify-between items-center border-b border-[#1f2937] z-20">
        <Link href="/" className="font-serif text-white text-lg tracking-[0.15em]">F&F</Link>
        <div className="flex gap-2">
          {lookbook.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentPage ? 'bg-[#c8b28a] w-6' : 'bg-[#374151] hover:bg-[#4b5563]'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#6b7280] text-xs font-sans">{currentPage + 1} / {totalPages}</span>
          <button onClick={openCart} className="text-[#c8b28a] text-xs font-sans hover:text-white">Cart</button>
        </div>
      </header>

      {/* Main Lookbook */}
      <main
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full h-full min-h-[calc(100vh-120px)]">
          {renderPage()}
        </div>

        {/* Navigation Arrows */}
        {currentPage > 0 && (
          <button
            onClick={() => goToPage('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#1f2937]/80 hover:bg-[#c8b28a] rounded-full flex items-center justify-center transition-all z-10"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {currentPage < totalPages - 1 && (
          <button
            onClick={() => goToPage('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#1f2937]/80 hover:bg-[#c8b28a] rounded-full flex items-center justify-center transition-all z-10"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#111827] py-3 px-6 flex justify-between items-center border-t border-[#1f2937]">
        <p className="text-[#374151] text-[10px] tracking-[0.2em] uppercase font-sans">2026 Frequency & Form</p>
        <p className="text-[#c8b28a] text-xs font-serif italic">Dress in Alignment</p>
        <div className="flex gap-4">
          <Link href="/shop" className="text-[#374151] text-[10px] tracking-[0.2em] uppercase hover:text-[#c8b28a] font-sans">Shop</Link>
          <Link href="/ff/style-studio" className="text-[#374151] text-[10px] tracking-[0.2em] uppercase hover:text-[#c8b28a] font-sans">Style Studio</Link>
        </div>
      </footer>
    </div>
  );
}

export default function LookbookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <p className="text-[#c8b28a] font-serif">Loading lookbook...</p>
      </div>
    }>
      <LookbookContent />
    </Suspense>
  );
}
