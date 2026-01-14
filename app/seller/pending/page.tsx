'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Mail, ArrowLeft } from 'lucide-react'
import { getSession, getSellerProfile, signOut } from '@/lib/seller-auth'

export default function SellerPendingPage() {
  const router = useRouter()
  const [brandName, setBrandName] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const session = await getSession()
      if (!session) {
        router.push('/seller/login')
        return
      }

      const profile = await getSellerProfile()
      if (!profile) {
        router.push('/seller/login')
        return
      }

      if (profile.status === 'approved') {
        router.push('/seller/dashboard')
        return
      }

      setBrandName(profile.brand_name)
      setStatus(profile.status)
    } catch (error) {
      router.push('/seller/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/seller/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f3]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-sm shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-[#f8f6f3] rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-[#c9a962]" />
        </div>

        <h1 className="text-2xl font-serif text-[#1a3a2f] mb-2">
          Application {status === 'pending' ? 'Under Review' : 'Status'}
        </h1>

        {brandName && (
          <p className="text-gray-600 mb-6">{brandName}</p>
        )}

        <div className="bg-[#f8f6f3] p-4 rounded-sm mb-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            {status === 'pending' ? (
              <>
                Thank you for applying to become a Frequency & Form partner.
                Our team is reviewing your application and will be in touch within 2-3 business days.
              </>
            ) : status === 'rejected' ? (
              <>
                Unfortunately, your application was not approved at this time.
                Please contact us if you have questions.
              </>
            ) : (
              <>
                Your account status is: <strong>{status}</strong>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
          <Mail className="w-4 h-4" />
          <span>Questions? Email </span>
          <a
            href="mailto:partners@frequencyandform.com"
            className="text-[#1a3a2f] underline"
          >
            partners@frequencyandform.com
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 px-4 py-2 text-[#1a3a2f] hover:bg-[#f8f6f3] rounded-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
