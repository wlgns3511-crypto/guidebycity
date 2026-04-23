import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCitiesByState, getAllStates, getNationalAvgIncome, getNationalAvgCost } from "@/lib/db";
import { FeedbackButton } from "@/components/FeedbackButton";
import { InsightBlock } from "@/components/upgrades/InsightBlock";
import { getStateInsights } from "@/lib/state-insights";
import { StateRich } from '@/components/state/StateRich';

interface Props { params: Promise<{ slug: string }> }
export const dynamicParams = false;

export function generateStaticParams() { return getAllStates().map((s) => ({ slug: s.toLowerCase() })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Cities in ${slug.toUpperCase()} — Cost of Living & Income Guide`,
    description: `Browse cities in ${slug.toUpperCase()} with cost of living index, median income, rent, and home value data. Compare affordability across the state.`,
    alternates: { canonical: `/state/${slug}/` },
    openGraph: { url: `/state/${slug}/` },
  };
}
export default async function StatePage({ params }: Props) {
  const { slug } = await params;
  const state = slug.toUpperCase();
  const cities = getCitiesByState(state);
  if (cities.length === 0) notFound();

  const nationalAvgIncome = getNationalAvgIncome();
  const nationalAvgCost = getNationalAvgCost();

  // State-level aggregate stats for the summary
  const withCost = cities.filter(c => c.cost_index != null);
  const withIncome = cities.filter(c => c.median_income != null);
  const avgCost = withCost.length > 0 ? (withCost.reduce((s, c) => s + (c.cost_index ?? 0), 0) / withCost.length).toFixed(1) : null;
  const avgIncome = withIncome.length > 0 ? Math.round(withIncome.reduce((s, c) => s + (c.median_income ?? 0), 0) / withIncome.length) : null;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Cities in {state}</h1>
      <p className="text-slate-600 mb-6">
        {cities.length} cities tracked in {state}{avgCost ? ` with an average cost of living index of ${avgCost}` : ''}{avgIncome ? ` and median household income of $${avgIncome.toLocaleString()}/year` : ''}.
      </p>

      <InsightBlock
        entityName={state}
        insights={getStateInsights(state, cities, nationalAvgIncome, nationalAvgCost)}
        heading={`${state} Cost of Living Analysis`}
      />

      <FeedbackButton pageId={slug} />

      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        {cities.map((c) => (
          <a key={c.slug} href={`/city/${c.slug}`} className="flex justify-between p-3 border rounded-lg hover:bg-teal-50">
            <span>{c.short_name}</span>
            <span className="text-slate-400">{c.cost_index ? c.cost_index.toFixed(1) : '-'}</span>
          </a>
        ))}
      </div>

      <StateRich slug={slug} state={state} />

    </div>
  );
}
