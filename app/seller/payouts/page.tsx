'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface PayoutStats {
  pendingPayout: number
  totalEarnings: number
  lastPayoutAmount: number
  lastPayoutDate: string | null
  nextPayoutDate: string
}

interface Payout {
  id: string
  amount: number
  status: string
  payout_date: string
  created_at: string
  stripe_payout_id?: string
}

export default function SellerPayoutsPage() {
  const [stats, setStats] = useState<PayoutStats>({
    pendingPayout: 0,
    totalEarnings: 0,
    lastPayoutAmount: 0,
    lastPayoutDate: null,
    nextPayoutDate: '',
  })
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPayoutData()
  }, [])

  const fetchPayoutData = async () => {
    try {
      const response = await fetch('/api/seller/payouts')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
        setPayouts(data.payouts || [])
      }
    } catch (error) {
      console.error('Failed to fetch payout data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'processing':
        return <TrendingUp className="w-4 h-4" />
      case 'paid':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
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
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">Payouts</h1>
        <p className="text-gray-600">Track your earnings and payout history</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending Payout</span>
            <DollarSign className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">
            ${(stats.pendingPayout / 100).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Next payout: {stats.nextPayoutDate || 'TBD'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Earnings</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            ${(stats.totalEarnings / 100).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Last Payout</span>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {stats.lastPayoutAmount > 0
              ? `$${(stats.lastPayoutAmount / 100).toFixed(2)}`
              : '--'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {stats.lastPayoutDate ? formatDate(stats.lastPayoutDate) : 'No payouts yet'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Commission Rate</span>
            <Calendar className="w-5 h-5 text-[#c9a962]" />
          </div>
          <div className="text-3xl font-bold text-[#1a3a2f]">80%</div>
          <p className="text-xs text-gray-500 mt-1">You keep 80% of sales</p>
        </div>
      </div>

      {/* Payout Schedule Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-sm p-6 mb-8">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Payout Schedule</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                • Payouts are processed <strong>every Monday</strong> for the previous week's
                sales
              </p>
              <p>
                • Sales must be <strong>delivered and confirmed</strong> to be included in payouts
              </p>
              <p>
                • Minimum payout threshold: <strong>$25.00</strong>
              </p>
              <p>
                • Funds typically arrive in your bank account within <strong>2-3 business days</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-serif text-[#1a3a2f]">Payout History</h2>
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-gray-900 mb-2">No payouts yet</h3>
            <p className="text-gray-600 mb-4">
              Your payout history will appear here once you start making sales
            </p>
            <p className="text-sm text-gray-500">
              Start selling to earn your first payout!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-4 font-medium">Payout Date</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Reference</th>
                  <th className="px-6 py-4 font-medium">Initiated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatDate(payout.payout_date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      ${(payout.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payout.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            payout.status
                          )}`}
                        >
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payout.stripe_payout_id || payout.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(payout.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Banking Info */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-sm p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 mb-2">Update Banking Information</h3>
            <p className="text-sm text-amber-800 mb-3">
              Make sure your banking information is up to date to receive payouts without delays.
            </p>
            <button className="text-sm font-medium text-[#c9a962] hover:underline">
              Go to Settings → Banking
            </button>
          </div>
        </div>
      </div>

      {/* Tax Info */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-sm p-6">
        <h3 className="font-medium text-gray-900 mb-2">Tax Information</h3>
        <p className="text-sm text-gray-700 mb-3">
          As an independent seller, you are responsible for reporting your earnings to tax
          authorities.
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• We will provide you with a 1099 form if your annual earnings exceed $600</li>
          <li>• You can download detailed payout reports from your dashboard</li>
          <li>• Consult with a tax professional for specific advice</li>
        </ul>
      </div>
    </div>
  )
}
