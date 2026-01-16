'use client';

import Link from 'next/link';
import { ShoppingBag, Sparkles, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import CartDrawer from '@/components/cart/CartDrawer';
import { useEffect, useState } from 'react';

export default function Header() {
  const { openCart, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setItemCount(getItemCount());
    }
  }, [mounted, getItemCount]);

  return (
    <>
      <header className="bg-[#fcfaf5] border-b border-[#f5f3ee] py-4">
        <div className="max-w-[1200px] mx-auto px-6">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="font-serif text-xl tracking-[0.15em] text-[#1f2937]">
              F&F
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/shop"
                className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#6b7280] hover:text-[#1f2937] transition-colors"
              >
                Shop
              </Link>
              <Link
                href="/ff/lookbook"
                className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#6b7280] hover:text-[#1f2937] transition-colors"
              >
                Lookbook
              </Link>
              <Link
                href="/ff/style-studio"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#c8b28a]/20 text-[#1f2937] font-sans text-[11px] tracking-[0.15em] uppercase hover:bg-[#c8b28a]/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Style Studio
              </Link>
              <Link
                href="/about"
                className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#6b7280] hover:text-[#1f2937] transition-colors"
              >
                The Science
              </Link>
              <Link
                href="/partners"
                className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#6b7280] hover:text-[#1f2937] transition-colors"
              >
                Partners
              </Link>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Cart icon */}
              <button
                onClick={openCart}
                className="relative text-[#6b7280] hover:text-[#1f2937] transition-colors"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#c8b28a] text-[#1f2937] rounded-full flex items-center justify-center text-[10px] font-sans font-medium">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-[#6b7280] hover:text-[#1f2937] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-[#f5f3ee]">
              <div className="flex flex-col gap-4">
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-[12px] tracking-[0.15em] uppercase text-[#6b7280] hover:text-[#1f2937] transition-colors py-2"
                >
                  Shop
                </Link>
                <Link
                  href="/ff/lookbook"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-[12px] tracking-[0.15em] uppercase text-[#6b7280] hover:text-[#1f2937] transition-colors py-2"
                >
                  Lookbook
                </Link>
                <Link
                  href="/ff/style-studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-[#c8b28a]/20 text-[#1f2937] font-sans text-[12px] tracking-[0.15em] uppercase w-full"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Style Studio
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-[12px] tracking-[0.15em] uppercase text-[#6b7280] hover:text-[#1f2937] transition-colors py-2"
                >
                  The Science
                </Link>
                <Link
                  href="/partners"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-sans text-[12px] tracking-[0.15em] uppercase text-[#6b7280] hover:text-[#1f2937] transition-colors py-2"
                >
                  Partners
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
