import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGuides } from '@/lib/guides';

const SITE_URL = 'https://guidebycity.com';

export const metadata: Metadata = {
  title: 'City Guides',
  description: 'In-depth guides on cost of living, demographics, housing markets, and city comparisons across 380+ US cities.',
  alternates: { canonical: '/guide/' },
  openGraph: { url: '/guide/' },
};

export default function GuidesIndex() {
  const guides = getAllGuides();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'City Guides',
    url: `${SITE_URL}/guide/`,
    numberOfItems: guides.length,
    itemListElement: guides.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: g.title,
      url: `${SITE_URL}/guide/${g.slug}/`,
    })),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">City Guides</h1>
        <p className="text-slate-600 max-w-3xl">
          Comprehensive guides on understanding cost of living data, comparing cities,
          and making data-driven decisions about where to live in the United States.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={`/guide/${g.slug}/`}
            className="block rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 p-5 transition-colors"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">{g.category}</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">{g.title}</h2>
            <p className="text-sm text-slate-600">{g.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
