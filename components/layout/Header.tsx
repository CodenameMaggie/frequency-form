'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-[#faf8f4] border-b border-[#e8dcc4] py-4">
      <div className="max-w-[1200px] mx-auto px-6">
        <nav className="flex items-center justify-center gap-12">
          <Link
            href="/shop"
            className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors"
          >
            Shop
          </Link>
          <Link
            href="/about"
            className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors"
          >
            The Science
          </Link>
          <Link
            href="/about"
            className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
