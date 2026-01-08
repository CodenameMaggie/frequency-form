'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://frequency-form-production.up.railway.app/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Frequency & Form - Bot Dashboard</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          {health ? (
            <div>
              <p className="mb-2">Status: <span className="font-mono text-green-600">{health.status}</span></p>
              <p className="mb-2">Database: <span className="font-mono">{health.database}</span></p>
              <p className="mb-2">Business: <span className="font-mono">{health.business}</span></p>
              <p className="mb-4">Time: <span className="font-mono text-sm">{health.timestamp}</span></p>

              <h3 className="font-semibold mb-2">Active Bots ({health.bots?.length || 0}):</h3>
              <div className="flex flex-wrap gap-2">
                {health.bots?.map((bot: string) => (
                  <span key={bot} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {bot}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-600">Bot server is offline or redeploying</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a href="https://railway.app/dashboard" target="_blank" rel="noopener noreferrer"
               className="block text-blue-600 hover:underline">
              🚂 Railway Dashboard (Logs & Metrics)
            </a>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
               className="block text-blue-600 hover:underline">
              💾 Supabase Database
            </a>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
               className="block text-blue-600 hover:underline">
              ▲ Vercel Dashboard
            </a>
            <a href="https://frequency-form-production.up.railway.app/health" target="_blank" rel="noopener noreferrer"
               className="block text-blue-600 hover:underline">
              🏥 Bot Health API
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
