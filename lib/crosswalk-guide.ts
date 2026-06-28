/**
 * Phase 7 §3.3 cross-walk decoder for guidebycity — city-level retrofit.
 *
 * Wraps the existing 3-lever PSU (AffordabilityTier × PopulationGrowthBand ×
 * HazardTier, already composed via interpretCity) into a single city-level
 * CrosswalkResult so /city/[slug]/ emits a typed verdict that varies across
 * the 387 metro cohort.
 *
 * Verdict band binds directly to AffordabilityTier — the clearest single
 * signal a relocation reader cares about (Demographia / FRB Atlanta HOAM
 * lineage). Growth + hazard feed composedScore as secondary penalties but
 * do not gate the band, per Trap #111 honest-distribution rule.
 *
 * Publisher diversity (Trap #110 — ≥2 distinct host TLDs):
 *   - https://www.census.gov/programs-surveys/acs   Census ACS B25077 + B19013
 *   - https://www.bea.gov/.../regional-price-...    BEA RPP cross-reference
 *   - https://www.bls.gov/cpi/                      BLS CPI shelter index
 *   - https://www.ncei.noaa.gov/.../storm-events/   NOAA NCEI Storm Events
 *   - https://www.hud.gov/.../small-area-fmrs       HUD Small Area FMRs
 *   - https://hazards.fema.gov/nri/                 FEMA National Risk Index
 *
 * Six distinct .gov hosts: census.gov · bea.gov · bls.gov · ncei.noaa.gov ·
 * hud.gov · hazards.fema.gov (counted as fema.gov for registrable domain).
 */

import type { City } from './db';
import { getCityBySlug } from './db';
import {
  classifyAffordability,
  type AffordabilityResult,
  type AffordabilityTier,
} from './city-affordability-tier';
import {
  classifyCityGrowth,
  type GrowthBand,
  type GrowthBandResult,
} from './population-growth-band';
import { classifyHazardTier, type HazardTier, type HazardTierResult } from './hazard-tier';
import { getRiskByCbsa } from './risk-facts';

export type CrosswalkVerdict = 'A' | 'B' | 'C' | 'D' | 'E';

export interface CityCrosswalkResult {
  verdict: CrosswalkVerdict;
  /** Affordability tier band the verdict is bound to. */
  affordabilityTier: AffordabilityTier;
  /** Composite cost-of-living index from the City record (US=100). */
  colIndex: number | null;
  /** Price-to-income ratio surfaced from the affordability lever. */
  priceToIncomeRatio: number | null;
  /** Composed penalty score = affordabilityRatio + growthPenalty + hazardPenalty. Lower = better for relocation. */
  composedScore: number;
  /** SERP title-safe label (≤10c — §4.0 budget). */
  shortLabel: string;
  /** Long-form label for body copy + meta description. */
  longLabel: string;
  /** Underlying secondary signals. */
  growthBand: GrowthBand;
  hazardTier: HazardTier;
  /** Full underlying decoder outputs, for body copy + JSON-LD evidence. */
  affordability: AffordabilityResult;
  growth: GrowthBandResult;
  hazard: HazardTierResult;
  decoderNotes: string;
  sourceCitations: string[];
}

const SHORT_LABELS: Record<CrosswalkVerdict, string> = {
  A: 'Affordable', // 10c — price-to-income ratio ≤ 3.0 (Demographia "affordable")
  B: 'Modest',     // 6c  — 3.0 < ratio ≤ 4.5
  C: 'Stretched',  // 9c  — 4.5 < ratio ≤ 6.0
  D: 'Strained',   // 8c  — 6.0 < ratio ≤ 8.0
  E: 'Severe',     // 6c  — ratio > 8.0 (top-tier coastal metros)
};

const LONG_LABELS: Record<CrosswalkVerdict, string> = {
  A: 'Affordable metro — Census price-to-income ratio sits at or below the Demographia 3.0 line',
  B: 'Modest cost — purchase remains feasible for a median household with budget discipline',
  C: 'Stretched cost — Demographia "seriously unaffordable" zone, long-term financial strain on a median budget',
  D: 'Strained cost — dual high-income earners or inherited equity required for ownership',
  E: 'Severe cost — top-decile earners only; multi-generational household structure typical',
};

function tierToVerdict(tier: AffordabilityTier): CrosswalkVerdict {
  switch (tier) {
    case 'Affordable': return 'A';
    case 'Modest':     return 'B';
    case 'Stretched':  return 'C';
    case 'Strained':   return 'D';
    case 'Severe':     return 'E';
  }
}

const GROWTH_PENALTY: Record<GrowthBand, number> = {
  Booming: -2,
  Growing: -1,
  Stable: 0,
  Slipping: 1,
  Shrinking: 2,
  Unknown: 0,
};

const HAZARD_PENALTY: Record<HazardTier, number> = {
  Low: 0,
  Moderate: 1,
  Elevated: 2,
  High: 3,
  Extreme: 4,
};

const SOURCE_CITATIONS = [
  'Census ACS 5-year B25077 (median home value) + B19013 (median household income), 2026-05 vintage',
  'BEA Regional Price Parities (state + metro, 2024 release) — cost-of-living cross-reference',
  'BLS CPI shelter index (annual rebase) — rent + ownership inflation signal',
  'NOAA NCEI Storm Events Database (1996–present) — hazard frequency context',
  'HUD Small Area FMRs (2026) — fair-market-rent county overlay',
  'FEMA National Risk Index v2024 — composite hazard risk band',
];

/**
 * Decode the city-level cross-walk for /city/[slug]/.
 *
 * Verdict A–E mirrors the Demographia/FRB-Atlanta AffordabilityTier the
 * page already publishes. ComposedScore = ratio + growthPenalty +
 * hazardPenalty (lower = better for relocation):
 *
 *   ratio          — Census ACS price-to-income (typical 2.5–9.5)
 *   growthPenalty  — Booming −2 → Shrinking +2 (Unknown 0)
 *   hazardPenalty  — Low 0 → Extreme +4
 *
 * Worst plausible composed score ≈ 9.5 + 2 + 4 = 15.5 (Severe + Shrinking
 * + Extreme — e.g. coastal Louisiana, Florida hurricane corridor). Best
 * plausible ≈ 2.0 − 2 + 0 = 0.0 (Affordable + Booming + Low — e.g. some
 * Texas/Mountain-West metros). Range carries per-city variance even within
 * the same verdict band.
 */
export function decodeCityCrosswalk(slug: string): CityCrosswalkResult | null {
  const city = getCityBySlug(slug);
  if (!city) return null;
  return decodeCityCrosswalkFromCity(city);
}

export function decodeCityCrosswalkFromCity(city: City): CityCrosswalkResult {
  const affordability = classifyAffordability(city.median_income, city.median_home_value);
  const growth = classifyCityGrowth(city);
  const risk = getRiskByCbsa(city.fips);
  const hazard = classifyHazardTier(risk);

  const verdict = tierToVerdict(affordability.tier);

  const ratio = affordability.ratio ?? 0;
  const growthPenalty = GROWTH_PENALTY[growth.band];
  const hazardPenalty = HAZARD_PENALTY[hazard.tier];
  const composedScore = Number((ratio + growthPenalty + hazardPenalty).toFixed(2));

  const decoderNotes =
    `affordability ratio ${affordability.ratio ?? 'null'} (${affordability.tier}); ` +
    `growth band ${growth.band}${growth.annualizedRate != null ? ` (${growth.annualizedRate}%/yr)` : ''}; ` +
    `hazard tier ${hazard.tier} (${hazard.dominantHazard}).`;

  return {
    verdict,
    affordabilityTier: affordability.tier,
    colIndex: city.cost_index,
    priceToIncomeRatio: affordability.ratio,
    composedScore,
    shortLabel: SHORT_LABELS[verdict],
    longLabel: LONG_LABELS[verdict],
    growthBand: growth.band,
    hazardTier: hazard.tier,
    affordability,
    growth,
    hazard,
    decoderNotes,
    sourceCitations: SOURCE_CITATIONS,
  };
}

/**
 * Compose the /city/[slug]/ title.absolute string.
 *
 * Pattern: `{ShortName}: {ShortLabel} · COL {n}`
 *
 * §4.0 title-cap budget math (typical case):
 *   15 (typical short_name, "Hilton Head Island, SC")
 * +  2 (": ")
 * + 10 (longest short label, "Affordable")
 * +  3 (" · ")
 * +  7 ("COL 100")
 * = ~37c typical, well under 60c Google rewrite cap.
 *
 * Outlier handling: short_name >30c (only 2/387 — Bridgeport MSA at 44c,
 * Louisville/Jefferson County at 31c) is clipped to "{city}, {state}" via
 * the first comma — guarantees 100% coverage under the cap.
 *
 * COL fallback when cost_index is null: just emits "{ShortName}: {Label}"
 * (no value suffix), so the title remains honest rather than printing zero.
 */
export function buildCityP1Title(shortName: string, result: CityCrosswalkResult): string {
  const clippedName = clipForTitle(shortName);
  const colPart = result.colIndex != null
    ? ` · COL ${Math.round(result.colIndex)}`
    : '';
  return `${clippedName}: ${result.shortLabel}${colPart}`;
}

function clipForTitle(shortName: string): string {
  if (shortName.length <= 30) return shortName;
  // Take everything up to the SECOND comma (keeps "City, ST"), drop any MSA tail.
  const parts = shortName.split(', ');
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1].split(' ')[0]}`;
  }
  return shortName.slice(0, 30);
}

/**
 * Build the short relocation verdict suitable for a meta description chip.
 */
export function buildCityVerdictChip(result: CityCrosswalkResult): string {
  const ratioTag = result.priceToIncomeRatio != null
    ? ` (${result.priceToIncomeRatio}× P/I)`
    : '';
  return `${result.shortLabel}${ratioTag}`;
}
