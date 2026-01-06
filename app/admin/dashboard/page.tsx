'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

interface DashboardStats {
  totalBrandPartners: number
  pendingApplications: number
  totalProducts: number
  pendingProducts: number
  totalRevenue: number
  platformRevenue: number
  recentApplications: any[]
  recentProducts: any[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBrandPartners: 0,
    pendingApplications: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalRevenue: 0,
    platformRevenue: 0,
    recentApplications: [],
    recentProducts: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your Frequency & Form marketplace
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Brand Partners</span>
            <Users className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">
            {stats.totalBrandPartners}
          </div>
          <p className="text-xs text-gray-500 mt-1">Active sellers</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending Applications</span>
            <FileText className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {stats.pendingApplications}
          </div>
          {stats.pendingApplications > 0 && (
            <Link
              href="/admin/applications"
              className="text-xs text-[#c9a962] hover:underline mt-1 inline-block"
            >
              Review now →
            </Link>
          )}
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Products</span>
            <Package className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">
            {stats.totalProducts}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.pendingProducts} pending approval
          </p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Platform Revenue</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            ${(stats.platformRevenue / 100).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">20% commission</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/applications"
          className="bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-yellow-600" />
            {stats.pendingApplications > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {stats.pendingApplications} pending
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg text-[#1a3a2f] mb-2">
            Review Applications
          </h3>
          <p className="text-sm text-gray-600">
            Approve or reject brand partner applications
          </p>
        </Link>

        <Link
          href="/admin/products"
          className="bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            {stats.pendingProducts > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {stats.pendingProducts} pending
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg text-[#1a3a2f] mb-2">
            Approve Products
          </h3>
          <p className="text-sm text-gray-600">
            Review and approve product listings
          </p>
        </Link>

        <Link
          href="/admin/payouts"
          className="bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow"
        >
          <DollarSign className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="font-serif text-lg text-[#1a3a2f] mb-2">
            Manage Payouts
          </h3>
          <p className="text-sm text-gray-600">
            Process weekly seller payouts
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-sm shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif text-[#1a3a2f]">
                Recent Applications
              </h2>
              <Link
                href="/admin/applications"
                className="text-[#c9a962] hover:underline text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>

          {stats.recentApplications.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No recent applications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentApplications.map((app: any) => (
                <div key={app.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{app.brand_name}</div>
                      <div className="text-sm text-gray-600">{app.contact_email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="text-[#c9a962] hover:underline text-sm font-medium"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-sm shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif text-[#1a3a2f]">
                Products Pending Approval
              </h2>
              <Link
                href="/admin/products"
                className="text-[#c9a962] hover:underline text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>

          {stats.recentProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No pending products</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentProducts.map((product: any) => (
                <div key={product.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.fabric_type}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        ${(product.price / 100).toFixed(2)} • {product.brand_name}
                      </div>
                    </div>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-[#c9a962] hover:underline text-sm font-medium"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(stats.pendingApplications > 5 || stats.pendingProducts > 10) && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-sm p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 mb-2">Action Required</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                {stats.pendingApplications > 5 && (
                  <li>• {stats.pendingApplications} brand applications need review</li>
                )}
                {stats.pendingProducts > 10 && (
                  <li>• {stats.pendingProducts} products waiting for approval</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
