'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Package, DollarSign, ShoppingBag } from 'lucide-react'

interface DashboardStats {
  totalSales: number
  pendingPayout: number
  productsListed: number
  conversionRate: number
  recentOrders: any[]
}

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    pendingPayout: 0,
    productsListed: 0,
    conversionRate: 0,
    recentOrders: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/seller/dashboard/stats')
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
          Welcome Back
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your store
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Sales (Month)</span>
            <DollarSign className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">
            ${(stats.totalSales / 100).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending Payout</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">
            ${(stats.pendingPayout / 100).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Next payout Monday</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Products Listed</span>
            <Package className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">
            {stats.productsListed}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            <Link href="/seller/products/new" className="text-[#c9a962] hover:underline">
              Add new product
            </Link>
          </p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Conversion Rate</span>
            <ShoppingBag className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">
            {stats.conversionRate}%
          </div>
          <p className="text-xs text-gray-500 mt-1">+2% from last month</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-sm shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-[#1a3a2f]">Recent Orders</h2>
          <Link
            href="/seller/orders"
            className="text-[#c9a962] hover:underline text-sm font-medium"
          >
            View All
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No orders yet</p>
            <p className="text-sm text-gray-500">
              Orders will appear here once customers start buying your products
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Your Earnings</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="py-4 font-medium">#{order.orderNumber}</td>
                    <td className="py-4">{order.date}</td>
                    <td className="py-4">{order.productName}</td>
                    <td className="py-4">${order.amount}</td>
                    <td className="py-4 text-green-600 font-medium">
                      ${order.earnings}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <Link
          href="/seller/products/new"
          className="bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow"
        >
          <Package className="w-8 h-8 text-[#c9a962] mb-3" />
          <h3 className="font-serif text-lg text-[#1a3a2f] mb-2">
            Add New Product
          </h3>
          <p className="text-sm text-gray-600">
            List a new product in your store
          </p>
        </Link>

        <Link
          href="/seller/orders"
          className="bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow"
        >
          <ShoppingBag className="w-8 h-8 text-[#c9a962] mb-3" />
          <h3 className="font-serif text-lg text-[#1a3a2f] mb-2">
            View Orders
          </h3>
          <p className="text-sm text-gray-600">
            Manage and ship customer orders
          </p>
        </Link>

        <Link
          href="/seller/payouts"
          className="bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow"
        >
          <DollarSign className="w-8 h-8 text-[#c9a962] mb-3" />
          <h3 className="font-serif text-lg text-[#1a3a2f] mb-2">
            View Payouts
          </h3>
          <p className="text-sm text-gray-600">
            Check your earnings and payout history
          </p>
        </Link>
      </div>
    </div>
  )
}
