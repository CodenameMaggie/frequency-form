'use client';

import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to newsletter API
    console.log('Newsletter signup:', email);
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] mt-20">
      <div className="container px-6">
        {/* Main Footer Content */}
        <div className="py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Logo & Tagline */}
          <div className="lg:col-span-2">
            <Link href="/">
              <h2 className="font-serif text-xl tracking-[0.2em] text-[rgb(var(--color-background))] mb-3 font-light">
                FREQUENCY & FORM
              </h2>
            </Link>
            <p className="font-serif italic text-[rgb(var(--color-background))] opacity-80 text-base mb-6 font-light">
              Dress in Alignment
            </p>
            <p className="text-sm text-[rgb(var(--color-background))] opacity-70 leading-relaxed max-w-md">
              Curated natural fiber clothing based on fabric frequency science.
              Healing-tier fabrics at 5,000 Hz. Never synthetics.
            </p>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="text-xs tracking-[0.15em] uppercase font-medium text-[rgb(var(--color-accent))] mb-4">
              Shop
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/shop?tier=healing"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  Healing Tier
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?tier=foundation"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  Foundation Tier
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?sort=newest"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn Column */}
          <div>
            <h3 className="text-xs tracking-[0.15em] uppercase font-medium text-[rgb(var(--color-accent))] mb-4">
              Learn
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  The Science
                </Link>
              </li>
              <li>
                <Link
                  href="/about#fabrics"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  Fabric Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/about#standards"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  Our Standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-xs tracking-[0.15em] uppercase font-medium text-[rgb(var(--color-accent))] mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-[rgb(var(--color-background))] opacity-80 hover:opacity-100 transition-opacity"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-[rgb(var(--color-background))] border-opacity-20 py-10 md:py-12">
          <div className="max-w-md mx-auto text-center">
            <h3 className="font-serif text-xl md:text-2xl text-[rgb(var(--color-background))] mb-2 font-light">
              Join the Frequency
            </h3>
            <p className="text-sm text-[rgb(var(--color-background))] opacity-70 mb-6">
              Be the first to know about new arrivals and exclusive collections.
            </p>

            {subscribed ? (
              <p className="text-[rgb(var(--color-accent))] text-sm">
                Thank you for subscribing!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 bg-[rgb(var(--color-background))] bg-opacity-10 border border-[rgb(var(--color-background))] border-opacity-30 text-[rgb(var(--color-background))] placeholder-[rgb(var(--color-background))] placeholder-opacity-50 focus:border-opacity-60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[rgb(var(--color-accent))] text-[rgb(var(--color-primary))] font-medium text-sm tracking-wider hover:opacity-90 transition-opacity"
                >
                  SUBSCRIBE
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="border-t border-[rgb(var(--color-background))] border-opacity-20 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[rgb(var(--color-background))] opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[rgb(var(--color-background))] opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Pinterest"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>

            {/* Copyright */}
            <p className="text-xs text-[rgb(var(--color-background))] opacity-60">
              © 2026 Frequency & Form. All natural fibers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
