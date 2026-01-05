'use client';

import { useState } from 'react';
import Link from 'next/link';
import FrequencyBadge from '@/components/product/FrequencyBadge';
import FabricTooltip from '@/components/product/FabricTooltip';
import ProductGrid from '@/components/product/ProductGrid';
import { Product } from '@/components/product/ProductCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

// Mock product data (will be replaced with database queries later)
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Italian Linen Shirt',
    brand: '100% Capri',
    price: 28500,
    tier: 'healing',
    slug: 'italian-linen-shirt'
  },
  {
    id: 2,
    name: 'Cashmere Crewneck Sweater',
    brand: 'Brunello Cucinelli',
    price: 129500,
    tier: 'healing',
    slug: 'cashmere-crewneck-sweater'
  },
  {
    id: 3,
    name: 'Egyptian Cotton Crew Tee',
    brand: 'Kotn',
    price: 5800,
    tier: 'foundation',
    slug: 'egyptian-cotton-crew-tee'
  },
  {
    id: 4,
    name: 'Merino Wool Turtleneck',
    brand: 'Loro Piana',
    price: 74500,
    tier: 'healing',
    slug: 'merino-wool-turtleneck'
  },
];

// Extended mock product details
const PRODUCT_DETAILS: any = {
  'italian-linen-shirt': {
    ...MOCK_PRODUCTS[0],
    images: ['/placeholder1.jpg', '/placeholder2.jpg', '/placeholder3.jpg'],
    description: 'Crafted from 100% Italian linen, this shirt embodies timeless elegance and healing energy. The natural fabric resonates at 5,000 Hz, promoting tissue regeneration and well-being throughout your day.',
    fabricType: 'linen' as const,
    fabricComposition: '100% Italian Linen',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    careInstructions: 'Machine wash cold. Tumble dry low or hang dry. Iron while slightly damp for best results.',
    brandStory: '100% Capri specializes in premium Italian linen garments, working directly with heritage mills in Italy to source the finest natural fibers.',
    healingProperties: 'Linen is antibacterial and promotes tissue regeneration. It has the highest infrared reflection of any natural fiber, making it ideal for promoting healing energy.',
    category: 'Shirts'
  },
  'cashmere-crewneck-sweater': {
    ...MOCK_PRODUCTS[1],
    images: ['/placeholder1.jpg', '/placeholder2.jpg'],
    description: 'Luxury Italian cashmere that promotes relaxation and emotional stability. Hand-finished by master artisans in Solomeo.',
    fabricType: 'cashmere' as const,
    fabricComposition: '100% Italian Cashmere',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    careInstructions: 'Dry clean only. Store folded, never hung.',
    brandStory: 'Brunello Cucinelli represents the pinnacle of Italian luxury and craftsmanship, with a commitment to ethical production and humanistic capitalism.',
    healingProperties: 'Cashmere resonates at 5,000 Hz, promoting relaxation, emotional stability, and luxurious comfort.',
    category: 'Sweaters'
  },
  'egyptian-cotton-crew-tee': {
    ...MOCK_PRODUCTS[2],
    images: ['/placeholder1.jpg'],
    description: 'Essential organic Egyptian cotton tee. Matches human body frequency at 100 Hz. Perfect for everyday wear.',
    fabricType: 'cotton' as const,
    fabricComposition: '100% Organic Egyptian Cotton',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    careInstructions: 'Machine wash cold with like colors. Tumble dry low.',
    brandStory: 'Kotn partners directly with Egyptian cotton farmers to create ethical, sustainable basics.',
    healingProperties: 'Organic cotton matches the human body frequency of 100 Hz, providing breathable comfort without depleting energy.',
    category: 'T-Shirts'
  },
  'merino-wool-turtleneck': {
    ...MOCK_PRODUCTS[3],
    images: ['/placeholder1.jpg', '/placeholder2.jpg'],
    description: 'Superfine merino wool turtleneck. Grounding, protective, thermoregulating. A winter essential.',
    fabricType: 'wool' as const,
    fabricComposition: '100% Superfine Merino Wool',
    sizes: ['S', 'M', 'L', 'XL'],
    careInstructions: 'Dry clean recommended. Hand wash cold if needed. Lay flat to dry.',
    brandStory: 'Loro Piana has been a leader in luxury fabrics since 1924, sourcing the finest natural fibers from around the world.',
    healingProperties: 'Wool provides grounding, protection, and thermoregulation at 5,000 Hz. Never wear with linen (frequencies cancel).',
    category: 'Sweaters'
  },
};

type AccordionItemProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[rgb(var(--color-muted))]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left hover:opacity-70 transition-opacity"
      >
        <span className="font-sans text-sm tracking-wider uppercase text-[rgb(var(--color-text))]">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[rgb(var(--color-text))]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[rgb(var(--color-text))]" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6 text-[rgb(var(--color-text))] leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = PRODUCT_DETAILS[params.slug];
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, openCart } = useCartStore();

  const handleAddToCart = () => {
    if (!product) return;

    // Add item to cart
    addItem(product, quantity, selectedSize);

    // Show success state
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);

    // Open cart drawer
    setTimeout(() => openCart(), 300);
  };

  // If product not found, show not found message
  if (!product) {
    return (
      <div className="container py-16 text-center px-6">
        <h1 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-primary))] mb-4 font-light">
          Product Not Found
        </h1>
        <p className="text-base text-[rgb(var(--color-text))] mb-8">
          The product you're looking for doesn't exist.
        </p>
        <Link
          href="/shop"
          className="inline-block px-8 py-4 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] text-sm tracking-wider hover:opacity-90 transition-opacity"
        >
          RETURN TO SHOP
        </Link>
      </div>
    );
  }

  // Related products (exclude current product)
  const relatedProducts = MOCK_PRODUCTS
    .filter(p => p.id !== product.id && p.tier === product.tier)
    .slice(0, 4);

  return (
    <div className="container py-12 px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-[rgb(var(--color-text))] opacity-70">
        <Link href="/shop" className="hover:opacity-100">Shop</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?tier=${product.tier}`} className="hover:opacity-100">
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

        {/* Left Column - Images */}
        <div className="sticky top-24 self-start">
          {/* Main Image */}
          <div className="aspect-[4/5] bg-[rgb(var(--color-muted))] mb-4 flex items-center justify-center">
            <span className="text-[rgb(var(--color-text))] opacity-30">
              [Product Image {selectedImage + 1}]
            </span>
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square bg-[rgb(var(--color-muted))] flex items-center justify-center border-2 transition-colors ${
                    selectedImage === idx
                      ? 'border-[rgb(var(--color-primary))]'
                      : 'border-transparent hover:border-[rgb(var(--color-muted))]'
                  }`}
                >
                  <span className="text-xs text-[rgb(var(--color-text))] opacity-30">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div>
          {/* Frequency Badge */}
          <div className="mb-4">
            <FrequencyBadge tier={product.tier} size="md" />
          </div>

          {/* Brand */}
          <p className="text-sm text-[rgb(var(--color-text))] opacity-70 mb-2 tracking-wide">
            {product.brand}
          </p>

          {/* Product Name */}
          <h1 className="font-serif text-3xl md:text-4xl text-[rgb(var(--color-primary))] mb-4 font-light">
            {product.name}
          </h1>

          {/* Price */}
          <p className="text-xl md:text-2xl text-[rgb(var(--color-text))] mb-8">
            ${(product.price / 100).toFixed(0)}
          </p>

          {/* Short Description */}
          <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Why This Fabric - Expandable */}
          <AccordionItem title="Why This Fabric" defaultOpen={true}>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Fabric & Frequency:</p>
                <p className="text-sm">
                  <FabricTooltip fabricType={product.fabricType}>
                    {product.fabricComposition}
                  </FabricTooltip>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Healing Properties:</p>
                <p className="text-sm">{product.healingProperties}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Care Instructions:</p>
                <p className="text-sm">{product.careInstructions}</p>
              </div>
            </div>
          </AccordionItem>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-8">
              <label className="block text-sm tracking-wider uppercase text-[rgb(var(--color-text))] mb-3">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 border text-sm tracking-wider transition-all ${
                      selectedSize === size
                        ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))]'
                        : 'border-[rgb(var(--color-muted))] text-[rgb(var(--color-text))] hover:border-[rgb(var(--color-primary))]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mt-6">
            <label className="block text-sm tracking-wider uppercase text-[rgb(var(--color-text))] mb-3">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-[rgb(var(--color-muted))] text-[rgb(var(--color-text))] hover:border-[rgb(var(--color-primary))] transition-colors"
              >
                −
              </button>
              <span className="w-12 text-center text-[rgb(var(--color-text))]">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-[rgb(var(--color-muted))] text-[rgb(var(--color-text))] hover:border-[rgb(var(--color-primary))] transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full mt-8 px-8 py-4 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-background))] text-sm tracking-wider hover:opacity-90 transition-all disabled:opacity-50"
            disabled={product.sizes && product.sizes.length > 0 && !selectedSize}
          >
            {addedToCart
              ? 'ADDED TO CART ✓'
              : product.sizes && product.sizes.length > 0 && !selectedSize
              ? 'SELECT A SIZE'
              : 'ADD TO CART'}
          </button>

          {/* Shipping & Returns Info */}
          <div className="mt-8">
            <AccordionItem title="Shipping Information">
              <p className="text-sm">
                Free shipping on orders over $200. Standard shipping (5-7 business days) available for $15. Express shipping (2-3 business days) available for $30.
              </p>
            </AccordionItem>

            <AccordionItem title="Returns & Exchanges">
              <p className="text-sm">
                We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original condition with tags attached. Free returns for store credit; $15 deduction for refunds.
              </p>
            </AccordionItem>
          </div>
        </div>
      </div>

      {/* Full Product Description */}
      <div className="max-w-3xl mx-auto mb-16 text-center">
        <h2 className="font-serif text-2xl md:text-3xl text-[rgb(var(--color-primary))] mb-6 font-light">
          About This Piece
        </h2>
        <p className="text-base md:text-lg text-[rgb(var(--color-text))] leading-relaxed mb-6">
          {product.description}
        </p>
        <div className="text-left bg-[rgb(var(--color-muted))] p-8">
          <h3 className="font-sans text-sm tracking-wider uppercase text-[rgb(var(--color-text))] mb-4">
            About {product.brand}
          </h3>
          <p className="text-sm text-[rgb(var(--color-text))] leading-relaxed">
            {product.brandStory}
          </p>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-center text-[rgb(var(--color-primary))] mb-12 font-light">
            You May Also Like
          </h2>
          <ProductGrid products={relatedProducts} columns={4} />
        </div>
      )}
    </div>
  );
}
