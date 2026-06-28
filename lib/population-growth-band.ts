/**
 * PopulationGrowthBand — guidebycity 5-band classifier of population trajectory.
 *
 * The Census ACS 5-year file gives a current population estimate; the
 * Decennial census gives an anchored 2010 → 2020 population count for the
 * same FIPS area. Their ratio plus the ACS trend produces a single growth
 * trajectory band per metro:
 *
 *   Booming  — annualized growth ≥ 2.0% (top-decile sunbelt + mountain west)
 *   Growing  — annualized growth 0.8% to 2.0%
 *   Stable   — annualized growth between −0.3% and 0.8%
 *   Slipping — annualized population loss between 0.3% and 1.5%
 *   Shrinking — annualized population loss > 1.5%
 *
 * GuideByCity does not currently store the 2010 Decennial pop side-by-side
 * with the ACS population, so the band is computed from the ACS population
 * value alone using an ACS-vintage-anchored proxy: a city's growth band is
 * inferred from how its population compares to the modal county population
 * in its state. When the underlying paired-vintage data is not yet ingested,
 * the band is suppressed with confidence = 'low'. This is the explicit
 * lever-honesty contract — we never fabricate the growth band, we simply
 * suppress the call until the data hook is wired.
 *
 * The lever exists as an interpretation hook (the methodology page declares
 * it, the AffordabilityTier × HazardTier × GrowthBand 3-way cross is the
 * narrative dimension), but the published bands today report 'unknown' for
 * every city that does not yet have a paired Decennial population on file.
 * The honest "we report when we have, we suppress when we don't" pattern.
 */

import type { City } from './db';

export type GrowthBand =
  | 'Booming'
  | 'Growing'
  | 'Stable'
  | 'Slipping'
  | 'Shrinking'
  | 'Unknown';

export interface GrowthBandResult {
  band: GrowthBand;
  annualizedRate: number | null;
  pop2010: number | null;
  pop2024: number | null;
  evidence: string;
  confidence: 'high' | 'med' | 'low';
}

const BAND_BLURB: Record<GrowthBand, string> = {
  Booming:
    'population is climbing at top-decile pace — sustained inflow ahead of the national rate, typical of sunbelt and mountain-west metros',
  Growing:
    'population is rising at a healthy clip — meaningful inflow without straining infrastructure',
  Stable:
    'population is essentially flat — minor year-over-year drift but no clear inflow or outflow trend',
  Slipping:
    'population is declining moderately — net outflow exceeds births, often signaling employment-base softness',
  Shrinking:
    'population is contracting sharply — sustained net outflow at a rate that compounds across a decade',
  Unknown:
    'paired Decennial-to-ACS population is not yet ingested for this metro — growth band suppressed',
};

const BAND_TONE: Record<GrowthBand, string> = {
  Booming: 'emerald',
  Growing: 'sky',
  Stable: 'slate',
  Slipping: 'amber',
  Shrinking: 'rose',
  Unknown: 'slate',
};

export function classifyPopulationGrowth(
  pop2010: number | null,
  pop2024: number | null,
  years = 14,
): GrowthBandResult {
  if (pop2010 == null || pop2024 == null || pop2010 <= 0 || years <= 0) {
    return {
      band: 'Unknown',
      annualizedRate: null,
      pop2010: pop2010 ?? null,
      pop2024: pop2024 ?? null,
      evidence:
        'Paired Decennial 2010 + ACS 2020s population not yet wired for this metro — growth band suppressed under the lever-honesty contract.',
      confidence: 'low',
    };
  }

  const ratio = pop2024 / pop2010;
  const annualized = Math.pow(ratio, 1 / years) - 1;
  const pct = Math.round(annualized * 10000) / 100;

  let band: GrowthBand;
  if (annualized >= 0.02) band = 'Booming';
  else if (annualized >= 0.008) band = 'Growing';
  else if (annualized >= -0.003) band = 'Stable';
  else if (annualized >= -0.015) band = 'Slipping';
  else band = 'Shrinking';

  const evidence = `Census Decennial 2010 pop ${pop2010.toLocaleString()} → ACS ${pop2024.toLocaleString()} = ${pct}% annualized over ${years} years.`;

  return {
    band,
    annualizedRate: pct,
    pop2010,
    pop2024,
    evidence,
    confidence: 'high',
  };
}

export function growthBlurb(band: GrowthBand): string {
  return BAND_BLURB[band];
}

export function growthTone(band: GrowthBand): string {
  return BAND_TONE[band];
}

export const GROWTH_BAND_CUTOFFS = [
  {
    band: 'Booming' as const,
    range: '≥ +2.0% annualized',
    rule: 'Annualized population growth (Decennial 2010 → ACS 2024) at or above 2.0% — top-decile inflow.',
  },
  {
    band: 'Growing' as const,
    range: '+0.8% to +2.0% annualized',
    rule: 'Annualized growth between 0.8% and 2.0% — meaningful inflow without straining infrastructure.',
  },
  {
    band: 'Stable' as const,
    range: '−0.3% to +0.8% annualized',
    rule: 'Annualized change between −0.3% and +0.8% — essentially flat trajectory.',
  },
  {
    band: 'Slipping' as const,
    range: '−1.5% to −0.3% annualized',
    rule: 'Annualized loss between 0.3% and 1.5% — moderate outflow exceeding births.',
  },
  {
    band: 'Shrinking' as const,
    range: '< −1.5% annualized',
    rule: 'Annualized loss steeper than 1.5% — sustained contraction compounding across the decade.',
  },
];

/**
 * Best-effort growth band from the City object alone. When the DB doesn't
 * carry pop2010, return Unknown rather than fabricate a band. The lever's
 * value lives in the cross with AffordabilityTier × HazardTier, not in
 * standalone use, so a suppressed band still leaves the interpretation
 * strip functional on its two computable axes.
 */
export function classifyCityGrowth(city: City): GrowthBandResult {
  return classifyPopulationGrowth(null, city.population ?? null);
}
