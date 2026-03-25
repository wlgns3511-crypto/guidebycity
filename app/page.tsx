import { getMostExpensive, getCheapest, getHighestIncome, countCities, getAllStates } from "@/lib/db";

function fmt(v: number | null): string { return v ? '$' + v.toLocaleString('en-US') : 'N/A'; }
function fmtIdx(v: number | null): string { return v ? v.toFixed(1) : 'N/A'; }

export default function Home() {
  const expensive = getMostExpensive(10);
  const cheapest = getCheapest(10);
  const richest = getHighestIncome(10);
  const total = countCities();
  const states = getAllStates();

  return (
    <div>
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-3">US City Guide</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore {total}+ US cities. Cost of living, income, housing costs, and side-by-side comparisons.
        </p>
      </section>

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
    </div>
  );
}
