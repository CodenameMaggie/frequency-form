'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import CartDrawer from '@/components/cart/CartDrawer';
import { useEffect, useState } from 'react';

export default function Header() {
  const { openCart, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [itemCount, setItemCount] = useState(0);

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
      <header className="bg-[#faf8f4] border-b border-[#e8dcc4] py-4">
        <div className="max-w-[1200px] mx-auto px-6">
          <nav className="flex items-center justify-between">
            {/* Left spacer for balance */}
            <div className="w-10"></div>

            {/* Center navigation */}
            <div className="flex items-center gap-12">
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
              <Link
                href="/admin/login"
                className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors"
              >
                Admin
              </Link>
              <Link
                href="/seller/login"
                className="font-sans text-[11px] tracking-[0.2em] uppercase text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors"
              >
                Seller
              </Link>
            </div>

            {/* Cart icon */}
            <button
              onClick={openCart}
              className="relative text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#d4c8a8] text-[#1e2a3a] rounded-full flex items-center justify-center text-[10px] font-sans font-medium">
                  {itemCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
