import Link from 'next/link'
import { CheckCircle2, Mail, Calendar } from 'lucide-react'

export const metadata = {
  title: 'Application Received | Frequency & Form',
}

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f3] py-20">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-sm shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-serif text-[#1a3a2f] mb-4">
            Application Received!
          </h1>

          <p className="text-lg text-gray-700 mb-8">
            Thank you for applying to become a Frequency & Form partner. We're excited to learn more about your brand!
          </p>

          <div className="bg-[#f8f6f3] rounded-sm p-6 mb-8 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#c9a962] mt-1 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Check Your Email</p>
                <p className="text-sm text-gray-600">
                  We've sent a confirmation email with your application details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#c9a962] mt-1 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Review Timeline</p>
                <p className="text-sm text-gray-600">
                  We typically review applications within 3-5 business days.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-serif text-[#1a3a2f] mb-4">
              What Happens Next?
            </h2>

            <div className="text-left space-y-4 mb-8">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#c9a962] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Application Review</p>
                  <p className="text-sm text-gray-600">
                    Our team reviews your brand, products, and frequency compliance.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#c9a962] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Decision Email</p>
                  <p className="text-sm text-gray-600">
                    You'll receive an email with our decision and next steps.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#c9a962] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Onboarding</p>
                  <p className="text-sm text-gray-600">
                    If approved, we'll send login credentials and help you list your first products.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#1a3a2f] text-white rounded-sm p-6 mb-6">
              <p className="font-medium mb-2">Questions?</p>
              <p className="text-sm text-[#e8dcc4]">
                Email us at{' '}
                <a
                  href="mailto:concierge@frequencyandform.com"
                  className="text-[#c9a962] underline hover:no-underline"
                >
                  concierge@frequencyandform.com
                </a>
              </p>
            </div>

            <Link
              href="/"
              className="inline-block text-[#1a3a2f] hover:text-[#c9a962] font-medium"
            >
              ← Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
