import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRankingProfile, getRankingRows, RANKING_TYPES, type RankingType } from "@/lib/rankings";
import { itemListSchema } from "@/lib/schema";

interface Props { params: Promise<{ type: string }> }

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return RANKING_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const profile = getRankingProfile(type);
  if (!profile) return {};
  return {
    title: profile.metaTitle,
    description: profile.metaDescription,
    alternates: { canonical: `/rankings/${type}/` },
    openGraph: {
      title: profile.metaTitle,
      description: profile.metaDescription,
      url: `/rankings/${type}/`,
    },
  };
}

const TONE_CLS: Record<string, { bg: string; text: string; pill: string }> = {
  red: { bg: 'bg-red-50', text: 'text-red-800', pill: 'bg-red-100 text-red-800' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', pill: 'bg-emerald-100 text-emerald-800' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', pill: 'bg-amber-100 text-amber-800' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-800', pill: 'bg-sky-100 text-sky-800' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-800', pill: 'bg-indigo-100 text-indigo-800' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-800', pill: 'bg-orange-100 text-orange-800' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-800', pill: 'bg-teal-100 text-teal-800' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-800', pill: 'bg-violet-100 text-violet-800' },
};

export default async function RankingTypePage({ params }: Props) {
  const { type } = await params;
  const profile = getRankingProfile(type);
  if (!profile) notFound();
  const rows = getRankingRows(type as RankingType, 25);
  const tone = TONE_CLS[profile.tone];

  const listItems = rows.slice(0, 25).map(r => ({ name: r.city.short_name, url: `/city/${r.city.slug}/` }));

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema(profile.title, `/rankings/${type}/`, listItems)) }} />

      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a>{' / '}
        <a href="/rankings/" className="hover:underline">Rankings</a>{' / '}
        <span className="text-slate-800">{profile.shortLabel}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{profile.title}</h1>
      <p className="text-slate-600 mb-6 max-w-3xl">{profile.blurb}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {RANKING_TYPES.map((t) => {
          const p = getRankingProfile(t)!;
          const active = t === type;
          return (
            <a key={t} href={`/rankings/${t}/`}
              className={`px-3 py-1 rounded-full text-xs border ${active ? `${tone.pill} border-current` : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
              {p.shortLabel}
            </a>
          );
        })}
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-3 p-3 bg-slate-100 text-sm font-semibold">
          <span>#</span>
          <span>City</span>
          <span className="text-right">{profile.primaryLabel}</span>
          {profile.secondaryLabel && <span className="text-right text-slate-500 hidden sm:block">{profile.secondaryLabel}</span>}
        </div>
        {rows.map((r, i) => (
          <a key={r.city.slug} href={`/city/${r.city.slug}/`}
            className="grid grid-cols-[3rem_1fr_auto_auto] gap-3 items-center p-3 hover:bg-teal-50 border-b border-slate-100">
            <span className="text-slate-400">{i + 1}.</span>
            <span className="text-sm">{r.city.short_name}{r.city.state ? `, ${r.city.state}` : ''}</span>
            <span className="text-sm font-semibold text-slate-900 text-right">{profile.primaryFmt(r.primary)}</span>
            {profile.secondaryLabel && (
              <span className="text-xs text-slate-500 text-right hidden sm:block">{profile.secondaryFmt ? profile.secondaryFmt(r.secondary) : '—'}</span>
            )}
          </a>
        ))}
      </div>

      <section className="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How to read this list</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Ranking lists are useful directional tools, not deal-breakers. A
          metro near the top of one list often sits in the middle of another
          — for example, a high-income metro can carry a similarly high cost
          index, leaving real-income roughly average. The individual{' '}
          <a className="text-teal-600 hover:underline" href="/city/">city guides</a> show
          all five dimensions side-by-side, so you can read the full picture
          rather than a single axis.
        </p>
      </section>

      <div className="mt-6 text-sm text-slate-500">
        <a href="/rankings/" className="text-teal-600 hover:underline">← All ranking lists</a>
        {' · '}
        <a href="/risk/" className="text-teal-600 hover:underline">Hazard topic pages →</a>
      </div>
    </div>
  );
}
