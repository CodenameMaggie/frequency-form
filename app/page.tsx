'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="max-w-[900px] mx-auto px-6 pt-[60px] pb-20 text-center">
        {/* Hero Line */}
        <div className="w-px h-[50px] mx-auto mb-7 bg-gradient-to-b from-transparent to-[rgb(var(--champagne))]"></div>

        {/* Logo */}
        <h1 className="text-[clamp(32px,8vw,52px)] font-light tracking-[0.15em] uppercase mb-3 text-[rgb(var(--navy))]">
          Frequency & Form
        </h1>

        {/* Tagline */}
        <p className="text-[19px] italic font-light text-[rgb(var(--champagne-dark))] mb-9 tracking-[0.04em]">
          Dress in Alignment
        </p>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mb-9">
          <span className="w-[50px] h-px bg-[rgb(var(--champagne))]"></span>
          <i className="w-1.5 h-1.5 bg-[rgb(var(--navy))] rounded-full"></i>
          <span className="w-[50px] h-px bg-[rgb(var(--champagne))]"></span>
        </div>

        {/* Hero Text */}
        <p className="text-base leading-[2.2] text-[rgb(var(--text-muted))] max-w-[520px] mx-auto font-sans font-light">
          Curated natural fiber garments for women and men. Each piece selected not just for its beauty, but for its frequency—the invisible energy that touches your skin and shapes how you feel.
        </p>
      </section>

      {/* The Science Section */}
      <section className="max-w-[900px] mx-auto px-6 mb-[70px]">
        {/* Section Label */}
        <p className="text-center text-[9px] tracking-[0.4em] uppercase text-[rgb(var(--champagne-dark))] font-sans font-medium mb-3">
          The Science
        </p>

        {/* Section Title */}
        <h2 className="text-center text-[28px] font-light text-[rgb(var(--navy))] mb-4 tracking-[0.05em]">
          The Frequency of Fabric
        </h2>

        {/* Section Subtitle */}
        <p className="text-center text-sm text-[rgb(var(--text-muted))] font-sans font-light mb-10 max-w-[500px] mx-auto leading-[1.8]">
          In 2003, Dr. Heidi Yellen measured the bioenergetic frequencies of fabrics. What she discovered changed everything we thought we knew about getting dressed.
        </p>

        {/* Frequency Tiers */}
        <div className="flex flex-col gap-[3px] mb-6">

          {/* Elevating Tier - Champagne */}
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-[140px] bg-[rgb(var(--champagne))] p-6 md:py-6 md:px-5 flex flex-col justify-center text-center">
              <span className="text-[26px] font-light text-[rgb(var(--navy))] mb-0.5">5,000 Hz</span>
              <span className="text-[8px] tracking-[0.25em] uppercase font-sans font-medium text-[rgb(var(--navy))]">Elevating</span>
            </div>
            <div className="flex-1 bg-[rgb(var(--champagne-pale))] p-6 md:py-6 md:px-7 flex flex-col justify-center">
              <h3 className="text-lg font-normal mb-1.5 tracking-[0.05em] text-[rgb(var(--navy))]">Healing Tier</h3>
              <p className="text-[13px] font-sans font-light mb-2 text-[rgb(var(--text-muted))]">Linen · Wool · Cashmere · Hemp</p>
              <p className="text-xs font-sans font-light italic opacity-80 text-[rgb(var(--text-muted))]">50× your body's natural frequency. These fabrics don't just clothe you—they elevate you.</p>
            </div>
          </div>

          {/* Harmonizing Tier - Ivory/White */}
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-[140px] bg-white border border-[rgb(var(--champagne-light))] md:border-r-0 p-6 md:py-6 md:px-5 flex flex-col justify-center text-center">
              <span className="text-[26px] font-light text-[rgb(var(--champagne-dark))] mb-0.5">100 Hz</span>
              <span className="text-[8px] tracking-[0.25em] uppercase font-sans font-medium text-[rgb(var(--champagne-dark))]">Harmonizing</span>
            </div>
            <div className="flex-1 bg-white border border-[rgb(var(--champagne-light))] md:border-l-0 p-6 md:py-6 md:px-7 flex flex-col justify-center">
              <h3 className="text-lg font-normal mb-1.5 tracking-[0.05em] text-[rgb(var(--navy))]">Foundation Tier</h3>
              <p className="text-[13px] font-sans font-light mb-2 text-[rgb(var(--text-muted))]">Organic Cotton</p>
              <p className="text-xs font-sans font-light italic opacity-80 text-[rgb(var(--text-soft))]">Perfectly in tune with your body. Neutral, comfortable, and never depleting.</p>
            </div>
          </div>

          {/* Never Tier - Dark Navy */}
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-[140px] bg-[rgb(var(--navy))] p-6 md:py-6 md:px-5 flex flex-col justify-center text-center">
              <span className="text-[26px] font-light text-[#c9a0a0] mb-0.5">0–15 Hz</span>
              <span className="text-[8px] tracking-[0.25em] uppercase font-sans font-medium text-[#c9a0a0]">Depleting</span>
            </div>
            <div className="flex-1 bg-[rgb(var(--navy))] p-6 md:py-6 md:px-7 flex flex-col justify-center">
              <h3 className="text-lg font-normal mb-1.5 tracking-[0.05em] text-[rgb(var(--ivory))]">What We Never Carry</h3>
              <p className="text-[13px] font-sans font-light mb-2 text-[#a08080] line-through decoration-[#806060]">Polyester · Nylon · Acrylic · Rayon</p>
              <p className="text-xs font-sans font-light italic text-[#c9a0a0]">The same frequency as diseased tissue. We believe you deserve better.</p>
            </div>
          </div>

        </div>

        {/* Body Reference */}
        <div className="text-center p-5 bg-[rgb(var(--ivory-warm))] border-l-[3px] border-[rgb(var(--champagne))] mt-6">
          <p className="text-[13px] text-[rgb(var(--text-muted))] font-sans font-light">
            The healthy human body resonates at <strong className="text-[rgb(var(--navy))] font-medium">100 Hz</strong>. Everything you wear either elevates that frequency, matches it, or drains it.
          </p>
        </div>
      </section>

      {/* The Promise Section */}
      <section className="text-center py-[50px] px-6 bg-[rgb(var(--champagne-pale))] mb-[70px]">
        <p className="text-[9px] tracking-[0.4em] uppercase text-[rgb(var(--champagne-dark))] font-sans font-medium mb-3">
          Our Promise
        </p>
        <h2 className="text-[28px] font-light text-[rgb(var(--navy))] mb-4 tracking-[0.05em]">
          The Linen & Wool Rule
        </h2>
        <p className="text-[15px] leading-[2.2] text-[rgb(var(--text-muted))] max-w-[480px] mx-auto mb-6 font-sans font-light">
          Ancient wisdom knew what science now confirms: linen and wool should never be worn together. Their energy flows in opposite directions—when combined, they cancel to zero.
        </p>
        <p className="text-[13px] italic text-[rgb(var(--navy))] max-w-[400px] mx-auto">
          Our curation ensures these fabrics are never paired. What touches your skin matters too much to leave to chance.
        </p>
      </section>

      {/* Signup Section */}
      <section className="text-center max-w-[420px] mx-auto px-6 pb-20">
        <p className="text-[9px] tracking-[0.4em] uppercase text-[rgb(var(--champagne-dark))] font-sans font-medium mb-3">
          Join Us
        </p>
        <h2 className="text-[28px] font-light text-[rgb(var(--navy))] mb-3 tracking-[0.05em]">
          Request an Invitation
        </h2>
        <p className="text-sm text-[rgb(var(--text-muted))] font-sans font-light mb-8 leading-[1.8]">
          We're welcoming a select circle who understand that what touches your skin shapes your energy. Be among the first to shop the collection.
        </p>
        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Your email address"
            required
            className="px-5 py-4 bg-white border border-[rgb(var(--champagne))] text-[rgb(var(--navy))] text-[13px] font-sans font-light text-center outline-none transition-colors focus:border-[rgb(var(--navy))] placeholder:text-[rgb(var(--champagne-dark))]"
          />
          <button
            type="submit"
            className="px-8 py-4 bg-[rgb(var(--navy))] text-[rgb(var(--champagne-light))] text-[10px] font-sans font-medium tracking-[0.28em] uppercase transition-colors hover:bg-[rgb(var(--navy-light))]"
          >
            Request Invitation
          </button>
        </form>
        <p className="mt-6 text-[11px] text-[rgb(var(--text-soft))] font-sans font-light">
          Women & Men · Natural Fibers Only
        </p>
      </section>
    </>
  );
}
