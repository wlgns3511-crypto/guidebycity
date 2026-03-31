import { getMostExpensive, getCheapest, getHighestIncome, getAllCities } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Cities",
  description: "Compare US cities side by side — cost of living, income, rent, and housing.",
};

export default function ComparePage() {
  const exp = getMostExpensive(10);
  const cheap = getCheapest(10);
  const highIncome = getHighestIncome(10);
  const allCities = getAllCities();

  // Popular city pairs
  const popularPairs = [
    ["austin-round-rock-san-marcos-tx", "denver-aurora-centennial-co"],
    ["new-york-newark-jersey-city-ny-nj", "los-angeles-long-beach-anaheim-ca"],
    ["seattle-tacoma-bellevue-wa", "portland-vancouver-hillsboro-or-wa"],
    ["san-francisco-oakland-fremont-ca", "new-york-newark-jersey-city-ny-nj"],
    ["miami-fort-lauderdale-west-palm-beach-fl", "tampa-st-petersburg-clearwater-fl"],
    ["chicago-naperville-elgin-il-in", "houston-pasadena-the-woodlands-tx"],
    ["boston-cambridge-newton-ma-nh", "washington-arlington-alexandria-dc-va-md-wv"],
    ["san-diego-chula-vista-carlsbad-ca", "san-jose-sunnyvale-santa-clara-ca"],
    ["phoenix-mesa-chandler-az", "dallas-fort-worth-arlington-tx"],
    ["nashville-davidson-murfreesboro-franklin-tn", "charlotte-concord-gastonia-nc-sc"],
  ];

  const cityMap = Object.fromEntries(allCities.map(c => [c.slug, c]));

  // Most expensive vs cheapest
  const expVsCheap = exp.slice(0, 10).map((a, i) => {
    const b = cheap[i];
    if (!b) return null;
    const [x, y] = [a.slug, b.slug].sort();
    return { href: `/compare/${x}-vs-${y}`, label: `${a.short_name} vs ${b.short_name}` };
  }).filter(Boolean);

  // High income vs affordable
  const incomeVsCheap = highIncome.slice(0, 6).map((a, i) => {
    const b = cheap[i];
    if (!b) return null;
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
          {popularPairs.map(([a, b]) => {
            const ca = cityMap[a], cb = cityMap[b];
            if (!ca || !cb) return null;
            const [x, y] = [a, b].sort();
            return (
              <a key={`${x}-${y}`} href={`/compare/${x}-vs-${y}/`}
                className="p-3 border rounded-lg hover:bg-teal-50 text-teal-600 transition-colors">
                {ca.short_name} vs {cb.short_name}
              </a>
            );
          })}
        </div>
      </section>

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

      <p className="text-sm text-slate-400 mt-8">
        Compare any two cities by visiting /compare/city-a-vs-city-b/. We have data for {allCities.length}+ metro areas.
      </p>
    </div>
  );
}
