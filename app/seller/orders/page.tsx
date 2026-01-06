'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Package, Truck, CheckCircle, Clock } from 'lucide-react'

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface Order {
  id: string
  order_number: string
  product_name: string
  product_id: string
  customer_email: string
  quantity: number
  sale_amount: number
  commission_amount: number
  brand_payout_amount: number
  status: string
  shipping_status: string
  tracking_number?: string
  created_at: string
  shipped_at?: string
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/seller/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter || order.shipping_status === statusFilter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'processing':
        return <Package className="w-5 h-5 text-blue-600" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-600" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <ShoppingBag className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.brand_payout_amount, 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const processingOrders = orders.filter((o) => o.status === 'processing').length
  const shippedOrders = orders.filter((o) => o.shipping_status === 'shipped').length

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">Orders</h1>
        <p className="text-gray-600">Manage and fulfill customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">{orders.length}</div>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">{pendingOrders}</div>
          <p className="text-xs text-gray-500 mt-1">Awaiting your action</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Processing</span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">{processingOrders}</div>
          <p className="text-xs text-gray-500 mt-1">Being prepared</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Revenue</span>
            <Truck className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            ${(totalRevenue / 100).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Your earnings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-sm shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Orders' },
              { value: 'pending', label: 'Pending' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value as OrderStatus)}
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

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-gray-900 mb-2">
            {statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="text-gray-600">
            {statusFilter !== 'all'
              ? 'Try adjusting your filter'
              : 'Orders will appear here when customers purchase your products'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-4 font-medium">Order</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Qty</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Your Earnings</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        #{order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/seller/products/edit/${order.product_id}`}
                        className="text-sm text-[#c9a962] hover:underline"
                      >
                        {order.product_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.customer_email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ${(order.sale_amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      ${(order.brand_payout_amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.shipping_status || order.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            order.shipping_status || order.status
                          )}`}
                        >
                          {order.shipping_status || order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/seller/orders/${order.id}`}
                        className="text-[#c9a962] hover:underline text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help Box */}
      {pendingOrders > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-sm p-6">
          <h3 className="text-sm font-medium text-amber-900 mb-2">
            You have {pendingOrders} pending {pendingOrders === 1 ? 'order' : 'orders'}
          </h3>
          <p className="text-sm text-amber-800">
            Click "View Details" on each order to mark as processing and add tracking information
            once shipped.
          </p>
        </div>
      )}
    </div>
  )
}
