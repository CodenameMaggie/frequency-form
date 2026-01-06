'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Check, X, Clock, Eye } from 'lucide-react'

type ApplicationStatus = 'all' | 'pending' | 'approved' | 'rejected'

interface Application {
  id: string
  brand_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  website: string
  instagram: string
  product_types: string[]
  price_range: string
  monthly_volume: string
  uses_synthetic_fibers: boolean
  synthetic_explanation: string | null
  willing_to_comply: boolean
  why_join: string
  how_heard: string
  status: string
  created_at: string
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>('pending')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'all') return true
    return app.status === statusFilter
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <Check className="w-4 h-4" />
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
        <div className="text-gray-600">Loading applications...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">
          Brand Applications
        </h1>
        <p className="text-gray-600">
          Review and approve brand partner applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Total Applications</div>
          <div className="text-3xl font-bold text-[#1a3a2f] mt-1">
            {applications.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">
            {applications.filter((a) => a.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {applications.filter((a) => a.status === 'approved').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm">
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-3xl font-bold text-red-600 mt-1">
            {applications.filter((a) => a.status === 'rejected').length}
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
              { value: 'rejected', label: 'Rejected' },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value as ApplicationStatus)}
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

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-serif text-gray-900 mb-2">
            No applications found
          </h3>
          <p className="text-gray-600">
            {statusFilter !== 'all'
              ? `No ${statusFilter} applications`
              : 'Applications will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-4 font-medium">Brand Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Product Types</th>
                  <th className="px-6 py-4 font-medium">Natural Fibers</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.brand_name}</div>
                      {app.website && (
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#c9a962] hover:underline"
                        >
                          {app.website}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{app.contact_name}</div>
                      <div className="text-xs text-gray-600">{app.contact_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {app.product_types.slice(0, 2).join(', ')}
                        {app.product_types.length > 2 && ` +${app.product_types.length - 2}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {app.uses_synthetic_fibers ? (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          Uses Synthetics
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Natural Only
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(app.status)}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            app.status
                          )}`}
                        >
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/applications/${app.id}`}
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
