'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount] = useState(0);

  return (
    <header className="sticky top-0 z-50 bg-[rgb(var(--color-background))] border-b border-[rgb(var(--champagne-light))] transition-colors">
      <div className="container">
        <div className="flex items-center justify-between h-16">

          {/* Logo - Small and refined */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="font-serif text-xs md:text-sm tracking-[0.15em] text-[rgb(var(--navy))] hover:opacity-70 transition-opacity font-light">
              Frequency & Form
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/shop"
              className="text-xs tracking-wider text-[rgb(var(--text-muted))] hover:text-[rgb(var(--navy))] transition-colors font-sans"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-xs tracking-wider text-[rgb(var(--text-muted))] hover:text-[rgb(var(--navy))] transition-colors font-sans"
            >
              The Science
            </Link>
            <Link
              href="/about"
              className="text-xs tracking-wider text-[rgb(var(--text-muted))] hover:text-[rgb(var(--navy))] transition-colors font-sans"
            >
              About
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Search Icon */}
            <button
              className="p-2 hover:opacity-70 transition-opacity"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-[rgb(var(--text-muted))]" />
            </button>

            {/* Cart Icon with Count */}
            <Link
              href="/cart"
              className="relative p-2 hover:opacity-70 transition-opacity"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-4 h-4 text-[rgb(var(--text-muted))]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[rgb(var(--champagne))] text-[rgb(var(--navy))] text-xs font-sans font-medium rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:opacity-70 transition-opacity"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[rgb(var(--text-muted))]" />
              ) : (
                <Menu className="w-5 h-5 text-[rgb(var(--text-muted))]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgb(var(--champagne-light))] bg-[rgb(var(--color-background))]">
          <nav className="container py-6 flex flex-col space-y-4">
            <Link
              href="/shop"
              className="text-sm tracking-wider text-[rgb(var(--text-muted))] hover:text-[rgb(var(--navy))] transition-colors py-2 font-sans"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-sm tracking-wider text-[rgb(var(--text-muted))] hover:text-[rgb(var(--navy))] transition-colors py-2 font-sans"
              onClick={() => setMobileMenuOpen(false)}
            >
              The Science
            </Link>
            <Link
              href="/about"
              className="text-sm tracking-wider text-[rgb(var(--text-muted))] hover:text-[rgb(var(--navy))] transition-colors py-2 font-sans"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
