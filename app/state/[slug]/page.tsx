import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCitiesByState, getAllStates, getNationalAvgIncome, getNationalAvgCost } from "@/lib/db";
import { FeedbackButton } from "@/components/FeedbackButton";
import { InsightBlock } from "@/components/upgrades/InsightBlock";
import { getStateInsights } from "@/lib/state-insights";
import { StateRich } from '@/components/state/StateRich';
import { getStateRiskAggregate, hazardLabel, hazardTitle } from "@/lib/risk-facts";

interface Props { params: Promise<{ slug: string }> }
export const dynamicParams = false;

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico',
};
function fullStateName(abbrev: string): string { return STATE_NAMES[abbrev.toUpperCase()] ?? abbrev.toUpperCase(); }

export function generateStaticParams() { return getAllStates().map((s) => ({ slug: s.toLowerCase() })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const state = slug.toUpperCase();
  const full = fullStateName(state);
  return {
    title: `${full} Cities Guide — Cost of Living, Income & Hazard Risk`,
    description: `Browse cities in ${full} with cost-of-living index, median income, rent, home values, and FEMA National Risk Index data. Compare affordability and natural-hazard exposure across the state.`,
    alternates: { canonical: `/state/${slug}/` },
    openGraph: { url: `/state/${slug}/` },
  };
}

export default async function StatePage({ params }: Props) {
  const { slug } = await params;
  const state = slug.toUpperCase();
  const full = fullStateName(state);
  const cities = getCitiesByState(state);
  if (cities.length === 0) notFound();

  const nationalAvgIncome = getNationalAvgIncome();
  const nationalAvgCost = getNationalAvgCost();

  // Cost / income aggregates
  const withCost = cities.filter(c => c.cost_index != null);
  const withIncome = cities.filter(c => c.median_income != null);
  const avgCost = withCost.length > 0 ? Math.round((withCost.reduce((s, c) => s + (c.cost_index ?? 0), 0) / withCost.length) * 10) / 10 : null;
  const avgIncome = withIncome.length > 0 ? Math.round(withIncome.reduce((s, c) => s + (c.median_income ?? 0), 0) / withIncome.length) : null;

  // Spread
  const costs = withCost.map(c => c.cost_index!).sort((a, b) => a - b);
  const minCost = costs[0] ?? null;
  const maxCost = costs[costs.length - 1] ?? null;

  // Above / below national avg counts
  const aboveAvg = withCost.filter(c => (c.cost_index ?? 0) > nationalAvgCost).length;
  const belowAvg = withCost.filter(c => (c.cost_index ?? 0) < nationalAvgCost).length;

  // Risk aggregate
  const riskAgg = getStateRiskAggregate(state);
  const dominantBand = (() => {
    const bands = [
      { label: 'Very High', n: riskAgg.veryHigh },
      { label: 'Relatively High', n: riskAgg.high },
      { label: 'Relatively Moderate', n: riskAgg.moderate },
      { label: 'Relatively Low', n: riskAgg.low },
      { label: 'Very Low', n: riskAgg.veryLow },
    ].filter(b => b.n > 0).sort((a, b) => b.n - a.n);
    return bands[0]?.label ?? 'Unknown';
  })();

  // Layer 2 cluster narrative — varies by spread + cost positioning
  const costPositioning = avgCost == null ? null : avgCost > nationalAvgCost + 5 ? 'pricey' : avgCost < nationalAvgCost - 5 ? 'affordable' : 'average';
  const spread = minCost != null && maxCost != null ? maxCost - minCost : null;
  const isWideSpread = spread != null && spread > 30;

  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/" className="hover:underline">Home</a>{' / '}
        <a href="/state/" className="hover:underline">States</a>{' / '}
        <span className="text-slate-800">{full}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">Cities in {full}</h1>
      <p className="text-slate-600 mb-2">
        {cities.length} {cities.length === 1 ? 'city' : 'cities'} tracked in {full}{avgCost ? `, with an average cost-of-living index of ${avgCost}` : ''}{avgIncome ? ` and median household income of $${avgIncome.toLocaleString()}` : ''}.
      </p>
      <p className="text-sm text-slate-500 mb-6 max-w-3xl">
        Each city links to a full guide combining ACS demographics, BEA Regional Price Parities for cost of living, NOAA climate data, and the FEMA National Risk Index for natural-hazard exposure.
      </p>

      {/* ─── KPI grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center">
          <div className="text-xs uppercase text-teal-600 font-semibold">Avg Cost Index</div>
          <div className="text-2xl font-bold text-teal-900">{avgCost ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-1">{avgCost != null && avgCost > nationalAvgCost ? `+${(avgCost - nationalAvgCost).toFixed(1)} vs US` : avgCost != null ? `${(avgCost - nationalAvgCost).toFixed(1)} vs US` : ''}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <div className="text-xs uppercase text-emerald-600 font-semibold">Median Income</div>
          <div className="text-2xl font-bold text-emerald-900">{avgIncome ? `$${avgIncome.toLocaleString()}` : '—'}</div>
          <div className="text-xs text-slate-500 mt-1">{avgIncome ? `${avgIncome > nationalAvgIncome ? '+' : ''}${(((avgIncome - nationalAvgIncome) / nationalAvgIncome) * 100).toFixed(0)}% vs US` : ''}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <div className="text-xs uppercase text-amber-600 font-semibold">Above US Avg</div>
          <div className="text-2xl font-bold text-amber-900">{aboveAvg}</div>
          <div className="text-xs text-slate-500 mt-1">{withCost.length ? `${Math.round((aboveAvg / withCost.length) * 100)}% of metros` : ''}</div>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-center">
          <div className="text-xs uppercase text-sky-600 font-semibold">Avg Risk Score</div>
          <div className="text-2xl font-bold text-sky-900">{riskAgg.avgRiskScore ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-1">FEMA NRI · {dominantBand}</div>
        </div>
      </div>

      {/* ─── Layer 2 cluster narrative ──────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-2">{full} Metro Cluster — Cost &amp; Risk Picture</h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-2">
          {costPositioning === 'pricey' && (
            <>The {cities.length} {full} metros tracked here run notably above the national cost-of-living baseline. The state-average index of <strong>{avgCost}</strong> is roughly <strong>{((avgCost! - nationalAvgCost) / nationalAvgCost * 100).toFixed(0)}% higher</strong> than the US average ({nationalAvgCost.toFixed(1)}), which usually indicates housing-market pressure rather than uniformly expensive goods or utilities.</>
          )}
          {costPositioning === 'affordable' && (
            <>{full} skews to the affordable side: across {cities.length} tracked metros the average cost-of-living index is <strong>{avgCost}</strong>, about <strong>{Math.abs((avgCost! - nationalAvgCost) / nationalAvgCost * 100).toFixed(0)}% below</strong> the national baseline of {nationalAvgCost.toFixed(1)}. Lower housing costs are typically the largest contributor.</>
          )}
          {costPositioning === 'average' && (
            <>The {cities.length} {full} metros average a cost-of-living index of <strong>{avgCost}</strong>, sitting close to the national baseline of {nationalAvgCost.toFixed(1)}. Most state-level affordability headlines do not capture the within-state spread, which is what individual relocators actually feel.</>
          )}
          {' '}
          {spread != null && (
            <>
              {isWideSpread ? (
                <>The within-state spread is unusually wide — from <strong>{minCost!.toFixed(1)}</strong> at the cheapest metro to <strong>{maxCost!.toFixed(1)}</strong> at the priciest, a {spread.toFixed(0)}-point gap. City selection within the state matters more than the state-level average suggests.</>
              ) : (
                <>The within-state spread is fairly tight — from {minCost!.toFixed(1)} to {maxCost!.toFixed(1)} ({spread.toFixed(0)} points). City choice has limited impact on cost; lifestyle and access factors drive most relocation decisions.</>
              )}
            </>
          )}
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          On natural-hazard exposure, FEMA classifies most of {full}&apos;s tracked metros as <strong>{dominantBand}</strong>{riskAgg.veryHigh > 0 || riskAgg.high > 0 ? ` (with ${riskAgg.veryHigh + riskAgg.high} metro${riskAgg.veryHigh + riskAgg.high === 1 ? '' : 's'} in the top two risk tiers)` : ''}.
          {riskAgg.topHazards.length > 0 && (
            <> The state&apos;s most commonly cited high-impact hazards across these metros are <strong>{riskAgg.topHazards.slice(0, 3).map(h => hazardLabel(h.name)).join(', ')}</strong>.</>
          )}
          {' '}This combination shapes both insurance pricing and emergency planning at the local level — and within the state, exposure can vary materially between the dominant-hazard band and quieter inland metros.
        </p>
      </section>

      <InsightBlock
        entityName={full}
        insights={getStateInsights(full, cities, nationalAvgIncome, nationalAvgCost)}
        heading={`${full} Cost of Living Analysis`}
      />

      {/* ─── Risk distribution mini-chart ───────────────────────────── */}
      {riskAgg.withRisk > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-2">Hazard-Risk Distribution Across {full}</h2>
          <p className="text-sm text-slate-500 mb-3 max-w-3xl">How the {riskAgg.withRisk} {full} metros distribute across FEMA&apos;s five National Risk Index bands. Each cell is a count of metros in that tier.</p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Very Low', n: riskAgg.veryLow, cls: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
              { label: 'Low', n: riskAgg.low, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
              { label: 'Moderate', n: riskAgg.moderate, cls: 'bg-amber-50 text-amber-800 border-amber-200' },
              { label: 'High', n: riskAgg.high, cls: 'bg-orange-50 text-orange-800 border-orange-200' },
              { label: 'Very High', n: riskAgg.veryHigh, cls: 'bg-red-50 text-red-800 border-red-200' },
            ].map(b => (
              <div key={b.label} className={`p-3 rounded-lg border ${b.cls} text-center`}>
                <div className="text-2xl font-bold">{b.n}</div>
                <div className="text-xs">{b.label}</div>
              </div>
            ))}
          </div>
          {riskAgg.topHazards.length > 0 && (
            <div className="mt-4 grid sm:grid-cols-3 gap-2">
              {riskAgg.topHazards.slice(0, 3).map(h => (
                <a key={h.name} href={`/risk/${h.name}/`} className="block bg-white border border-slate-200 rounded-lg p-3 hover:border-teal-300 hover:bg-teal-50 transition">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{hazardTitle(h.name)}</div>
                  <div className="text-sm font-semibold text-slate-800">Top-3 in {h.mentions} {h.mentions === 1 ? 'metro' : 'metros'}</div>
                  <div className="text-xs text-slate-500 mt-1">Peak score {h.topScore}</div>
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      <FeedbackButton pageId={slug} />

      <h2 className="text-lg font-bold mb-3 mt-6">All {full} Metros</h2>
      <div className="grid sm:grid-cols-2 gap-2 text-sm mb-8">
        {cities.map((c) => (
          <a key={c.slug} href={`/city/${c.slug}/`} className="flex justify-between p-3 border rounded-lg hover:bg-teal-50">
            <span>{c.short_name}</span>
            <span className="text-slate-400">{c.cost_index ? c.cost_index.toFixed(1) : '-'}</span>
          </a>
        ))}
      </div>

      <StateRich slug={slug} state={state} />

      <div className="mt-8 text-sm text-slate-500">
        <a href="/rankings/" className="text-teal-600 hover:underline">National rankings →</a>
        {' · '}
        <a href="/risk/" className="text-teal-600 hover:underline">Hazard topic pages →</a>
      </div>
    </div>
  );
}
