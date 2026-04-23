import { getMostExpensive, getCheapest, getHighestIncome, getAllCities, getTopComparisons } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Cities",
  description: "Compare US cities side by side — cost of living, income, rent, and housing.",
  alternates: { canonical: "/compare/" },
  openGraph: { url: "/compare/" },
};

function canonicalComparison(a: string, b: string): string {
  return [a, b].sort().join("-vs-");
}

export default function ComparePage() {
  const exp = getMostExpensive(10);
  const cheap = getCheapest(10);
  const highIncome = getHighestIncome(10);
  const allCities = getAllCities();
  const topComparisonPairs = getTopComparisons(100);
  const featuredComparisons = topComparisonPairs
    .slice(0, 20)
    .map(({ slugA, slugB }) => {
      const cityA = allCities.find((city) => city.slug === slugA);
      const cityB = allCities.find((city) => city.slug === slugB);
      if (!cityA || !cityB) return null;
      return {
        href: `/compare/${slugA}-vs-${slugB}/`,
        label: `${cityA.short_name} vs ${cityB.short_name}`,
      };
    })
    .filter((item): item is { href: string; label: string } => item !== null);
  const allowedComparisonSet = new Set(
    topComparisonPairs.map(({ slugA, slugB }) => canonicalComparison(slugA, slugB)),
  );
  const isAllowedPair = (a: string, b: string) => allowedComparisonSet.has(canonicalComparison(a, b));

  // Most expensive vs cheapest
  const expVsCheap = exp.slice(0, 10).map((a, i) => {
    const b = cheap[i];
    if (!b) return null;
    if (!isAllowedPair(a.slug, b.slug)) return null;
    const [x, y] = [a.slug, b.slug].sort();
    return { href: `/compare/${x}-vs-${y}`, label: `${a.short_name} vs ${b.short_name}` };
  }).filter(Boolean);

  // High income vs affordable
  const incomeVsCheap = highIncome.slice(0, 6).map((a, i) => {
    const b = cheap[i];
    if (!b) return null;
    if (!isAllowedPair(a.slug, b.slug)) return null;
    const [x, y] = [a.slug, b.slug].sort();
    return { href: `/compare/${x}-vs-${y}`, label: `${a.short_name} vs ${b.short_name}` };
  }).filter(Boolean);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Compare Cities</h1>
      <p className="text-slate-500 mb-8">Side-by-side cost of living, income, and housing comparisons between US cities.</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Popular Comparisons</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {featuredComparisons.map((item) => (
            <a key={item.href} href={item.href}
              className="p-3 border rounded-lg hover:bg-teal-50 text-teal-600 transition-colors">
              {item.label}
            </a>
          ))}
        </div>
      </section>

      {expVsCheap.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Most Expensive vs Most Affordable</h2>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {expVsCheap.map((item) => item && (
              <a key={item.href} href={`${item.href}/`}
                className="p-3 border rounded-lg hover:bg-teal-50 text-teal-600 transition-colors">
                {item.label}
              </a>
            ))}
          </div>
        </section>
      )}

      {incomeVsCheap.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Highest Income vs Most Affordable</h2>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {incomeVsCheap.map((item) => item && (
              <a key={item.href} href={`${item.href}/`}
                className="p-3 border rounded-lg hover:bg-teal-50 text-teal-600 transition-colors">
                {item.label}
              </a>
            ))}
          </div>
        </section>
      )}

      <p className="text-sm text-slate-400 mt-8">
        Compare any two cities by visiting /compare/city-a-vs-city-b/. We have data for {allCities.length}+ metro areas.
      </p>
    </div>
  );
}
