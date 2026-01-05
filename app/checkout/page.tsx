'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { useCartStore } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FrequencyBadge from '@/components/product/FrequencyBadge';
import { AlertCircle } from 'lucide-react';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, getSubtotal, hasLinenWoolConflict, clearCart } = useCartStore();

  const [email, setEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const shipping = subtotal >= 20000 ? 0 : 1500; // Free shipping over $200
  const total = subtotal + shipping;
  const hasConflict = hasLinenWoolConflict();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Create order in database
        const response = await fetch('/api/checkout/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            shippingAddress,
            items,
            paymentIntentId: paymentIntent.id,
            subtotal,
            shipping,
            total,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create order');
        }

        const { orderNumber } = await response.json();

        // Clear cart
        clearCart();

        // Redirect to confirmation page
        router.push(`/order/confirmation?orderNumber=${orderNumber}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left Column - Form */}
      <div className="lg:col-span-7 space-y-8">
        {/* Contact Information */}
        <div>
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-6 font-light">
            Contact Information
          </h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email address"
            className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
          />
        </div>

        {/* Shipping Address */}
        <div>
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-6 font-light">
            Shipping Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={shippingAddress.firstName}
              onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
              required
              placeholder="First name"
              className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
            />
            <input
              type="text"
              value={shippingAddress.lastName}
              onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
              required
              placeholder="Last name"
              className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
            />
          </div>
          <div className="mt-4 space-y-4">
            <input
              type="text"
              value={shippingAddress.address1}
              onChange={(e) => setShippingAddress({ ...shippingAddress, address1: e.target.value })}
              required
              placeholder="Address line 1"
              className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
            />
            <input
              type="text"
              value={shippingAddress.address2}
              onChange={(e) => setShippingAddress({ ...shippingAddress, address2: e.target.value })}
              placeholder="Address line 2 (optional)"
              className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                required
                placeholder="City"
                className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
              />
              <input
                type="text"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                required
                placeholder="State"
                className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
              />
              <input
                type="text"
                value={shippingAddress.postalCode}
                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                required
                placeholder="Postal code"
                className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
              />
            </div>
            <select
              value={shippingAddress.country}
              onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
              required
              className="w-full px-4 py-3 border border-[#d4c8a8] text-[#1e2a3a] text-sm font-sans focus:outline-none focus:border-[#1e2a3a] transition-colors"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-6 font-light">
            Payment Information
          </h2>
          <div className="p-4 border border-[#d4c8a8]">
            <PaymentElement
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    email: email,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full px-8 py-4 bg-[#1e2a3a] text-[#e8dcc4] text-sm tracking-wider hover:bg-[#2e3a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'PROCESSING...' : `COMPLETE ORDER - $${(total / 100).toFixed(0)}`}
        </button>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-5">
        <div className="bg-[#f5f0e4] p-8 sticky top-24">
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-6 font-light">
            Order Summary
          </h2>

          {/* Linen/Wool Warning */}
          {hasConflict && (
            <div className="bg-white border-l-4 border-[#d4c8a8] p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#1e2a3a] flex-shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-[#1e2a3a] leading-relaxed">
                  Your order contains both linen and wool. These fabrics have opposing energy flows
                  and should be worn on different days.
                </p>
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="space-y-4 mb-6 pb-6 border-b border-[#d4c8a8]">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.size}`} className="flex gap-4">
                <div className="w-16 h-16 bg-[#e8dcc4] flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs text-[#5a6a7a]">Image</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-sm text-[#1e2a3a] font-light truncate">
                    {item.product.name}
                  </h3>
                  <p className="font-sans text-xs text-[#5a6a7a] mb-1">{item.product.brand}</p>
                  <div className="mb-1">
                    <FrequencyBadge tier={item.product.tier} size="sm" />
                  </div>
                  {item.size && (
                    <p className="font-sans text-xs text-[#5a6a7a]">Size: {item.size}</p>
                  )}
                  <p className="font-sans text-xs text-[#5a6a7a]">Qty: {item.quantity}</p>
                </div>
                <p className="font-serif text-sm text-[#1e2a3a]">
                  ${((item.product.price * item.quantity) / 100).toFixed(0)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-3 mb-6 pb-6 border-b border-[#d4c8a8]">
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-[#5a6a7a] uppercase tracking-wider">
                Subtotal
              </span>
              <span className="font-serif text-base text-[#1e2a3a]">
                ${(subtotal / 100).toFixed(0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-[#5a6a7a] uppercase tracking-wider">
                Shipping
              </span>
              <span className="font-serif text-base text-[#1e2a3a]">
                {shipping === 0 ? 'FREE' : `$${(shipping / 100).toFixed(0)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="font-sans text-base text-[#1e2a3a] uppercase tracking-wider font-medium">
              Total
            </span>
            <span className="font-serif text-3xl text-[#1e2a3a]">
              ${(total / 100).toFixed(0)}
            </span>
          </div>

          <p className="font-sans text-xs text-[#5a6a7a] text-center">
            Free shipping on orders over $200
          </p>
        </div>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const { items } = useCartStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Redirect if cart is empty
    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    // Create payment intent
    fetch('/api/checkout/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((error) => {
        console.error('Error creating payment intent:', error);
      });
  }, [items, mounted, router]);

  if (!mounted || !clientSecret) {
    return (
      <div className="container py-16 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-serif text-3xl text-[#1e2a3a] mb-4 font-light">
            Loading Checkout...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl md:text-4xl text-[#1e2a3a] mb-4 font-light">
            Checkout
          </h1>
          <Link
            href="/cart"
            className="font-sans text-sm text-[#5a6a7a] hover:text-[#1e2a3a] transition-colors uppercase tracking-wider"
          >
            ← Back to Cart
          </Link>
        </div>

        <Elements
          stripe={getStripe()}
          options={{
            clientSecret,
            appearance: {
              theme: 'flat',
              variables: {
                fontFamily: 'Montserrat, -apple-system, sans-serif',
                fontSizeBase: '14px',
                colorPrimary: '#1e2a3a',
                colorBackground: '#ffffff',
                colorText: '#1e2a3a',
                colorDanger: '#ef4444',
                borderRadius: '0px',
                spacingUnit: '4px',
              },
              rules: {
                '.Input': {
                  border: '1px solid #d4c8a8',
                  padding: '12px',
                },
                '.Input:focus': {
                  borderColor: '#1e2a3a',
                  boxShadow: 'none',
                },
                '.Label': {
                  color: '#5a6a7a',
                  fontSize: '12px',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                },
              },
            },
          }}
        >
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      </div>
    </div>
  );
}
