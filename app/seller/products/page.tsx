'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Plus, Search, Filter } from 'lucide-react'

type ProductStatus = 'all' | 'active' | 'pending' | 'needs_changes' | 'rejected'

interface Product {
  id: string
  name: string
  fabric_type: string
  price: number
  inventory_count: number
  approval_status: string
  image_url?: string
  is_active: boolean
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/seller/products')
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
    // Status filter
    if (statusFilter === 'active' && product.approval_status !== 'approved') return false
    if (statusFilter === 'pending' && product.approval_status !== 'pending') return false
    if (statusFilter === 'needs_changes' && product.approval_status !== 'needs_changes') return false
    if (statusFilter === 'rejected' && product.approval_status !== 'rejected') return false

    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      needs_changes: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const text = {
      approved: 'Active',
      pending: 'Pending Approval',
      needs_changes: 'Needs Changes',
      rejected: 'Rejected',
    }
    return text[status as keyof typeof text] || status
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">
            Products
          </h1>
          <p className="text-gray-600">
            Manage your product listings
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="flex items-center gap-2 bg-[#1a3a2f] hover:bg-[#1a3a2f]/90 text-white px-6 py-3 rounded-sm font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-sm shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProductStatus)}
              className="px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
            >
              <option value="all">All Products</option>
              <option value="active">Active</option>
              <option value="pending">Pending Approval</option>
              <option value="needs_changes">Needs Changes</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first product to the marketplace'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/seller/products/new"
              className="inline-flex items-center gap-2 bg-[#1a3a2f] hover:bg-[#1a3a2f]/90 text-white px-6 py-3 rounded-sm font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Fabric</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Inventory</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.fabric_type}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(product.price / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.inventory_count > 0 ? (
                        <span>{product.inventory_count} in stock</span>
                      ) : (
                        <span className="text-red-600">Out of stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          product.approval_status
                        )}`}
                      >
                        {getStatusText(product.approval_status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/seller/products/edit/${product.id}`}
                        className="text-[#c9a962] hover:underline text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {products.length > 0 && (
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-sm shadow-sm">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-2xl font-bold text-[#1a3a2f] mt-1">
              {products.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-sm shadow-sm">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {products.filter((p) => p.approval_status === 'approved').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-sm shadow-sm">
            <div className="text-sm text-gray-600">Pending Approval</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {products.filter((p) => p.approval_status === 'pending').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-sm shadow-sm">
            <div className="text-sm text-gray-600">Needs Attention</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {
                products.filter(
                  (p) => p.approval_status === 'needs_changes' || p.approval_status === 'rejected'
                ).length
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
