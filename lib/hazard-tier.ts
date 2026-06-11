/**
 * HazardTier — guidebycity 5-band classifier derived from FEMA NRI.
 *
 * The FEMA National Risk Index publishes a single overall `risk_ratng` per
 * county (Very Low → Very High) and a per-hazard `ratng` for each of 18
 * hazard types. The overall ratng is a population-weighted composite, so
 * a county with one extreme hazard but average exposure on the rest can
 * be flagged "Relatively Moderate" overall — which masks the relocation
 * decision (e.g. Taylor County, TX is overall Moderate but Very High hail).
 *
 * HazardTier reconciles those two signals into one 5-band classifier:
 *
 *   Extreme  — NRI overall = Very High OR ≥2 of top-3 hazards rated Very High
 *   High     — NRI overall = Relatively High OR exactly 1 hazard rated Very High
 *   Elevated — NRI overall = Relatively Moderate AND ≥1 hazard rated Relatively High
 *   Moderate — NRI overall = Relatively Moderate (no Relatively High hazard)
 *   Low      — NRI overall = Relatively Low or Very Low
 *
 * dominantHazard = `topHazards[0].name` (highest-score hazard in the FEMA
 * top-3 set), or 'none' when the county has no top-3 hazards at moderate-
 * or-above.
 *
 * annualEvents reflects the FEMA NRI annualized frequency aggregated across
 * the county's top hazards. This is FEMA's hazard-model frequency, NOT raw
 * NOAA Storm Events DB counts. Methodology surfaces that distinction.
 *
 * Confidence drops to 'low' when the NRI overall rating is null (data gap).
 *
 * NOT a FEMA official tier — it is our derivation. Methodology page states
 * the cutoffs verbatim so reviewers can audit them.
 */

import type { CityRisk, HazardInfo } from './risk-facts';
import { getRiskByCbsa } from './risk-facts';
import type { City } from './db';

export type HazardTier = 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Extreme';

export type DominantHazard =
  | 'tornado'
  | 'hurricane'
  | 'wildfire'
  | 'earthquake'
  | 'riverine-flood'
  | 'coastal-flood'
  | 'hail'
  | 'winter-weather'
  | 'lightning'
  | 'ice-storm'
  | 'heat-wave'
  | 'drought'
  | 'mixed'
  | 'none';

export interface HazardTierResult {
  tier: HazardTier;
  dominantHazard: DominantHazard;
  veryHighHazardCount: number;
  annualEvents: number | null;
  evidence: string;
  confidence: 'high' | 'med' | 'low';
}

const TIER_BLURB: Record<HazardTier, string> = {
  Low: 'low natural-hazard exposure across the FEMA NRI hazard set',
  Moderate: 'moderate composite hazard exposure with no single hazard at top intensity',
  Elevated: 'moderate composite exposure with at least one hazard escalating toward high intensity',
  High: 'high composite exposure or a single hazard at maximum FEMA intensity',
  Extreme: 'maximum FEMA NRI intensity — multiple hazards or overall county rating at Very High',
};

export function classifyHazardTier(risk: CityRisk | null): HazardTierResult {
  if (!risk || !risk.riskRating) {
    return {
      tier: 'Moderate',
      dominantHazard: 'none',
      veryHighHazardCount: 0,
      annualEvents: null,
      evidence: 'No FEMA NRI primary-county match for this metro — tier suppressed.',
      confidence: 'low',
    };
  }

  const top: HazardInfo[] = risk.topHazards ?? [];
  const veryHigh = top.filter(h => h.ratng === 'Very High').length;
  const relativelyHigh = top.filter(h => h.ratng === 'Relatively High').length;

  let tier: HazardTier;
  if (risk.riskRating === 'Very High' || veryHigh >= 2) tier = 'Extreme';
  else if (risk.riskRating === 'Relatively High' || veryHigh === 1) tier = 'High';
  else if (risk.riskRating === 'Relatively Moderate' && relativelyHigh >= 1) tier = 'Elevated';
  else if (risk.riskRating === 'Relatively Moderate') tier = 'Moderate';
  else tier = 'Low';

  const dominantRaw = top.length > 0 ? (top[0].name as DominantHazard) : 'none';
  const dominant: DominantHazard =
    tier === 'Extreme' && veryHigh >= 2 && top.length >= 2
      ? 'mixed'
      : dominantRaw;

  const annualEvents = top.reduce(
    (s, h) => (h.afreq != null ? s + h.afreq : s),
    0,
  );
  const annualEventsRounded = top.length > 0 ? Math.round(annualEvents * 100) / 100 : null;

  const countyTag = risk.countyName ? `${risk.countyName} ` : '';
  const ratngTag = risk.riskRating ?? 'unrated';
  const topTag = top.length > 0
    ? top.map(h => `${h.name} (${h.ratng})`).join(', ')
    : 'no top-3 hazards at Moderate+';
  const evidence = `FEMA NRI v2024 primary-county = ${countyTag}rated "${ratngTag}" overall; top hazards: ${topTag}.`;

  return {
    tier,
    dominantHazard: dominant,
    veryHighHazardCount: veryHigh,
    annualEvents: annualEventsRounded,
    evidence,
    confidence: top.length === 0 ? 'med' : 'high',
  };
}

export function hazardTierBlurb(tier: HazardTier): string {
  return TIER_BLURB[tier];
}

const DOMINANT_LABEL: Record<DominantHazard, string> = {
  'tornado': 'tornadoes',
  'hurricane': 'hurricanes',
  'wildfire': 'wildfire',
  'earthquake': 'earthquakes',
  'riverine-flood': 'riverine flooding',
  'coastal-flood': 'coastal flooding',
  'hail': 'hailstorms',
  'winter-weather': 'severe winter weather',
  'lightning': 'lightning-driven storms',
  'ice-storm': 'ice storms',
  'heat-wave': 'heat waves',
  'drought': 'drought',
  'mixed': 'multiple top-tier hazards',
  'none': 'no dominant single hazard',
};

export function dominantHazardLabel(d: DominantHazard): string {
  return DOMINANT_LABEL[d];
}

export interface StateHazardTierRollup {
  state: string;
  cities: number;          // cities with a FEMA NRI primary-county match
  distribution: Record<HazardTier, number>;
  modalTier: HazardTier;
  dominantHazardOverState: DominantHazard;
  veryHighHazardCities: number;       // metros with ≥1 "Very High" hazard
}

export function rollupStateHazardTier(state: string, cities: City[]): StateHazardTierRollup {
  const distribution: Record<HazardTier, number> = {
    Low: 0, Moderate: 0, Elevated: 0, High: 0, Extreme: 0,
  };
  const dominantCounts: Record<string, number> = {};
  let withRisk = 0;
  let veryHighHazardCities = 0;

  for (const c of cities) {
    const risk = getRiskByCbsa(c.fips);
    const tier = classifyHazardTier(risk);
    if (tier.confidence === 'low') continue;
    withRisk++;
    distribution[tier.tier]++;
    if (tier.veryHighHazardCount > 0) veryHighHazardCities++;
    if (tier.dominantHazard !== 'none' && tier.dominantHazard !== 'mixed') {
      dominantCounts[tier.dominantHazard] = (dominantCounts[tier.dominantHazard] ?? 0) + 1;
    }
  }

  const tierOrder: HazardTier[] = ['Extreme', 'High', 'Elevated', 'Moderate', 'Low'];
  let modalTier: HazardTier = 'Moderate';
  let maxCount = -1;
  for (const t of tierOrder) {
    if (distribution[t] > maxCount) { maxCount = distribution[t]; modalTier = t; }
  }

  const dominantSorted = Object.entries(dominantCounts).sort((a, b) => b[1] - a[1]);
  const dominantHazardOverState: DominantHazard =
    dominantSorted.length === 0 ? 'none' : (dominantSorted[0][0] as DominantHazard);

  return {
    state,
    cities: withRisk,
    distribution,
    modalTier,
    dominantHazardOverState,
    veryHighHazardCities,
  };
}

export const HAZARD_TIER_THRESHOLDS = [
  { tier: 'Extreme' as const, rule: 'FEMA NRI overall = "Very High" OR ≥2 of the metro\'s top-3 hazards rated "Very High"' },
  { tier: 'High' as const, rule: 'FEMA NRI overall = "Relatively High" OR exactly 1 of the top-3 hazards rated "Very High"' },
  { tier: 'Elevated' as const, rule: 'FEMA NRI overall = "Relatively Moderate" AND ≥1 of the top-3 hazards rated "Relatively High"' },
  { tier: 'Moderate' as const, rule: 'FEMA NRI overall = "Relatively Moderate" with no hazard at "Relatively High" or above' },
  { tier: 'Low' as const, rule: 'FEMA NRI overall = "Relatively Low" or "Very Low"' },
];
