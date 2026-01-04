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
      {/* Product Image */}
      <div className="relative mb-4 aspect-[3/4] bg-[rgb(var(--color-muted))] overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[rgb(var(--color-text))] opacity-20 text-sm">
            [Product Image]
          </div>
        )}

        {/* Frequency Badge */}
        <div className="absolute top-3 right-3">
          <FrequencyBadge tier={product.tier} size="sm" />
        </div>
      </div>

      {/* Product Info */}
      <div>
        <p className="text-xs text-[rgb(var(--color-text))] opacity-60 mb-1 tracking-wide">
          {product.brand}
        </p>
        <h4 className="font-serif text-base md:text-lg text-[rgb(var(--color-primary))] mb-1 group-hover:opacity-70 transition-opacity">
          {product.name}
        </h4>
        <p className="text-[rgb(var(--color-text))] font-medium">
          ${(product.price / 100).toFixed(0)}
        </p>
      </div>
    </Link>
  );
}
