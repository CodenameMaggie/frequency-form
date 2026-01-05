'use client';

import { useCartStore } from '@/lib/cart-store';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, AlertCircle } from 'lucide-react';
import FrequencyBadge from '@/components/product/FrequencyBadge';
import { useEffect, useState } from 'react';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal, hasLinenWoolConflict } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = getSubtotal();
  const hasConflict = hasLinenWoolConflict();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#faf8f4] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-[#1e2a3a] px-6 py-5 flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#e8dcc4] font-light tracking-wide">Your Cart</h2>
          <button
            onClick={closeCart}
            className="text-[#e8dcc4] hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="font-serif text-lg text-[#5a6a7a] mb-6">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="px-6 py-3 bg-[#1e2a3a] text-[#e8dcc4] text-sm tracking-wider hover:bg-[#2e3a4a] transition-colors"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Linen/Wool Conflict Warning */}
              {hasConflict && (
                <div className="bg-[#f5f0e4] border-l-4 border-[#d4c8a8] p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-[#1e2a3a] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-sans text-sm text-[#1e2a3a] leading-relaxed">
                        <strong className="font-medium">Note:</strong> Your cart contains both linen and wool.
                        These fabrics have opposing energy flows and cancel each other when worn together.
                        We recommend wearing on different days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex gap-4 pb-6 border-b border-[#e8dcc4] last:border-0">
                  {/* Image */}
                  <div className="w-24 h-24 bg-[#e8dcc4] flex-shrink-0 flex items-center justify-center">
                    <span className="text-xs text-[#5a6a7a]">[Image]</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-xs text-[#5a6a7a] mb-1">{item.product.brand}</p>
                        <h3 className="font-serif text-sm text-[#1e2a3a] font-light mb-2 truncate">
                          {item.product.name}
                        </h3>
                        <div className="mb-2">
                          <FrequencyBadge tier={item.product.tier} size="sm" />
                        </div>
                        {item.size && (
                          <p className="font-sans text-xs text-[#5a6a7a]">Size: {item.size}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 border border-[#d4c8a8] text-[#1e2a3a] hover:border-[#1e2a3a] transition-colors flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-sans text-sm text-[#1e2a3a] w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 border border-[#d4c8a8] text-[#1e2a3a] hover:border-[#1e2a3a] transition-colors flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-serif text-base text-[#1e2a3a]">
                        ${((item.product.price * item.quantity) / 100).toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#e8dcc4] bg-[#faf8f4] px-6 py-6">
            {/* Subtotal */}
            <div className="flex items-center justify-between mb-6">
              <span className="font-sans text-sm tracking-wider uppercase text-[#5a6a7a]">Subtotal</span>
              <span className="font-serif text-2xl text-[#1e2a3a]">
                ${(subtotal / 100).toFixed(0)}
              </span>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Link
                href="/cart"
                onClick={closeCart}
                className="block w-full px-6 py-4 border border-[#1e2a3a] text-[#1e2a3a] text-center text-sm tracking-wider hover:bg-[#1e2a3a] hover:text-[#e8dcc4] transition-colors"
              >
                VIEW CART
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full px-6 py-4 bg-[#1e2a3a] text-[#e8dcc4] text-center text-sm tracking-wider hover:bg-[#2e3a4a] transition-colors"
              >
                CHECKOUT
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
