'use client';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-[900px] mx-auto px-6 pt-[60px] pb-20 text-center">
        {/* Hero Line */}
        <div className="w-px h-[50px] mx-auto mb-7 bg-gradient-to-b from-transparent to-[#d4c8a8]"></div>

        {/* Logo */}
        <h1 className="font-serif text-[clamp(32px,8vw,52px)] font-light tracking-[0.15em] uppercase mb-3 text-[#1e2a3a]">
          Frequency & Form
        </h1>

        {/* Tagline */}
        <div className="text-center mb-9">
          <p className="font-serif text-[19px] italic font-light text-[#b8a888] tracking-[0.04em] inline-block pl-[0.04em]">
            Dress in Alignment
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mb-9">
          <span className="w-[50px] h-px bg-[#d4c8a8]"></span>
          <i className="w-1.5 h-1.5 bg-[#1e2a3a] rounded-full"></i>
          <span className="w-[50px] h-px bg-[#d4c8a8]"></span>
        </div>

        {/* Hero Text */}
        <p className="font-sans text-base leading-[2.2] text-[#5a6a7a] max-w-[520px] mx-auto font-light text-center">
          Curated natural fiber garments for women and men. Each piece selected not just for its beauty, but for its frequency—the invisible energy that touches your skin and shapes how you feel.
        </p>
      </section>

      {/* The Science Section */}
      <section className="max-w-[900px] mx-auto px-6 mb-[70px]">
        {/* Section Label */}
        <div className="w-full text-center mb-3">
          <p className="text-[9px] uppercase text-[#b8a888] font-sans font-medium tracking-[0.4em] inline-block pl-[0.4em]">
            The Science
          </p>
        </div>

        {/* Section Title */}
        <h2 className="font-serif text-center text-[28px] font-light text-[#1e2a3a] mb-4 tracking-[0.05em]">
          The Frequency of Fabric
        </h2>

        {/* Section Subtitle */}
        <p className="text-center text-sm text-[#5a6a7a] font-sans font-light mb-10 max-w-[500px] mx-auto leading-[1.8]">
          In 2003, Dr. Heidi Yellen measured the bioenergetic frequencies of fabrics. What she discovered changed everything we thought we knew about getting dressed.
        </p>

        {/* Frequency Tiers */}
        <div className="flex flex-col gap-[3px] mb-6">

          {/* Elevating Tier */}
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-[140px] bg-[#d4c8a8] p-6 md:py-6 md:px-5 flex flex-col justify-center text-center">
              <span className="font-serif text-[26px] font-light text-[#1e2a3a] mb-0.5">5,000 Hz</span>
              <span className="font-sans text-[8px] tracking-[0.25em] uppercase font-medium text-[#1e2a3a]">Elevating</span>
            </div>
            <div className="flex-1 bg-[#f5f0e4] p-6 md:py-6 md:px-7 flex flex-col justify-center text-center">
              <h3 className="font-serif text-lg font-normal mb-1.5 tracking-[0.05em] text-[#1e2a3a]">Healing Tier</h3>
              <p className="font-sans text-[13px] font-light mb-2 text-[#5a6a7a]">Linen · Wool · Cashmere · Hemp</p>
              <p className="font-sans text-xs font-light italic opacity-80 text-[#5a6a7a]">50× your body's natural frequency. These fabrics don't just clothe you—they elevate you.</p>
            </div>
          </div>

          {/* Harmonizing Tier */}
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-[140px] bg-white border border-[#e8dcc4] md:border-r-0 p-6 md:py-6 md:px-5 flex flex-col justify-center text-center">
              <span className="font-serif text-[26px] font-light text-[#b8a888] mb-0.5">100 Hz</span>
              <span className="font-sans text-[8px] tracking-[0.25em] uppercase font-medium text-[#b8a888]">Harmonizing</span>
            </div>
            <div className="flex-1 bg-white border border-[#e8dcc4] md:border-l-0 p-6 md:py-6 md:px-7 flex flex-col justify-center text-center">
              <h3 className="font-serif text-lg font-normal mb-1.5 tracking-[0.05em] text-[#1e2a3a]">Foundation Tier</h3>
              <p className="font-sans text-[13px] font-light mb-2 text-[#5a6a7a]">Organic Cotton</p>
              <p className="font-sans text-xs font-light italic opacity-80 text-[#8a9aaa]">Perfectly in tune with your body. Neutral, comfortable, and never depleting.</p>
            </div>
          </div>

          {/* Never Tier */}
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-[140px] bg-[#1e2a3a] p-6 md:py-6 md:px-5 flex flex-col justify-center text-center">
              <span className="font-serif text-[26px] font-light text-white mb-0.5">0–15 Hz</span>
              <span className="font-sans text-[8px] tracking-[0.25em] uppercase font-medium text-white opacity-70">Depleting</span>
            </div>
            <div className="flex-1 bg-[#1e2a3a] p-6 md:py-6 md:px-7 flex flex-col justify-center text-center">
              <h3 className="font-serif text-lg font-normal mb-2 tracking-[0.05em] text-white">What We Never Carry</h3>
              <p className="font-sans text-[13px] font-light mb-3 text-white opacity-90">Polyester · Nylon · Acrylic · Rayon</p>
              <p className="font-sans text-xs font-light leading-relaxed text-white opacity-70">Synthetic fabrics measure at the same frequency as diseased tissue—just 15 Hz. They drain your natural energy rather than support it. We reject them entirely.</p>
            </div>
          </div>

        </div>

        {/* Body Reference */}
        <div className="text-center p-5 bg-[#f5f0e8] border-l-[3px] border-[#d4c8a8] mt-6">
          <p className="font-sans text-[13px] text-[#5a6a7a] font-light">
            The healthy human body resonates at <strong className="text-[#1e2a3a] font-medium">100 Hz</strong>. Everything you wear either elevates that frequency, matches it, or drains it.
          </p>
        </div>
      </section>

      {/* The Promise Section */}
      <section className="py-[50px] px-6 bg-[#f5f0e4]">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="flex justify-center mb-3">
            <p className="font-sans text-[9px] uppercase text-[#b8a888] font-medium tracking-[0.4em] pl-[0.4em]">
              Our Promise
            </p>
          </div>
          <h2 className="font-serif text-[28px] font-light text-[#1e2a3a] mb-6 tracking-[0.05em]">
            The Linen & Wool Rule
          </h2>
          <p className="font-sans text-[15px] leading-[1.7] text-[#5a6a7a] max-w-[520px] mx-auto mb-6 font-light text-center">
            Ancient wisdom knew what science now confirms: linen and wool should never be worn together. Their energy flows in opposite directions—when combined, they cancel to zero.
          </p>
          <p className="font-serif text-[13px] italic text-[#1e2a3a] max-w-[520px] mx-auto leading-relaxed text-center">
            Our curation ensures these fabrics are never paired. What touches your skin matters too much to leave to chance.
          </p>
        </div>
      </section>

      {/* Signup Section */}
      <section className="py-20 px-6">
        <div className="max-w-[420px] mx-auto text-center">
          <div className="text-center mb-3">
            <p className="font-sans text-[9px] uppercase text-[#b8a888] font-medium tracking-[0.4em] inline-block pl-[0.4em]">
              Join Us
            </p>
          </div>
          <h2 className="font-serif text-[28px] font-light text-[#1e2a3a] mb-4 tracking-[0.05em]">
            Request an Invitation
          </h2>
          <p className="font-sans text-sm text-[#5a6a7a] font-light mb-8 leading-[1.8] text-center">
            We're welcoming a select circle who understand that what touches your skin shapes your energy. Be among the first to shop the collection.
          </p>
          <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              required
              className="px-5 py-4 bg-white border border-[#d4c8a8] text-[#1e2a3a] text-[13px] font-sans font-light text-center outline-none transition-colors focus:border-[#1e2a3a] placeholder:text-[#b8a888]"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-[#1e2a3a] text-[#e8dcc4] text-[10px] font-sans font-medium tracking-[0.28em] uppercase transition-colors hover:bg-[#2e3a4a]"
            >
              Request Invitation
            </button>
          </form>
          <p className="font-sans mt-6 text-[11px] text-[#8a9aaa] font-light">
            Women & Men · Natural Fibers Only
          </p>
        </div>
      </section>
    </main>
  );
}
