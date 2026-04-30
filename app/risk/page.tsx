import type { Metadata } from "next";
import { HAZARD_TOPICS, getHazardProfile } from "@/lib/hazard-topics";

export const metadata: Metadata = {
  title: "US City Hazard Risk — Tornado, Hurricane, Wildfire, Earthquake, Flood",
  description:
    "Five FEMA National Risk Index hazard topics for US metros: tornado, hurricane, wildfire, earthquake, and riverine flooding. Top-25 lists, regional pattern explainers, and insurance / preparedness implications for each.",
  alternates: { canonical: "/risk/" },
  openGraph: {
    title: "US City Hazard Risk — 5 FEMA NRI Topic Pages",
    description: "Five hazard topic pages drawing on FEMA NRI county-level data, mapped to 387 US metros.",
    url: "/risk/",
  },
};

const TONE: Record<string, { bg: string; border: string; text: string }> = {
  tornado: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  hurricane: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  wildfire: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  earthquake: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  'riverine-flood': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
};

export default function RiskIndex() {
  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a>{' / '}
        <span className="text-slate-800">Hazard Risk</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">US City Hazard-Risk Topics</h1>
      <p className="text-slate-600 mb-2 max-w-3xl">
        Five FEMA National Risk Index hazards mapped to 387 US metros. Each
        page combines the top-25 highest-risk metros with a regional pattern
        explainer and the implications for insurance, building codes, and
        preparedness.
      </p>
      <p className="text-sm text-slate-500 mb-8 max-w-3xl">
        Looking for a metro&apos;s overall composite score across all 18
        hazards instead?{' '}
        <a href="/rankings/highest-risk-cities/" className="text-teal-600 hover:underline">Browse the composite rankings</a>{' '}
        or jump straight to an individual{' '}
        <a href="/city/" className="text-teal-600 hover:underline">city guide</a>.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {HAZARD_TOPICS.map((h) => {
          const p = getHazardProfile(h)!;
          const t = TONE[h];
          return (
            <a key={h} href={`/risk/${h}/`} className={`block rounded-lg border ${t.border} ${t.bg} p-5 hover:shadow-sm transition`}>
              <h2 className={`font-semibold mb-1 ${t.text}`}>{p.title}</h2>
              <p className="text-sm text-slate-600">{p.shortLabel} risk · top-25 metros</p>
            </a>
          );
        })}
      </div>

      <section className="mt-12 p-5 bg-slate-50 border border-slate-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">About FEMA NRI hazard data</h2>
        <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
          <li>The FEMA National Risk Index publishes county-level risk scores across 18 named hazards plus a composite score.</li>
          <li>Each hazard score combines historical frequency, expected annual loss, and exposure (population + built assets) — so metros score high either through intrinsic geographic exposure or because a large population sits in the path.</li>
          <li>Each metro on guidebycity is mapped to its primary county (the principal county of the CBSA), since most NRI publications are county-keyed.</li>
          <li>Within a metro, neighborhood-level exposure varies sharply — flood zones, wildfire-prone interfaces, and earthquake fault proximity all change within a few miles.</li>
        </ul>
      </section>

      <div className="mt-6 text-sm text-slate-500">
        <a href="/rankings/" className="text-teal-600 hover:underline">National rankings →</a>
        {' · '}
        <a href="/state/" className="text-teal-600 hover:underline">State directory →</a>
      </div>
    </div>
  );
}
