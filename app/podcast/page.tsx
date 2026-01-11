'use client';

import { Mic2, Calendar, CheckCircle2, Sparkles } from 'lucide-react';

export default function PodcastPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#1a3a2f] to-[#1a3a2f]/90 text-white py-24">
        <div className="absolute inset-0 bg-[url('/fabric-texture.jpg')] opacity-5 bg-cover bg-center" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Mic2 className="w-16 h-16 text-[#c9a962]" />
          </div>
          <h1 className="text-5xl md:text-6xl font-serif mb-6">
            The Sovereign Designer Podcast
          </h1>
          <p className="text-xl md:text-2xl text-[#e8dcc4] mb-8 max-w-3xl mx-auto">
            Conversations about natural materials, self-sufficiency, lasting systems, and the art of sovereign living.
          </p>
          <a
            href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#c9a962] hover:bg-[#b89952] text-[#1a3a2f] px-10 py-4 rounded-sm text-lg font-medium transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Book Your Guest Spot
          </a>
          <p className="text-[#e8dcc4] mt-4 text-sm">
            Share your expertise with an audience that values conscious living
          </p>
        </div>
      </section>

      {/* About the Podcast */}
      <section className="py-20 bg-[#f8f6f3]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-[#1a3a2f] text-center mb-6">
            About the Show
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center max-w-3xl mx-auto">
            The Sovereign Designer explores the science, craft, and philosophy behind living in alignment with natural systems.
            From the frequency of fabrics to the timber in our homes, we interview experts who understand that what surrounds
            us shapes our energy, health, and sovereignty.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-sm shadow-sm">
              <Sparkles className="w-10 h-10 text-[#c9a962] mb-4" />
              <h3 className="text-xl font-serif text-[#1a3a2f] mb-3">Topics We Explore</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a962] mt-1">•</span>
                  <span>Fabric frequency science & natural fibers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a962] mt-1">•</span>
                  <span>Timber frame homes & natural building</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a962] mt-1">•</span>
                  <span>Self-sufficiency systems & homesteading</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a962] mt-1">•</span>
                  <span>Lasting, regenerative design principles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a962] mt-1">•</span>
                  <span>Sovereign living & conscious entrepreneurship</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c9a962] mt-1">•</span>
                  <span>Ancestral wisdom meets modern science</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-sm shadow-sm">
              <Mic2 className="w-10 h-10 text-[#c9a962] mb-4" />
              <h3 className="text-xl font-serif text-[#1a3a2f] mb-3">Our Audience</h3>
              <p className="text-gray-700 mb-4">
                Conscious creators, homesteaders, natural fiber enthusiasts, sustainable builders,
                and anyone designing a life aligned with natural principles.
              </p>
              <div className="bg-[#f8f6f3] p-4 rounded-sm">
                <p className="text-sm text-gray-600 italic">
                  "People who understand that what touches their skin, surrounds their home,
                  and fills their days matters to their energy and sovereignty."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Guest Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-[#1a3a2f] text-center mb-12">
            You'd Be a Perfect Guest If...
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Natural Materials Expert',
                desc: 'You understand fabric frequencies, natural building materials, or the science of what surrounds us'
              },
              {
                title: 'Sustainable Craftsperson',
                desc: 'You create lasting goods using traditional methods—textiles, timber, tools, or systems'
              },
              {
                title: 'Self-Sufficiency Practitioner',
                desc: 'You live or teach homesteading, regenerative agriculture, or off-grid systems'
              },
              {
                title: 'Conscious Entrepreneur',
                desc: 'You built a business aligned with natural principles and sovereign living'
              },
              {
                title: 'Health & Energy Researcher',
                desc: 'You study how materials, frequencies, or environments affect human health'
              },
              {
                title: 'Traditional Skills Teacher',
                desc: 'You preserve and teach ancestral crafts, building methods, or land practices'
              },
            ].map((guest, idx) => (
              <div key={idx} className="flex items-start gap-4 bg-[#f8f6f3] p-6 rounded-sm">
                <CheckCircle2 className="w-6 h-6 text-[#c9a962] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif text-lg text-[#1a3a2f] mb-2">{guest.title}</h3>
                  <p className="text-sm text-gray-700">{guest.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#1a3a2f] text-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-center mb-12">
            The Guest Experience
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: 1, title: 'Book Your Spot', desc: 'Schedule via Calendly - takes 30 seconds' },
              { num: 2, title: 'Pre-Interview Chat', desc: 'Quick call to plan topics & flow' },
              { num: 3, title: 'Record Together', desc: '45-60 minute conversation (Zoom)' },
              { num: 4, title: 'Share & Amplify', desc: 'We handle editing, you share with your audience' },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-16 h-16 bg-[#c9a962] text-[#1a3a2f] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-serif mb-2">{step.title}</h3>
                <p className="text-sm text-[#e8dcc4]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-20 bg-[#f8f6f3]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-serif text-[#1a3a2f] text-center mb-12">
            What You Get as a Guest
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Exposure', desc: 'Reach our audience of conscious consumers and sovereign living enthusiasts' },
              { title: 'Credibility', desc: 'Position yourself as an expert in natural systems and sustainable living' },
              { title: 'Sharable Content', desc: 'Professional audio/video clips perfect for your own marketing' },
              { title: 'Backlinks', desc: 'Show notes with links to your website, products, or services' },
              { title: 'Community', desc: 'Join our network of conscious creators and thought leaders' },
              { title: 'Fun Conversation', desc: 'No script, no pressure - just authentic dialogue' },
            ].map((benefit, idx) => (
              <div key={idx} className="bg-white p-6 rounded-sm shadow-sm text-center">
                <h3 className="font-serif text-xl text-[#1a3a2f] mb-3">{benefit.title}</h3>
                <p className="text-sm text-gray-700">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-[#1a3a2f] to-[#1a3a2f]/90 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">
            Ready to Share Your Story?
          </h2>
          <p className="text-lg text-[#e8dcc4] mb-8">
            If you're passionate about natural materials, self-sufficiency, or sovereign living,
            our audience wants to hear from you.
          </p>
          <a
            href="https://calendly.com/maggie-maggieforbesstrategies/podcast-call-1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#c9a962] hover:bg-[#b89952] text-[#1a3a2f] px-10 py-4 rounded-sm text-lg font-medium transition-colors mb-6"
          >
            <Calendar className="w-5 h-5" />
            Book Your Guest Spot Now
          </a>
          <p className="text-sm text-[#e8dcc4]">
            Questions? Email us at <a href="mailto:concierge@frequencyandform.com" className="text-[#c9a962] underline">concierge@frequencyandform.com</a>
          </p>
        </div>
      </section>

      {/* Host Bio */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-serif text-[#1a3a2f] text-center mb-8">
            Your Host
          </h2>
          <div className="bg-[#f8f6f3] p-8 rounded-sm">
            <h3 className="text-2xl font-serif text-[#1a3a2f] mb-3">Maggie Forbes</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Founder of Frequency & Form and advocate for sovereign living through natural systems.
              Maggie explores the intersection of science and ancestral wisdom—from the frequency of
              fabrics to the timber in our homes.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Her mission: help conscious individuals design lives aligned with natural principles,
              one conversation at a time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
