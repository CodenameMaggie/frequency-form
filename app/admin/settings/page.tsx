'use client'

import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-[#c9a962]" />
        <div>
          <h1 className="text-2xl font-serif text-[#1a3a2f]">Settings</h1>
          <p className="text-gray-600 text-sm">Admin configuration</p>
        </div>
      </div>

      <div className="bg-white rounded-sm shadow-sm p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-[#1a3a2f] mb-4">General Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Site Name</p>
                  <p className="text-sm text-gray-500">The name displayed across the platform</p>
                </div>
                <span className="text-gray-700">Frequency & Form</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Support Email</p>
                  <p className="text-sm text-gray-500">Primary contact for support inquiries</p>
                </div>
                <span className="text-gray-700">concierge@frequencyandform.com</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Partner Email</p>
                  <p className="text-sm text-gray-500">Contact for partnership inquiries</p>
                </div>
                <span className="text-gray-700">partners@frequencyandform.com</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-[#1a3a2f] mb-4">Platform Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#f8f6f3] p-4 rounded-sm">
                <p className="text-sm text-gray-600">Environment</p>
                <p className="font-medium text-[#1a3a2f]">Production</p>
              </div>
              <div className="bg-[#f8f6f3] p-4 rounded-sm">
                <p className="text-sm text-gray-600">Version</p>
                <p className="font-medium text-[#1a3a2f]">1.0.0</p>
              </div>
              <div className="bg-[#f8f6f3] p-4 rounded-sm">
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
