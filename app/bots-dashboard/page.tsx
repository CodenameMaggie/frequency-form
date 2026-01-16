'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp, Users, Bot, Mail, Search, Share2,
  DollarSign, Target, Calendar, AlertCircle, CheckCircle2,
  Clock, Zap, Shield, BarChart3
} from 'lucide-react';

// Revenue Goal: $100M in 5 years
const REVENUE_GOAL = 100_000_000;
const GOAL_YEARS = 5;
const START_DATE = new Date('2025-01-01');

// Team Structure
const TEAM = {
  dave: {
    name: 'Dave',
    role: 'Operations Overseer',
    responsibility: 'Revenue Goal Achievement',
    goal: '$100M in 5 Years',
    avatar: 'D'
  },
  jordan: {
    name: 'Jordan',
    role: 'Legal & Compliance',
    responsibility: 'Legalities & Revenue Compliance',
    focus: 'Contracts, Terms, Partner Agreements',
    avatar: 'J'
  }
};

// Bot Configuration
const BOTS = [
  {
    id: 'henry-partner-discovery',
    name: 'Henry',
    role: 'Partner Discovery',
    description: 'Discovers European natural fiber brands',
    schedule: 'Daily 6:00 AM UTC',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'high'
  },
  {
    id: 'dan-partner-outreach',
    name: 'Dan',
    role: 'Partner Outreach',
    description: 'Sends partnership emails via Forbes Command',
    schedule: 'Daily 10:00 AM UTC',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'high'
  },
  {
    id: 'dan-partner-followup',
    name: 'Dan',
    role: 'Partner Follow-up',
    description: 'Automated follow-up sequence (Day 3, 7, 14)',
    schedule: 'Daily 2:00 PM UTC',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'high'
  },
  {
    id: 'dan-auto-social-posts',
    name: 'Dan',
    role: 'Social Media',
    description: 'Creates content for Twitter, LinkedIn, Facebook',
    schedule: 'Daily 9:00 AM UTC',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'medium'
  },
  {
    id: 'dan-lead-generator',
    name: 'Dan',
    role: 'Lead Generation',
    description: 'Discovers boutiques, yoga studios, hotels',
    schedule: 'Every 2 hours',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'high'
  },
  {
    id: 'henry-seamstress-discovery',
    name: 'Henry',
    role: 'Manufacturer Discovery',
    description: 'Finds seamstresses and pattern makers',
    schedule: '2x Daily (11am, 5pm)',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'medium'
  },
  {
    id: 'annie-auto-onboarding',
    name: 'Annie',
    role: 'Seller Onboarding',
    description: 'Creates accounts, sends welcome emails',
    schedule: 'Every 30 minutes',
    status: 'active',
    owner: 'jordan',
    revenueImpact: 'medium'
  },
  {
    id: 'annie-chat',
    name: 'Annie',
    role: 'Customer Service',
    description: 'Template-based chat support (no AI costs)',
    schedule: 'On-demand',
    status: 'active',
    owner: 'jordan',
    revenueImpact: 'medium'
  },
  {
    id: 'dan-pinterest-poster',
    name: 'Dan',
    role: 'Pinterest Marketing',
    description: 'Creates pins with frequency messaging',
    schedule: '2x Daily (9am, 3pm)',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'medium'
  },
  {
    id: 'annie-pinterest-poster',
    name: 'Annie',
    role: 'Product Pins',
    description: 'Creates pins for approved products',
    schedule: '2x Daily (9am, 3pm)',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'medium'
  },
  {
    id: 'mainframe-sync-processor',
    name: 'Mainframe',
    role: 'MFS Sync',
    description: 'Syncs data to Command Center',
    schedule: 'Every 10 minutes',
    status: 'active',
    owner: 'dave',
    revenueImpact: 'low'
  }
];

interface DashboardStats {
  totalPartners: number;
  activePartners: number;
  emailsSent: number;
  leadsDiscovered: number;
  currentRevenue: number;
  monthlyRevenue: number;
  conversionRate: number;
}

export default function BotsDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPartners: 0,
    activePartners: 0,
    emailsSent: 0,
    leadsDiscovered: 0,
    currentRevenue: 0,
    monthlyRevenue: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'degraded' | 'offline'>('healthy');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const baseUrl = window.location.origin;

      // Fetch health status
      const healthRes = await fetch(`${baseUrl}/api/health`);
      if (healthRes.ok) {
        setSystemStatus('healthy');
      } else {
        setSystemStatus('degraded');
      }

      // In production, fetch real stats from API
      // For now, use placeholder data
      setStats({
        totalPartners: 47,
        activePartners: 12,
        emailsSent: 234,
        leadsDiscovered: 156,
        currentRevenue: 45000,
        monthlyRevenue: 8500,
        conversionRate: 8.2
      });

      setLoading(false);
    } catch {
      setSystemStatus('offline');
      setLoading(false);
    }
  }

  // Calculate revenue progress
  const yearsElapsed = (Date.now() - START_DATE.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const expectedRevenue = (REVENUE_GOAL / GOAL_YEARS) * yearsElapsed;
  const revenueProgress = (stats.currentRevenue / REVENUE_GOAL) * 100;
  const onTrack = stats.currentRevenue >= expectedRevenue * 0.8;

  // Calculate yearly milestones
  const yearlyMilestone = REVENUE_GOAL / GOAL_YEARS; // $20M per year

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8b28a] mx-auto mb-4"></div>
          <p className="text-[#94a3b8]">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <header className="bg-[#1e293b] border-b border-[#334155] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">F&F Command Center</h1>
            <p className="text-[#94a3b8] text-sm">Autonomous Revenue Operations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              systemStatus === 'healthy' ? 'bg-green-500/20 text-green-400' :
              systemStatus === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                systemStatus === 'healthy' ? 'bg-green-400' :
                systemStatus === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              {systemStatus === 'healthy' ? 'All Systems Operational' :
               systemStatus === 'degraded' ? 'Partial Outage' : 'System Offline'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Revenue Goal Banner */}
        <div className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#c8b28a]/20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-[#c8b28a]" />
              </div>
              <div>
                <h2 className="text-xl font-bold">$100M Revenue Goal</h2>
                <p className="text-[#94a3b8] text-sm">5-Year Target • Dave Responsible</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#c8b28a]">${(stats.currentRevenue / 1000).toFixed(0)}K</p>
              <p className="text-[#94a3b8] text-sm">Current Revenue</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#94a3b8]">Progress to $100M</span>
              <span className="text-[#c8b28a]">{revenueProgress.toFixed(3)}%</span>
            </div>
            <div className="h-3 bg-[#334155] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c8b28a] to-[#d4af37] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(revenueProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Yearly Milestones */}
          <div className="grid grid-cols-5 gap-4 text-center">
            {[1, 2, 3, 4, 5].map((year) => {
              const milestone = yearlyMilestone * year;
              const achieved = stats.currentRevenue >= milestone;
              return (
                <div key={year} className={`p-3 rounded-lg ${achieved ? 'bg-green-500/20' : 'bg-[#334155]/50'}`}>
                  <p className="text-xs text-[#94a3b8]">Year {year}</p>
                  <p className={`font-bold ${achieved ? 'text-green-400' : 'text-white'}`}>
                    ${(milestone / 1_000_000).toFixed(0)}M
                  </p>
                  {achieved && <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto mt-1" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Oversight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Dave - Operations */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-blue-400">
                {TEAM.dave.avatar}
              </div>
              <div>
                <h3 className="text-lg font-bold">{TEAM.dave.name}</h3>
                <p className="text-blue-400 text-sm">{TEAM.dave.role}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-[#c8b28a]" />
                <span className="text-[#94a3b8]">Responsibility:</span>
                <span className="text-white">{TEAM.dave.responsibility}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-[#94a3b8]">Goal:</span>
                <span className="text-green-400 font-bold">{TEAM.dave.goal}</span>
              </div>
              <div className="mt-4 p-3 bg-[#334155]/50 rounded-lg">
                <p className="text-xs text-[#94a3b8] mb-2">Oversees {BOTS.filter(b => b.owner === 'dave').length} Bots:</p>
                <div className="flex flex-wrap gap-2">
                  {BOTS.filter(b => b.owner === 'dave').map(bot => (
                    <span key={bot.id} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      {bot.name} ({bot.role})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Jordan - Legal */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center text-2xl font-bold text-purple-400">
                {TEAM.jordan.avatar}
              </div>
              <div>
                <h3 className="text-lg font-bold">{TEAM.jordan.name}</h3>
                <p className="text-purple-400 text-sm">{TEAM.jordan.role}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-[#c8b28a]" />
                <span className="text-[#94a3b8]">Responsibility:</span>
                <span className="text-white">{TEAM.jordan.responsibility}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-purple-400" />
                <span className="text-[#94a3b8]">Focus:</span>
                <span className="text-purple-400">{TEAM.jordan.focus}</span>
              </div>
              <div className="mt-4 p-3 bg-[#334155]/50 rounded-lg">
                <p className="text-xs text-[#94a3b8] mb-2">Oversees {BOTS.filter(b => b.owner === 'jordan').length} Bots:</p>
                <div className="flex flex-wrap gap-2">
                  {BOTS.filter(b => b.owner === 'jordan').map(bot => (
                    <span key={bot.id} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                      {bot.name} ({bot.role})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-[#94a3b8] text-sm">Partners</span>
            </div>
            <p className="text-2xl font-bold">{stats.activePartners}<span className="text-[#94a3b8] text-lg">/{stats.totalPartners}</span></p>
            <p className="text-green-400 text-xs mt-1">Active / Total</p>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-[#c8b28a]" />
              <span className="text-[#94a3b8] text-sm">Emails Sent</span>
            </div>
            <p className="text-2xl font-bold">{stats.emailsSent}</p>
            <p className="text-[#94a3b8] text-xs mt-1">This month</p>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-5 h-5 text-green-400" />
              <span className="text-[#94a3b8] text-sm">Leads</span>
            </div>
            <p className="text-2xl font-bold">{stats.leadsDiscovered}</p>
            <p className="text-[#94a3b8] text-xs mt-1">Discovered</p>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-[#94a3b8] text-sm">Conversion</span>
            </div>
            <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            <p className="text-[#94a3b8] text-xs mt-1">Lead to Partner</p>
          </div>
        </div>

        {/* Bot Grid */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#c8b28a]" />
              Autonomous Bots ({BOTS.length})
            </h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                High Impact
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                Medium
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#94a3b8]" />
                Support
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BOTS.map((bot) => (
              <div
                key={bot.id}
                className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 hover:border-[#c8b28a]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      bot.owner === 'dave' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {bot.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{bot.name}</h3>
                      <p className="text-[#c8b28a] text-xs">{bot.role}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    bot.revenueImpact === 'high' ? 'bg-green-400' :
                    bot.revenueImpact === 'medium' ? 'bg-yellow-400' : 'bg-[#94a3b8]'
                  }`} />
                </div>
                <p className="text-[#94a3b8] text-sm mb-3">{bot.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[#94a3b8]">
                    <Clock className="w-3 h-3" />
                    {bot.schedule}
                  </span>
                  <span className={`px-2 py-0.5 rounded ${
                    bot.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-[#334155] text-[#94a3b8]'
                  }`}>
                    {bot.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cron Schedule */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-[#c8b28a]" />
            Automated Schedule (Forbes Command Cron)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#94a3b8] mb-3">Partner Pipeline</h3>
              {[
                { time: '6:00 AM UTC', task: 'Henry Partner Discovery', bot: 'Henry' },
                { time: '10:00 AM UTC', task: 'Dan Partner Outreach', bot: 'Dan' },
                { time: '2:00 PM UTC', task: 'Dan Partner Follow-up', bot: 'Dan' },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-[#0f172a] rounded">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[#c8b28a]" />
                    <span className="text-sm">{job.task}</span>
                  </div>
                  <span className="text-[#94a3b8] text-xs">{job.time}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#94a3b8] mb-3">Operations</h3>
              {[
                { time: 'Every 5 min', task: 'Email Queue Processor', bot: 'System' },
                { time: 'Every 10 min', task: 'Mainframe Sync', bot: 'Mainframe' },
                { time: 'Every 30 min', task: 'Annie Auto Onboarding', bot: 'Annie' },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-[#0f172a] rounded">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[#c8b28a]" />
                    <span className="text-sm">{job.task}</span>
                  </div>
                  <span className="text-[#94a3b8] text-xs">{job.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[#94a3b8] text-sm">
          <p>Frequency & Form Command Center • Autonomous Revenue Operations</p>
          <p className="text-xs mt-1">Dave: Revenue Goal ($100M/5yr) • Jordan: Legal & Compliance</p>
        </div>
      </main>
    </div>
  );
}
