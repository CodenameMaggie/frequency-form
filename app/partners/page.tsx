import Link from 'next/link'
import { CheckCircle2, TrendingUp, Shield, DollarSign, Users, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Sell on Frequency & Form | Brand Partner Portal',
  description: 'Join the marketplace for healing-frequency natural fibers. Reach customers who care about what touches their skin.',
}

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#1a3a2f] to-[#1a3a2f]/90 text-white py-24">
        <div className="absolute inset-0 bg-[url('/fabric-texture.jpg')] opacity-5 bg-cover bg-center" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-serif mb-6">
            Sell on Frequency & Form
          </h1>
          <p className="text-xl md:text-2xl text-[#e8dcc4] mb-8 max-w-3xl mx-auto">
            Join the marketplace for healing-frequency natural fibers and reach customers who truly understand the power of what touches their skin.
          </p>
          <Link
            href="/partners/apply"
            className="inline-block bg-[#c9a962] hover:bg-[#b89952] text-[#1a3a2f] px-10 py-4 rounded-sm text-lg font-medium transition-colors"
          >
            Apply to Become a Partner
          </Link>
          <p className="text-[#e8dcc4] mt-4 text-sm">
            ✨ First 50 brands get Founding Partner status (15% commission forever)
          </p>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 bg-[#f8f6f3]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-[#1a3a2f] text-center mb-12">
            Why Brands Choose Us
          </h2>
          <div className="grid md:grid-3 gap-8">
            <div className="bg-white p-8 rounded-sm shadow-sm">
              <Users className="w-12 h-12 text-[#c9a962] mb-4" />
              <h3 className="text-xl font-serif text-[#1a3a2f] mb-3">Curated Audience</h3>
              <p className="text-gray-700">
                Reach customers who actively seek natural fibers and understand frequency science. No competing with fast fashion.
              </p>
            </div>

            <div className="bg-white p-8 rounded-sm shadow-sm">
              <Shield className="w-12 h-12 text-[#c9a962] mb-4" />
              <h3 className="text-xl font-serif text-[#1a3a2f] mb-3">Frequency Verified™</h3>
              <p className="text-gray-700">
                Your products earn our verified badge, signaling quality and authenticity to customers who care.
              </p>
            </div>

            <div className="bg-white p-8 rounded-sm shadow-sm">
              <Sparkles className="w-12 h-12 text-[#c9a962] mb-4" />
              <h3 className="text-xl font-serif text-[#1a3a2f] mb-3">Beautiful Presentation</h3>
              <p className="text-gray-700">
                Your products showcase in our elegant, luxury-focused design that highlights natural beauty.
              </p>
            </div>

            <div className="bg-white p-8 rounded-sm shadow-sm">
              <TrendingUp className="w-12 h-12 text-[#c9a962] mb-4" />
              <h3 className="text-xl font-serif text-[#1a3a2f] mb-3">Marketing Support</h3>
              <p className="text-gray-700">
                We handle SEO, social media, and email marketing. You focus on creating exceptional products.
              </p>
            </div>

            <div className="bg-white p-8 rounded-sm shadow-sm">
              <DollarSign className="w-12 h-12 text-[#c9a962] mb-4" />
              <h3 className="text-xl font-serif text-[#1a3a2f] mb-3">Transparent Commission</h3>
              <p className="text-gray-700">
                Simple 20% commission (15% for Founding Partners). No hidden fees, no surprises.
              </p>
            </div>

            <div className="bg-white p-8 rounded-sm shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-[#c9a962] mb-4" />
              <h3 className="text-xl font-serif text-[#1a3a2f] mb-3">Fast Payouts</h3>
              <p className="text-gray-700">
                Weekly payouts with transparent reporting. You always know exactly what you've earned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-[#1a3a2f] text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-5 gap-8">
            {[
              { num: 1, title: 'Apply', desc: 'Tell us about your brand and natural fiber products' },
              { num: 2, title: 'Get Verified', desc: 'We review your materials for frequency compliance' },
              { num: 3, title: 'List Products', desc: 'Upload your inventory to our platform' },
              { num: 4, title: 'Start Selling', desc: 'We handle marketing, you handle fulfillment' },
              { num: 5, title: 'Get Paid', desc: 'Weekly payouts, transparent reporting' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 bg-[#c9a962] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-serif text-[#1a3a2f] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-[#1a3a2f] text-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-center mb-8">
            Frequency Standards
          </h2>
          <p className="text-[#e8dcc4] text-center mb-12 text-lg">
            We only partner with brands that meet our frequency standards:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#c9a962] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium">Natural fibers only</p>
                <p className="text-[#e8dcc4] text-sm">Linen, wool, cashmere, hemp, organic cotton</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#c9a962] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium">No synthetic blends</p>
                <p className="text-[#e8dcc4] text-sm">Polyester, nylon, acrylic, rayon prohibited</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#c9a962] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium">No linen/wool blends</p>
                <p className="text-[#e8dcc4] text-sm">Frequencies cancel - wear on different days</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#c9a962] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium">Transparent sourcing</p>
                <p className="text-[#e8dcc4] text-sm">Honest about materials and origins</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#c9a962] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium">Quality craftsmanship</p>
                <p className="text-[#e8dcc4] text-sm">Well-made pieces that last</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#c9a962] flex-shrink-0 mt-1" />
              <div>
                <p className="font-medium">Values alignment</p>
                <p className="text-[#e8dcc4] text-sm">Respect for healing properties of natural fibers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-[#1a3a2f] text-center mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-2 border-[#c9a962] p-8 rounded-sm relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#c9a962] text-white px-4 py-1 rounded-full text-sm font-medium">
                ⭐ LIMITED TIME
              </div>
              <h3 className="text-2xl font-serif text-[#1a3a2f] mb-4 mt-2">Founding Partner</h3>
              <div className="text-4xl font-bold text-[#1a3a2f] mb-2">15%</div>
              <p className="text-gray-600 mb-6">Commission (locked in forever)</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                  <span>Featured homepage placement</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                  <span>"Founding Partner" badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                  <span>Input on platform features</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500">First 50 brands only</p>
            </div>

            <div className="border border-gray-200 p-8 rounded-sm">
              <h3 className="text-2xl font-serif text-[#1a3a2f] mb-4">Standard Partner</h3>
              <div className="text-4xl font-bold text-[#1a3a2f] mb-2">20%</div>
              <p className="text-gray-600 mb-6">Commission</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                  <span>Full marketplace access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                  <span>Frequency Verified™ badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                  <span>Weekly payouts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#c9a962]" />
                  <span>Marketing support</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500">Volume discounts available</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#f8f6f3]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif text-[#1a3a2f] mb-6">
            Ready to Join?
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Application takes 5 minutes. We typically review within 3-5 business days.
          </p>
          <Link
            href="/partners/apply"
            className="inline-block bg-[#1a3a2f] hover:bg-[#1a3a2f]/90 text-white px-10 py-4 rounded-sm text-lg font-medium transition-colors"
          >
            Apply Now
          </Link>
          <p className="text-sm text-gray-600 mt-6">
            Questions? Email us at <a href="mailto:concierge@frequencyandform.com" className="text-[#c9a962] underline">concierge@frequencyandform.com</a>
          </p>
        </div>
      </section>
    </div>
  )
}
