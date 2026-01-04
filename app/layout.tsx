import type { Metadata } from "next";
import "./globals.css";
import { getCurrentSeason } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Frequency & Form | Dress in Alignment",
  description: "Curated natural fiber clothing based on fabric frequency science. Healing-tier fabrics at 5,000 Hz. Foundation essentials in organic cotton. Never synthetics.",
  keywords: ["natural fiber clothing", "linen", "organic cotton", "cashmere", "wool", "silk", "sustainable fashion"],
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
      </body>
    </html>
  );
}
