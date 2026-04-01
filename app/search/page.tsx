import type { Metadata } from "next";
import { searchCities, getMostExpensive, getCheapest } from "@/lib/db";

export const metadata: Metadata = {
  title: "Search City Guides — Cost of Living, Income & Housing",
  description: "Search 380+ US city guides. Find cost of living, median income, housing costs, and quality of life data.",
  alternates: { canonical: "/search" },
  openGraph: { url: "/search/" },
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

function fmt(v: number | null): string { return v ? "$" + v.toLocaleString("en-US") : "N/A"; }
function fmtIdx(v: number | null): string { return v ? v.toFixed(1) : "N/A"; }

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? searchCities(query, 40) : [];
  const expensive = !query ? getMostExpensive(6) : [];
  const affordable = !query ? getCheapest(6) : [];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Search City Guides</h1>
      <p className="text-slate-500 mb-6">Find cost of living, income, and housing data for 380+ US cities</p>

      <form method="get" action="/search" className="mb-8">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search cities (e.g. Austin, Denver, Miami...)"
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {query && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-slate-700">
            {results.length > 0
              ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`
              : `No results found for "${query}"`}
          </h2>
          {results.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((c) => (
                <a
                  key={c.slug}
                  href={`/city/${c.slug}`}
                  className="block p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="font-semibold text-slate-900 mb-1">{c.short_name}</div>
                  <div className="text-xs text-slate-400 mb-2">{c.name}</div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                    {c.cost_index && <span>Cost Index: <strong>{fmtIdx(c.cost_index)}</strong></span>}
                    {c.median_income && <span>Income: <strong>{fmt(c.median_income)}</strong></span>}
                    {c.median_rent && <span>Rent: <strong>{fmt(c.median_rent)}/mo</strong></span>}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-500">
              <p>Try a different city name or browse featured cities below.</p>
            </div>
          )}
        </div>
      )}

      {!query && (
        <div>
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-slate-700">Most Expensive Cities</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {expensive.map((c) => (
                <a key={c.slug} href={`/city/${c.slug}`} className="p-3 border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all flex justify-between items-center">
                  <span className="font-medium text-slate-900">{c.short_name}</span>
                  <span className="text-xs text-red-600 font-medium">Index: {fmtIdx(c.cost_index)}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3 text-slate-700">Most Affordable Cities</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {affordable.map((c) => (
                <a key={c.slug} href={`/city/${c.slug}`} className="p-3 border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all flex justify-between items-center">
                  <span className="font-medium text-slate-900">{c.short_name}</span>
                  <span className="text-xs text-green-600 font-medium">Index: {fmtIdx(c.cost_index)}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
