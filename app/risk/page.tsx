import type { Metadata } from "next";
import { HAZARD_TOPICS, getHazardProfile } from "@/lib/hazard-topics";
import { HAZARD_TIER_THRESHOLDS } from "@/lib/hazard-tier";
import { datasetSchema, FEMA_NRI_CREATOR } from "@/lib/schema";
import { AuthorBox } from "@/components/AuthorBox";

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetSchema(
              'US Metro HazardTier — guidebycity 5-band rollup of FEMA NRI v2024',
              'A 5-band classification (Low → Extreme) of US metros derived from FEMA NRI v2024 primary-county overall rating plus the count of "Very High"-rated hazards in each metro\'s top-3 hazard set. Covers 387 metros with primary-county matches.',
              '/risk/',
              FEMA_NRI_CREATOR,
            ),
          ),
        }}
      />

      <section
        data-upgrade="hazard-tier-explainer"
        aria-label="What our HazardTier 5-band means"
        className="mb-10 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-3">What our HazardTier 5-band means</h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          HazardTier is guidebycity&apos;s 5-band rollup of FEMA NRI v2024. It reconciles two signals the raw NRI publishes separately: the metro&apos;s composite primary-county overall rating, and the per-hazard rating on the metro&apos;s top-3 hazards. A metro with a moderate composite but one extreme single hazard (Taylor County, TX = overall &ldquo;Relatively Moderate&rdquo; but &ldquo;Very High&rdquo; for hail) gets surfaced explicitly rather than buried under the composite.
        </p>
        <ul className="text-sm text-slate-700 space-y-2 list-none pl-0">
          {HAZARD_TIER_THRESHOLDS.map(t => (
            <li key={t.tier} className="flex gap-2">
              <span className="inline-block min-w-[90px] font-semibold text-slate-900">{t.tier}</span>
              <span className="text-slate-600">{t.rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        data-upgrade="hazard-tier-misreadings"
        aria-label="How tier ≠ insurance premium"
        className="mb-10 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-3">How HazardTier ≠ insurance premium</h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          HazardTier measures <strong>physical hazard frequency and intensity</strong>, not your homeowner-insurance bill. The relationship is partial. A metro can sit at Moderate HazardTier and still see insurance premium spikes because of carrier withdrawal (California wildfire zones), reinsurance cost pass-throughs (Florida hurricane), or building-stock vulnerability (Mississippi mobile-home density). Conversely, an Elevated metro with a single dominant hazard the carriers price routinely (Tornado Alley) often carries lower premiums than the tier suggests.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          Use HazardTier as a physical-exposure baseline. To estimate insurance cost: combine the tier with state-level homeowner-premium averages from the NAIC dwelling-fire/HO-3 reports, and check current carrier availability in the specific ZIP via the state Department of Insurance.
        </p>
      </section>

      <section
        data-upgrade="hazard-tier-dominant"
        aria-label="Dominant hazard ≠ only hazard"
        className="mb-10 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-3">Dominant hazard is not the only hazard</h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          When the city page says &ldquo;dominant hazard = hurricane,&rdquo; that&apos;s the single highest-scored hazard in the FEMA top-3 set. It does not mean other hazards are absent. Florida metros routinely combine hurricane + flood + lightning at meaningful levels; Pacific Northwest metros combine wildfire + earthquake; Gulf Coast metros combine hurricane + coastal flood + tornado.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          On the per-city page, the &ldquo;Top hazards by FEMA score&rdquo; grid below the HazardTier card shows the full top-3. Use that for relocation planning rather than the single &ldquo;dominant&rdquo; label, especially in multi-hazard regions.
        </p>
      </section>

      <section
        data-upgrade="hazard-tier-window"
        aria-label="Why we use the FEMA NRI v2024 window"
        className="mb-10 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-3">Why FEMA NRI v2024 and not a 10-year NOAA event count</h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          FEMA NRI v2024 already integrates the multi-decade historical record (NOAA Storm Events DB for severe storms, USGS National Seismic Hazard maps for earthquake, NIFC fire-occurrence for wildfire, NFIP claims for riverine flood) and combines it with exposure data (population, building value, agricultural value) to produce a single risk-score that&apos;s comparable across very different hazard types.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          A raw 10-year NOAA event count would be more current but would over-index recent volatility and would not be hazard-normalised — a wildfire metro with two extreme fires in 10 years and a tornado metro with twenty EF-0/EF-1 events would look the same on a count-only basis. FEMA&apos;s composite handles that. We refresh against new NRI releases (typically annual) rather than re-running per-event counts.
        </p>
      </section>

      <section
        data-upgrade="hazard-tier-use"
        aria-label="How to use HazardTier alongside FEMA flood maps and USGS seismic data"
        className="mb-10 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-xl font-bold text-slate-900 mb-3">How to use HazardTier alongside the underlying sources</h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          HazardTier is a metro-level screening signal. Once you&apos;ve narrowed to a specific metro or neighborhood, drop down to the source-of-truth maps and datasets for diligence:
        </p>
        <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-5">
          <li><strong>Flood exposure:</strong> FEMA Flood Map Service Center for the exact parcel&apos;s SFHA designation (AE vs X zone) — much more decision-relevant than the metro composite for any individual house.</li>
          <li><strong>Wildfire exposure:</strong> CAL FIRE FHSZ maps in California, USFS WUI maps elsewhere — they show the property-level burn likelihood at a resolution the metro tier cannot.</li>
          <li><strong>Earthquake exposure:</strong> USGS National Seismic Hazard Maps + the local building-code vintage (post-1990s code drastically reduces real risk).</li>
          <li><strong>Hurricane / coastal flood:</strong> NOAA SLOSH inundation maps and the local Building Code Effectiveness Grading Schedule.</li>
        </ul>
        <p className="text-sm text-slate-500 mt-3">
          HazardTier replaces &ldquo;is this metro risky?&rdquo; with a coherent 5-band answer; the source maps above replace &ldquo;is this parcel risky?&rdquo;
        </p>
      </section>

      <h2 className="text-xl font-bold text-slate-900 mb-3">Per-hazard topic pages — top-25 metros</h2>
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

      <AuthorBox source="FEMA National Risk Index v2024 (primary-county mapping) · 387 US metros · HazardTier rollup derived deterministically from NRI overall + per-hazard ratings." />
    </div>
  );
}
