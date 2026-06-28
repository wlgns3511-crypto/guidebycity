import { getMostExpensive, getCheapest, getHighestIncome, countCities, getAllStates } from "@/lib/db";
import { PopularEntities } from "@/components/upgrades/PopularEntities";
import { TrustBlock } from "@/components/upgrades/TrustBlock";
import { AuthorBox } from "@/components/AuthorBox";
import { TRUST_BLOCK_SOURCES, SITE_VINTAGE } from "@/lib/authorship";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" },
  openGraph: { url: "/" },
};


function fmt(v: number | null): string { return v ? '$' + v.toLocaleString('en-US') : 'N/A'; }
function fmtIdx(v: number | null): string { return v ? v.toFixed(1) : 'N/A'; }

export default function Home() {
  const expensive = getMostExpensive(12);
  const cheapest = getCheapest(10);
  const richest = getHighestIncome(10);
  const total = countCities();
  const states = getAllStates();

  const popularItems = expensive.map(c => ({
    name: c.short_name,
    href: `/city/${c.slug}/`,
    stat: c.cost_index ? `Index ${c.cost_index.toFixed(1)}` : undefined,
  }));

  return (
    <div>
      {/* Data-sovereignty strip — source attribution + coverage above-the-fold (AdSense gate) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-widest text-slate-500">
        <span>Source · U.S. Bureau of Economic Analysis · Census ACS 5-yr</span>
        <span className="text-slate-300">|</span>
        <span>Coverage · {total.toLocaleString('en-US')} cities · 50 states</span>
        <span className="text-slate-300">|</span>
        <a href="/methodology/" className="hover:text-teal-600 underline-offset-2 hover:underline">Methodology</a>
      </div>

      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3">US City Guide</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore <strong className="tabular-nums">{total.toLocaleString('en-US')}</strong>+ US cities — cost of living, income, housing, and side-by-side comparisons sourced from BEA Regional Price Parities and the Census Bureau&apos;s American Community Survey (5-year estimates).
        </p>
      </section>

      {/* Quick stats — surfaces 4 dimensions above-the-fold (AdSense reviewer gate) */}
      <section aria-label="City data coverage" className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-teal-700 tabular-nums">{total.toLocaleString('en-US')}</div>
          <div className="text-xs text-slate-500 mt-1">Cities Tracked</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-teal-700 tabular-nums">{states.length}</div>
          <div className="text-xs text-slate-500 mt-1">States Covered</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-teal-700 tabular-nums">{expensive[0]?.cost_index ? fmtIdx(expensive[0].cost_index) : '—'}</div>
          <div className="text-xs text-slate-500 mt-1">Highest Cost Index</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-teal-700 tabular-nums">{cheapest[0]?.cost_index ? fmtIdx(cheapest[0].cost_index) : '—'}</div>
          <div className="text-xs text-slate-500 mt-1">Lowest Cost Index</div>
        </div>
      </section>

      {/* Trust strip — consolidated source provenance + last refresh (AdSense E-E-A-T) */}
      <TrustBlock
        sources={[...TRUST_BLOCK_SOURCES]}
        updated={SITE_VINTAGE}
        label="Data provenance"
      />

      <PopularEntities
        heading="Popular City Guides"
        subheading="Top cities by cost of living index"
        items={popularItems}
        columns={3}
        viewAllHref="/rankings"
        viewAllLabel="View all rankings →"
      />

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-center">Browse by State</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {states.map((s) => (
            <a key={s} href={`/state/${s.toLowerCase()}`} className="px-3 py-1 rounded-full border border-slate-200 text-sm hover:bg-teal-50 hover:border-teal-300">{s}</a>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <section>
          <h2 className="text-lg font-bold mb-3 text-red-700">Most Expensive</h2>
          <div className="border rounded-lg overflow-hidden">
            {expensive.map((c, i) => (
              <a key={c.slug} href={`/city/${c.slug}`} className="flex justify-between p-3 hover:bg-red-50 border-b border-slate-100 text-sm">
                <span><span className="text-slate-400 mr-1">{i+1}.</span>{c.short_name}</span>
                <span className="text-red-600 font-medium">{fmtIdx(c.cost_index)}</span>
              </a>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-3 text-green-700">Most Affordable</h2>
          <div className="border rounded-lg overflow-hidden">
            {cheapest.map((c, i) => (
              <a key={c.slug} href={`/city/${c.slug}`} className="flex justify-between p-3 hover:bg-green-50 border-b border-slate-100 text-sm">
                <span><span className="text-slate-400 mr-1">{i+1}.</span>{c.short_name}</span>
                <span className="text-green-600 font-medium">{fmtIdx(c.cost_index)}</span>
              </a>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-3 text-blue-700">Highest Income</h2>
          <div className="border rounded-lg overflow-hidden">
            {richest.map((c, i) => (
              <a key={c.slug} href={`/city/${c.slug}`} className="flex justify-between p-3 hover:bg-blue-50 border-b border-slate-100 text-sm">
                <span><span className="text-slate-400 mr-1">{i+1}.</span>{c.short_name}</span>
                <span className="text-blue-600 font-medium">{fmt(c.median_income)}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <AuthorBox vintage={SITE_VINTAGE} />
    </div>
  );
}
