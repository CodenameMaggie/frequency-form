'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, TrendingUp, Eye, ShoppingCart, DollarSign } from 'lucide-react';

interface SupplierData {
  supplierName: string;
  season: string;
  year: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    views: number;
  }>;
}

export default function SupplierLookbookPage() {
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [downloadingKit, setDownloadingKit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupplierData();
  }, []);

  const loadSupplierData = async () => {
    try {
      const res = await fetch('/api/ff/supplier/lookbook');
      if (res.ok) {
        const data = await res.json();
        setSupplierData(data);
      } else {
        // Set demo data if API not available
        setSupplierData({
          supplierName: 'Partner Brand',
          season: 'Spring',
          year: 2026,
          totalViews: 12847,
          totalSales: 342,
          totalRevenue: 4532100,
          conversionRate: 2.7,
          topProducts: [
            { id: '1', name: 'Italian Linen Shirt', sales: 89, revenue: 2536500, views: 3421 },
            { id: '2', name: 'Cashmere Crewneck', sales: 67, revenue: 8676500, views: 2890 },
            { id: '3', name: 'Linen Wide Leg Trousers', sales: 54, revenue: 1755000, views: 2156 }
          ]
        });
      }
    } catch (e) {
      console.error('Error loading supplier data:', e);
      // Set demo data on error
      setSupplierData({
        supplierName: 'Partner Brand',
        season: 'Spring',
        year: 2026,
        totalViews: 12847,
        totalSales: 342,
        totalRevenue: 4532100,
        conversionRate: 2.7,
        topProducts: [
          { id: '1', name: 'Italian Linen Shirt', sales: 89, revenue: 2536500, views: 3421 },
          { id: '2', name: 'Cashmere Crewneck', sales: 67, revenue: 8676500, views: 2890 },
          { id: '3', name: 'Linen Wide Leg Trousers', sales: 54, revenue: 1755000, views: 2156 }
        ]
      });
    }
    setLoading(false);
  };

  const downloadSocialKit = async () => {
    setDownloadingKit(true);
    try {
      const res = await fetch('/api/ff/supplier/social-kit/download', {
        method: 'POST'
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ff-social-media-kit.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Social media kit download coming soon!');
      }
    } catch (e) {
      console.error('Download error:', e);
      alert('Social media kit download coming soon!');
    }
    setDownloadingKit(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf5] flex items-center justify-center">
        <p className="text-[#c8b28a] font-serif">Loading supplier data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfaf5]">
      {/* Header */}
      <header className="bg-[#1f2937] py-6 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-serif text-white text-xl tracking-[0.15em]">F&F</Link>
          <p className="text-[#c8b28a] text-sm font-sans">Supplier Portal</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase text-[#c8b28a] tracking-[0.4em] mb-3 font-sans">
            {supplierData?.season} {supplierData?.year}
          </p>
          <h1 className="font-serif text-4xl font-light text-[#1f2937] mb-4">Your Performance Lookbook</h1>
          <p className="font-sans text-[#6b7280] max-w-lg mx-auto">
            See how your products performed this season and download social media assets.
          </p>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 text-center rounded-lg shadow-sm border border-[#f5f3ee]">
            <div className="w-10 h-10 mx-auto mb-3 bg-[#c8b28a]/20 rounded-full flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#c8b28a]" />
            </div>
            <p className="font-serif text-3xl text-[#1f2937]">{supplierData?.totalViews?.toLocaleString() || 0}</p>
            <p className="text-[10px] uppercase text-[#c8b28a] tracking-[0.2em] mt-2 font-sans">Lookbook Views</p>
          </div>
          <div className="bg-white p-6 text-center rounded-lg shadow-sm border border-[#f5f3ee]">
            <div className="w-10 h-10 mx-auto mb-3 bg-[#c8b28a]/20 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-[#c8b28a]" />
            </div>
            <p className="font-serif text-3xl text-[#1f2937]">{supplierData?.totalSales || 0}</p>
            <p className="text-[10px] uppercase text-[#c8b28a] tracking-[0.2em] mt-2 font-sans">Units Sold</p>
          </div>
          <div className="bg-white p-6 text-center rounded-lg shadow-sm border border-[#f5f3ee]">
            <div className="w-10 h-10 mx-auto mb-3 bg-[#c8b28a]/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#c8b28a]" />
            </div>
            <p className="font-serif text-3xl text-[#1f2937]">${((supplierData?.totalRevenue || 0) / 100).toLocaleString()}</p>
            <p className="text-[10px] uppercase text-[#c8b28a] tracking-[0.2em] mt-2 font-sans">Revenue</p>
          </div>
          <div className="bg-white p-6 text-center rounded-lg shadow-sm border border-[#f5f3ee]">
            <div className="w-10 h-10 mx-auto mb-3 bg-[#c8b28a]/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#c8b28a]" />
            </div>
            <p className="font-serif text-3xl text-[#1f2937]">{supplierData?.conversionRate || 0}%</p>
            <p className="text-[10px] uppercase text-[#c8b28a] tracking-[0.2em] mt-2 font-sans">Conversion</p>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-[#f5f3ee] mb-12">
          <h2 className="font-serif text-2xl text-[#1f2937] mb-6">Top Performing Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(supplierData?.topProducts || []).map((product, i) => (
              <div key={product.id} className="flex gap-4 p-4 bg-[#fcfaf5] rounded-lg">
                <div className="w-16 h-16 bg-[#f5f3ee] flex items-center justify-center rounded-lg flex-shrink-0">
                  <span className="text-2xl font-serif text-[#c8b28a]">#{i + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-serif text-lg text-[#1f2937] truncate">{product.name}</p>
                  <p className="text-sm text-[#6b7280] font-sans">{product.sales} sold</p>
                  <p className="text-sm text-[#c8b28a] font-sans font-medium">${(product.revenue / 100).toLocaleString()} revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Kit */}
        <div className="bg-[#1f2937] p-8 md:p-12 rounded-lg text-center">
          <p className="text-[10px] uppercase text-[#c8b28a] tracking-[0.4em] mb-3 font-sans">Marketing Assets</p>
          <h2 className="font-serif text-2xl text-white mb-4">Social Media Kit</h2>
          <p className="text-[#9ca3af] font-sans text-sm max-w-md mx-auto mb-8">
            Download pre-approved images featuring your products. Use on Instagram, Pinterest, and Facebook with our brand guidelines.
          </p>
          <button
            onClick={downloadSocialKit}
            disabled={downloadingKit}
            className="inline-flex items-center gap-3 px-10 py-4 bg-[#c8b28a] text-[#1f2937] text-[11px] font-sans font-semibold tracking-[0.25em] uppercase hover:bg-white transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloadingKit ? 'Preparing...' : 'Download Kit'}
          </button>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-[#6b7280] text-xs font-sans">
            <span className="flex items-center gap-1">
              <span className="text-[#c8b28a]">&#10003;</span> Instagram (1080x1080)
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[#c8b28a]">&#10003;</span> Pinterest (1000x1500)
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[#c8b28a]">&#10003;</span> Stories (1080x1920)
            </span>
          </div>
          <p className="text-[#4b5563] text-xs mt-6 font-sans">
            By downloading, you agree to tag @frequencyandform and use #DressInAlignment
          </p>
        </div>

        {/* Brand Guidelines */}
        <div className="mt-12 bg-white p-8 rounded-lg shadow-sm border border-[#f5f3ee]">
          <h2 className="font-serif text-2xl text-[#1f2937] mb-6">Brand Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-sans text-sm font-medium text-[#1f2937] mb-3 uppercase tracking-wider">Color Palette</h3>
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-[#1f2937] rounded" title="Charcoal #1f2937"></div>
                <div className="w-12 h-12 bg-[#c8b28a] rounded" title="Champagne #c8b28a"></div>
                <div className="w-12 h-12 bg-[#fcfaf5] rounded border border-[#f5f3ee]" title="Cream #fcfaf5"></div>
                <div className="w-12 h-12 bg-[#f5f3ee] rounded" title="Ivory #f5f3ee"></div>
              </div>
            </div>
            <div>
              <h3 className="font-sans text-sm font-medium text-[#1f2937] mb-3 uppercase tracking-wider">Required Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#f5f3ee] text-[#6b7280] text-sm font-sans rounded">#DressInAlignment</span>
                <span className="px-3 py-1 bg-[#f5f3ee] text-[#6b7280] text-sm font-sans rounded">#FrequencyAndForm</span>
                <span className="px-3 py-1 bg-[#f5f3ee] text-[#6b7280] text-sm font-sans rounded">#NaturalFibers</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f3ee] py-6 px-8 mt-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <p className="text-[#9ca3af] text-xs font-sans">2026 Frequency & Form - Supplier Portal</p>
          <Link href="/ff/lookbook" className="text-[#c8b28a] text-xs font-sans hover:text-[#1f2937]">
            View Public Lookbook
          </Link>
        </div>
      </footer>
    </div>
  );
}
