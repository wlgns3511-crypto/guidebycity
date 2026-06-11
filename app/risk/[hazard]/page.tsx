import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHazardProfile, getHazardRows, HAZARD_TOPICS, type HazardTopic } from "@/lib/hazard-topics";
import { itemListSchema, datasetSchema, FEMA_NRI_CREATOR } from "@/lib/schema";

interface Props { params: Promise<{ hazard: string }> }

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return HAZARD_TOPICS.map((hazard) => ({ hazard }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hazard } = await params;
  const profile = getHazardProfile(hazard);
  if (!profile) return {};
  return {
    title: profile.metaTitle,
    description: profile.metaDescription,
    alternates: { canonical: `/risk/${hazard}/` },
    openGraph: {
      title: profile.metaTitle,
      description: profile.metaDescription,
      url: `/risk/${hazard}/`,
    },
  };
}

const RATING_PILL: Record<string, string> = {
  'Very High': 'bg-red-100 text-red-800',
  'Relatively High': 'bg-orange-100 text-orange-800',
  'Relatively Moderate': 'bg-amber-100 text-amber-800',
  'Relatively Low': 'bg-emerald-100 text-emerald-800',
  'Very Low': 'bg-emerald-200 text-emerald-900',
  'No Rating': 'bg-slate-100 text-slate-600',
  'Insufficient Data': 'bg-slate-100 text-slate-600',
  'Not Applicable': 'bg-slate-100 text-slate-600',
};

export default async function HazardTopicPage({ params }: Props) {
  const { hazard } = await params;
  const profile = getHazardProfile(hazard);
  if (!profile) notFound();
  const rows = getHazardRows(hazard as HazardTopic, 25);

  const listItems = rows.slice(0, 25).map(r => ({ name: r.city.short_name, url: `/city/${r.city.slug}/` }));

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema(profile.title, `/risk/${hazard}/`, listItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema(profile.title, profile.metaDescription, `/risk/${hazard}/`, FEMA_NRI_CREATOR)) }} />

      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a>{' / '}
        <a href="/risk/" className="hover:underline">Hazard Risk</a>{' / '}
        <span className="text-slate-800">{profile.shortLabel}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{profile.title}</h1>

      {/* Hook */}
      <section className="mb-6 p-5 bg-teal-50 border border-teal-200 rounded-lg">
        <h2 className="font-semibold text-teal-800 text-lg mb-2">{profile.hookHeadline}</h2>
        <p className="text-sm text-slate-700 leading-relaxed">{profile.hook}</p>
      </section>

      {/* Cross-topic nav */}
      <div className="flex flex-wrap gap-2 mb-8">
        {HAZARD_TOPICS.map((h) => {
          const p = getHazardProfile(h)!;
          const active = h === hazard;
          return (
            <a key={h} href={`/risk/${h}/`}
              className={`px-3 py-1 rounded-full text-xs border ${active ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 hover:bg-teal-50'}`}>
              {p.shortLabel}
            </a>
          );
        })}
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">Top 25 metros by {profile.shortLabel.toLowerCase()} risk score</h2>
      <p className="text-sm text-slate-500 mb-3 max-w-3xl">FEMA National Risk Index — primary county mapped to the metro CBSA. Score is on the 0–100 NRI hazard-specific scale. Annualised frequency is from the underlying FEMA dataset.</p>

      <div className="border rounded-lg overflow-hidden bg-white mb-8">
        <div className="grid grid-cols-[3rem_1fr_auto_auto_auto] gap-3 p-3 bg-slate-100 text-sm font-semibold">
          <span>#</span>
          <span>City</span>
          <span className="text-right">Rating</span>
          <span className="text-right">Score</span>
          <span className="text-right hidden sm:block text-slate-500">{profile.afreqLabel}</span>
        </div>
        {rows.map((r, i) => (
          <a key={r.city.slug} href={`/city/${r.city.slug}/`}
            className="grid grid-cols-[3rem_1fr_auto_auto_auto] gap-3 items-center p-3 hover:bg-teal-50 border-b border-slate-100">
            <span className="text-slate-400">{i + 1}.</span>
            <span className="text-sm">{r.city.short_name}{r.city.state ? `, ${r.city.state}` : ''}</span>
            <span className="text-right">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${RATING_PILL[r.ratng] ?? 'bg-slate-100 text-slate-600'}`}>{r.ratng}</span>
            </span>
            <span className="text-sm font-semibold text-slate-900 text-right">{r.score.toFixed(1)}</span>
            <span className="text-xs text-slate-500 text-right hidden sm:block">{profile.fmtAfreq(r.afreq)}</span>
          </a>
        ))}
      </div>

      {/* Outro */}
      <section className="my-8 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h2 className="text-lg font-bold mb-2 text-slate-900">What it means for relocators</h2>
        <p className="text-slate-700 leading-relaxed">{profile.outro}</p>
      </section>

      <section className="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Reading the FEMA NRI score</h2>
        <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
          <li>Score 0–100 on a national county scale. 100 = the highest-risk county in the country for this hazard.</li>
          <li>The categorical rating (Very Low → Very High) is FEMA&apos;s smoothed five-band reading of the same underlying score.</li>
          <li>Annualised frequency is the historical event count divided by years observed. For tornado / hurricane / earthquake, it counts qualifying events in the county; for wildfire it&apos;s annual burn area; for flood it&apos;s NFIP-classifiable events.</li>
          <li>Exposure inside a metro varies by neighborhood — these metro-level scores are starting points, not ZIP-precise underwriting.</li>
        </ul>
      </section>

      <div className="mt-6 text-sm text-slate-500">
        <a href="/risk/" className="text-teal-600 hover:underline">← All hazard topics</a>
        {' · '}
        <a href="/rankings/highest-risk-cities/" className="text-teal-600 hover:underline">Composite NRI rankings →</a>
      </div>
    </div>
  );
}
