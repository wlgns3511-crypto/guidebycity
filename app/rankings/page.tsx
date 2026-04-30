import type { Metadata } from "next";
import { RANKING_TYPES, getRankingProfile } from "@/lib/rankings";

export const metadata: Metadata = {
  title: "US City Rankings — Cost, Income, Housing, and Hazard Risk",
  description:
    "Ten ranking lists across US metros: cost of living (most expensive / most affordable), housing markets, median income, real-income value leaders, rent burden, utilities, and FEMA National Risk Index (highest-risk + safest). Same dataset behind every guidebycity city page, indexed for browsing by axis.",
  alternates: { canonical: "/rankings/" },
  openGraph: {
    title: "US City Rankings — 10 Lists by Cost, Income & Hazard Risk",
    description: "Browse 25 cities per axis across cost, income, housing, rent burden, and FEMA National Risk Index.",
    url: "/rankings/",
  },
};

const TONE_CLS: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
};

export default function RankingsIndex() {
  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a>{' / '}
        <span className="text-slate-800">Rankings</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">US City Rankings</h1>
      <p className="text-slate-600 mb-2 max-w-3xl">
        Ten lists across 387 metros. Same dataset behind every city guide,
        organised one axis at a time so you can browse by cost, income,
        housing, rent burden, utilities, or natural-hazard risk.
      </p>
      <p className="text-sm text-slate-500 mb-8 max-w-3xl">
        Hazard rankings draw on the FEMA National Risk Index for the metro&apos;s primary county. Cost, income, and housing rankings draw on BEA Regional Price Parities + Census ACS.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {RANKING_TYPES.map((t) => {
          const p = getRankingProfile(t)!;
          const tone = TONE_CLS[p.tone];
          return (
            <a key={t} href={`/rankings/${t}/`} className={`block rounded-lg border ${tone.border} ${tone.bg} p-5 hover:shadow-sm transition`}>
              <h2 className={`font-semibold mb-1 ${tone.text}`}>{p.title}</h2>
              <p className="text-sm text-slate-600">{p.shortLabel} · top 25</p>
            </a>
          );
        })}
      </div>

      <section className="mt-12 p-5 bg-slate-50 border border-slate-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How the lists are built</h2>
        <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
          <li>Cost rankings draw on BEA Regional Price Parities (2023 metro release). Index 100 = US average.</li>
          <li>Income, rent, and home-value figures are 5-year ACS estimates.</li>
          <li>Real income = nominal median household income × (100 / cost index). It approximates cost-adjusted purchasing power.</li>
          <li>Rent burden = (median rent × 12) ÷ median household income. HUD considers above 30% &ldquo;cost-burdened.&rdquo;</li>
          <li>Hazard rankings use the FEMA National Risk Index composite score for the primary county of each metro. The composite folds 18 named hazards plus population at risk and expected annual loss.</li>
          <li>Each list shows the top 25 — full ranks across all 387 metros are surfaced on individual <a className="underline text-teal-700" href="/city/">city guides</a>.</li>
        </ul>
      </section>

      <div className="mt-6 text-sm text-slate-500">
        <a href="/risk/" className="text-teal-600 hover:underline">Hazard topic pages →</a>
        {' · '}
        <a href="/state/" className="text-teal-600 hover:underline">State directory →</a>
      </div>
    </div>
  );
}
