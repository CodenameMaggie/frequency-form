'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

const STEPS = [
  'Brand Information',
  'Contact Information',
  'Product Information',
  'Samples',
  'Final Questions'
]

export default function ApplyPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Step 1: Brand Info
    brandName: '',
    website: '',
    instagram: '',
    originCountry: '',
    description: '',

    // Step 2: Contact
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    role: '',

    // Step 3: Products
    productTypes: [] as string[],
    priceRange: '',
    averageOrderValue: '',
    monthlyVolume: '',
    usesSyntheticFibers: 'no',
    syntheticExplanation: '',
    willingToComply: 'yes',

    // Step 4: Samples
    sampleProducts: [{ name: '', url: '', fabric: '', price: '' }],

    // Step 5: Final
    whyJoin: '',
    howHeard: '',
    additionalNotes: '',
    confirmAccurate: false,
    agreeTerms: false,
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleProductType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      productTypes: prev.productTypes.includes(type)
        ? prev.productTypes.filter((t) => t !== type)
        : [...prev.productTypes, type],
    }))
  }

  const addSampleProduct = () => {
    setFormData((prev) => ({
      ...prev,
      sampleProducts: [...prev.sampleProducts, { name: '', url: '', fabric: '', price: '' }],
    }))
  }

  const removeSampleProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sampleProducts: prev.sampleProducts.filter((_, i) => i !== index),
    }))
  }

  const updateSampleProduct = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      sampleProducts: prev.sampleProducts.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      ),
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.brandName && formData.description
      case 1:
        return formData.contactName && formData.contactEmail
      case 2:
        return formData.productTypes.length > 0 && formData.priceRange
      case 3:
        return formData.sampleProducts[0].name || formData.sampleProducts[0].url
      case 4:
        return formData.whyJoin && formData.confirmAccurate && formData.agreeTerms
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/partners/apply/success')
      } else {
        alert('Error submitting application. Please try again.')
      }
    } catch (error) {
      alert('Error submitting application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3] py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-sm shadow-sm p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">
              Brand Partner Application
            </h1>
            <p className="text-gray-600">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between mb-2">
              {STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`text-xs ${
                    index <= currentStep ? 'text-[#c9a962] font-medium' : 'text-gray-400'
                  }`}
                >
                  {index < currentStep && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                  <span className="hidden md:inline">{step}</span>
                  <span className="md:hidden">{index + 1}</span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-[#c9a962] rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Brand Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => updateFormData('brandName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  placeholder="https://"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => updateFormData('instagram', e.target.value)}
                  placeholder="@yourbrand"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country of Origin
                </label>
                <input
                  type="text"
                  value={formData.originCountry}
                  onChange={(e) => updateFormData('originCountry', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Description of Your Brand *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => updateFormData('contactName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => updateFormData('contactEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => updateFormData('contactPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Role at the Company
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => updateFormData('role', e.target.value)}
                  placeholder="Founder, Owner, Marketing Director, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 3: Product Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What types of products do you make? *
                </label>
                <div className="space-y-2">
                  {['Linen', 'Wool', 'Cashmere', 'Hemp', 'Organic Cotton', 'Other natural fibers'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.productTypes.includes(type)}
                        onChange={() => toggleProductType(type)}
                        className="w-4 h-4 text-[#c9a962] border-gray-300 rounded focus:ring-[#c9a962]"
                      />
                      <span className="ml-2 text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range *
                </label>
                <select
                  value={formData.priceRange}
                  onChange={(e) => updateFormData('priceRange', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  required
                >
                  <option value="">Select range</option>
                  <option value="budget">Budget ($0-50)</option>
                  <option value="mid">Mid-range ($50-150)</option>
                  <option value="premium">Premium ($150-500)</option>
                  <option value="luxury">Luxury ($500+)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Monthly Order Volume
                </label>
                <select
                  value={formData.monthlyVolume}
                  onChange={(e) => updateFormData('monthlyVolume', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                >
                  <option value="">Select volume</option>
                  <option value="1-10">1-10 orders/month</option>
                  <option value="10-50">10-50 orders/month</option>
                  <option value="50-100">50-100 orders/month</option>
                  <option value="100+">100+ orders/month</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do any of your products contain synthetic fibers? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="syntheticFibers"
                      value="no"
                      checked={formData.usesSyntheticFibers === 'no'}
                      onChange={(e) => updateFormData('usesSyntheticFibers', e.target.value)}
                      className="w-4 h-4 text-[#c9a962] border-gray-300 focus:ring-[#c9a962]"
                    />
                    <span className="ml-2 text-gray-700">No, all natural fibers</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="syntheticFibers"
                      value="yes"
                      checked={formData.usesSyntheticFibers === 'yes'}
                      onChange={(e) => updateFormData('usesSyntheticFibers', e.target.value)}
                      className="w-4 h-4 text-[#c9a962] border-gray-300 focus:ring-[#c9a962]"
                    />
                    <span className="ml-2 text-gray-700">Yes, some products have synthetics</span>
                  </label>
                </div>
              </div>

              {formData.usesSyntheticFibers === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Which products and why?
                  </label>
                  <textarea
                    value={formData.syntheticExplanation}
                    onChange={(e) => updateFormData('syntheticExplanation', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Note: Products with synthetic materials cannot be listed on our platform.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you willing to only list natural fiber products? *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="willingToComply"
                      value="yes"
                      checked={formData.willingToComply === 'yes'}
                      onChange={(e) => updateFormData('willingToComply', e.target.value)}
                      className="w-4 h-4 text-[#c9a962] border-gray-300 focus:ring-[#c9a962]"
                    />
                    <span className="ml-2 text-gray-700">Yes, I agree to only list natural fiber products</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="willingToComply"
                      value="no"
                      checked={formData.willingToComply === 'no'}
                      onChange={(e) => updateFormData('willingToComply', e.target.value)}
                      className="w-4 h-4 text-[#c9a962] border-gray-300 focus:ring-[#c9a962]"
                    />
                    <span className="ml-2 text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Sample Products */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <p className="text-gray-600 mb-4">
                Add up to 5 sample products you'd like to sell (at least 1 required):
              </p>

              {formData.sampleProducts.map((product, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">Product {index + 1}</h3>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSampleProduct(index)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={product.name}
                      onChange={(e) => updateSampleProduct(index, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                    />
                    <input
                      type="url"
                      placeholder="Product URL or image link"
                      value={product.url}
                      onChange={(e) => updateSampleProduct(index, 'url', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Fiber content (e.g., 100% linen)"
                      value={product.fabric}
                      onChange={(e) => updateSampleProduct(index, 'fabric', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Price ($)"
                      value={product.price}
                      onChange={(e) => updateSampleProduct(index, 'price', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                    />
                  </div>
                </div>
              ))}

              {formData.sampleProducts.length < 5 && (
                <button
                  type="button"
                  onClick={addSampleProduct}
                  className="text-[#c9a962] hover:underline text-sm font-medium"
                >
                  + Add another product
                </button>
              )}
            </div>
          )}

          {/* Step 5: Final Questions */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to join Frequency & Form? *
                </label>
                <textarea
                  value={formData.whyJoin}
                  onChange={(e) => updateFormData('whyJoin', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you hear about us?
                </label>
                <select
                  value={formData.howHeard}
                  onChange={(e) => updateFormData('howHeard', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="search">Search Engine</option>
                  <option value="social">Social Media</option>
                  <option value="referral">Referral</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anything else we should know?
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => updateFormData('additionalNotes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                />
              </div>

              <div className="space-y-3 pt-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.confirmAccurate}
                    onChange={(e) => updateFormData('confirmAccurate', e.target.checked)}
                    className="w-4 h-4 text-[#c9a962] border-gray-300 rounded focus:ring-[#c9a962] mt-1"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I confirm all information provided is accurate *
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => updateFormData('agreeTerms', e.target.checked)}
                    className="w-4 h-4 text-[#c9a962] border-gray-300 rounded focus:ring-[#c9a962] mt-1"
                    required
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the Partner Terms of Service *
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-2 rounded-sm ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-[#1a3a2f] hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-2 rounded-sm ${
                  canProceed()
                    ? 'bg-[#c9a962] hover:bg-[#b89952] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className={`flex items-center gap-2 px-8 py-2 rounded-sm ${
                  canProceed() && !isSubmitting
                    ? 'bg-[#1a3a2f] hover:bg-[#1a3a2f]/90 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
