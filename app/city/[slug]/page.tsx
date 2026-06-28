import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCityBySlug, getAllCities, getCitiesByState, getWeather, monthName } from "@/lib/db";
import { buildDbPageRobots, buildTrustUpdatedLabel, getDbPageGate, getReviewedAt, getReviewedBy, METHODOLOGY_URL } from "@/lib/db-page";
import { CITY_VINTAGE, PUBLISHER, SOURCE_AUTHORITIES } from "@/lib/authorship";
import { isValidComparePair } from "@/lib/compare-whitelist";
import { breadcrumbSchema, faqSchema, datasetSchema } from "@/lib/schema";
import { analyzeCity } from "@/lib/city-analysis";
import { generateAutoFAQs } from "@/lib/auto-faqs";
import { AdSlot } from "@/components/AdSlot";
import { DataFeedback } from "@/components/DataFeedback";
import { EmbedButton } from "@/components/EmbedButton";
import { FreshnessTag } from "@/components/FreshnessTag";
import { CostCompareCalculator } from "@/components/CostCompareCalculator";
import { AuthorBox } from "@/components/AuthorBox";
import { EditorNote } from "@/components/EditorNote";
import { DidYouKnow } from "@/components/DidYouKnow";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { CrossSiteLinks } from "@/components/CrossSiteLinks";
import { InsightCards } from "@/components/InsightCards";
import { InsightBlock } from "@/components/upgrades/InsightBlock";
import { getCityInsights } from "@/lib/insights";
import { CostBreakdownBar } from "@/components/CostBreakdownBar";
import { CostComparison } from "@/components/tools/CostComparison";
import { AnswerHero } from "@/components/upgrades/AnswerHero";
import { TrustBlock } from "@/components/upgrades/TrustBlock";
import { DecisionNext } from "@/components/upgrades/DecisionNext";
import { RelatedEntities } from '@/components/upgrades/RelatedEntities';
import { TableOfContents } from '@/components/upgrades/TableOfContents';
import { getRiskByCbsa, buildRiskCommentary, hazardLabel, hazardTitle, type RiskStatus } from '@/lib/risk-facts';
import { classifyHazardTier, hazardTierBlurb, dominantHazardLabel, type HazardTier } from '@/lib/hazard-tier';
import { classifyAffordability } from '@/lib/city-affordability-tier';
import { classifyCityGrowth } from '@/lib/population-growth-band';
import { interpretCity } from '@/lib/city-interpretation';
import { decodeCityCrosswalkFromCity, buildCityP1Title, buildCityVerdictChip } from '@/lib/crosswalk-guide';
import { CrosswalkBridge } from '@/components/upgrades/CrosswalkBridge';
import { CityInterpretationStrip } from '@/components/upgrades/CityInterpretation';
import { CityHeroImage } from '@/components/CityHeroImage';
import { getCityImage } from '@/lib/city-images';
import { calculateProprietaryMetrics } from "@/lib/proprietary-metrics";
import { ProprietaryMetricsBlock } from "@/components/upgrades/ProprietaryMetricsBlock";

interface Props { params: Promise<{ slug: string }> }

function fmt(v: number | null): string { return v ? '$' + v.toLocaleString('en-US') : 'N/A'; }
function fmtIdx(v: number | null): string { return v ? v.toFixed(1) : 'N/A'; }
function pctDiff(v: number | null): string {
  if (!v) return 'N/A';
  const d = v - 100;
  return d > 0 ? `${d.toFixed(1)}% above average` : `${Math.abs(d).toFixed(1)}% below average`;
}

function buildCityTopAnswer(c: {
  cost_index: number | null;
  median_home_value: number | null;
  median_income: number | null;
  median_rent: number | null;
  short_name: string;
  state: string | null;
}) {
  return `${c.short_name}, ${c.state} has a cost-of-living index of ${fmtIdx(c.cost_index)}, with median household income of ${fmt(c.median_income)} and median rent of ${fmt(c.median_rent)} per month. This page is meant to show whether the city's housing and income picture makes the overall index feel manageable or financially tight in practice.`;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllCities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCityBySlug(slug);
  if (!c) return {};
  const dataVintage = "local ACS + BEA RPP + NOAA climate snapshot";

  // Peer: same-state different city, prefer comparable cost index
  const stateCities = c.state
    ? getCitiesByState(c.state).filter((x) => x.slug !== slug)
    : [];
  const ci = c.cost_index ?? 100;
  const peer = stateCities.find((p) => {
    if (!p.cost_index) return false;
    const d = Math.abs((p.cost_index - ci) / ci);
    return d > 0.03 && d < 0.8;
  }) || stateCities.find((p) => p.cost_index) || stateCities[0];

  // Title retune 2026-05-20 (Phase 7 P1 verdict-in-title):
  // Pattern `{ShortName}: {Verdict} · COL {n}` keeps the cost-of-living query
  // intent (Demographia affordability band reads as the verdict) while binding
  // a typed-id surface that varies across the 387-metro cohort. title.absolute
  // bypasses the layout " | GuideByCity" suffix to stay under the 60c cap.
  const year = new Date().getUTCFullYear();
  const crosswalk = decodeCityCrosswalkFromCity(c);
  const metrics = calculateProprietaryMetrics(crosswalk, c.short_name, slug);
  const titleAbsolute = buildCityP1Title(c.short_name, crosswalk);
  const topAnswer = buildCityTopAnswer(c);
  const description = `[Affordability: ${metrics.housingAffordabilityScore}/100, Relocation Grade: ${metrics.overallGrade}] ${topAnswer}`;
  const gate = getDbPageGate({
    alternativeLinkCount: Math.max(3, stateCities.slice(0, 3).length),
    dataVintage,
    topAnswer,
  });

  return {
    title: { absolute: titleAbsolute },
    description,
    alternates: { canonical: `/city/${slug}/` },
    openGraph: { title: titleAbsolute, description, url: `/city/${slug}/` },
    robots: buildDbPageRobots(gate.pass),
  };
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const c = getCityBySlug(slug);
  if (!c) notFound();

  const allCities = getAllCities().filter(x => x.slug !== slug).slice(0, 10);
  const stateCities = c.state ? getCitiesByState(c.state).filter(x => x.slug !== slug).slice(0, 8) : [];
  const compareableAll = allCities.filter(x => isValidComparePair(slug, x.slug));
  const compareableState = stateCities.filter(x => isValidComparePair(slug, x.slug));
  const weather = getWeather(c);
  const analysis = analyzeCity(c, weather);
  const dataVintage = "local ACS + BEA RPP + NOAA climate snapshot";
  const risk = getRiskByCbsa(c.fips);
  const riskCommentary = risk ? buildRiskCommentary(slug, risk, c.short_name) : null;
  const hazardTier = classifyHazardTier(risk);
  const affordability = classifyAffordability(c.median_income, c.median_home_value);
  const growth = classifyCityGrowth(c);
  const interpretation = interpretCity({
    cityName: c.short_name,
    affordability,
    growth,
    hazard: hazardTier,
    dominantHazardLabelText: dominantHazardLabel(hazardTier.dominantHazard),
  });
  const crosswalk = decodeCityCrosswalkFromCity(c);
  const metrics = calculateProprietaryMetrics(crosswalk, c.short_name, slug);
  const verdictChip = buildCityVerdictChip(crosswalk);
  const topAnswer = buildCityTopAnswer(c);
  const autoFaqs = generateAutoFAQs(c, weather);
  const faqs = [
    ...(c.cost_index ? [{ question: `Is ${c.short_name} expensive?`, answer: `${c.short_name} has a cost of living index of ${fmtIdx(c.cost_index)}, which is ${pctDiff(c.cost_index)}.` }] : []),
    ...(c.median_income ? [{ question: `What is the average income in ${c.short_name}?`, answer: `The median household income in ${c.short_name} is ${fmt(c.median_income)} per year.` }] : []),
    ...(c.median_rent ? [{ question: `How much is rent in ${c.short_name}?`, answer: `The median monthly rent in ${c.short_name} is ${fmt(c.median_rent)}.` }] : []),
    ...(c.median_home_value ? [{ question: `What is the average home price in ${c.short_name}?`, answer: `The median home value in ${c.short_name} is ${fmt(c.median_home_value)}.` }] : []),
    { question: `What is it like living in ${c.short_name}?`, answer: analysis.summary },
    ...(analysis.pros.length > 0 ? [{ question: `What are the pros of living in ${c.short_name}?`, answer: `Advantages include: ${analysis.pros.join(". ")}. ${analysis.bestTimeToVisit}` }] : []),
    ...(analysis.cons.length > 0 ? [{ question: `What are the downsides of living in ${c.short_name}?`, answer: `Things to consider: ${analysis.cons.join(". ")}.` }] : []),
    ...(analysis.bestTimeToVisit ? [{ question: `When is the best time to visit ${c.short_name}?`, answer: analysis.bestTimeToVisit }] : []),
    ...autoFaqs,
  ];

  const breadcrumbs = [{ name: "Home", url: "/" }, { name: c.state, url: `/state/${c.state.toLowerCase()}/` }, { name: c.short_name, url: `/city/${slug}/` }];

  return (
    <article data-toc-root>
      <nav className="text-sm text-slate-500 mb-4">
        {breadcrumbs.map((b, i) => (<span key={i}>{i > 0 && " / "}{i < 2 ? <a href={b.url} className="hover:underline">{b.name}</a> : <span className="text-slate-800">{b.name}</span>}</span>))}
      </nav>

      {(() => {
        const img = getCityImage(slug);
        return img ? <CityHeroImage img={img} /> : null;
      })()}

      <AnswerHero
        title={`${c.short_name} city guide`}
        subtitle={c.name}
        tagline={`${topAnswer} ${analysis.summary}`}
        badges={[
          {
            label: verdictChip,
            tone: ((crosswalk.verdict === 'A' || crosswalk.verdict === 'B') ? 'emerald' : 'amber') as 'amber' | 'emerald',
          },
          ...(c.cost_index ? [{
            label: c.cost_index > 100 ? `${(c.cost_index - 100).toFixed(0)}% above US` : `${(100 - c.cost_index).toFixed(0)}% below US`,
            tone: ((c.cost_index > 100 ? "amber" : "emerald") as "amber" | "emerald"),
          }] : []),
          { label: c.state, tone: "indigo" as const },
        ]}
        alternatives={stateCities.slice(0, 3).map(sc => ({
          label: sc.short_name,
          href: `/city/${sc.slug}/`,
          sublabel: sc.cost_index ? `Index ${fmtIdx(sc.cost_index)}` : undefined,
        }))}
        alternativesLabel={`Other ${c.state} cities`}
      />

      <FreshnessTag
        source="Census ACS + BEA RPP + NOAA climate"
        updated={getReviewedAt()}
        reviewedBy={getReviewedBy()}
        dataVintage={dataVintage}
      />

      <TrustBlock
        sources={[
          { name: "Census ACS", url: "https://www.census.gov/programs-surveys/acs/" },
          { name: "BEA Regional Price Parities", url: "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area" },
          { name: "BLS CPI", url: "https://www.bls.gov/cpi/" },
          { name: "NOAA Climate Data", url: "https://www.ncei.noaa.gov/" },
          { name: "MIT Living Wage Calculator", url: "https://livingwage.mit.edu/" },
        ]}
        updated={buildTrustUpdatedLabel(dataVintage)}
        methodologyUrl={METHODOLOGY_URL}
      />

      <ProprietaryMetricsBlock
        housingAffordabilityScore={metrics.housingAffordabilityScore}
        economicVitalityScore={metrics.economicVitalityScore}
        environmentalResilienceScore={metrics.environmentalResilienceScore}
        overallGrade={metrics.overallGrade}
        commentary={metrics.commentary}
      />

      <EditorNote note={`This guide covers key livability metrics for ${c.short_name}, including cost of living, income levels, housing costs, and climate data to help you evaluate whether this city is right for you.`} />

      <TableOfContents />

      <InsightBlock
        entityName={c.short_name}
        insights={getCityInsights(c)}
        heading="Key Takeaways"
      />

      <InsightCards city={c} />

      <CostBreakdownBar housing={c.housing_index} goods={c.goods_index} utilities={c.utilities_index} costIndex={c.cost_index} />

      <div className="bg-teal-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {c.cost_index && <div><div className="text-sm text-slate-500">Cost of Living</div><div className={`text-2xl font-bold ${c.cost_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.cost_index)}</div></div>}
          {c.median_income && <div><div className="text-sm text-slate-500">Median Income</div><div className="text-2xl font-bold">{fmt(c.median_income)}</div></div>}
          {c.median_rent && <div><div className="text-sm text-slate-500">Median Rent</div><div className="text-2xl font-bold">{fmt(c.median_rent)}/mo</div></div>}
          {c.median_home_value && <div><div className="text-sm text-slate-500">Median Home</div><div className="text-2xl font-bold">{fmt(c.median_home_value)}</div></div>}
        </div>
      </div>

      <AdSlot id="city-top" />

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

      {risk && hazardTier.confidence !== 'low' && (() => {
        const tierTone: Record<HazardTier, { ring: string; bg: string; pill: string; label: string }> = {
          'Low':      { ring: 'ring-emerald-200', bg: 'bg-emerald-50',  pill: 'bg-emerald-100 text-emerald-900', label: 'text-emerald-900' },
          'Moderate': { ring: 'ring-amber-200',   bg: 'bg-amber-50',    pill: 'bg-amber-100 text-amber-900',     label: 'text-amber-900' },
          'Elevated': { ring: 'ring-orange-200',  bg: 'bg-orange-50',   pill: 'bg-orange-100 text-orange-900',   label: 'text-orange-900' },
          'High':     { ring: 'ring-rose-200',    bg: 'bg-rose-50',     pill: 'bg-rose-100 text-rose-900',       label: 'text-rose-900' },
          'Extreme':  { ring: 'ring-red-300',     bg: 'bg-red-50',      pill: 'bg-red-200 text-red-900',         label: 'text-red-900' },
        };
        const tt = tierTone[hazardTier.tier];
        return (
          <section
            data-upgrade="hazard-tier"
            aria-label={`HazardTier classification for ${c.short_name}`}
            className={`mb-6 rounded-xl ring-1 ${tt.ring} ${tt.bg} p-5`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tt.pill}`}>HazardTier · {hazardTier.tier}</span>
              <span className="text-xs text-slate-500">Dominant: {dominantHazardLabel(hazardTier.dominantHazard)}</span>
              {hazardTier.annualEvents != null && hazardTier.annualEvents > 0 && (
                <span className="text-xs text-slate-500">· {hazardTier.annualEvents.toFixed(2)} modelled events/yr across top hazards</span>
              )}
            </div>
            <p className={`text-sm leading-relaxed ${tt.label}`}>
              <strong>{c.short_name}</strong> classifies as a <strong>{hazardTier.tier}</strong> HazardTier metro — {hazardTierBlurb(hazardTier.tier)}.
              {hazardTier.veryHighHazardCount > 0 && ` ${hazardTier.veryHighHazardCount} of its top-3 county hazards carry FEMA's "Very High" rating.`}
            </p>
            <p className="text-xs text-slate-500 mt-2">{hazardTier.evidence} HazardTier is a guidebycity-derived 5-band rollup of FEMA NRI — see <a href="/methodology/#hazard-tier" className="underline">methodology</a> for thresholds.</p>
          </section>
        );
      })()}

      <CityInterpretationStrip
        cityName={c.short_name}
        affordabilityTier={affordability.tier}
        growthBand={growth.band}
        hazardTier={hazardTier.tier}
        interpretation={interpretation}
      />

      {/* ─── Risk Profile (FEMA NRI) ──────────────────────────────────
          2026-04-29 HCU 5-chunk patch — guidebycity unique-data section.
          Pulls the FEMA National Risk Index for the metro's primary county
          and renders headline / fact / context / implication. */}
      {risk && riskCommentary && risk.riskScore != null && (() => {
        const tone: Record<RiskStatus, { bg: string; border: string; text: string; pill: string }> = {
          'very-high': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', pill: 'bg-red-100 text-red-800' },
          'high': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', pill: 'bg-orange-100 text-orange-800' },
          'moderate': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', pill: 'bg-amber-100 text-amber-800' },
          'low': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', pill: 'bg-emerald-100 text-emerald-800' },
          'very-low': { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', pill: 'bg-emerald-200 text-emerald-900' },
          'unknown': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', pill: 'bg-slate-100 text-slate-700' },
        };
        const t = tone[risk.status];
        return (
          <section className="mb-8" id="risk-profile">
            <h2 className="text-xl font-bold mb-3">Natural-Hazard Risk Profile</h2>
            <div className={`rounded-xl border ${t.border} ${t.bg} p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${t.pill}`}>{riskCommentary.headline}</span>
                <span className="text-xs text-slate-500">FEMA National Risk Index · {risk.countyName}</span>
              </div>
              <p className={`text-sm leading-relaxed mb-3 ${t.text}`}><strong>{riskCommentary.fact}</strong></p>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{riskCommentary.context}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{riskCommentary.implication}</p>

              {risk.topHazards.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Top hazards by FEMA score</h3>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {risk.topHazards.slice(0, 3).map((h) => (
                      <a key={h.code} href={`/risk/${h.name}/`} className="block bg-white border border-slate-200 rounded-lg p-3 hover:border-teal-300 hover:bg-teal-50 transition">
                        <div className="text-xs uppercase tracking-wide text-slate-500">{hazardTitle(h.name)}</div>
                        <div className="text-sm font-semibold text-slate-800">{h.ratng}</div>
                        <div className="text-xs text-slate-500 mt-1">Score {h.score}{h.afreq != null && h.afreq > 0 ? ` · ${h.afreq.toFixed(2)}/yr` : ''}</div>
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Top hazards reflect the FEMA NRI &quot;risk score&quot; for {hazardLabel(risk.topHazards[0].name)}{risk.topHazards.length > 1 ? `, ${hazardLabel(risk.topHazards[1].name)}` : ''}{risk.topHazards.length > 2 ? `, and ${hazardLabel(risk.topHazards[2].name)}` : ''} in {risk.countyName}, the primary county for the {c.short_name} metro.</p>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {c.cost_index && (
        <CostCompareCalculator cityName={c.short_name} defaultCostIndex={c.cost_index} />
      )}

      {c.cost_index && (
        <CostComparison
          cityName={c.short_name}
          costIndex={c.cost_index}
          housingIndex={c.housing_index ?? null}
          goodsIndex={c.goods_index ?? null}
          utilitiesIndex={c.utilities_index ?? null}
          medianIncome={c.median_income ?? null}
          medianRent={c.median_rent ?? null}
        />
      )}

      <DidYouKnow fact={`The cost of living in ${c.short_name} is ${c.cost_index ? pctDiff(c.cost_index) : 'not yet indexed'} compared to the national baseline of 100. Factors like housing, groceries, and utilities all contribute to this score.`} />

      <AdSlot id="city-mid" />

      <section className="mb-8 p-4 bg-slate-50 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Explore More About {c.short_name}</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={`https://salarybycity.com/locations/${slug}/`} className="text-blue-600 hover:underline" target="_blank" rel="noopener">Salaries in {c.short_name}</a>
          <a href={`https://costbycity.com/cities/${slug}/`} className="text-emerald-600 hover:underline" target="_blank" rel="noopener">Cost of Living in {c.short_name}</a>
        </div>
      </section>

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

      {/* 2026-04-28 — 'Compare {city} With' 위젯 두 섹션 제거 (AdSense scaled-content remediation, /compare/* noindex).
          state-only + all-cities. RelatedEntities가 비슷한 도시 탐색 경로 유지함. */}

      <RelatedEntities
        entityName={c.short_name}
        heading={`Other ${c.state} cities`}
        statLabel="Cost index"
        items={stateCities.slice(0, 8).map(sc => ({
          name: sc.short_name,
          href: `/city/${sc.slug}/`,
          stat: sc.cost_index ? `Index ${fmtIdx(sc.cost_index)}` : undefined,
        }))}
      />

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

      {/* Why this matters — US relocation context */}
      <section className="mb-8 mt-6" data-upgrade="why-it-matters">
        <h2 className="text-xl font-bold mb-3">
          Why a {c.short_name} city guide matters
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 leading-relaxed space-y-3">
          <p>
            Most relocation decisions in the US come down to a small
            number of trade-offs: cost of living, housing market,
            schools, safety, climate, and commute. {c.short_name}&apos;s
            cost of living index of {fmtIdx(c.cost_index)} versus a
            US average of 100 means the typical basket of goods and
            services costs {pctDiff(c.cost_index)} here. On a $80,000
            household budget, even a 10% gap is $8,000 a year.
          </p>
          <p>
            The honest workflow for evaluating any city is layering
            data sources: <strong>Census ACS</strong> for demographics
            and income, <strong>BEA Regional Price Parities</strong>
            for cost of living, <strong>FBI UCR</strong> for crime,
            <strong>NCES CCD</strong> for schools, and{" "}
            <strong>NOAA</strong> for climate. {c.short_name} sits in
            specific positions on each of these &mdash; this guide
            covers the cost-of-living and demographics layer; we link
            out to the rest below.
          </p>
          <p>
            Climate matters more than people predict. Heating and
            cooling costs are part of the cost-of-living picture, but
            psychological adjustment to fewer (or more) sunny days,
            humidity, and snow is a real factor that doesn&apos;t show
            up in any index. If possible, visit during the worst
            season the city has &mdash; not the best.
          </p>
          <p className="text-sm text-slate-500">
            Sources: US Census Bureau ACS, BEA Regional Price Parities,
            BLS Consumer Price Index, NOAA climate data, MIT Living
            Wage Calculator. Refreshed quarterly.
          </p>
        </div>
      </section>

      <DecisionNext
        cards={[
          {
            title: `Salaries in ${c.short_name}`,
            blurb: `BLS wage data by occupation for this metro &mdash; the income side of the equation.`,
            href: `https://salarybycity.com`,
            cta: `Open SalaryByCity`,
            tone: "indigo" as const,
          },
          {
            title: `Safety in ${c.short_name}`,
            blurb: `FBI UCR crime rates and safety scores for cities in this area.`,
            href: `https://safecitypeek.com`,
            cta: `Open SafeCityPeek`,
            tone: "emerald" as const,
          },
          {
            title: `Schools in ${c.state}`,
            blurb: `NCES K-12 school data, district ratings, and enrollment figures.`,
            href: `https://myschoolpeek.com`,
            cta: `Open MySchoolPeek`,
            tone: "amber" as const,
          },
        ]}
      />

      <CrosswalkBridge stateCode={c.state} />

      <AuthorBox vintage={CITY_VINTAGE} />

          <EmbedButton url="https://guidebycity.com" title="Data from GuideByCity" site="GuideByCity" siteUrl="https://guidebycity.com" />

          <DataFeedback />

          <section className="mt-8 p-6 bg-sky-50 rounded-xl border border-sky-100">
        <h3 className="text-lg font-semibold text-sky-900 mb-3">Planning to Relocate?</h3>
        <p className="text-sky-800 text-sm leading-relaxed">
          Compare auto insurance rates, find affordable renters insurance, and get moving quotes for your relocation.
          Check <a href={`https://salarybycity.com`} className="underline font-medium">local salaries</a> and <a href={`https://costbycity.com`} className="underline font-medium">cost of living</a> to budget your move.
        </p>
      </section>

      <DataSourceBadge sources={[
        { name: "Census Bureau", url: "https://www.census.gov" },
        { name: "BLS", url: "https://www.bls.gov" },
      ]} />

      <CrossSiteLinks current="GuideByCity" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Place",
        name: `${c.short_name}, ${c.state}`,
        url: `https://guidebycity.com/city/${slug}/`,
        description: topAnswer,
        address: { "@type": "PostalAddress", addressLocality: c.short_name, addressRegion: c.state, addressCountry: "US" },
        dateModified: CITY_VINTAGE,
        author: { "@type": "Organization", name: PUBLISHER.name, url: PUBLISHER.url },
        publisher: { "@type": "Organization", name: PUBLISHER.name, url: PUBLISHER.url },
        reviewedBy: SOURCE_AUTHORITIES,
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...breadcrumbSchema(breadcrumbs), author: { "@type": "Organization", name: PUBLISHER.name } }) }} />
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...faqSchema(faqs), author: { "@type": "Organization", name: PUBLISHER.name } }) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema(
        `${c.short_name} — Cost-of-Living, Affordability, Growth & Hazard-Risk Profile`,
        `City-level dataset for ${c.short_name}: BEA Regional Price Parities cost-of-living index, Census ACS B25077 median home value, Census ACS B19013 median household income, Census ACS B25064 median rent, FEMA NRI v2024 primary-county hazard rating, plus three GuideByCity editorial classifiers — CityAffordabilityTier (5-band rollup of Census ACS B25077 ÷ Census ACS B19013), PopulationGrowthBand (5-band rollup of Census Decennial 2010 → Census ACS 2024 annualized rate), and HazardTier (5-band rollup of FEMA NRI v2024).`,
        `/city/${slug}/`,
      )) }} />
    </article>
  );
}
