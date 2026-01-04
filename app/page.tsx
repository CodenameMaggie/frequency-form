import Link from 'next/link';

export default function HomePage() {
  // Mock product data for featured products
  const featuredProducts = [
    {
      id: 1,
      name: 'Italian Linen Shirt',
      brand: '100% Capri',
      price: 28500,
      tier: 'healing',
      image: '/placeholder.jpg',
      slug: 'italian-linen-shirt'
    },
    {
      id: 2,
      name: 'Egyptian Cotton Tee',
      brand: 'Kotn',
      price: 5800,
      tier: 'foundation',
      image: '/placeholder.jpg',
      slug: 'egyptian-cotton-tee'
    },
    {
      id: 3,
      name: 'Cashmere Sweater',
      brand: 'Brunello Cucinelli',
      price: 129500,
      tier: 'healing',
      image: '/placeholder.jpg',
      slug: 'cashmere-sweater'
    },
    {
      id: 4,
      name: 'Merino Wool Turtleneck',
      brand: 'Loro Piana',
      price: 74500,
      tier: 'healing',
      image: '/placeholder.jpg',
      slug: 'merino-wool-turtleneck'
    },
  ];

  return (
    <>
      {/* SECTION 1: HERO - Editorial & Refined */}
      <section className="relative flex items-center justify-center" style={{ minHeight: 'calc(100vh - 5rem)' }}>
        <div className="container max-w-5xl text-center px-8 py-20 md:py-32">
          <p className="label text-[rgb(var(--color-accent))] mb-8 tracking-[0.25em]">
            NATURAL FIBERS ONLY
          </p>
          <h1 className="font-serif text-[clamp(3.5rem,8vw,7rem)] text-[rgb(var(--color-primary))] mb-10 leading-[0.95] tracking-[-0.02em] font-light">
            Dress in
            <br />
            Alignment
          </h1>
          <p className="text-[1.125rem] md:text-[1.25rem] text-[rgb(var(--color-text))] opacity-80 mb-16 max-w-2xl mx-auto leading-[1.7] font-light">
            Healing-tier fabrics at 5,000 Hz. Foundation essentials in organic cotton.
            <br className="hidden md:block" />
            Never synthetics.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link href="/shop?tier=healing" className="btn-primary inline-block">
              Shop Healing Tier
            </Link>
            <Link href="/shop?tier=foundation" className="btn-secondary inline-block">
              Shop Foundation Tier
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE SCIENCE - Refined Layout */}
      <section className="py-32 bg-[rgb(var(--color-muted))]">
        <div className="container max-w-4xl px-8">
          <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] text-center text-[rgb(var(--color-primary))] mb-12 font-light tracking-[-0.01em]">
            The Frequency of Fabric
          </h2>
          <p className="text-center text-[1.1875rem] text-[rgb(var(--color-text))] opacity-85 mb-20 max-w-3xl mx-auto leading-[1.8] font-light">
            In 2003, Dr. Heidi Yellen discovered that certain natural fibers resonate at 5,000 Hz—the same frequency that promotes healing in the human body. Her research using the Ag-Environ machine revealed that what we wear profoundly affects our energy.
          </p>

          {/* Three Stats - More Elegant */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-20 max-w-5xl mx-auto">
            <div className="text-center border-t border-[rgb(var(--color-primary))] border-opacity-20 pt-8">
              <p className="font-serif text-[3.5rem] text-[rgb(var(--color-accent))] mb-4 font-light tracking-tight">
                5,000 Hz
              </p>
              <p className="text-[0.6875rem] tracking-[0.2em] uppercase text-[rgb(var(--color-text))] opacity-60 mb-3">
                Healing Tier
              </p>
              <p className="text-[0.9375rem] text-[rgb(var(--color-text))] opacity-70 leading-relaxed font-light">
                Linen, Wool, Cashmere, Silk
              </p>
            </div>
            <div className="text-center border-t border-[rgb(var(--color-primary))] border-opacity-20 pt-8">
              <p className="font-serif text-[3.5rem] text-[rgb(var(--color-text))] mb-4 font-light tracking-tight">
                100 Hz
              </p>
              <p className="text-[0.6875rem] tracking-[0.2em] uppercase text-[rgb(var(--color-text))] opacity-60 mb-3">
                Foundation Tier
              </p>
              <p className="text-[0.9375rem] text-[rgb(var(--color-text))] opacity-70 leading-relaxed font-light">
                Organic Cotton, Hemp
              </p>
            </div>
            <div className="text-center border-t border-[rgb(var(--color-primary))] border-opacity-20 pt-8">
              <p className="font-serif text-[3.5rem] text-[rgb(var(--color-never))] mb-4 font-light tracking-tight">
                15 Hz
              </p>
              <p className="text-[0.6875rem] tracking-[0.2em] uppercase text-[rgb(var(--color-text))] opacity-60 mb-3">
                Synthetics (Never)
              </p>
              <p className="text-[0.9375rem] text-[rgb(var(--color-text))] opacity-70 leading-relaxed font-light">
                Polyester, Nylon, Acrylic
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link href="/about" className="btn-secondary inline-block">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3: TWO TIERS */}
      <section className="section-padding">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

            {/* Healing Tier */}
            <div className="relative">
              <div className="aspect-[4/5] bg-[rgb(var(--color-muted))] mb-6 flex items-center justify-center">
                <span className="text-[rgb(var(--color-text))] opacity-30 text-sm">
                  [Healing Tier Image]
                </span>
              </div>
              <div className="inline-block px-3 py-1 bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))] text-xs tracking-wider mb-4">
                5,000 HZ
              </div>
              <h3 className="font-serif text-3xl text-[rgb(var(--color-primary))] mb-4">
                Healing Tier
              </h3>
              <ul className="space-y-2 mb-6">
                <li className="text-[rgb(var(--color-text))]">Linen</li>
                <li className="text-[rgb(var(--color-text))]">Wool</li>
                <li className="text-[rgb(var(--color-text))]">Cashmere</li>
                <li className="text-[rgb(var(--color-text))]">Silk</li>
                <li className="text-[rgb(var(--color-text))]">Natural Fur</li>
              </ul>
              <Link
                href="/shop?tier=healing"
                className="inline-block px-6 py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] text-sm tracking-wider hover:opacity-90 transition-opacity"
              >
                SHOP HEALING TIER
              </Link>
            </div>

            {/* Foundation Tier */}
            <div className="relative">
              <div className="aspect-[4/5] bg-[rgb(var(--color-muted))] mb-6 flex items-center justify-center">
                <span className="text-[rgb(var(--color-text))] opacity-30 text-sm">
                  [Foundation Tier Image]
                </span>
              </div>
              <div className="inline-block px-3 py-1 bg-[rgb(var(--color-muted))] text-[rgb(var(--color-text))] text-xs tracking-wider mb-4">
                100 HZ
              </div>
              <h3 className="font-serif text-3xl text-[rgb(var(--color-primary))] mb-4">
                Foundation Tier
              </h3>
              <ul className="space-y-2 mb-6">
                <li className="text-[rgb(var(--color-text))]">Organic Cotton</li>
                <li className="text-[rgb(var(--color-text))]">Hemp</li>
              </ul>
              <Link
                href="/shop?tier=foundation"
                className="inline-block px-6 py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] text-sm tracking-wider hover:opacity-90 transition-opacity"
              >
                SHOP FOUNDATION TIER
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURED PRODUCTS */}
      <section className="section-padding bg-[rgb(var(--color-muted))]">
        <div className="container">
          <h2 className="font-serif text-4xl md:text-5xl text-center text-[rgb(var(--color-primary))] mb-16">
            New Arrivals
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="group"
              >
                <div className="relative mb-4 aspect-[3/4] bg-[rgb(var(--color-background))] overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-[rgb(var(--color-text))] opacity-20">
                    [Product Image]
                  </div>
                  {/* Frequency Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 text-xs tracking-wider ${
                    product.tier === 'healing'
                      ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))]'
                      : 'bg-[rgb(var(--color-muted))] text-[rgb(var(--color-text))]'
                  }`}>
                    {product.tier === 'healing' ? '5,000 HZ' : '100 HZ'}
                  </div>
                </div>
                <p className="text-xs text-[rgb(var(--color-text))] opacity-60 mb-1">
                  {product.brand}
                </p>
                <h4 className="font-serif text-lg text-[rgb(var(--color-primary))] mb-2 group-hover:opacity-70 transition-opacity">
                  {product.name}
                </h4>
                <p className="text-[rgb(var(--color-text))]">
                  ${(product.price / 100).toFixed(0)}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-block px-8 py-4 border border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))] text-sm tracking-wider hover:bg-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-background))] transition-all"
            >
              VIEW ALL PRODUCTS
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: THE PROMISE */}
      <section className="section-padding">
        <div className="container max-w-4xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-[rgb(var(--color-primary))] mb-8">
            What We Never Carry
          </h2>
          <p className="text-lg text-[rgb(var(--color-text))] mb-6 leading-relaxed">
            Synthetic fabrics—polyester, nylon, acrylic, rayon—measure at 15 Hz. The same frequency as diseased tissue. We reject them entirely.
          </p>
          <p className="text-lg text-[rgb(var(--color-text))] leading-relaxed">
            We also honor the ancient wisdom of <em>shatnez</em>: linen and wool are never blended. Their opposing energy flows cancel each other to 0 Hz. Our AI styling system ensures these fabrics are never paired in your wardrobe.
          </p>
        </div>
      </section>

      {/* SECTION 6: EMAIL SIGNUP */}
      <section className="section-padding bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))]">
        <div className="container max-w-2xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-[rgb(var(--color-background))] mb-4">
            Join the Frequency
          </h2>
          <p className="text-lg text-[rgb(var(--color-background))] opacity-80 mb-8">
            Be the first to know about new arrivals and exclusive collections.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email"
              required
              className="flex-1 px-6 py-4 bg-[rgb(var(--color-background))] bg-opacity-10 border border-[rgb(var(--color-background))] border-opacity-30 text-[rgb(var(--color-background))] placeholder-[rgb(var(--color-background))] placeholder-opacity-50 focus:border-opacity-60 focus:outline-none"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-[rgb(var(--color-accent))] text-[rgb(var(--color-primary))] font-medium text-sm tracking-wider hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
