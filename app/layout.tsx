import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });
const SITE_NAME = "GuideByCity";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guidebycity.com";
export const metadata: Metadata = {
  title: { default: `${SITE_NAME} - City Guides, Cost of Living & Demographics`, template: `%s | ${SITE_NAME}` },
  description: "Explore 380+ US cities. Cost of living, income, housing, and city-to-city comparisons.",
  metadataBase: new URL(SITE_URL), robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FSLWGTPYZJ" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-FSLWGTPYZJ');` }} />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5724806562146685" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "name": "GuideByCity",
              "url": "https://guidebycity.com",
              "description": "Explore 380+ US cities. Cost of living, income, housing, and city-to-city comparisons.",
              "inLanguage": "en-US"
            },
            {
              "@type": "Organization",
              "name": "GuideByCity",
              "url": "https://guidebycity.com",
              "description": "Explore 380+ US cities. Cost of living, income, housing, and city-to-city comparisons.",
              "sameAs": []
            }
          ]
        }) }} />
      </head>
      <body className={`${inter.className} antialiased bg-white text-slate-900 min-h-screen flex flex-col`}>
        <header className="border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-teal-700">{SITE_NAME}</a>
            <nav className="flex gap-4 text-sm">
              <a href="/city" className="hover:text-teal-600">Cities</a>
              <a href="/compare" className="hover:text-teal-600">Compare</a>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">{children}</main>
        <footer className="border-t border-slate-200 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-slate-500">
            <p>Data from Bureau of Economic Analysis and U.S. Census Bureau.</p>
            <p className="mt-2">
              <a href="/about" className="hover:text-teal-600">About</a>
              {" | "}
              <a href="/privacy" className="hover:text-teal-600">Privacy</a>
              {" | "}
              <a href="/terms" className="hover:text-teal-600">Terms</a>
              {" | "}
              <a href="/contact" className="hover:text-teal-600">Contact</a>
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Related Resources</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <a href="https://costbycity.com" className="hover:text-teal-600">Cost of Living</a>
                <a href="https://salarybycity.com" className="hover:text-teal-600">Salaries</a>
                <a href="https://zippeek.com" className="hover:text-teal-600">ZIP Codes</a>
                <a href="https://fairrentwize.com" className="hover:text-teal-600">Fair Rents</a>
              </div>
            </div>
            <p className="mt-1">\&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
