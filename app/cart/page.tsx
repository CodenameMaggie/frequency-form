'use client';

import { useCartStore } from '@/lib/cart-store';
import Link from 'next/link';
import { Minus, Plus, Trash2, AlertCircle, ShoppingBag } from 'lucide-react';
import FrequencyBadge from '@/components/product/FrequencyBadge';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal, hasLinenWoolConflict } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container py-16 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl text-[#1e2a3a] mb-8 font-light text-center">
            Your Cart
          </h1>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const hasConflict = hasLinenWoolConflict();

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="container py-16 px-6 min-h-screen">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <ShoppingBag className="w-16 h-16 text-[#d4c8a8]" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1e2a3a] mb-4 font-light">
            Your Cart is Empty
          </h1>
          <p className="text-base md:text-lg text-[#5a6a7a] mb-8 leading-relaxed">
            Discover our curated collection of natural fiber garments that elevate your frequency.
          </p>
          <Link
            href="/shop"
            className="inline-block px-8 py-4 bg-[#1e2a3a] text-[#e8dcc4] text-sm tracking-wider hover:bg-[#2e3a4a] transition-colors"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="font-serif text-3xl md:text-4xl text-[#1e2a3a] mb-8 font-light text-center">
          Your Cart
        </h1>

        {/* Linen/Wool Conflict Warning */}
        {hasConflict && (
          <div className="bg-[#f5f0e4] border-l-4 border-[#d4c8a8] p-6 mb-8">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-[#1e2a3a] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif text-lg text-[#1e2a3a] mb-2 font-normal">
                  Fabric Frequency Notice
                </h3>
                <p className="font-sans text-sm text-[#1e2a3a] leading-relaxed">
                  Your cart contains both linen and wool. These fabrics have opposing energy flows (linen flows left-to-right, wool flows right-to-left) and cancel each other when worn together, reducing the combined frequency to 0 Hz. We recommend wearing these pieces on different days to maintain their healing benefits.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="bg-white border border-[#e8dcc4] p-6 flex flex-col sm:flex-row gap-6"
                >
                  {/* Image */}
                  <div className="w-full sm:w-32 h-32 bg-[#e8dcc4] flex-shrink-0 flex items-center justify-center">
                    <span className="text-sm text-[#5a6a7a]">[Product Image]</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <p className="font-sans text-xs text-[#5a6a7a] mb-1 uppercase tracking-wider">
                          {item.product.brand}
                        </p>
                        <h3 className="font-serif text-xl text-[#1e2a3a] font-light mb-3">
                          {item.product.name}
                        </h3>
                        <div className="mb-3">
                          <FrequencyBadge tier={item.product.tier} size="md" />
                        </div>
                        {item.size && (
                          <p className="font-sans text-sm text-[#5a6a7a]">Size: {item.size}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-xl text-[#1e2a3a] mb-2">
                          ${(item.product.price / 100).toFixed(0)}
                        </p>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors flex items-center gap-1 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4">
                      <span className="font-sans text-sm text-[#5a6a7a] uppercase tracking-wider">
                        Quantity:
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 border border-[#d4c8a8] text-[#1e2a3a] hover:border-[#1e2a3a] transition-colors flex items-center justify-center"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-sans text-base text-[#1e2a3a] w-10 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 border border-[#d4c8a8] text-[#1e2a3a] hover:border-[#1e2a3a] transition-colors flex items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-serif text-lg text-[#1e2a3a] ml-auto">
                        ${((item.product.price * item.quantity) / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-8">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 font-sans text-sm text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors uppercase tracking-wider"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-[#f5f0e4] p-8 sticky top-24">
              <h2 className="font-serif text-2xl text-[#1e2a3a] mb-6 font-light">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-[#d4c8a8]">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-[#5a6a7a] uppercase tracking-wider">
                    Subtotal
                  </span>
                  <span className="font-serif text-lg text-[#1e2a3a]">
                    ${(subtotal / 100).toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-[#5a6a7a] uppercase tracking-wider">
                    Shipping
                  </span>
                  <span className="font-sans text-sm text-[#5a6a7a] italic">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <span className="font-sans text-base text-[#1e2a3a] uppercase tracking-wider font-medium">
                  Total
                </span>
                <span className="font-serif text-3xl text-[#1e2a3a]">
                  ${(subtotal / 100).toFixed(0)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="block w-full px-8 py-4 bg-[#1e2a3a] text-[#e8dcc4] text-center text-sm tracking-wider hover:bg-[#2e3a4a] transition-colors mb-4"
              >
                PROCEED TO CHECKOUT
              </Link>

              <p className="font-sans text-xs text-[#5a6a7a] text-center leading-relaxed">
                Free shipping on orders over $200
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
