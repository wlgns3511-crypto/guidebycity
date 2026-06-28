/**
 * CityAffordabilityTier — guidebycity 5-band classifier derived from the
 * Census ACS B25077 median home value over B19013 median household income.
 *
 * The Demographia International Housing Affordability series and the Federal
 * Reserve Bank of Atlanta Home Ownership Affordability Monitor (HOAM) both
 * lean on the price-to-income ratio (home value divided by household income)
 * as the canonical single-number metric for "can a median family buy here."
 * Demographia bands traditionally read: ≤3.0 affordable, 3.1–4.0 moderately
 * unaffordable, 4.1–5.0 seriously unaffordable, ≥5.1 severely unaffordable.
 *
 * CityAffordabilityTier widens the upper end because US metros routinely
 * exceed the historical 5.1 cap — San Jose, San Francisco, Honolulu, Santa
 * Cruz, and Los Angeles all sit above 8.0 in the current ACS vintage. A
 * single "Severely Unaffordable" bucket would flatten those metros against
 * Boise (~5.5) and Phoenix (~5.8). We split them so a relocation reader
 * sees the difference:
 *
 *   Affordable  — ratio ≤ 3.0 (Demographia "affordable" range)
 *   Modest      — 3.0 < ratio ≤ 4.5 (purchase feasible for median income)
 *   Stretched   — 4.5 < ratio ≤ 6.0 (Demographia "seriously unaffordable")
 *   Strained    — 6.0 < ratio ≤ 8.0 (high-cost metros, dual-income required)
 *   Severe      — ratio > 8.0 (top-tier coastal metros, generational equity)
 *
 * Confidence = 'low' when either median_income or median_home_value is null.
 *
 * NOT an FRB Atlanta or Demographia official tier — it is our derivation.
 * The /guide/city-affordability-tier/ page surfaces the cutoffs verbatim
 * so any reader can audit against the ACS B25077 / B19013 record.
 */

import type { City } from './db';

export type AffordabilityTier =
  | 'Affordable'
  | 'Modest'
  | 'Stretched'
  | 'Strained'
  | 'Severe';

export interface AffordabilityResult {
  tier: AffordabilityTier;
  ratio: number | null;
  medianHomeValue: number | null;
  medianIncome: number | null;
  evidence: string;
  confidence: 'high' | 'med' | 'low';
}

const TIER_BLURB: Record<AffordabilityTier, string> = {
  Affordable: 'home values stay near or below the Demographia 3.0 price-to-income line — a median household can purchase without stretching',
  Modest: 'home values run moderately ahead of the local income base — purchase remains feasible for a median household with discipline',
  Stretched: 'home values cross into the Demographia "seriously unaffordable" zone — purchase pushes a median household into long-term financial strain',
  Strained: 'home values require dual high-income earners or substantial inherited equity — single-earner median households are effectively locked out of ownership',
  Severe: 'home values run more than 8× median income — ownership is gated to top-decile earners, established equity, or multi-generational households',
};

const TIER_TONE: Record<AffordabilityTier, string> = {
  Affordable: 'emerald',
  Modest: 'sky',
  Stretched: 'amber',
  Strained: 'orange',
  Severe: 'rose',
};

export function classifyAffordability(
  medianIncome: number | null,
  medianHomeValue: number | null,
): AffordabilityResult {
  if (medianIncome == null || medianHomeValue == null || medianIncome <= 0) {
    return {
      tier: 'Modest',
      ratio: null,
      medianHomeValue: medianHomeValue ?? null,
      medianIncome: medianIncome ?? null,
      evidence:
        'Census ACS median_income or median_home_value not available for this metro — affordability tier suppressed.',
      confidence: 'low',
    };
  }

  const ratio = medianHomeValue / medianIncome;
  const roundedRatio = Math.round(ratio * 100) / 100;

  let tier: AffordabilityTier;
  if (ratio <= 3.0) tier = 'Affordable';
  else if (ratio <= 4.5) tier = 'Modest';
  else if (ratio <= 6.0) tier = 'Stretched';
  else if (ratio <= 8.0) tier = 'Strained';
  else tier = 'Severe';

  const evidence = `Census ACS B25077 median home value $${medianHomeValue.toLocaleString()} ÷ B19013 median household income $${medianIncome.toLocaleString()} = ${roundedRatio}× price-to-income ratio.`;

  return {
    tier,
    ratio: roundedRatio,
    medianHomeValue,
    medianIncome,
    evidence,
    confidence: 'high',
  };
}

export function affordabilityBlurb(tier: AffordabilityTier): string {
  return TIER_BLURB[tier];
}

export function affordabilityTone(tier: AffordabilityTier): string {
  return TIER_TONE[tier];
}

export const AFFORDABILITY_CUTOFFS = [
  {
    tier: 'Affordable' as const,
    range: 'ratio ≤ 3.0',
    rule: 'Census ACS B25077 median home value divided by B19013 median household income ≤ 3.0 — Demographia "affordable" range.',
  },
  {
    tier: 'Modest' as const,
    range: '3.0 < ratio ≤ 4.5',
    rule: 'Price-to-income ratio sits between 3.0 and 4.5 — Demographia "moderately unaffordable" extending into the seriously-unaffordable boundary.',
  },
  {
    tier: 'Stretched' as const,
    range: '4.5 < ratio ≤ 6.0',
    rule: 'Price-to-income ratio between 4.5 and 6.0 — overlaps Demographia "seriously unaffordable" (5.1+) and the FRB Atlanta HOAM "burdened" range.',
  },
  {
    tier: 'Strained' as const,
    range: '6.0 < ratio ≤ 8.0',
    rule: 'Price-to-income ratio between 6.0 and 8.0 — Demographia "severely unaffordable" plus the high-cost coastal metro band.',
  },
  {
    tier: 'Severe' as const,
    range: 'ratio > 8.0',
    rule: 'Price-to-income ratio above 8.0 — observed only in top-tier coastal metros (San Jose, San Francisco, Honolulu, Santa Cruz, Los Angeles in the current ACS vintage).',
  },
];

export interface StateAffordabilityRollup {
  state: string;
  cities: number;
  distribution: Record<AffordabilityTier, number>;
  modalTier: AffordabilityTier;
  medianRatio: number | null;
}

export function rollupStateAffordability(
  state: string,
  cities: City[],
): StateAffordabilityRollup {
  const distribution: Record<AffordabilityTier, number> = {
    Affordable: 0,
    Modest: 0,
    Stretched: 0,
    Strained: 0,
    Severe: 0,
  };
  const ratios: number[] = [];
  let withData = 0;

  for (const c of cities) {
    const r = classifyAffordability(c.median_income, c.median_home_value);
    if (r.confidence === 'low' || r.ratio == null) continue;
    withData++;
    distribution[r.tier]++;
    ratios.push(r.ratio);
  }

  const tierOrder: AffordabilityTier[] = [
    'Severe',
    'Strained',
    'Stretched',
    'Modest',
    'Affordable',
  ];
  let modalTier: AffordabilityTier = 'Modest';
  let maxCount = -1;
  for (const t of tierOrder) {
    if (distribution[t] > maxCount) {
      maxCount = distribution[t];
      modalTier = t;
    }
  }

  let medianRatio: number | null = null;
  if (ratios.length > 0) {
    const sorted = [...ratios].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianRatio =
      sorted.length % 2 === 0
        ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100
        : sorted[mid];
  }

  return {
    state,
    cities: withData,
    distribution,
    modalTier,
    medianRatio,
  };
}
