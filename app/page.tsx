'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Sparkles, Brain, Shirt, Palette, Camera, ShoppingBag } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { useCartStore } from '@/lib/cart-store';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addItem, openCart } = useCartStore();

  // Get featured products (first 4)
  const featuredProducts = PRODUCTS.slice(0, 4);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSubmitted(true);
        setEmail('');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
    setIsSubmitting(false);
  };

  const handleQuickAdd = (product: typeof PRODUCTS[0]) => {
    addItem(product, 1);
    openCart();
  };

  return (
    <main className="min-h-screen bg-[rgb(var(--cream))]">
      {/* Hero Section - Editorial Style */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f3ee] via-[#fcfaf5] to-[#fcfaf5]" />

        {/* Content */}
        <div className="relative z-10 max-w-[1000px] mx-auto px-6 text-center">
          {/* Decorative line */}
          <div className="w-px h-[60px] mx-auto mb-8 bg-gradient-to-b from-transparent via-[#c8b28a] to-[#c8b28a]" />

          {/* Logo */}
          <h1 className="font-serif text-[clamp(36px,9vw,64px)] font-light tracking-[0.2em] uppercase mb-4 text-[#1f2937]">
            Frequency & Form
          </h1>

          {/* Tagline */}
          <p className="font-serif text-[clamp(18px,3vw,24px)] italic font-light text-[#c8b28a] tracking-[0.06em] mb-8">
            Dress in Alignment
          </p>

          {/* Hero Description */}
          <p className="font-sans text-base md:text-lg leading-[1.8] text-[#6b7280] max-w-[600px] mx-auto mb-10">
            Welcome to your personal style concierge. Like a Costco for luxury natural fibers,
            we bring you exclusive access to premium garments at exceptional value—powered by AI
            that learns your preferences and curates pieces you'll love.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/ff/style-studio"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#1f2937] text-[#f5f3ee] text-[12px] font-sans font-medium tracking-[0.25em] uppercase transition-all hover:bg-[#374151] hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enter AI Style Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 px-8 py-4 border border-[#1f2937] text-[#1f2937] text-[12px] font-sans font-medium tracking-[0.25em] uppercase transition-all hover:bg-[#1f2937] hover:text-[#f5f3ee]"
            >
              <span>Browse Collection</span>
            </Link>
          </div>

          {/* Trust Badge */}
          <p className="mt-8 font-sans text-xs text-[#9ca3af] tracking-wide">
            100% Natural Fibers · AI-Powered Recommendations · Members-Only Pricing
          </p>
        </div>
      </section>

      {/* AI Style Studio Feature Section */}
      <section className="py-20 px-6 bg-[#f5f3ee]">
        <div className="max-w-[1200px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="font-sans text-[10px] uppercase text-[#c8b28a] font-medium tracking-[0.4em] mb-3">
              Your Personal AI Stylist
            </p>
            <h2 className="font-serif text-[clamp(28px,5vw,42px)] font-light text-[#1f2937] mb-4 tracking-[0.05em]">
              Style Studio
            </h2>
            <p className="font-sans text-base text-[#6b7280] max-w-[500px] mx-auto leading-[1.8]">
              An intelligent system that knows your style better than you know yourself.
              Body scan, color analysis, and AI-curated recommendations—all in one place.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Camera, title: 'Body Scan', desc: 'AI analyzes your proportions for perfect fit recommendations' },
              { icon: Palette, title: 'Color Analysis', desc: 'Discover your ideal color palette based on undertones' },
              { icon: Shirt, title: 'Virtual Closet', desc: 'Organize your wardrobe and see outfit combinations' },
              { icon: Brain, title: 'Smart Curation', desc: 'AI learns your preferences and suggests new pieces' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-[#fcfaf5] p-8 text-center group hover:shadow-lg transition-all">
                <div className="w-12 h-12 mx-auto mb-4 bg-[#c8b28a]/20 rounded-full flex items-center justify-center group-hover:bg-[#c8b28a]/30 transition-colors">
                  <feature.icon className="w-5 h-5 text-[#1f2937]" />
                </div>
                <h3 className="font-serif text-lg text-[#1f2937] mb-2">{feature.title}</h3>
                <p className="font-sans text-sm text-[#6b7280] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/ff/style-studio"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#c8b28a] text-[#1f2937] text-[11px] font-sans font-medium tracking-[0.25em] uppercase transition-all hover:bg-[#b8a27a] hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Your Style Journey</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The Science Section */}
      <section className="py-20 px-6 bg-[#fcfaf5]">
        <div className="max-w-[900px] mx-auto">
          {/* Section Label */}
          <div className="text-center mb-3">
            <p className="font-sans text-[10px] uppercase text-[#c8b28a] font-medium tracking-[0.4em]">
              The Science
            </p>
          </div>

          {/* Section Title */}
          <h2 className="font-serif text-center text-[clamp(26px,5vw,36px)] font-light text-[#1f2937] mb-4 tracking-[0.05em]">
            The Frequency of Fabric
          </h2>

          {/* Section Subtitle */}
          <p className="text-center text-sm md:text-base text-[#6b7280] font-sans font-light mb-12 max-w-[550px] mx-auto leading-[1.8]">
            In 2003, Dr. Heidi Yellen measured the bioenergetic frequencies of fabrics.
            What she discovered changed everything we thought we knew about getting dressed.
          </p>

          {/* Frequency Tiers */}
          <div className="flex flex-col gap-1 mb-8">
            {/* Elevating Tier */}
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[160px] bg-[#c8b28a] p-6 flex flex-col justify-center text-center">
                <span className="font-serif text-[28px] font-light text-[#1f2937] mb-0.5">5,000 Hz</span>
                <span className="font-sans text-[9px] tracking-[0.25em] uppercase font-medium text-[#1f2937]">Elevating</span>
              </div>
              <div className="flex-1 bg-[#f5f3ee] p-6 flex flex-col justify-center text-center md:text-left md:pl-8">
                <h3 className="font-serif text-xl font-normal mb-2 tracking-[0.05em] text-[#1f2937]">Healing Tier</h3>
                <p className="font-sans text-sm font-light mb-2 text-[#6b7280]">Linen · Wool · Cashmere · Hemp</p>
                <p className="font-sans text-xs font-light italic text-[#9ca3af]">50× your body's natural frequency. These fabrics elevate you.</p>
              </div>
            </div>

            {/* Harmonizing Tier */}
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[160px] bg-white border border-[#e5e7eb] md:border-r-0 p-6 flex flex-col justify-center text-center">
                <span className="font-serif text-[28px] font-light text-[#9ca3af] mb-0.5">100 Hz</span>
                <span className="font-sans text-[9px] tracking-[0.25em] uppercase font-medium text-[#9ca3af]">Harmonizing</span>
              </div>
              <div className="flex-1 bg-white border border-[#e5e7eb] md:border-l-0 p-6 flex flex-col justify-center text-center md:text-left md:pl-8">
                <h3 className="font-serif text-xl font-normal mb-2 tracking-[0.05em] text-[#1f2937]">Foundation Tier</h3>
                <p className="font-sans text-sm font-light mb-2 text-[#6b7280]">Organic Cotton</p>
                <p className="font-sans text-xs font-light italic text-[#9ca3af]">Perfectly in tune with your body. Neutral and never depleting.</p>
              </div>
            </div>

            {/* Never Tier */}
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[160px] bg-[#1f2937] p-6 flex flex-col justify-center text-center">
                <span className="font-serif text-[28px] font-light text-white mb-0.5">0–15 Hz</span>
                <span className="font-sans text-[9px] tracking-[0.25em] uppercase font-medium text-white/70">Depleting</span>
              </div>
              <div className="flex-1 bg-[#1f2937] p-6 flex flex-col justify-center text-center md:text-left md:pl-8">
                <h3 className="font-serif text-xl font-medium mb-2 tracking-[0.05em] text-white">What We Never Carry</h3>
                <p className="font-sans text-sm font-light mb-2 text-white/90">Polyester · Nylon · Acrylic · Rayon</p>
                <p className="font-sans text-xs font-light text-white/70">Synthetics drain your natural energy. We reject them entirely.</p>
              </div>
            </div>
          </div>

          {/* Body Reference */}
          <div className="text-left p-6 bg-[#f5f3ee] border-l-[3px] border-[#c8b28a]">
            <p className="font-sans text-sm text-[#6b7280] font-light">
              The healthy human body resonates at <strong className="text-[#1f2937] font-medium">100 Hz</strong>.
              Everything you wear either elevates that frequency, matches it, or drains it.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products with Quick Add */}
      <section className="py-20 px-6 bg-[#f5f3ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <p className="font-sans text-[10px] uppercase text-[#c8b28a] font-medium tracking-[0.4em] mb-3">
              Curated Selection
            </p>
            <h2 className="font-serif text-[clamp(26px,5vw,36px)] font-light text-[#1f2937] mb-4 tracking-[0.05em]">
              Featured Pieces
            </h2>
            <p className="font-sans text-sm text-[#6b7280] max-w-[450px] mx-auto">
              Hand-selected natural fiber garments at exceptional member pricing
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {featuredProducts.map((product) => {
              // Determine if product is "light" based on name
              const isLightProduct = product.name.toLowerCase().includes('linen') ||
                                     product.name.toLowerCase().includes('cotton') ||
                                     product.name.toLowerCase().includes('white');
              const bgClass = isLightProduct ? 'bg-[#1f2937]' : 'bg-[#f5f3ee]';
              const textClass = isLightProduct ? 'text-white' : 'text-[#1f2937]';

              return (
                <div key={product.id} className="group">
                  <Link href={`/shop/${product.slug}`}>
                    <div className={`relative aspect-[3/4] ${bgClass} overflow-hidden mb-4`}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          <span className={`text-sm ${textClass}`}>[Product Image]</span>
                        </div>
                      )}
                      {/* Tier Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 text-[9px] tracking-[0.2em] uppercase font-sans ${
                          product.tier === 'healing'
                            ? 'bg-[#c8b28a] text-[#1f2937]'
                            : 'bg-white text-[#6b7280]'
                        }`}>
                          {product.tier === 'healing' ? '5,000 Hz' : '100 Hz'}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <p className="font-sans text-[10px] text-[#9ca3af] tracking-[0.15em] uppercase">
                      {product.brand}
                    </p>
                    <Link href={`/shop/${product.slug}`}>
                      <h3 className="font-serif text-lg text-[#1f2937] hover:opacity-70 transition-opacity">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <p className="font-sans text-[#1f2937] font-medium">
                        ${(product.price / 100).toFixed(0)}
                      </p>
                      <button
                        onClick={() => handleQuickAdd(product)}
                        className="flex items-center gap-2 text-[10px] font-sans tracking-[0.1em] uppercase text-[#c8b28a] hover:text-[#1f2937] transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Quick Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All CTA */}
          <div className="text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#1f2937] text-[#1f2937] text-[11px] font-sans font-medium tracking-[0.2em] uppercase hover:bg-[#1f2937] hover:text-white transition-all"
            >
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* The Promise Section */}
      <section className="py-20 px-6 bg-[#fcfaf5]">
        <div className="max-w-[900px] mx-auto text-center">
          <p className="font-sans text-[10px] uppercase text-[#c8b28a] font-medium tracking-[0.4em] mb-3">
            Our Promise
          </p>
          <h2 className="font-serif text-[clamp(26px,5vw,36px)] font-light text-[#1f2937] mb-6 tracking-[0.05em]">
            The Linen & Wool Rule
          </h2>
          <p className="font-sans text-base leading-[1.8] text-[#6b7280] max-w-[550px] mx-auto mb-6">
            Ancient wisdom knew what science now confirms: linen and wool should never be worn together.
            Their energy flows in opposite directions—when combined, they cancel to zero.
          </p>
          <p className="font-serif text-sm italic text-[#1f2937] max-w-[550px] mx-auto leading-relaxed">
            Our AI curation ensures these fabrics are never paired. What touches your skin matters
            too much to leave to chance.
          </p>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 px-6 bg-[#1f2937]">
        <div className="max-w-[500px] mx-auto text-center">
          <p className="font-sans text-[10px] uppercase text-[#c8b28a] font-medium tracking-[0.4em] mb-3">
            Join the Movement
          </p>
          <h2 className="font-serif text-[clamp(24px,5vw,32px)] font-light text-white mb-4 tracking-[0.05em]">
            Request an Invitation
          </h2>
          <p className="font-sans text-sm text-white/70 mb-8 leading-[1.8]">
            Join a select circle who understand that what touches your skin shapes your energy.
            Be among the first to access new collections and AI-powered styling.
          </p>

          {submitted ? (
            <div className="p-6 bg-[#c8b28a]/20 border border-[#c8b28a]">
              <p className="font-sans text-sm text-white">
                Welcome to Frequency & Form. Check your inbox for a confirmation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="px-6 py-4 bg-white/10 border border-white/20 text-white text-sm font-sans text-center outline-none transition-colors focus:border-[#c8b28a] placeholder:text-white/50"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-[#c8b28a] text-[#1f2937] text-[11px] font-sans font-medium tracking-[0.25em] uppercase transition-all hover:bg-[#b8a27a] disabled:opacity-50"
              >
                {isSubmitting ? 'Joining...' : 'Request Invitation'}
              </button>
            </form>
          )}

          <p className="font-sans mt-6 text-[11px] text-white/50">
            Women & Men · Natural Fibers Only · AI-Powered
          </p>
        </div>
      </section>
    </main>
  );
}
