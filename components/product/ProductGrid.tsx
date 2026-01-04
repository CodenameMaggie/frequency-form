import ProductCard, { Product } from './ProductCard';

type ProductGridProps = {
  products: Product[];
  columns?: 2 | 3 | 4;
  className?: string;
};

export default function ProductGrid({
  products,
  columns = 4,
  className = ''
}: ProductGridProps) {
  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }[columns];

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-[rgb(var(--color-text))] opacity-60">
          No products found.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridColsClass} gap-8 ${className}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
