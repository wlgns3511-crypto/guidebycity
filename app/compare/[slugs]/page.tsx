import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCityBySlug, getTopComparisons } from "@/lib/db";
import { faqSchema } from "@/lib/schema";

interface Props { params: Promise<{ slugs: string }> }
function parseSlugs(s: string): [string, string] | null { const m = s.match(/^(.+)-vs-(.+)$/); return m ? [m[1], m[2]] : null; }
function fmt(v: number | null): string { return v ? '$' + v.toLocaleString('en-US') : 'N/A'; }
function fmtIdx(v: number | null): string { return v ? v.toFixed(1) : '-'; }

export async function generateStaticParams() {
  return getTopComparisons(3000).map((p) => { const [a, b] = [p.slugA, p.slugB].sort(); return { slugs: `${a}-vs-${b}` }; });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugs } = await params;
  const p = parseSlugs(slugs);
  if (!p) return {};
  const a = getCityBySlug(p[0]), b = getCityBySlug(p[1]);
  if (!a || !b) return {};
  return {
    title: `${a.short_name} vs ${b.short_name} - City Comparison`,
    description: `Compare ${a.short_name} and ${b.short_name}. Cost of living, income, housing, and more side by side.`,
    alternates: { canonical: `/compare/${slugs}` },
  };
}

export default async function ComparePage({ params }: Props) {
  const { slugs } = await params;
  const p = parseSlugs(slugs);
  if (!p) notFound();
  const a = getCityBySlug(p[0]), b = getCityBySlug(p[1]);
  if (!a || !b) notFound();

  const cheaper = (a.cost_index || 100) < (b.cost_index || 100) ? a : b;
  const rows: [string, string, string][] = [
    ['Cost of Living Index', fmtIdx(a.cost_index), fmtIdx(b.cost_index)],
    ['Housing Index', fmtIdx(a.housing_index), fmtIdx(b.housing_index)],
    ['Goods Index', fmtIdx(a.goods_index), fmtIdx(b.goods_index)],
    ['Utilities Index', fmtIdx(a.utilities_index), fmtIdx(b.utilities_index)],
    ['Median Income', fmt(a.median_income), fmt(b.median_income)],
    ['Median Home Value', fmt(a.median_home_value), fmt(b.median_home_value)],
    ['Median Rent', fmt(a.median_rent), fmt(b.median_rent)],
    ['Per Capita Income', fmt(a.per_capita_income), fmt(b.per_capita_income)],
  ];

  const faqs = [
    { question: `Is ${a.short_name} or ${b.short_name} cheaper?`, answer: `${cheaper.short_name} is more affordable with a cost of living index of ${fmtIdx(cheaper.cost_index)} vs ${fmtIdx(cheaper === a ? b.cost_index : a.cost_index)}.` },
  ];

  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a> / <a href="/compare" className="hover:underline">Compare</a> / <span className="text-slate-800">{a.short_name} vs {b.short_name}</span>
      </nav>
      <h1 className="text-3xl font-bold mb-6">{a.short_name} vs {b.short_name}</h1>
      <div className="bg-teal-50 rounded-lg p-4 mb-6 text-center">
        <span className="font-bold text-teal-700">{cheaper.short_name}</span> is more affordable
      </div>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="bg-slate-100"><th className="text-left p-3">Metric</th><th className="text-right p-3">{a.short_name}</th><th className="text-right p-3">{b.short_name}</th></tr></thead>
        <tbody>
          {rows.map(([label, va, vb]) => (
            <tr key={label} className="border-b border-slate-200">
              <td className="p-3">{label}</td><td className="p-3 text-right font-medium">{va}</td><td className="p-3 text-right font-medium">{vb}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="mt-8">
        {faqs.map((f, i) => (<details key={i} className="border rounded-lg mb-2" open><summary className="p-4 font-medium">{f.question}</summary><div className="px-4 pb-4 text-slate-600">{f.answer}</div></details>))}
      </section>
      <div className="flex gap-4 mt-6">
        <a href={`/city/${p[0]}`} className="text-teal-600 hover:underline">{a.short_name} guide &rarr;</a>
        <a href={`/city/${p[1]}`} className="text-teal-600 hover:underline">{b.short_name} guide &rarr;</a>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />
    </div>
  );
}
