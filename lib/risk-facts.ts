/**
 * risk-facts.ts — guidebycity HCU 5-chunk patch (2026-04-29).
 *
 * Layer 1: FEMA National Risk Index (NRI) county-level data adapted for CBSA
 * primary-county exposure. 387 metros × 18 hazards × 5 status bands.
 *
 * Source: FEMA NRI v2024 mirror at services.arcgis.com (county polygon set,
 * geometry stripped). Each hazard provides:
 *   • RISKR (categorical: Very Low → Very High)
 *   • RISKS (numerical 0–100)
 *   • AFREQ (annualized frequency, events/year)
 *
 * UNIQUE-DATA RATIONALE:
 *   costbycity has 99% schema overlap with us. NRI is the lever that makes
 *   /city/[slug]/ on guidebycity meaningfully different from costbycity —
 *   relocation-decision data costbycity does not surface.
 *
 * NRI rating ladder:
 *   "Very High"           → very-high   (top ~10% nationwide)
 *   "Relatively High"     → high
 *   "Relatively Moderate" → moderate
 *   "Relatively Low"      → low
 *   "Very Low"            → very-low
 *
 * Each metro's 4-slot Risk Profile (headline / fact / context / implication)
 * has 3 variants per status × per slot, picked by slug-hash with rotating
 * salt so adjacent slots don't collide.
 */

import { pickVariant } from './content-helpers';
import type { City } from './db';
import { getDb } from './db';

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

export type RiskStatus = 'very-high' | 'high' | 'moderate' | 'low' | 'very-low' | 'unknown';

export interface HazardInfo {
  name: string;       // human-readable: "tornado", "wildfire"
  code: string;       // 4-letter NRI code: "TRND", "WFIR"
  ratng: string;      // categorical label
  score: number;      // 0–100 numeric
  afreq: number | null; // events/year (when applicable)
}

export interface CityRisk {
  cbsaFips: string;
  countyName: string | null;
  riskScore: number | null;       // 0–100
  riskRating: string | null;       // categorical
  riskPercentile: number | null;   // 0–100 (national)
  ealRating: string | null;        // expected annual loss
  soviRating: string | null;       // social vulnerability
  reslRating: string | null;       // community resilience
  topHazards: HazardInfo[];        // top-3 by score, only if score >= moderate
  status: RiskStatus;
}

// ──────────────────────────────────────────────────────────────────
// Hazard label translation
// ──────────────────────────────────────────────────────────────────

const HAZARD_LABEL: Record<string, string> = {
  'avalanche': 'avalanche',
  'coastal-flood': 'coastal flooding',
  'cold-wave': 'cold waves',
  'drought': 'drought',
  'earthquake': 'earthquakes',
  'hail': 'hail',
  'heat-wave': 'heat waves',
  'hurricane': 'hurricanes',
  'ice-storm': 'ice storms',
  'landslide': 'landslides',
  'lightning': 'lightning',
  'riverine-flood': 'riverine flooding',
  'strong-wind': 'strong wind',
  'tornado': 'tornadoes',
  'tsunami': 'tsunami',
  'volcano': 'volcanic activity',
  'wildfire': 'wildfire',
  'winter-weather': 'winter weather',
};

const HAZARD_TITLE: Record<string, string> = {
  'avalanche': 'Avalanche',
  'coastal-flood': 'Coastal Flood',
  'cold-wave': 'Cold Wave',
  'drought': 'Drought',
  'earthquake': 'Earthquake',
  'hail': 'Hail',
  'heat-wave': 'Heat Wave',
  'hurricane': 'Hurricane',
  'ice-storm': 'Ice Storm',
  'landslide': 'Landslide',
  'lightning': 'Lightning',
  'riverine-flood': 'Riverine Flood',
  'strong-wind': 'Strong Wind',
  'tornado': 'Tornado',
  'tsunami': 'Tsunami',
  'volcano': 'Volcano',
  'wildfire': 'Wildfire',
  'winter-weather': 'Winter Weather',
};

export function hazardLabel(name: string): string { return HAZARD_LABEL[name] ?? name; }
export function hazardTitle(name: string): string { return HAZARD_TITLE[name] ?? name; }

// ──────────────────────────────────────────────────────────────────
// Status classifier
// ──────────────────────────────────────────────────────────────────

function classifyStatus(rating: string | null): RiskStatus {
  if (!rating) return 'unknown';
  switch (rating) {
    case 'Very High': return 'very-high';
    case 'Relatively High': return 'high';
    case 'Relatively Moderate': return 'moderate';
    case 'Relatively Low': return 'low';
    case 'Very Low': return 'very-low';
    default: return 'unknown';
  }
}

// ──────────────────────────────────────────────────────────────────
// DB helpers
// ──────────────────────────────────────────────────────────────────

interface RiskRow {
  cbsa_fips: string;
  primary_county_fips: string | null;
  primary_county_name: string | null;
  risk_score: number | null;
  risk_ratng: string | null;
  risk_spctl: number | null;
  eal_ratng: string | null;
  sovi_ratng: string | null;
  resl_ratng: string | null;
  hazards_json: string | null;
  top_hazards_json: string | null;
}

export function getRiskByCbsa(cbsaFips: string): CityRisk | null {
  const row = getDb().prepare('SELECT * FROM cbsa_risk WHERE cbsa_fips = ?').get(cbsaFips) as RiskRow | undefined;
  if (!row) return null;
  let topHazards: HazardInfo[] = [];
  try {
    const arr = row.top_hazards_json ? JSON.parse(row.top_hazards_json) : [];
    topHazards = arr.map((h: { name: string; ratng: string; score: number; afreq: number | null; code: string }) => ({
      name: h.name, code: h.code, ratng: h.ratng, score: h.score, afreq: h.afreq,
    }));
  } catch { /* ignore parse error */ }
  return {
    cbsaFips: row.cbsa_fips,
    countyName: row.primary_county_name,
    riskScore: row.risk_score,
    riskRating: row.risk_ratng,
    riskPercentile: row.risk_spctl != null ? Math.round(row.risk_spctl * 10) / 10 : null,
    ealRating: row.eal_ratng,
    soviRating: row.sovi_ratng,
    reslRating: row.resl_ratng,
    topHazards,
    status: classifyStatus(row.risk_ratng),
  };
}

export function getCitiesByRiskStatus(status: RiskStatus, limit = 20): { city: City; risk: CityRisk }[] {
  const ratingMap: Record<RiskStatus, string> = {
    'very-high': 'Very High', 'high': 'Relatively High', 'moderate': 'Relatively Moderate',
    'low': 'Relatively Low', 'very-low': 'Very Low', 'unknown': '',
  };
  const target = ratingMap[status];
  if (!target) return [];
  const rows = getDb().prepare(`
    SELECT c.*, r.risk_score, r.risk_ratng, r.primary_county_name
    FROM cities c JOIN cbsa_risk r ON c.fips = r.cbsa_fips
    WHERE r.risk_ratng = ?
    ORDER BY r.risk_score DESC
    LIMIT ?
  `).all(target, limit) as (City & { risk_score: number; risk_ratng: string; primary_county_name: string })[];
  return rows.map(r => ({
    city: r as City,
    risk: {
      cbsaFips: r.fips, countyName: r.primary_county_name,
      riskScore: r.risk_score, riskRating: r.risk_ratng,
      riskPercentile: null, ealRating: null, soviRating: null, reslRating: null,
      topHazards: [], status,
    },
  }));
}

export function getHighestRiskCities(limit = 25): { city: City; risk: CityRisk }[] {
  const rows = getDb().prepare(`
    SELECT c.*, r.risk_score, r.risk_ratng, r.primary_county_name
    FROM cities c JOIN cbsa_risk r ON c.fips = r.cbsa_fips
    WHERE r.risk_score IS NOT NULL
    ORDER BY r.risk_score DESC
    LIMIT ?
  `).all(limit) as (City & { risk_score: number; risk_ratng: string; primary_county_name: string })[];
  return rows.map(r => ({
    city: r as City,
    risk: {
      cbsaFips: r.fips, countyName: r.primary_county_name,
      riskScore: r.risk_score, riskRating: r.risk_ratng,
      riskPercentile: null, ealRating: null, soviRating: null, reslRating: null,
      topHazards: [], status: classifyStatus(r.risk_ratng),
    },
  }));
}

export function getSafestCities(limit = 25): { city: City; risk: CityRisk }[] {
  const rows = getDb().prepare(`
    SELECT c.*, r.risk_score, r.risk_ratng, r.primary_county_name
    FROM cities c JOIN cbsa_risk r ON c.fips = r.cbsa_fips
    WHERE r.risk_score IS NOT NULL
    ORDER BY r.risk_score ASC
    LIMIT ?
  `).all(limit) as (City & { risk_score: number; risk_ratng: string; primary_county_name: string })[];
  return rows.map(r => ({
    city: r as City,
    risk: {
      cbsaFips: r.fips, countyName: r.primary_county_name,
      riskScore: r.risk_score, riskRating: r.risk_ratng,
      riskPercentile: null, ealRating: null, soviRating: null, reslRating: null,
      topHazards: [], status: classifyStatus(r.risk_ratng),
    },
  }));
}

export interface StateRiskAggregate {
  state: string;
  cityCount: number;
  withRisk: number;
  avgRiskScore: number | null;
  veryHigh: number;
  high: number;
  moderate: number;
  low: number;
  veryLow: number;
  topHazards: { name: string; mentions: number; topScore: number }[]; // hazards most often top-3 across state
}

export function getStateRiskAggregate(stateAbbrev: string): StateRiskAggregate {
  const state = stateAbbrev.toUpperCase();
  const rows = getDb().prepare(`
    SELECT c.fips, r.risk_score, r.risk_ratng, r.top_hazards_json, r.hazards_json
    FROM cities c JOIN cbsa_risk r ON c.fips = r.cbsa_fips
    WHERE c.state = ?
  `).all(state) as { fips: string; risk_score: number | null; risk_ratng: string | null; top_hazards_json: string | null; hazards_json: string | null }[];

  const cityCount = rows.length;
  const withScore = rows.filter(r => r.risk_score != null);
  const avgRiskScore = withScore.length ? Math.round((withScore.reduce((a, b) => a + (b.risk_score ?? 0), 0) / withScore.length) * 10) / 10 : null;

  let veryHigh = 0, high = 0, moderate = 0, low = 0, veryLow = 0;
  for (const r of rows) {
    const s = classifyStatus(r.risk_ratng);
    if (s === 'very-high') veryHigh++;
    else if (s === 'high') high++;
    else if (s === 'moderate') moderate++;
    else if (s === 'low') low++;
    else if (s === 'very-low') veryLow++;
  }

  // Aggregate top hazards across state
  const hazardScores: Record<string, { mentions: number; maxScore: number }> = {};
  for (const r of rows) {
    if (!r.top_hazards_json) continue;
    try {
      const top = JSON.parse(r.top_hazards_json) as { name: string; score: number }[];
      for (const h of top.slice(0, 3)) {
        if (!hazardScores[h.name]) hazardScores[h.name] = { mentions: 0, maxScore: 0 };
        hazardScores[h.name].mentions++;
        if (h.score > hazardScores[h.name].maxScore) hazardScores[h.name].maxScore = h.score;
      }
    } catch { /* ignore */ }
  }
  const topHazards = Object.entries(hazardScores)
    .map(([name, v]) => ({ name, mentions: v.mentions, topScore: Math.round(v.maxScore * 10) / 10 }))
    .sort((a, b) => b.mentions - a.mentions || b.topScore - a.topScore)
    .slice(0, 5);

  return {
    state, cityCount, withRisk: withScore.length, avgRiskScore,
    veryHigh, high, moderate, low, veryLow, topHazards,
  };
}

export function getCitiesByHazard(hazardName: string, limit = 30): { city: City; ratng: string; score: number; afreq: number | null }[] {
  // hazard rows are stored as full JSON in hazards_json — extract via JSON1 extension
  const rows = getDb().prepare(`
    SELECT c.*, r.hazards_json FROM cities c JOIN cbsa_risk r ON c.fips = r.cbsa_fips
    WHERE r.hazards_json IS NOT NULL
  `).all() as (City & { hazards_json: string })[];
  const out: { city: City; ratng: string; score: number; afreq: number | null }[] = [];
  for (const r of rows) {
    try {
      const haz = JSON.parse(r.hazards_json);
      const h = haz[hazardName];
      if (!h || h.score == null) continue;
      out.push({ city: r as City, ratng: h.ratng ?? 'Unknown', score: h.score, afreq: h.afreq });
    } catch { /* ignore */ }
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

// ──────────────────────────────────────────────────────────────────
// Status priors — # of CBSAs in each status (rough nationwide context)
// ──────────────────────────────────────────────────────────────────
// (computed once at module load via simple count)
let _statusCounts: Record<RiskStatus, number> | null = null;
export function getStatusCounts(): Record<RiskStatus, number> {
  if (_statusCounts) return _statusCounts;
  const rows = getDb().prepare('SELECT risk_ratng, COUNT(*) as c FROM cbsa_risk GROUP BY risk_ratng').all() as { risk_ratng: string; c: number }[];
  const map: Record<RiskStatus, number> = { 'very-high': 0, 'high': 0, 'moderate': 0, 'low': 0, 'very-low': 0, 'unknown': 0 };
  for (const r of rows) map[classifyStatus(r.risk_ratng)] += r.c;
  _statusCounts = map;
  return map;
}

// ──────────────────────────────────────────────────────────────────
// Commentary builder — 4 slots × 5 statuses × 3 variants
// ──────────────────────────────────────────────────────────────────

export interface RiskCommentary {
  headline: string;     // eyebrow / status label
  fact: string;         // data sentence
  context: string;      // national positioning
  implication: string;  // relocator-facing takeaway
}

const HEADLINES: Record<RiskStatus, readonly string[]> = {
  'very-high': [
    'High-Exposure Metro',
    'Top-Tier National Risk Profile',
    'Above the Risk Curve',
  ],
  'high': [
    'Above-Average Hazard Footprint',
    'Notable Risk Exposure',
    'Elevated Disaster Profile',
  ],
  'moderate': [
    'Mid-Range Hazard Profile',
    'Average Risk Exposure',
    'Typical Disaster Footprint',
  ],
  'low': [
    'Below-Average Hazard Profile',
    'Lower-Risk Metro',
    'Quieter Disaster Pattern',
  ],
  'very-low': [
    'Bottom-Decile Risk',
    'Geographically Insulated',
    'Among the Safest Metros',
  ],
  'unknown': ['Risk Data Pending'],
};

function pctileText(p: number | null): string {
  if (p == null) return '';
  if (p >= 90) return 'top 10% nationally';
  if (p >= 75) return 'top 25%';
  if (p >= 50) return 'upper half';
  if (p >= 25) return 'lower half';
  return 'bottom 25%';
}

function topHazardPhrase(top: HazardInfo[], includeRating: boolean): string {
  if (!top.length) return 'no single hazard dominates';
  if (top.length === 1) {
    const h = top[0];
    return includeRating ? `${hazardLabel(h.name)} (${h.ratng.toLowerCase()})` : hazardLabel(h.name);
  }
  const list = top.slice(0, 3).map(h => hazardLabel(h.name));
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list[0]}, ${list[1]}, and ${list[2]}`;
}

export function buildRiskCommentary(slug: string, risk: CityRisk, cityName: string): RiskCommentary {
  const status = risk.status;
  const headline = pickVariant(slug, HEADLINES[status], 0);
  const pct = risk.riskPercentile ?? null;
  const score = risk.riskScore != null ? Math.round(risk.riskScore * 10) / 10 : null;
  const top = risk.topHazards;
  const topPhrase = topHazardPhrase(top, false);
  const topPhraseR = topHazardPhrase(top, true);
  const county = risk.countyName ?? `the primary county`;

  // FACT — data sentence
  const factSets: Record<RiskStatus, readonly string[]> = {
    'very-high': [
      `${cityName} sits in the ${pctileText(pct)} of the FEMA National Risk Index, with a composite risk score of ${score} (rating: Very High). Primary drivers: ${topPhraseR}.`,
      `FEMA's National Risk Index places ${cityName} (${county}) at ${score}/100 — Very High overall. The dominant hazards are ${topPhrase}.`,
      `On the FEMA NRI scale where 100 is the riskiest county nationwide, ${cityName} scores ${score} — a Very High rating shaped mainly by ${topPhrase}.`,
    ],
    'high': [
      `${cityName} earns a "Relatively High" composite score of ${score} on the FEMA National Risk Index — above the median of all 3,200+ US counties. ${top.length ? `Standout hazards: ${topPhrase}.` : ''}`,
      `FEMA NRI rates ${cityName} (${county}) at ${score}/100 — Relatively High. ${top.length ? `${topPhraseR.charAt(0).toUpperCase() + topPhraseR.slice(1)} drive most of that exposure.` : ''}`,
      `${cityName}'s composite hazard score of ${score} places it in FEMA's Relatively High band — the second-highest of five rating tiers. ${top.length ? `Risk concentrates in ${topPhrase}.` : ''}`,
    ],
    'moderate': [
      `${cityName} carries a Relatively Moderate FEMA NRI rating with a composite score of ${score} — close to the national county median. ${top.length ? `${topPhraseR.charAt(0).toUpperCase() + topPhraseR.slice(1)} are the most prominent local hazards.` : ''}`,
      `On FEMA's National Risk Index, ${cityName} (${county}) lands in the middle band: composite score ${score}, rating Relatively Moderate. ${top.length ? `Local profile is shaped by ${topPhrase}.` : ''}`,
      `FEMA NRI gives ${cityName} a Relatively Moderate rating (composite ${score}/100) — neither notably exposed nor unusually safe. ${top.length ? `${topPhraseR} stand out within that average profile.` : ''}`,
    ],
    'low': [
      `${cityName} earns a Relatively Low FEMA NRI rating with a composite score of ${score}. Only a handful of named hazards reach moderate exposure here.`,
      `FEMA NRI places ${cityName} (${county}) in the Relatively Low band — composite score ${score}/100, below the national county median.`,
      `${cityName} sits below the national average on FEMA's composite National Risk Index (score ${score}, rating Relatively Low) — broad-front hazard exposure is limited.`,
    ],
    'very-low': [
      `${cityName} scores ${score} on the FEMA National Risk Index — a Very Low rating, placing it among the calmest counties in the country for natural-hazard exposure.`,
      `FEMA NRI rates ${cityName} (${county}) Very Low, with a composite score of just ${score}/100 — bottom-decile nationwide.`,
      `On FEMA's National Risk Index, ${cityName} earns the lowest of five ratings (Very Low; composite ${score}). Few named hazards register meaningful exposure.`,
    ],
    'unknown': [
      `FEMA National Risk Index data for ${cityName} is incomplete or pending.`,
    ],
  };
  const fact = pickVariant(slug, factSets[status], 1);

  // CONTEXT — national positioning
  const contextSets: Record<RiskStatus, readonly string[]> = {
    'very-high': [
      `Roughly the top ~10% of US counties carry FEMA's "Very High" composite rating. They tend to cluster in densely populated coastal and Western metros where exposure (population × infrastructure) compounds underlying hazard frequency.`,
      `The "Very High" tier is FEMA's top rung — only a sliver of the 3,200+ counties land here, and they share two features: large at-risk populations and at least one hazard with annualized losses well above national averages.`,
      `"Very High" is the riskiest of FEMA's five composite ratings. The label folds in expected annual loss, hazard frequency, and population at risk — so it skews toward big-metro counties as much as toward intrinsically dangerous geographies.`,
    ],
    'high': [
      `"Relatively High" sits one notch below the top tier. Most of these counties have one or two prominent hazards (often hurricane, hail, or wildfire on the regional pattern), with exposure amplified by population.`,
      `FEMA places counties in the Relatively High band when at least one named hazard pushes annualized loss above the national county average — usually with a sizeable resident or asset base behind it.`,
      `The Relatively High band typically captures growing metros where one or two regional hazards (e.g. tornado in the Plains, hurricane on the Gulf, wildfire in the Mountain West) drive most of the composite score.`,
    ],
    'moderate': [
      `The Relatively Moderate band is the largest of FEMA's five tiers — it covers most of the central US plus inland metros that catch one or two regional hazards but lack catastrophic exposure on any single front.`,
      `Counties in the Relatively Moderate tier tend to have well-distributed but bounded hazard exposure. No single named threat dominates, and total annualized loss is close to the national county median.`,
      `FEMA's "Relatively Moderate" rating is the index's centroid — slightly more counties land here than any other band. It signals a typical mix of weather risk without a defining catastrophic hazard.`,
    ],
    'low': [
      `Counties in the Relatively Low band are below the national median for composite risk. They typically lack a defining hazard — coastal flood, major earthquake, or wildfire-prone wildland-urban interface — and have modest population at risk.`,
      `FEMA's Relatively Low tier captures inland counties with stable weather patterns, limited seismic activity, and small populations exposed to extreme events. Insurance pricing tends to follow.`,
      `The Relatively Low rating means the county pulls in below the national county average on most of FEMA's 18 hazard tracks. Often these are smaller inland metros buffered from the country's main weather highways.`,
    ],
    'very-low': [
      `"Very Low" is FEMA's calmest tier — fewer than 10% of US counties earn it. Most are inland, modestly populated, and outside major hurricane / tornado / wildfire / seismic corridors.`,
      `Counties in the Very Low band tend to share three traits: limited coastline exposure, no high-severity earthquake history, and low wildfire-prone wildland-urban interface. Insurance markets often reflect that calm.`,
      `The Very Low rating is the bottom rung of FEMA's NRI. These counties typically have smaller populations, fewer high-value assets in flood zones, and no single hazard with above-average annualized loss.`,
    ],
    'unknown': [`The FEMA NRI covers all 3,000+ US counties; missing data here is rare and usually indicates a recent boundary change or data quality flag.`],
  };
  const context = pickVariant(slug, contextSets[status], 2);

  // IMPLICATION — what this means for relocators
  const implicationSets: Record<RiskStatus, readonly string[]> = {
    'very-high': [
      `For relocators: budget for elevated home insurance and check whether mortgage lenders require named-peril riders (wind / flood / earthquake). Knowing the dominant hazard ahead of time shapes which neighborhoods, building ages, and insurance carriers actually work in this market.`,
      `Implication: a Very High composite score does not mean "don't move here" — it means insurance, building codes, and emergency preparedness deserve real attention. Pull the local hazard mitigation plan before you sign anything long-term.`,
      `If you're moving in: factor disaster preparedness into housing choice. Newer construction, defensible space (wildfire), elevated foundations (flood), and current wind-zone codes (hurricane) materially change actual exposure even within a Very High county.`,
    ],
    'high': [
      `For relocators: insurance rates here typically run above the national average. Get quotes on multiple properties before committing — within the same metro, exposure can vary sharply between flood zones, fire-buffer perimeters, and inland sub-areas.`,
      `Implication: identify the dominant hazard before house-hunting. A Relatively High composite usually traces to one or two prominent threats — once you know which, you can screen neighborhoods (and policy bundles) accordingly.`,
      `Relatively High exposure is manageable but worth pricing. Newer home construction, elevation, and wind-rated roofing meaningfully reduce both insurance cost and real-life downtime.`,
    ],
    'moderate': [
      `For relocators: hazard exposure shouldn't drive your decision here, but it's worth knowing the regional pattern. Insurance rates tend to track national averages with one or two hazard-specific riders priced in.`,
      `Implication: no single named threat dominates. Standard homeowner policies cover most exposure; you mainly want to confirm flood-zone status and (in some states) earthquake or wind-storm endorsements.`,
      `A Relatively Moderate rating means hazard cost should be a checklist item, not a deal-breaker. Normal due diligence (elevation certificate, roof age, electrical service updates) usually closes the gap.`,
    ],
    'low': [
      `For relocators: insurance markets here are relatively soft — homeowner policies are typically priced near or below national medians. Standard coverage handles most realistic exposure.`,
      `Implication: a Relatively Low rating gives you headroom in the housing budget. Money you'd spend on hardening or named-peril riders elsewhere stays available for renovations, savings, or a larger down payment.`,
      `Low composite exposure is a quiet competitive advantage. Combined with modest insurance premiums, it lifts effective housing affordability versus high-risk metros at the same nominal price point.`,
    ],
    'very-low': [
      `For relocators: this is one of the calmest hazard environments in the country. Insurance is typically among the cheapest you'll find, and most major federal disaster declarations bypass the area entirely.`,
      `Implication: a Very Low rating compounds with affordability — both insurance premiums and disaster-related housing-stock damage stay quietly out of view. That advantage shows up in 30-year carrying costs more than in headline list prices.`,
      `Very Low exposure means routine homeowner coverage usually suffices, with no hazard-specific endorsements needed. Reinvest the savings into flexibility (cash reserve, mortgage prepayment) rather than premium hardening you don't need.`,
    ],
    'unknown': [
      `Check the FEMA NRI county profile directly for the latest figures. National risk data is typically updated annually.`,
    ],
  };
  const implication = pickVariant(slug, implicationSets[status], 3);

  return { headline, fact, context, implication };
}
