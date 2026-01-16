import Link from 'next/link';
import FrequencyBadge from './FrequencyBadge';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export type ProductColor = 'black' | 'navy' | 'camel' | 'ivory' | 'white' | 'burgundy' | 'forest' | 'natural' | 'charcoal';

export type Product = {
  id: number | string;
  slug: string;
  name: string;
  brand: string;
  price: number; // in cents
  tier: 'healing' | 'foundation';
  image?: string;
  images?: string[];
  color?: ProductColor;
};

type ProductCardProps = {
  product: Product;
  className?: string;
  showQuickAdd?: boolean;
};

// Determine if a product image should have a dark or light background
// Light-colored products (linen, white, cream) look better on dark backgrounds
// Dark-colored products (navy, black, charcoal) look better on light backgrounds
function getContrastBackground(productName: string): { bg: string; text: string } {
  const name = productName.toLowerCase();
  const isLightProduct =
    name.includes('linen') ||
    name.includes('white') ||
    name.includes('cotton') ||
    name.includes('cream') ||
    name.includes('ivory') ||
    name.includes('silk');

  if (isLightProduct) {
    return { bg: 'bg-[#1f2937]', text: 'text-white' };
  }
  return { bg: 'bg-[#f5f3ee]', text: 'text-[#1f2937]' };
}

export default function ProductCard({ product, className = '', showQuickAdd = false }: ProductCardProps) {
  const displayImage = product.image || (product.images && product.images[0]);
  const { bg, text } = getContrastBackground(product.name);
  const { addItem, openCart } = useCartStore();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    openCart();
  };

  return (
    <div className={`group ${className}`}>
      <Link href={`/shop/${product.slug}`} className="block">
        {/* Product Image with Contrast Background */}
        <div className={`relative mb-5 aspect-[3/4] ${bg} overflow-hidden`}>
          {displayImage ? (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center ${text} opacity-20 text-sm font-light`}>
              [Product Image]
            </div>
          )}

          {/* Frequency Badge */}
          <div className="absolute top-4 right-4">
            <FrequencyBadge tier={product.tier} size="sm" />
          </div>

          {/* Quick Add Overlay - Appears on Hover */}
          {showQuickAdd && (
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleQuickAdd}
                className="w-full py-3 bg-white text-[#1f2937] text-[10px] font-sans font-medium tracking-[0.2em] uppercase hover:bg-[#c8b28a] transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Quick Add
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="space-y-2">
        <p className="text-[0.65rem] text-[#9ca3af] tracking-[0.18em] uppercase font-sans font-medium">
          {product.brand}
        </p>
        <Link href={`/shop/${product.slug}`}>
          <h4 className="font-serif text-[1.1rem] text-[#1f2937] font-light leading-tight group-hover:text-[#c8b28a] transition-colors duration-300">
            {product.name}
          </h4>
        </Link>
        <div className="flex items-center justify-between">
          <p className="text-[#1f2937] text-[0.95rem] font-sans font-medium tracking-wide">
            ${(product.price / 100).toFixed(0)}
          </p>
          {showQuickAdd && (
            <button
              onClick={handleQuickAdd}
              className="flex items-center gap-1.5 text-[9px] font-sans tracking-[0.15em] uppercase text-[#c8b28a] hover:text-[#1f2937] transition-colors"
            >
              <ShoppingBag className="w-3 h-3" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
