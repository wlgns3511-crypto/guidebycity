import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCityBySlug, getAllCities, getWeather, monthName } from "@/lib/db";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { analyzeCity } from "@/lib/city-analysis";
import { getCrossRefInsights } from '@/lib/crossref';

interface Props { params: Promise<{ slug: string }> }

function fmt(v: number | null): string { return v ? '$' + v.toLocaleString('en-US') : 'N/A'; }
function fmtIdx(v: number | null): string { return v ? v.toFixed(1) : 'N/A'; }
function pctDiff(v: number | null): string {
  if (!v) return 'N/A';
  const d = v - 100;
  return d > 0 ? `${d.toFixed(1)}% above average` : `${Math.abs(d).toFixed(1)}% below average`;
}

export async function generateStaticParams() {
  return getAllCities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCityBySlug(slug);
  if (!c) return {};
  return {
    title: `${c.short_name} City Guide - Cost of Living, Income & Housing`,
    description: `${c.short_name} guide: cost of living index ${fmtIdx(c.cost_index)}, median income ${fmt(c.median_income)}, median rent ${fmt(c.median_rent)}.`,
    alternates: { canonical: `/city/${slug}` },
  };
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const c = getCityBySlug(slug);
  if (!c) notFound();

  const allCities = getAllCities().filter(x => x.slug !== slug).slice(0, 10);
  const weather = getWeather(c);
  const crossInsights = getCrossRefInsights(slug, 'guide');
  const analysis = analyzeCity(c, weather);
  const faqs = [
    ...(c.cost_index ? [{ question: `Is ${c.short_name} expensive?`, answer: `${c.short_name} has a cost of living index of ${fmtIdx(c.cost_index)}, which is ${pctDiff(c.cost_index)}.` }] : []),
    ...(c.median_income ? [{ question: `What is the average income in ${c.short_name}?`, answer: `The median household income in ${c.short_name} is ${fmt(c.median_income)} per year.` }] : []),
    ...(c.median_rent ? [{ question: `How much is rent in ${c.short_name}?`, answer: `The median monthly rent in ${c.short_name} is ${fmt(c.median_rent)}.` }] : []),
    ...(c.median_home_value ? [{ question: `What is the average home price in ${c.short_name}?`, answer: `The median home value in ${c.short_name} is ${fmt(c.median_home_value)}.` }] : []),
    { question: `What is it like living in ${c.short_name}?`, answer: analysis.summary },
    ...(analysis.pros.length > 0 ? [{ question: `What are the pros of living in ${c.short_name}?`, answer: `Advantages include: ${analysis.pros.join(". ")}. ${analysis.bestTimeToVisit}` }] : []),
    ...(analysis.cons.length > 0 ? [{ question: `What are the downsides of living in ${c.short_name}?`, answer: `Things to consider: ${analysis.cons.join(". ")}.` }] : []),
    ...(analysis.bestTimeToVisit ? [{ question: `When is the best time to visit ${c.short_name}?`, answer: analysis.bestTimeToVisit }] : []),
  ];

  const breadcrumbs = [{ name: "Home", url: "/" }, { name: c.state, url: `/state/${c.state.toLowerCase()}` }, { name: c.short_name, url: `/city/${slug}` }];

  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        {breadcrumbs.map((b, i) => (<span key={i}>{i > 0 && " / "}{i < 2 ? <a href={b.url} className="hover:underline">{b.name}</a> : <span className="text-slate-800">{b.name}</span>}</span>))}
      </nav>

      <h1 className="text-3xl font-bold mb-2">{c.short_name} City Guide</h1>
      <p className="text-slate-500 mb-6">{c.name}</p>

      <div className="bg-teal-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {c.cost_index && <div><div className="text-sm text-slate-500">Cost of Living</div><div className={`text-2xl font-bold ${c.cost_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.cost_index)}</div></div>}
          {c.median_income && <div><div className="text-sm text-slate-500">Median Income</div><div className="text-2xl font-bold">{fmt(c.median_income)}</div></div>}
          {c.median_rent && <div><div className="text-sm text-slate-500">Median Rent</div><div className="text-2xl font-bold">{fmt(c.median_rent)}/mo</div></div>}
          {c.median_home_value && <div><div className="text-sm text-slate-500">Median Home</div><div className="text-2xl font-bold">{fmt(c.median_home_value)}</div></div>}
        </div>
      </div>

      {/* City Overview */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3">Living in {c.short_name}</h2>
        <div className="bg-teal-50 border-l-4 border-teal-400 p-4 rounded-r-lg">
          <p className="text-slate-700 text-sm">{analysis.summary}</p>
        </div>
      </section>

      {(analysis.pros.length > 0 || analysis.cons.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {analysis.pros.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 mb-2">Pros</h3>
              <ul className="space-y-1">
                {analysis.pros.map((p, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.cons.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-2">Cons</h3>
              <ul className="space-y-1">
                {analysis.cons.map((con, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">✗</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {analysis.whoShouldLive.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3">Best For</h2>
          <div className="flex flex-wrap gap-2">
            {analysis.whoShouldLive.map((w, i) => (
              <span key={i} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200">{w}</span>
            ))}
          </div>
        </section>
      )}

      {analysis.bestTimeToVisit && (
        <div className="bg-amber-50 border-l-4 border-amber-300 p-3 rounded-r-lg mb-6">
          <p className="font-medium text-amber-800 text-xs mb-1">Best Time to Visit</p>
          <p className="text-slate-700 text-sm">{analysis.bestTimeToVisit}</p>
        </div>
      )}

      {(c.housing_index || c.goods_index || c.utilities_index) && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Cost Breakdown</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {c.housing_index && <div className="border rounded-lg p-4 text-center"><div className="text-sm text-slate-500">Housing</div><div className={`text-xl font-bold ${c.housing_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.housing_index)}</div></div>}
            {c.goods_index && <div className="border rounded-lg p-4 text-center"><div className="text-sm text-slate-500">Goods</div><div className={`text-xl font-bold ${c.goods_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.goods_index)}</div></div>}
            {c.utilities_index && <div className="border rounded-lg p-4 text-center"><div className="text-sm text-slate-500">Utilities</div><div className={`text-xl font-bold ${c.utilities_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.utilities_index)}</div></div>}
          </div>
        </section>
      )}

      <section className="mb-8 p-4 bg-slate-50 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Explore More About {c.short_name}</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={`https://salarybycity.com/locations/${slug}/`} className="text-blue-600 hover:underline" target="_blank" rel="noopener">Salaries in {c.short_name}</a>
          <a href={`https://costbycity.com/cities/${slug}/`} className="text-emerald-600 hover:underline" target="_blank" rel="noopener">Cost of Living in {c.short_name}</a>
        </div>
      </section>

      {crossInsights.length > 0 && (
        <section className="mt-8 mb-6">
          <h2 className="text-xl font-bold mb-3">Related Data Insights</h2>
          <div className="space-y-2">
            {crossInsights.map((insight, i) => (
              <div key={i} className="p-3 bg-slate-50 border-l-4 border-slate-300 rounded-r-lg">
                <p className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: insight }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {weather && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Monthly Weather in {c.short_name}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-slate-100">
                <th className="p-2 text-left">Month</th>
                <th className="p-2 text-right">Avg High</th>
                <th className="p-2 text-right">Avg Low</th>
                <th className="p-2 text-right">Precipitation</th>
              </tr></thead>
              <tbody>
                {Object.entries(weather).sort(([a],[b]) => Number(a) - Number(b)).map(([m, w]) => (
                  <tr key={m} className="border-b border-slate-100">
                    <td className="p-2">{monthName(Number(m))}</td>
                    <td className="p-2 text-right text-red-500">{w.avg_high}°F</td>
                    <td className="p-2 text-right text-blue-500">{w.avg_low}°F</td>
                    <td className="p-2 text-right text-slate-500">{(w.precip_mm / 25.4).toFixed(1)} in</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Compare {c.short_name} With</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {allCities.map((o) => {
            const [a, b] = [slug, o.slug].sort();
            return (<a key={o.slug} href={`/compare/${a}-vs-${b}`} className="p-3 border rounded-lg hover:bg-teal-50 text-teal-600">{c.short_name} vs {o.short_name}</a>);
          })}
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">FAQ</h2>
          {faqs.map((f, i) => (
            <details key={i} className="border rounded-lg mb-2" open={i === 0}>
              <summary className="p-4 cursor-pointer font-medium">{f.question}</summary>
              <div className="px-4 pb-4 text-slate-600">{f.answer}</div>
            </details>
          ))}
        </section>
      )}

      <section className="mt-8 p-6 bg-sky-50 rounded-xl border border-sky-100">
        <h3 className="text-lg font-semibold text-sky-900 mb-3">Planning to Relocate?</h3>
        <p className="text-sky-800 text-sm leading-relaxed">
          Compare auto insurance rates, find affordable renters insurance, and get moving quotes for your relocation.
          Check <a href={`https://salarybycity.com`} className="underline font-medium">local salaries</a> and <a href={`https://costbycity.com`} className="underline font-medium">cost of living</a> to budget your move.
        </p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(breadcrumbs)) }} />
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />}
    </div>
  );
}
