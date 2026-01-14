'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Users, Check, X, Clock } from 'lucide-react'

interface Partner {
  id: string
  brand_name: string
  contact_email: string
  status: string
  created_at: string
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPartners(data || [])
    } catch (error) {
      console.error('Error fetching partners:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-sm">
            <Check className="w-3 h-3" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-sm">
            <X className="w-3 h-3" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-sm">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading partners...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-[#c9a962]" />
        <div>
          <h1 className="text-2xl font-serif text-[#1a3a2f]">Brand Partners</h1>
          <p className="text-gray-600 text-sm">Manage approved partner accounts</p>
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="bg-white p-8 rounded-sm text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No partners yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f8f6f3]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-[#f8f6f3]/50">
                  <td className="px-6 py-4 text-sm font-medium text-[#1a3a2f]">
                    {partner.brand_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {partner.contact_email}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(partner.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(partner.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
