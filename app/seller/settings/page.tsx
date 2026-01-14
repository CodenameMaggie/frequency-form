'use client'

import { useEffect, useState } from 'react'
import { Settings, Store, Mail, Globe } from 'lucide-react'
import { getSellerProfile } from '@/lib/seller-auth'

interface SellerProfile {
  id: string
  brand_name: string
  contact_email: string
  website_url?: string
  brand_description?: string
  status: string
}

export default function SellerSettingsPage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const data = await getSellerProfile()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-[#c9a962]" />
        <div>
          <h1 className="text-2xl font-serif text-[#1a3a2f]">Settings</h1>
          <p className="text-gray-600 text-sm">Manage your brand profile</p>
        </div>
      </div>

      <div className="bg-white rounded-sm shadow-sm p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-[#1a3a2f] mb-4">Brand Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 py-3 border-b border-gray-100">
                <Store className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Brand Name</p>
                  <p className="text-gray-700">{profile?.brand_name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-3 border-b border-gray-100">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Contact Email</p>
                  <p className="text-gray-700">{profile?.contact_email || '-'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-3 border-b border-gray-100">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Website</p>
                  <p className="text-gray-700">{profile?.website_url || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {profile?.brand_description && (
            <div>
              <h2 className="text-lg font-medium text-[#1a3a2f] mb-4">Brand Description</h2>
              <p className="text-gray-700 leading-relaxed">{profile.brand_description}</p>
            </div>
          )}

          <div>
            <h2 className="text-lg font-medium text-[#1a3a2f] mb-4">Account Status</h2>
            <div className="bg-[#f8f6f3] p-4 rounded-sm inline-block">
              <span className={`font-medium ${
                profile?.status === 'approved' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {profile?.status === 'approved' ? 'Approved Partner' : profile?.status}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Need to update your information? Contact us at{' '}
              <a href="mailto:partners@frequencyandform.com" className="text-[#1a3a2f] underline">
                partners@frequencyandform.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
