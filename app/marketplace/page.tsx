'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Filter, Search } from 'lucide-react'

const FABRIC_TYPES = ['All', 'Linen', 'Wool', 'Cotton', 'Silk', 'Hemp', 'Bamboo', 'Cashmere', 'Alpaca']
const CATEGORIES = ['All', 'Clothing', 'Bedding', 'Home Textiles', 'Accessories', 'Towels & Bath', 'Baby & Kids', 'Activewear']

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compare_at_price: number | null
  fabric_type: string
  image_url: string | null
  brand_name: string
  brand_slug: string
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fabricFilter, setFabricFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/marketplace/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    if (fabricFilter !== 'All' && product.fabric_type.toLowerCase() !== fabricFilter.toLowerCase()) {
      return false
    }
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center">
        <div className="text-gray-600">Loading marketplace...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#1a3a2f] to-[#1a3a2f]/90 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">
            Natural Fiber Marketplace
          </h1>
          <p className="text-xl text-[#e8dcc4] mb-8">
            Shop healing-frequency textiles from trusted artisan brands
          </p>

          {/* Search */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-sm text-gray-900 focus:ring-2 focus:ring-[#c9a962] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Filter by Fabric:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FABRIC_TYPES.map((fabric) => (
              <button
                key={fabric}
                onClick={() => setFabricFilter(fabric)}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  fabricFilter === fabric
                    ? 'bg-[#1a3a2f] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {fabric}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-sm shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              {searchQuery || fabricFilter !== 'All' ? 'No products found' : 'Coming Soon'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || fabricFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Our marketplace is launching soon with beautiful natural fiber products'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/marketplace/products/${product.slug}`}
                className="bg-white rounded-sm shadow-sm overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="text-xs text-[#c9a962] uppercase tracking-wide mb-1">
                    {product.fabric_type}
                  </div>
                  <h3 className="font-serif text-lg text-gray-900 mb-1 group-hover:text-[#c9a962] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    by {product.brand_name}
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      ${(product.price / 100).toFixed(2)}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${(product.compare_at_price / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-sm shadow-sm">
            <h3 className="font-serif text-lg text-[#1a3a2f] mb-3">
              Only Natural Fibers
            </h3>
            <p className="text-sm text-gray-600">
              Every product is verified to contain only natural, healing-frequency fibers. No synthetics, ever.
            </p>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm">
            <h3 className="font-serif text-lg text-[#1a3a2f] mb-3">
              Curated Brands
            </h3>
            <p className="text-sm text-gray-600">
              We partner with artisan brands who share our commitment to quality and natural materials.
            </p>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm">
            <h3 className="font-serif text-lg text-[#1a3a2f] mb-3">
              Frequency Science
            </h3>
            <p className="text-sm text-gray-600">
              Each fabric type carries unique healing frequencies that support cellular health and energy balance.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#1a3a2f] to-[#1a3a2f]/90 rounded-sm p-8 text-center text-white">
          <h2 className="text-2xl font-serif mb-4">
            Are You a Natural Fiber Brand?
          </h2>
          <p className="text-[#e8dcc4] mb-6">
            Join our marketplace and reach customers who value healing-frequency textiles
          </p>
          <Link
            href="/partners/apply"
            className="inline-block bg-[#c9a962] hover:bg-[#c9a962]/90 text-white px-8 py-3 rounded-sm font-medium transition-colors"
          >
            Apply to Become a Partner
          </Link>
        </div>
      </div>
    </div>
  )
}
