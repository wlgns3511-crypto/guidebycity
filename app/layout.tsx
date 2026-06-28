import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UpgradeAnalytics } from "@/components/upgrades/UpgradeAnalytics";
import RelatedSites from "@/components/RelatedSites";
const inter = Inter({ subsets: ["latin"], display: "swap" });
const SITE_NAME = "GuideByCity";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guidebycity.com";

const ROOT_ALTERNATE_LANGUAGES = {
  en: `${SITE_URL}/`,
  'x-default': `${SITE_URL}/`,
} as const;

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} - City Guides, Cost of Living & Demographics`, template: `%s | ${SITE_NAME}` },
  description: "Explore 380+ US cities. Cost of living, income, housing, and city-to-city comparisons.",
  metadataBase: new URL(SITE_URL), robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  other: { "google-adsense-account": "ca-pub-5724806562146685" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
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
              "inLanguage": "en-US",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://guidebycity.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "Organization",
              "name": "GuideByCity",
              "url": "https://guidebycity.com",
              "description": "Explore 380+ US cities. Cost of living, income, housing, and city-to-city comparisons.",
              "parentOrganization": {
                "@type": "Organization",
                "name": "DataPeek Research Network",
                "url": "https://datapeekfacts.com"
              }
            }
          ]
        }) }} />
      </head>
      <body className={`${inter.className} antialiased bg-white text-slate-900 min-h-screen flex flex-col`}>
        <UpgradeAnalytics />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:border focus:rounded">Skip to content</a>
        <header className="border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-teal-700">{SITE_NAME}</a>
            <nav className="flex gap-4 text-sm">
              <a href="/city/" className="hover:text-teal-600">Cities</a>
              {/* 2026-04-28 — 'Compare' nav 제거 (AdSense scaled-content remediation).
                  /compare/* 트리는 4/18 doorway-thin 판단으로 noindex 처리됨.
                  Sitewide layout 링크는 모든 indexable 페이지에 박히므로 AdSense
                  리뷰어가 noindex 트리로 직행. 직접 URL 입력 시엔 페이지 그대로 작동. */}
            </nav>
          </div>
        </header>
        <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">{children}</main>
        <footer className="border-t border-slate-200 mt-16">
          <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-slate-500">
            <p>Built with data from Bureau of Economic Analysis and U.S. Census Bureau.</p>
            <p className="mt-2">
              <a href="/about/" className="hover:text-teal-600">About</a>
              {" | "}
              <a href="/methodology/" className="hover:text-teal-600">Methodology</a>
              {" | "}
              <a href="/editorial-policy/" className="hover:text-teal-600">Editorial Policy</a>
              {" | "}
              <a href="/corrections-policy/" className="hover:text-teal-600">Corrections</a>
              {" | "}
              <a href="/privacy/" className="hover:text-teal-600">Privacy</a>
              {" | "}
              <a href="/terms/" className="hover:text-teal-600">Terms</a>
              {" | "}
              <a href="/disclaimer/" className="hover:text-teal-600">Disclaimer</a>
              {" | "}
              <a href="/contact/" className="hover:text-teal-600">Contact</a>
            </p>
            <RelatedSites currentSite="GuideByCity" accentClass="hover:text-teal-600" label="Other Data Tools" />
            <p className="mt-4 text-xs text-slate-400">Your city-by-city guide to local costs, services, and quality of life.</p>
            <p className="mt-2">&copy; {new Date().getFullYear()} {SITE_NAME} &mdash; A free public data resource.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
