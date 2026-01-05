'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const order = searchParams.get('orderNumber');
    setOrderNumber(order);
  }, [searchParams]);

  if (!orderNumber) {
    return (
      <div className="container py-16 px-6 min-h-screen">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-3xl text-[#1e2a3a] mb-4 font-light">
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 px-6 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-[#1e2a3a] mb-4 font-light">
            Thank You
          </h1>
          <p className="font-sans text-lg text-[#5a6a7a] mb-6">
            Your order has been confirmed
          </p>
          <div className="inline-block px-6 py-3 bg-[#f5f0e4] border border-[#d4c8a8]">
            <p className="font-sans text-xs text-[#5a6a7a] uppercase tracking-wider mb-1">
              Order Number
            </p>
            <p className="font-serif text-2xl text-[#1e2a3a]">{orderNumber}</p>
          </div>
        </div>

        {/* Confirmation Email Notice */}
        <div className="bg-[#f5f0e4] p-8 mb-12 text-center">
          <p className="font-sans text-base text-[#1e2a3a] leading-relaxed">
            A confirmation email has been sent to your email address with your order details
            and tracking information.
          </p>
        </div>

        {/* What's Next */}
        <div className="mb-12">
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-6 font-light text-center">
            What's Next
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#d4c8a8] flex items-center justify-center flex-shrink-0">
                <span className="font-sans text-sm text-[#1e2a3a] font-medium">1</span>
              </div>
              <div>
                <h3 className="font-sans text-sm uppercase tracking-wider text-[#1e2a3a] font-medium mb-1">
                  Order Processing
                </h3>
                <p className="font-sans text-sm text-[#5a6a7a] leading-relaxed">
                  We're preparing your natural fiber garments with care. Processing typically
                  takes 1-2 business days.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#d4c8a8] flex items-center justify-center flex-shrink-0">
                <span className="font-sans text-sm text-[#1e2a3a] font-medium">2</span>
              </div>
              <div>
                <h3 className="font-sans text-sm uppercase tracking-wider text-[#1e2a3a] font-medium mb-1">
                  Shipping Notification
                </h3>
                <p className="font-sans text-sm text-[#5a6a7a] leading-relaxed">
                  You'll receive a shipping confirmation email with tracking information once
                  your order is on its way.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#d4c8a8] flex items-center justify-center flex-shrink-0">
                <span className="font-sans text-sm text-[#1e2a3a] font-medium">3</span>
              </div>
              <div>
                <h3 className="font-sans text-sm uppercase tracking-wider text-[#1e2a3a] font-medium mb-1">
                  Dress in Alignment
                </h3>
                <p className="font-sans text-sm text-[#5a6a7a] leading-relaxed">
                  Enjoy the elevated frequency of natural fibers. Remember: never wear linen
                  and wool together.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="text-center">
          <Link
            href="/shop"
            className="inline-block px-8 py-4 bg-[#1e2a3a] text-[#e8dcc4] text-sm tracking-wider hover:bg-[#2e3a4a] transition-colors"
          >
            CONTINUE SHOPPING
          </Link>
        </div>

        {/* Support Note */}
        <div className="mt-12 text-center">
          <p className="font-sans text-sm text-[#5a6a7a] leading-relaxed">
            Questions about your order? Contact us at{' '}
            <a href="mailto:support@frequencyandform.com" className="text-[#1e2a3a] hover:underline">
              support@frequencyandform.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 px-6 min-h-screen">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-serif text-3xl text-[#1e2a3a] mb-4 font-light">Loading...</h1>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
