'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, XCircle, Settings } from 'lucide-react';

interface EmailPreferences {
  marketing_emails: boolean;
  product_updates: boolean;
  order_updates: boolean;
  partner_updates: boolean;
  podcast_updates: boolean;
  unsubscribed_all: boolean;
}

interface PreferencesData {
  email: string;
  preferences: EmailPreferences;
  categories: Record<string, string>;
  critical_categories: string[];
}

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const category = searchParams.get('category');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [data, setData] = useState<PreferencesData | null>(null);
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);

  // Fetch current preferences
  useEffect(() => {
    if (!token) {
      setError('Invalid unsubscribe link. Please use the link from your email.');
      setLoading(false);
      return;
    }

    fetchPreferences();
  }, [token]);

  async function fetchPreferences() {
    try {
      const response = await fetch(`/api/unsubscribe?token=${token}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to load preferences');
        setLoading(false);
        return;
      }

      setData(result.data);
      setPreferences(result.data.preferences);
      setLoading(false);

      // Auto-unsubscribe if specific category requested
      if (category && !result.data.preferences.unsubscribed_all) {
        await handleUnsubscribeCategory(category);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load preferences');
      setLoading(false);
    }
  }

  async function handleUnsubscribeAll() {
    if (!token) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'unsubscribe_all',
          reason: 'User requested via unsubscribe page'
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to unsubscribe');
        setLoading(false);
        return;
      }

      setSuccess(result.message);
      await fetchPreferences(); // Refresh preferences
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe');
      setLoading(false);
    }
  }

  async function handleUnsubscribeCategory(cat: string) {
    if (!token) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'unsubscribe_category',
          category: cat,
          reason: 'User requested via unsubscribe page'
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to unsubscribe');
        setLoading(false);
        return;
      }

      setSuccess(result.message);
      await fetchPreferences(); // Refresh preferences
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe');
      setLoading(false);
    }
  }

  async function handleUpdatePreferences() {
    if (!token || !preferences) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          preferences
        })
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to update preferences');
        setLoading(false);
        return;
      }

      setSuccess(result.message);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
      setLoading(false);
    }
  }

  function togglePreference(key: keyof EmailPreferences) {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: !preferences[key] });
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#f8f6f3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#c9a962] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3]">
      {/* Header */}
      <section className="bg-gradient-to-b from-[#1a3a2f] to-[#1a3a2f]/90 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-12 h-12 text-[#c9a962]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4">
            Email Preferences
          </h1>
          <p className="text-lg text-[#e8dcc4]">
            Manage your email subscription preferences for Frequency & Form
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-sm mb-6 flex items-start gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-sm mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{success}</p>
            </div>
          )}

          {/* Preferences Form */}
          {data && preferences && (
            <div className="bg-white rounded-sm shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-[#c9a962]" />
                <h2 className="text-2xl font-serif text-[#1a3a2f]">
                  Email Preferences for {data.email}
                </h2>
              </div>

              {preferences.unsubscribed_all ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-serif text-[#1a3a2f] mb-2">
                    You are unsubscribed
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You will not receive marketing emails from Frequency & Form.
                    You will still receive important order updates.
                  </p>
                  <button
                    onClick={() => {
                      setPreferences({
                        ...preferences,
                        unsubscribed_all: false,
                        marketing_emails: true,
                        product_updates: true,
                        partner_updates: true,
                        podcast_updates: true
                      });
                    }}
                    className="bg-[#c9a962] hover:bg-[#b89952] text-white px-6 py-3 rounded-sm transition-colors"
                  >
                    Resubscribe to All Emails
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6">
                    Choose which emails you'd like to receive from us. You can change these preferences at any time.
                  </p>

                  <div className="space-y-4 mb-8">
                    {/* Marketing Emails */}
                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-sm hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={preferences.marketing_emails}
                        onChange={() => togglePreference('marketing_emails')}
                        className="mt-1 w-5 h-5 text-[#c9a962] rounded focus:ring-[#c9a962]"
                      />
                      <div>
                        <div className="font-medium text-[#1a3a2f]">Marketing Emails</div>
                        <div className="text-sm text-gray-600">Promotional emails, sales, and special offers</div>
                      </div>
                    </label>

                    {/* Product Updates */}
                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-sm hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={preferences.product_updates}
                        onChange={() => togglePreference('product_updates')}
                        className="mt-1 w-5 h-5 text-[#c9a962] rounded focus:ring-[#c9a962]"
                      />
                      <div>
                        <div className="font-medium text-[#1a3a2f]">Product Updates</div>
                        <div className="text-sm text-gray-600">New product announcements and collection launches</div>
                      </div>
                    </label>

                    {/* Partner Updates */}
                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-sm hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={preferences.partner_updates}
                        onChange={() => togglePreference('partner_updates')}
                        className="mt-1 w-5 h-5 text-[#c9a962] rounded focus:ring-[#c9a962]"
                      />
                      <div>
                        <div className="font-medium text-[#1a3a2f]">Partner Updates</div>
                        <div className="text-sm text-gray-600">New partner brands and featured designers</div>
                      </div>
                    </label>

                    {/* Podcast Updates */}
                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-sm hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={preferences.podcast_updates}
                        onChange={() => togglePreference('podcast_updates')}
                        className="mt-1 w-5 h-5 text-[#c9a962] rounded focus:ring-[#c9a962]"
                      />
                      <div>
                        <div className="font-medium text-[#1a3a2f]">Modern Mondays Podcast</div>
                        <div className="text-sm text-gray-600">New episodes and guest announcements</div>
                      </div>
                    </label>

                    {/* Order Updates (Always Enabled) */}
                    <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-sm bg-gray-50 opacity-60">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="mt-1 w-5 h-5 text-[#c9a962] rounded"
                      />
                      <div>
                        <div className="font-medium text-[#1a3a2f]">Order Updates (Required)</div>
                        <div className="text-sm text-gray-600">Order confirmations, shipping notifications (cannot be disabled)</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleUpdatePreferences}
                      disabled={loading}
                      className="flex-1 bg-[#c9a962] hover:bg-[#b89952] text-white px-6 py-3 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                    <button
                      onClick={handleUnsubscribeAll}
                      disabled={loading}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Unsubscribe from All
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Questions about your subscription? Email us at{' '}
              <a href="mailto:concierge@frequencyandform.com" className="text-[#c9a962] underline">
                concierge@frequencyandform.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
