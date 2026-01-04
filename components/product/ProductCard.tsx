import Link from 'next/link';
import FrequencyBadge from './FrequencyBadge';

export type Product = {
  id: number | string;
  slug: string;
  name: string;
  brand: string;
  price: number; // in cents
  tier: 'healing' | 'foundation';
  image?: string;
  images?: string[];
};

type ProductCardProps = {
  product: Product;
  className?: string;
};

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const displayImage = product.image || (product.images && product.images[0]);

  return (
    <Link
      href={`/shop/${product.slug}`}
      className={`group block ${className}`}
    >
      {/* Product Image - More refined */}
      <div className="relative mb-6 aspect-[3/4] bg-[rgb(var(--color-muted))] overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[rgb(var(--color-text))] opacity-15 text-sm font-light">
            [Product Image]
          </div>
        )}

        {/* Frequency Badge - Refined positioning */}
        <div className="absolute top-4 right-4">
          <FrequencyBadge tier={product.tier} size="sm" />
        </div>
      </div>

      {/* Product Info - More sophisticated */}
      <div className="space-y-2">
        <p className="text-[0.6875rem] text-[rgb(var(--color-text))] opacity-50 tracking-[0.15em] uppercase font-medium">
          {product.brand}
        </p>
        <h4 className="font-serif text-[1.125rem] text-[rgb(var(--color-primary))] font-light leading-tight group-hover:opacity-60 transition-opacity duration-300">
          {product.name}
        </h4>
        <p className="text-[rgb(var(--color-text))] text-[0.9375rem] font-normal tracking-wide">
          ${(product.price / 100).toFixed(0)}
        </p>
      </div>
    </Link>
  );
}
