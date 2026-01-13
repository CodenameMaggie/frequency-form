'use client';

import { useEffect, useState } from 'react';

interface BotHealth {
  status: string;
  database: string;
  business: string;
  bots: string[];
  timestamp?: string;
}

interface BotActivity {
  bot_actions: number;
  emails_sent: number;
  leads_discovered: number;
  ai_queries: number;
}

export default function BotsDashboard() {
  const [botHealth, setBotHealth] = useState<BotHealth | null>(null);
  const [activity, setActivity] = useState<BotActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchBotStatus() {
    try {
      // Check bot server health (use local server if available, fallback to production)
      const baseUrl = window.location.origin;
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthData = await healthRes.json();
      setBotHealth(healthData);

      // Mock activity data (in production, this would come from an API endpoint)
      setActivity({
        bot_actions: 0,
        emails_sent: 0,
        leads_discovered: 0,
        ai_queries: 0
      });

      setLoading(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e2a3a] mx-auto mb-4"></div>
          <p className="text-[#5a6a7a]">Loading bot status...</p>
        </div>
      </div>
    );
  }

  const isHealthy = botHealth?.status === 'healthy';

  return (
    <div className="min-h-screen bg-[#f5f0e4]">
      {/* Header */}
      <div className="bg-[#1e2a3a] text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-3xl font-light tracking-wider mb-2">Bot Dashboard</h1>
          <p className="text-[#b8a888] text-sm">Frequency & Form Autonomous Operations</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl text-[#1e2a3a]">System Status</h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className={`text-sm font-medium ${isHealthy ? 'text-green-700' : 'text-red-700'}`}>
                {isHealthy ? 'Operational' : 'Offline'}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 text-sm">Error: {error}</p>
              <p className="text-red-600 text-xs mt-1">The bot server may be redeploying or temporarily unavailable.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#f5f0e4] p-4 rounded">
              <p className="text-[#5a6a7a] text-xs uppercase tracking-wider mb-1">Database</p>
              <p className="text-[#1e2a3a] text-lg font-medium">{botHealth?.database || 'Unknown'}</p>
            </div>
            <div className="bg-[#f5f0e4] p-4 rounded">
              <p className="text-[#5a6a7a] text-xs uppercase tracking-wider mb-1">Business</p>
              <p className="text-[#1e2a3a] text-lg font-medium">{botHealth?.business || 'N/A'}</p>
            </div>
            <div className="bg-[#f5f0e4] p-4 rounded">
              <p className="text-[#5a6a7a] text-xs uppercase tracking-wider mb-1">Last Updated</p>
              <p className="text-[#1e2a3a] text-lg font-medium">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Active Bots */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-4">Active Bots ({botHealth?.bots?.length || 0})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {botHealth?.bots?.map((bot) => (
              <div key={bot} className="bg-[#f5f0e4] p-4 rounded text-center">
                <div className="w-8 h-8 bg-[#d4c8a8] rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-[#1e2a3a] text-sm font-bold">{bot.charAt(0)}</span>
                </div>
                <p className="text-[#1e2a3a] text-sm font-medium">{bot}</p>
                <p className="text-[#5a6a7a] text-xs mt-1">Online</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-4">24-Hour Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#f5f0e4] p-6 rounded">
              <p className="text-[#5a6a7a] text-xs uppercase tracking-wider mb-2">Bot Actions</p>
              <p className="text-[#1e2a3a] text-3xl font-light">{activity?.bot_actions || 0}</p>
            </div>
            <div className="bg-[#f5f0e4] p-6 rounded">
              <p className="text-[#5a6a7a] text-xs uppercase tracking-wider mb-2">Emails Sent</p>
              <p className="text-[#1e2a3a] text-3xl font-light">{activity?.emails_sent || 0}</p>
            </div>
            <div className="bg-[#f5f0e4] p-6 rounded">
              <p className="text-[#5a6a7a] text-xs uppercase tracking-wider mb-2">Leads Discovered</p>
              <p className="text-[#1e2a3a] text-3xl font-light">{activity?.leads_discovered || 0}</p>
            </div>
            <div className="bg-[#f5f0e4] p-6 rounded">
              <p className="text-[#5a6a7a] text-xs uppercase tracking-wider mb-2">AI Queries</p>
              <p className="text-[#1e2a3a] text-3xl font-light">{activity?.ai_queries || 0}</p>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-blue-800 text-sm">
              ℹ️ Activity data will populate once cron jobs start running (10-15 minutes after deployment).
            </p>
          </div>
        </div>

        {/* Cron Schedule */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-4">Automated Cron Jobs</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-[#e8dcc4]">
              <span className="text-[#1e2a3a] text-sm">Dan Free Scraper</span>
              <span className="text-[#5a6a7a] text-xs">Every 10 minutes</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e8dcc4]">
              <span className="text-[#1e2a3a] text-sm">Dan Auto Outreach</span>
              <span className="text-[#5a6a7a] text-xs">Hourly (9am-5pm)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e8dcc4]">
              <span className="text-[#1e2a3a] text-sm">Email Queue Processor</span>
              <span className="text-[#5a6a7a] text-xs">Every 5 minutes</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e8dcc4]">
              <span className="text-[#1e2a3a] text-sm">Social Lead Discovery</span>
              <span className="text-[#5a6a7a] text-xs">Every 30 minutes</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#e8dcc4]">
              <span className="text-[#1e2a3a] text-sm">Lead Conversion</span>
              <span className="text-[#5a6a7a] text-xs">Hourly</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#1e2a3a] text-sm">+ 16 more jobs...</span>
              <span className="text-[#5a6a7a] text-xs">Various schedules</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-serif text-2xl text-[#1e2a3a] mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://frequency-form-production.up.railway.app/health"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#f5f0e4] rounded hover:bg-[#e8dcc4] transition-colors"
            >
              <span className="text-2xl">🏥</span>
              <div>
                <p className="text-[#1e2a3a] font-medium">Bot Server Health</p>
                <p className="text-[#5a6a7a] text-xs">Check live status</p>
              </div>
            </a>
            <a
              href="https://railway.app/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#f5f0e4] rounded hover:bg-[#e8dcc4] transition-colors"
            >
              <span className="text-2xl">🚂</span>
              <div>
                <p className="text-[#1e2a3a] font-medium">Railway Dashboard</p>
                <p className="text-[#5a6a7a] text-xs">View logs & metrics</p>
              </div>
            </a>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#f5f0e4] rounded hover:bg-[#e8dcc4] transition-colors"
            >
              <span className="text-2xl">💾</span>
              <div>
                <p className="text-[#1e2a3a] font-medium">Supabase Database</p>
                <p className="text-[#5a6a7a] text-xs">Query bot data</p>
              </div>
            </a>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[#f5f0e4] rounded hover:bg-[#e8dcc4] transition-colors"
            >
              <span className="text-2xl">▲</span>
              <div>
                <p className="text-[#1e2a3a] font-medium">Vercel Dashboard</p>
                <p className="text-[#5a6a7a] text-xs">Frontend deployments</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
