'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount] = useState(0); // Will be connected to cart state later

  return (
    <header className="sticky top-0 z-50 bg-[rgb(var(--color-background))] border-b border-[rgb(var(--color-muted))] transition-colors">
      <div className="container">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="font-serif text-xl md:text-2xl tracking-[0.2em] text-[rgb(var(--color-primary))] hover:opacity-70 transition-opacity">
              FREQUENCY & FORM
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/shop"
              className="text-sm tracking-wider text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-sm tracking-wider text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] transition-colors"
            >
              The Science
            </Link>
            <Link
              href="/about"
              className="text-sm tracking-wider text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] transition-colors"
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
              <Search className="w-5 h-5 text-[rgb(var(--color-text))]" />
            </button>

            {/* Cart Icon with Count */}
            <Link
              href="/cart"
              className="relative p-2 hover:opacity-70 transition-opacity"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5 text-[rgb(var(--color-text))]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))] text-xs font-sans font-medium rounded-full w-5 h-5 flex items-center justify-center">
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
                <X className="w-6 h-6 text-[rgb(var(--color-text))]" />
              ) : (
                <Menu className="w-6 h-6 text-[rgb(var(--color-text))]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[rgb(var(--color-muted))] bg-[rgb(var(--color-background))]">
          <nav className="container py-6 flex flex-col space-y-4">
            <Link
              href="/shop"
              className="text-lg tracking-wider text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-lg tracking-wider text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              The Science
            </Link>
            <Link
              href="/about"
              className="text-lg tracking-wider text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] transition-colors py-2"
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
