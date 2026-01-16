import type { Metadata } from "next";
import "./globals.css";
import { getCurrentSeason } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnieWidget from "@/components/AnnieWidget";

export const metadata: Metadata = {
  metadataBase: new URL('https://frequencyandform.com'),
  title: "Frequency & Form | Dress in Alignment",
  description: "Curated natural fiber clothing based on fabric frequency science. Healing-tier fabrics at 5,000 Hz. Foundation essentials in organic cotton. Never synthetics.",
  keywords: ["natural fiber clothing", "linen", "organic cotton", "cashmere", "wool", "silk", "sustainable fashion"],
  verification: {
    other: {
      'p:domain_verify': '9b29387f02a711e72cf08ddd9fad3c21'
    }
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://frequencyandform.com',
    siteName: 'Frequency & Form',
    title: 'Frequency & Form | Dress in Alignment',
    description: 'Curated natural fiber clothing based on fabric frequency science. Healing-tier fabrics at 5,000 Hz.',
    images: [{
      url: 'https://frequencyandform.com/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Frequency & Form - Natural Fiber Clothing'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@FrequencyForm',
    title: 'Frequency & Form | Dress in Alignment',
    description: 'Curated natural fiber clothing based on fabric frequency science.',
    images: ['https://frequencyandform.com/og-image.jpg']
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Determine current season for palette switching
  const season = getCurrentSeason();
  const seasonClass = `season-${season}`;

  return (
    <html lang="en">
      <body className={seasonClass}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <AnnieWidget />
      </body>
    </html>
  );
}
