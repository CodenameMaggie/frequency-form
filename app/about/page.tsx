import FabricTooltip from '@/components/product/FabricTooltip';

export default function AboutPage() {
  const fabricData = [
    {
      tier: 'Healing Tier',
      frequency: '5,000 Hz',
      fabrics: [
        { name: 'Linen', type: 'linen' as const, description: 'Antibacterial, tissue regeneration, highest infrared reflection' },
        { name: 'Wool', type: 'wool' as const, description: 'Grounding, protective, thermoregulating' },
        { name: 'Cashmere', type: 'cashmere' as const, description: 'Promotes relaxation, emotional stability' },
        { name: 'Silk', type: 'silk' as const, description: 'Spiritual protection, purity (5,000-10,000 Hz unprocessed)' },
        { name: 'Natural Fur', type: 'fur' as const, description: 'Same biological origin as wool, 50+ year lifespan' },
      ],
      color: 'rgb(var(--color-accent))'
    },
    {
      tier: 'Foundation Tier',
      frequency: '100 Hz',
      fabrics: [
        { name: 'Organic Cotton', type: 'cotton' as const, description: 'Matches human frequency, breathable, comfortable' },
        { name: 'Hemp', type: 'hemp' as const, description: 'Durable, sustainable, antibacterial, UV resistant' },
      ],
      color: 'rgb(var(--color-text))'
    },
    {
      tier: 'Never',
      frequency: '15 Hz',
      fabrics: [
        { name: 'Polyester', description: 'Synthetic, same frequency as diseased tissue' },
        { name: 'Nylon', description: 'Synthetic, depletes natural energy' },
        { name: 'Acrylic', description: 'Synthetic, blocks healing frequencies' },
        { name: 'Rayon', description: 'Processed cellulose, unstable frequency' },
      ],
      color: 'rgb(var(--color-never))'
    },
  ];

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="py-16 md:py-20 bg-[rgb(var(--color-muted))]">
        <div className="container max-w-4xl text-center px-6">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[rgb(var(--color-primary))] mb-6 font-light">
            The Science of Fabric Frequency
          </h1>
          <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed opacity-75 text-center">
            Why what you wear matters more than you think
          </p>
        </div>
      </section>

      {/* The Research */}
      <section className="py-16 md:py-20">
        <div className="container max-w-4xl px-6">
          <h2 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-primary))] mb-8 text-center font-light">
            The Research
          </h2>

          <div className="space-y-6 text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed max-w-3xl mx-auto text-center">
            <p>
              In 2003, Dr. Heidi Yellen conducted groundbreaking research measuring the bioenergetic frequencies of different fabrics using the Ag-Environ machine, a device originally developed to measure the energy of foods and their effect on the human body.
            </p>

            <p>
              Her discovery was revolutionary: certain natural fibers resonate at 5,000 Hz—a frequency that promotes healing and regeneration in human tissue. The human body at rest maintains a baseline frequency of approximately 100 Hz, while diseased tissue measures at just 15 Hz.
            </p>

            <p>
              What we discovered is that the fabrics touching our skin all day, every day, profoundly affect our energetic state. Wearing healing-tier fabrics elevates our frequency. Wearing synthetics depletes it.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-6 bg-[rgb(var(--color-muted))]">
              <p className="text-xs tracking-wider uppercase text-[rgb(var(--color-text))] opacity-60 mb-2">
                Human Baseline
              </p>
              <p className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-text))] mb-2 font-light">100 Hz</p>
              <p className="text-sm text-[rgb(var(--color-text))] opacity-70">
                Healthy resting state
              </p>
            </div>
            <div className="text-center p-6 bg-[rgb(var(--color-muted))]">
              <p className="text-xs tracking-wider uppercase text-[rgb(var(--color-text))] opacity-60 mb-2">
                Healing Fabrics
              </p>
              <p className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-accent))] mb-2 font-light">5,000 Hz</p>
              <p className="text-sm text-[rgb(var(--color-text))] opacity-70">
                Promotes regeneration
              </p>
            </div>
            <div className="text-center p-6 bg-[rgb(var(--color-muted))]">
              <p className="text-xs tracking-wider uppercase text-[rgb(var(--color-text))] opacity-60 mb-2">
                Diseased Tissue
              </p>
              <p className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-never))] mb-2 font-light">15 Hz</p>
              <p className="text-sm text-[rgb(var(--color-text))] opacity-70">
                Same as synthetics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Frequency Chart */}
      <section className="py-16 md:py-20 bg-[rgb(var(--color-muted))]" id="fabrics">
        <div className="container max-w-5xl px-6">
          <h2 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-primary))] mb-12 text-center font-light">
            The Frequency Chart
          </h2>

          <div className="space-y-8">
            {fabricData.map((category, idx) => (
              <div key={idx} className="bg-[rgb(var(--color-background))] p-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[rgb(var(--color-muted))]">
                  <h3 className="font-serif text-2xl text-[rgb(var(--color-primary))]">
                    {category.tier}
                  </h3>
                  <span
                    className="font-serif text-3xl font-medium"
                    style={{ color: category.color }}
                  >
                    {category.frequency}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.fabrics.map((fabric, fabricIdx) => (
                    <div key={fabricIdx}>
                      <h4 className="font-sans font-medium text-[rgb(var(--color-primary))] mb-2">
                        {'type' in fabric ? (
                          <FabricTooltip fabricType={fabric.type}>
                            {fabric.name}
                          </FabricTooltip>
                        ) : (
                          fabric.name
                        )}
                      </h4>
                      <p className="text-sm text-[rgb(var(--color-text))] opacity-70">
                        {fabric.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Healing Fabrics */}
      <section className="py-16 md:py-20">
        <div className="container max-w-4xl px-6">
          <h2 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-primary))] mb-12 text-center font-light">
            Healing Tier Fabrics
          </h2>

          <div className="space-y-12">
            {/* Linen */}
            <div>
              <h3 className="font-serif text-2xl text-[rgb(var(--color-primary))] mb-4 font-light">
                <FabricTooltip fabricType="linen">Linen</FabricTooltip>
              </h3>
              <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed mb-3">
                The most powerful healing fabric. Linen is naturally antibacterial and promotes tissue regeneration. It has the highest infrared reflection of any natural fiber, making it uniquely effective at promoting healing energy.
              </p>
              <p className="text-sm text-[rgb(var(--color-text))] opacity-70">
                Note: Linen energy flows left-to-right. Never blend or layer with wool (which flows right-to-left), as the opposing flows cancel to 0 Hz.
              </p>
            </div>

            {/* Wool */}
            <div>
              <h3 className="font-serif text-2xl text-[rgb(var(--color-primary))] mb-4 font-light">
                <FabricTooltip fabricType="wool">Wool</FabricTooltip>
              </h3>
              <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed">
                Grounding, protective, and thermoregulating. Wool provides exceptional insulation while maintaining 5,000 Hz healing frequency. Ideal for winter layering and cold-weather protection.
              </p>
            </div>

            {/* Cashmere */}
            <div>
              <h3 className="font-serif text-2xl text-[rgb(var(--color-primary))] mb-4 font-light">
                <FabricTooltip fabricType="cashmere">Cashmere</FabricTooltip>
              </h3>
              <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed">
                Promotes relaxation and emotional stability. The luxurious softness of cashmere isn't just about comfort—it's about maintaining a high-frequency state that supports mental and emotional well-being.
              </p>
            </div>

            {/* Silk */}
            <div>
              <h3 className="font-serif text-2xl text-[rgb(var(--color-primary))] mb-4 font-light">
                <FabricTooltip fabricType="silk">Silk</FabricTooltip>
              </h3>
              <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed">
                Spiritual protection and purity. When unprocessed, silk can measure between 5,000-10,000 Hz—the highest of any natural fiber. It's hypoallergenic and has been revered for millennia as a sacred fabric.
              </p>
            </div>

            {/* Natural Fur */}
            <div>
              <h3 className="font-serif text-2xl text-[rgb(var(--color-primary))] mb-4 font-light">
                <FabricTooltip fabricType="fur">Natural Fur</FabricTooltip>
              </h3>
              <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed">
                Shares the same biological origin as wool and cashmere, maintaining 5,000 Hz. When ethically sourced and properly cared for, natural fur can last 50+ years, making it one of the most sustainable luxury materials available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Linen + Wool Rule */}
      <section className="py-16 md:py-20 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))]">
        <div className="container max-w-4xl text-center px-6">
          <h2 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-background))] mb-8 font-light">
            The Linen + Wool Rule
          </h2>

          <div className="max-w-2xl mx-auto space-y-6 text-base md:text-lg leading-relaxed text-center">
            <p>
              Ancient wisdom meets modern science: linen and wool must never be worn together.
            </p>

            <p>
              Linen's energy flows left-to-right. Wool's energy flows right-to-left. When combined, these opposing flows cancel each other completely, reducing the combined frequency to 0 Hz.
            </p>

            <p>
              This prohibition appears in Deuteronomy 22:11 as <em>shatnez</em>—the ancient Hebrew term for forbidden mixtures. What seemed like religious law was actually energetic wisdom.
            </p>

            <p className="text-[rgb(var(--color-accent))] font-medium">
              Our AI styling system automatically prevents linen and wool from being paired in your wardrobe.
            </p>
          </div>
        </div>
      </section>

      {/* Foundation Tier */}
      <section className="py-16 md:py-20">
        <div className="container max-w-4xl px-6">
          <h2 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-primary))] mb-12 text-center font-light">
            Foundation Tier
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="font-serif text-2xl text-[rgb(var(--color-primary))] mb-4 font-light">
                <FabricTooltip fabricType="cotton">Organic Cotton</FabricTooltip>
              </h3>
              <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed">
                Matches the human body's baseline frequency of 100 Hz. Organic cotton doesn't elevate your frequency like healing-tier fabrics, but it doesn't deplete it either. It's the perfect foundation for everyday basics—breathable, comfortable, and energetically neutral.
              </p>
            </div>

            <div>
              <h3 className="font-serif text-2xl text-[rgb(var(--color-primary))] mb-4 font-light">
                <FabricTooltip fabricType="hemp">Hemp</FabricTooltip>
              </h3>
              <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed">
                Durable and sustainable at 100 Hz. Hemp is naturally antibacterial, UV resistant, and becomes softer with each wash. It's one of the most environmentally friendly fabrics available while maintaining neutral frequency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Standards */}
      <section className="py-16 md:py-20 bg-[rgb(var(--color-muted))]" id="standards">
        <div className="container max-w-4xl px-6">
          <h2 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-primary))] mb-12 text-center font-light">
            Our Standards
          </h2>

          <div className="space-y-6 text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed">
            <div>
              <h3 className="font-sans text-sm tracking-wider uppercase mb-3 text-[rgb(var(--color-accent))]">
                Artisan Partnerships Only
              </h3>
              <p>
                We partner exclusively with heritage brands and artisan makers who share our commitment to natural fibers and exceptional craftsmanship. No fast fashion. No mass production.
              </p>
            </div>

            <div>
              <h3 className="font-sans text-sm tracking-wider uppercase mb-3 text-[rgb(var(--color-accent))]">
                Full Fabric Transparency
              </h3>
              <p>
                Every product includes complete fabric composition and frequency information. You'll never have to guess what you're wearing or how it affects your energy.
              </p>
            </div>

            <div>
              <h3 className="font-sans text-sm tracking-wider uppercase mb-3 text-[rgb(var(--color-accent))]">
                European Heritage Brands
              </h3>
              <p>
                We prioritize brands from Italy, France, Scotland, and other regions with centuries-long textile traditions. Quality and provenance matter.
              </p>
            </div>

            <div>
              <h3 className="font-sans text-sm tracking-wider uppercase mb-3 text-[rgb(var(--color-accent))]">
                Ethical Sourcing
              </h3>
              <p>
                All materials are ethically sourced and certified where possible. We believe in full supply chain transparency and fair labor practices.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
