'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Calendar, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react'

interface PayoutStats {
  totalPendingPayouts: number
  totalPaidThisMonth: number
  brandsDuePayout: number
  nextPayoutDate: string
}

interface BrandPayout {
  brand_partner_id: string
  brand_name: string
  pending_amount: number
  completed_sales: number
  email: string
}

export default function AdminPayoutsPage() {
  const [stats, setStats] = useState<PayoutStats>({
    totalPendingPayouts: 0,
    totalPaidThisMonth: 0,
    brandsDuePayout: 0,
    nextPayoutDate: '',
  })
  const [pendingPayouts, setPendingPayouts] = useState<BrandPayout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchPayoutData()
  }, [])

  const fetchPayoutData = async () => {
    try {
      const response = await fetch('/api/admin/payouts')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
        setPendingPayouts(data.pendingPayouts || [])
      }
    } catch (error) {
      console.error('Failed to fetch payout data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const processPayouts = async () => {
    if (!confirm('Process all pending payouts? This will create payout records for all eligible brands.')) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/payouts/process', {
        method: 'POST',
      })

      if (response.ok) {
        alert('Payouts processed successfully!')
        fetchPayoutData() // Refresh data
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to process payouts')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading payout data...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">
            Payout Management
          </h1>
          <p className="text-gray-600">
            Process weekly seller payouts
          </p>
        </div>
        {pendingPayouts.length > 0 && (
          <button
            onClick={processPayouts}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-[#1a3a2f] hover:bg-[#1a3a2f]/90 text-white px-6 py-3 rounded-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            {isProcessing ? 'Processing...' : 'Process All Payouts'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending Payouts</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            ${(stats.totalPendingPayouts / 100).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {pendingPayouts.length} brands
          </p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Paid This Month</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            ${(stats.totalPaidThisMonth / 100).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Successfully paid</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Brands Due Payout</span>
            <Users className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">
            {stats.brandsDuePayout}
          </div>
          <p className="text-xs text-gray-500 mt-1">Above $25 threshold</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Next Payout</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600">
            {stats.nextPayoutDate}
          </div>
          <p className="text-xs text-gray-500 mt-1">Monday schedule</p>
        </div>
      </div>

      {/* Payout Schedule Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-sm p-6 mb-8">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Weekly Payout Schedule</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Payouts are processed every <strong>Monday</strong> for the previous week</p>
              <p>• Only includes sales marked as <strong>delivered</strong> and <strong>completed</strong></p>
              <p>• Minimum payout threshold: <strong>$25.00</strong></p>
              <p>• Commission: <strong>20%</strong> platform fee (15% for founding partners)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-serif text-[#1a3a2f]">
            Brands Awaiting Payout
          </h2>
        </div>

        {pendingPayouts.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-gray-900 mb-2">
              No pending payouts
            </h3>
            <p className="text-gray-600">
              All brands have been paid or have not reached the minimum threshold
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-4 font-medium">Brand Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Completed Sales</th>
                  <th className="px-6 py-4 font-medium">Payout Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingPayouts.map((payout) => (
                  <tr key={payout.brand_partner_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{payout.brand_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payout.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payout.completed_sales} sales
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      ${(payout.pending_amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {payout.pending_amount >= 2500 ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Ready to Process
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Below Threshold
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      {pendingPayouts.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-sm p-6">
          <h3 className="font-medium text-amber-900 mb-2">Before Processing Payouts</h3>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Ensure all sales are marked as delivered and confirmed</li>
            <li>• Verify banking information for each brand partner</li>
            <li>• Review commission rates (15% for founding partners, 20% for others)</li>
            <li>• Process button will create payout records and send confirmation emails</li>
          </ul>
        </div>
      )}
    </div>
  )
}
