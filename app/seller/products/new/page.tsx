'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, AlertCircle } from 'lucide-react'

const NATURAL_FABRICS = [
  { value: 'linen', label: 'Linen', frequency: '5000 Hz' },
  { value: 'wool', label: 'Wool', frequency: '5000 Hz' },
  { value: 'cotton', label: 'Cotton (Organic)', frequency: '100 Hz' },
  { value: 'silk', label: 'Silk', frequency: '15 Hz' },
  { value: 'hemp', label: 'Hemp', frequency: '~5000 Hz' },
  { value: 'bamboo', label: 'Bamboo (100% Natural)', frequency: '~100 Hz' },
  { value: 'cashmere', label: 'Cashmere', frequency: '~5000 Hz' },
  { value: 'alpaca', label: 'Alpaca', frequency: '~5000 Hz' },
]

const PRODUCT_CATEGORIES = [
  'Clothing',
  'Bedding',
  'Home Textiles',
  'Accessories',
  'Towels & Bath',
  'Baby & Kids',
  'Activewear',
  'Other',
]

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fabricType: '',
    fabricComposition: '',
    price: '',
    compareAtPrice: '',
    inventoryCount: '',
    lowStockThreshold: '10',
    category: '',
    careInstructions: '',
    imageUrl: '',
    confirmNaturalFibers: false,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required')
      return false
    }

    if (!formData.description.trim()) {
      setError('Product description is required')
      return false
    }

    if (!formData.fabricType) {
      setError('Please select a fabric type')
      return false
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price')
      return false
    }

    if (!formData.inventoryCount || parseInt(formData.inventoryCount) < 0) {
      setError('Please enter a valid inventory count')
      return false
    }

    if (!formData.category) {
      setError('Please select a category')
      return false
    }

    if (!formData.confirmNaturalFibers) {
      setError('You must confirm this product contains only natural fibers')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Convert price to cents
      const priceInCents = Math.round(parseFloat(formData.price) * 100)
      const compareAtPriceInCents = formData.compareAtPrice
        ? Math.round(parseFloat(formData.compareAtPrice) * 100)
        : null

      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          fabricType: formData.fabricType,
          fabricComposition: formData.fabricComposition,
          price: priceInCents,
          compareAtPrice: compareAtPriceInCents,
          inventoryCount: parseInt(formData.inventoryCount),
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          category: formData.category,
          careInstructions: formData.careInstructions,
          imageUrl: formData.imageUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create product')
      }

      setSuccessMessage('Product submitted for approval!')
      setTimeout(() => {
        router.push('/seller/products')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedFabric = NATURAL_FABRICS.find((f) => f.value === formData.fabricType)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[#1a3a2f] mb-2">
          Add New Product
        </h1>
        <p className="text-gray-600">
          List a new natural fiber product in the marketplace
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-sm">
          {successMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <h2 className="text-xl font-serif text-[#1a3a2f] mb-6">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                placeholder="e.g., Organic Linen Bedsheet Set"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                placeholder="Describe your product, its benefits, and what makes it special..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Include details about materials, craftsmanship, and frequency benefits
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Frequency & Fabric */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <h2 className="text-xl font-serif text-[#1a3a2f] mb-2">
            Frequency & Fabric
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Only natural fibers are allowed on Frequency & Form
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Fabric Type <span className="text-red-500">*</span>
              </label>
              <select
                name="fabricType"
                value={formData.fabricType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                required
              >
                <option value="">Select a fabric</option>
                {NATURAL_FABRICS.map((fabric) => (
                  <option key={fabric.value} value={fabric.value}>
                    {fabric.label} - {fabric.frequency}
                  </option>
                ))}
              </select>
              {selectedFabric && (
                <div className="mt-3 p-3 bg-[#f8f6f3] rounded-sm">
                  <div className="text-sm font-medium text-[#1a3a2f]">
                    Healing Frequency: {selectedFabric.frequency}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    This natural fiber supports cellular health and energy balance
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Fabric Composition
              </label>
              <input
                type="text"
                name="fabricComposition"
                value={formData.fabricComposition}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                placeholder="e.g., 100% Organic Linen or 80% Wool, 20% Silk"
              />
              <p className="text-sm text-gray-500 mt-1">
                If your product uses multiple fabrics, list them here
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-sm">
              <input
                type="checkbox"
                name="confirmNaturalFibers"
                checked={formData.confirmNaturalFibers}
                onChange={handleChange}
                className="mt-1"
                required
              />
              <label className="text-sm text-gray-700">
                <span className="font-medium">I confirm this product contains only natural fibers</span>
                <br />
                <span className="text-gray-600">
                  Products with synthetic materials (polyester, nylon, acrylic, etc.) will be rejected.
                  Our marketplace is dedicated to natural, healing-frequency materials only.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <h2 className="text-xl font-serif text-[#1a3a2f] mb-6">
            Pricing & Inventory
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You'll receive 80% after platform fee
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare at Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  name="compareAtPrice"
                  value={formData.compareAtPrice}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional: Show as strikethrough price
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inventory Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="inventoryCount"
                value={formData.inventoryCount}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Low Stock Threshold
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                You'll be notified when stock falls below this
              </p>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <h2 className="text-xl font-serif text-[#1a3a2f] mb-6">
            Product Images
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              For now, provide a direct URL to your product image. File upload coming soon.
            </p>
          </div>

          {formData.imageUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-700 mb-2">Preview:</p>
              <div className="w-32 h-32 border border-gray-200 rounded-sm overflow-hidden">
                <img
                  src={formData.imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = ''
                    e.currentTarget.className = 'w-full h-full flex items-center justify-center bg-gray-100'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <h2 className="text-xl font-serif text-[#1a3a2f] mb-6">
            Product Details
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Care Instructions
            </label>
            <textarea
              name="careInstructions"
              value={formData.careInstructions}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
              placeholder="e.g., Machine wash cold, tumble dry low, iron on low heat if needed"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#1a3a2f] hover:bg-[#1a3a2f]/90 text-white px-8 py-3 rounded-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>Submitting...</>
            ) : (
              <>
                <Package className="w-5 h-5" />
                Submit for Approval
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your product will be reviewed within 24-48 hours</li>
            <li>• We verify all products contain only natural fibers</li>
            <li>• Once approved, your product will go live on the marketplace</li>
            <li>• You'll receive an email notification about the status</li>
          </ul>
        </div>
      </form>
    </div>
  )
}
