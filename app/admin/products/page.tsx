'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Check, X, Eye, AlertTriangle } from 'lucide-react'

type ProductFilter = 'all' | 'pending' | 'approved' | 'needs_changes' | 'rejected'

interface Product {
  id: string
  name: string
  brand_name: string
  brand_partner_id: string
  fabric_type: string
  fabric_composition: string
  price: number
  inventory_count: number
  approval_status: string
  image_url: string | null
  created_at: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ProductFilter>('pending')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
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
    if (statusFilter === 'all') return true
    return product.approval_status === statusFilter
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      needs_changes: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="w-4 h-4" />
      case 'approved':
        return <Check className="w-4 h-4" />
      case 'needs_changes':
        return <AlertTriangle className="w-4 h-4" />
      case 'rejected':
        return <X className="w-4 h-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">
          Product Approval
        </h1>
        <p className="text-gray-600">
          Review and approve product listings
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-3xl font-bold text-[#1a3a2f] mt-1">
            {products.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">
            {products.filter((p) => p.approval_status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {products.filter((p) => p.approval_status === 'approved').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Needs Changes</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">
            {products.filter((p) => p.approval_status === 'needs_changes').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-3xl font-bold text-red-600 mt-1">
            {products.filter((p) => p.approval_status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-sm shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'needs_changes', label: 'Needs Changes' },
              { value: 'rejected', label: 'Rejected' },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value as ProductFilter)}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  statusFilter === status.value
                    ? 'bg-[#1a3a2f] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600">
            {statusFilter !== 'all'
              ? `No ${statusFilter.replace('_', ' ')} products`
              : 'Products will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Brand</th>
                  <th className="px-6 py-4 font-medium">Fabric</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Inventory</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
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
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.brand_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.fabric_type}</div>
                      {product.fabric_composition && (
                        <div className="text-xs text-gray-500">
                          {product.fabric_composition}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(product.price / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.inventory_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(product.approval_status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            product.approval_status
                          )}`}
                        >
                          {product.approval_status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-1 text-[#c9a962] hover:underline text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
