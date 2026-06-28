/**
 * CityInterpretation — guidebycity verdict-style synthesis across three
 * orthogonal lever axes (affordability × growth × hazard), reframed as a
 * 4-paragraph reader-help block.
 *
 * The PSU 1차 thesis: GuideByCity's three classifiers (AffordabilityTier,
 * PopulationGrowthBand, HazardTier) each answer one relocation question
 * (can I afford to buy here? is the metro growing or losing people? what
 * natural-hazard exposure do I take on?). A reader making a relocation
 * decision needs the three answers reconciled — a metro that's Affordable
 * AND Growing AND Low-hazard is a very different prospect than one that's
 * Affordable AND Shrinking AND Extreme-hazard.
 *
 * The interpretation strip:
 *   - Verdict (1 line): the modal pattern at a glance
 *   - Affordability paragraph: branches on AffordabilityTier
 *   - Growth paragraph: branches on PopulationGrowthBand (suppressed when Unknown)
 *   - Hazard paragraph: branches on HazardTier
 *   - Trade-off paragraph: pairs the strongest signal against the weakest
 *
 * The "trade-off" reading is what makes this a synthesis rather than three
 * stacked facts. We classify each city by the dominant tension between the
 * three axes — e.g. "affordable but shrinking", "expensive but high-growth",
 * "low-hazard but stretched". That's the editorial layer atop the raw data.
 */

import type { AffordabilityTier, AffordabilityResult } from './city-affordability-tier';
import type { GrowthBand, GrowthBandResult } from './population-growth-band';
import type { HazardTier, HazardTierResult } from './hazard-tier';

export type ReaderProfile = 'remote-worker' | 'family-with-kids' | 'retiree' | 'investor';

export type DominantSignal =
  | 'affordable-and-growing'
  | 'affordable-but-shrinking'
  | 'affordable-with-hazard-pressure'
  | 'expensive-but-growing'
  | 'expensive-and-shrinking'
  | 'expensive-with-hazard-pressure'
  | 'balanced'
  | 'unresolved';

export interface CityInterpretation {
  verdict: string;
  dominantSignal: DominantSignal;
  paragraphs: {
    affordability: string;
    growth: string | null;
    hazard: string | null;
    tradeoff: string;
  };
  evidence: {
    affordability: string;
    growth: string;
    hazard: string;
  };
}

const AFFORDABILITY_PARAGRAPH: Record<AffordabilityTier, (cityName: string, ratio: number | null) => string> = {
  Affordable: (city, r) =>
    `The price-to-income ratio in ${city} sits at the Demographia "affordable" line${r != null ? ` (${r}× current ACS reading)` : ''} — a median household can purchase a median-priced home without the housing payment swallowing the rest of the budget. That ratio is the entry-level Demographia "affordable" range, the historical baseline that most US metros sat near before the 1990s; finding it today usually means the local job market is also softer, so the affordability story should be read alongside wage data, not in isolation.`,
  Modest: (city, r) =>
    `${city}'s price-to-income ratio runs moderately ahead of the local income base${r != null ? ` (${r}×)` : ''}. Purchase remains feasible for a disciplined median-income household, but the buffer that an "Affordable" tier provides is gone — a single income disruption or a higher-than-modeled mortgage rate moves a purchase from "manageable" to "tight". Most cost-of-living calculators built on national averages will quietly understate the housing line item at this tier.`,
  Stretched: (city, r) =>
    `Home values in ${city} cross into the Demographia "seriously unaffordable" zone${r != null ? ` (${r}× price-to-income)` : ''}. A median income alone is not realistic for a median home purchase here — typical buyers are dual-income, are leveraging equity from a prior sale, or are willing to budget housing at 35%+ of gross income against the 28% guidance the standard mortgage underwriting framework expects.`,
  Strained: (city, r) =>
    `${city} prices at a price-to-income ratio${r != null ? ` of ${r}×` : ''} where single-earner median households are effectively locked out of ownership. The metro requires either dual high-income earners, substantial inherited equity, or generational household structures to make a purchase work. Renting often dominates the math here on a 5-10 year horizon — the breakeven on buying pushes past most relocation planning windows.`,
  Severe: (city, r) =>
    `${city} sits in the top decile of US price-to-income ratios${r != null ? ` (${r}×, against a Demographia 3.0 baseline)` : ''}. Home ownership is structurally gated to top-decile earners, established equity, or multi-generational households. The conventional "buy after year 3" relocation timeline does not apply — readers planning a move here should run their math against rent + invested down payment, not against a future purchase scenario.`,
};

const GROWTH_PARAGRAPH: Record<GrowthBand, (cityName: string, rate: number | null) => string> = {
  Booming: (city, r) =>
    `${city} is gaining population at top-decile pace${r != null ? ` (~${r}% annualized between the Census Decennial 2010 baseline and the latest ACS reading)` : ''}. Sustained inflow at that rate compresses housing supply and pushes service-industry wages upward but also strains schools, roads, and water infrastructure. A growth band this strong typically means today's affordability numbers are a backward-looking snapshot; readers planning a 3-5 year horizon should pressure-test the housing math against continued price appreciation.`,
  Growing: (city, r) =>
    `${city}'s population is rising at a healthy clip${r != null ? ` (~${r}% annualized)` : ''} — meaningful inflow without the infrastructure strain of a top-decile growth metro. The local economy is adding workers faster than it's losing them, which usually correlates with broader job-market depth and a more diverse housing inventory across the metro.`,
  Stable: (city, r) =>
    `${city}'s population is essentially flat${r != null ? ` (${r}% annualized drift)` : ''} — the metro is neither attracting nor losing people at a rate that materially shifts the housing supply or the labor market. Stable-growth metros tend to have more predictable cost-of-living trajectories because demand is not chasing supply in either direction.`,
  Slipping: (city, r) =>
    `${city}'s population is declining moderately${r != null ? ` (~${r}% annualized)` : ''}. Net outflow exceeds births, often signaling employment-base softness — manufacturing erosion, energy-sector contraction, or out-migration to higher-wage metros. Today's affordability number may be a leading indicator of further price softening; the trade-off is what the local job market looks like by the time you arrive.`,
  Shrinking: (city, r) =>
    `${city}'s population is contracting sharply${r != null ? ` (~${r}% annualized loss)` : ''}. Sustained net outflow at this rate compounds across a decade and typically reflects deeper structural issues — major-employer departure, school-district consolidation, or municipal budget stress. Today's housing affordability comes paired with material long-term value risk; readers planning to buy should weigh that against the rent option.`,
  Unknown:
    () =>
    'Paired Decennial-to-ACS population for this metro is not yet ingested, so the growth band is reported as Unknown rather than fabricated. The methodology page documents which counties have paired Decennial-to-ACS data on hand; for the rest, the affordability × hazard cross still functions as a 2-axis read.',
};

const HAZARD_PARAGRAPH: Record<HazardTier, (cityName: string, dominantHazardLabelText: string, veryHighCount: number) => string> = {
  Low: (city, _dom, _vh) =>
    `${city}'s FEMA National Risk Index profile is at the bottom of the 5-band scale. The metro has no top-tier hazard exposure across the FEMA hazard set — earthquake, hurricane, wildfire, tornado, flooding all rate "Relatively Low" or "Very Low" on the population-weighted FEMA composite. Insurance availability and pricing should track the national baseline rather than the climate-risk premium that affects "High" and "Extreme" HazardTier metros.`,
  Moderate: (city, _dom, _vh) =>
    `${city}'s FEMA NRI composite is at the middle of the 5-band scale. No single hazard rates "Very High" in the metro's primary county, but the cumulative exposure across the FEMA hazard set is meaningful enough to factor into insurance pricing and emergency-services planning. The Moderate tier is the largest by city count nationally — most US metros sit here.`,
  Elevated: (city, dom, _vh) =>
    `${city}'s FEMA NRI rates the primary county "Relatively Moderate" overall, but with at least one specific hazard escalating into the "Relatively High" intensity band (dominant hazard for this metro: ${dom}). The composite rating masks the relocation question — a metro can rate Moderate overall while carrying one hazard you'd otherwise plan around. The Elevated tier flags exactly that asymmetry.`,
  High: (city, dom, vh) =>
    `${city}'s FEMA NRI primary-county rating is "Relatively High" overall, or carries one hazard at "Very High" intensity. Dominant hazard: ${dom}. ${vh > 0 ? `${vh} of the metro's top-3 county hazards rate at FEMA's maximum "Very High" tier.` : ''} Insurance premiums in metros at this tier typically run materially above national averages, and the climate-risk discount on long-term housing value is a real consideration on a 10+ year hold.`,
  Extreme: (city, dom, vh) =>
    `${city}'s FEMA NRI primary-county profile is at the top of the 5-band scale — either rated "Very High" overall, or carrying two or more of the metro's top-3 hazards at "Very High" intensity. Dominant hazard: ${dom}. ${vh > 0 ? `${vh} of the metro's top-3 county hazards rate "Very High".` : ''} Insurance availability itself becomes a planning question at the Extreme tier — some carriers withdraw, and the carriers that remain price the climate-risk premium aggressively.`,
};

function pickDominantSignal(
  affTier: AffordabilityTier,
  growthBand: GrowthBand,
  hazardTier: HazardTier,
): DominantSignal {
  const affordable = affTier === 'Affordable' || affTier === 'Modest';
  const expensive = affTier === 'Strained' || affTier === 'Severe';
  const growing = growthBand === 'Booming' || growthBand === 'Growing';
  const shrinking = growthBand === 'Shrinking' || growthBand === 'Slipping';
  const highHazard = hazardTier === 'High' || hazardTier === 'Extreme';

  if (affordable && growing) return 'affordable-and-growing';
  if (affordable && shrinking) return 'affordable-but-shrinking';
  if (affordable && highHazard) return 'affordable-with-hazard-pressure';
  if (expensive && growing) return 'expensive-but-growing';
  if (expensive && shrinking) return 'expensive-and-shrinking';
  if (expensive && highHazard) return 'expensive-with-hazard-pressure';
  if (growthBand === 'Unknown') return 'unresolved';
  return 'balanced';
}

const SIGNAL_VERDICT: Record<DominantSignal, string> = {
  'affordable-and-growing':
    'Affordable price-to-income ratio paired with sustained inflow — the prototypical "destination metro" pattern.',
  'affordable-but-shrinking':
    'Affordable today, but the metro is losing population — read the affordability as a leading indicator, not a stable equilibrium.',
  'affordable-with-hazard-pressure':
    'Affordable price-to-income ratio but with elevated FEMA NRI exposure — the affordability comes paired with insurance and climate-risk planning.',
  'expensive-but-growing':
    'Stretched-to-severe price-to-income ratio with sustained inflow — top-decile metros usually fit this pattern; today\'s prices may be a backward-looking reading.',
  'expensive-and-shrinking':
    'High price-to-income ratio paired with population loss — a structural mismatch worth investigating before a long-term hold.',
  'expensive-with-hazard-pressure':
    'High price-to-income ratio plus elevated FEMA NRI exposure — climate-risk premium stacks on top of an already stretched housing math.',
  'balanced':
    'No single axis dominates — the three levers (affordability × growth × hazard) read as roughly comparable bands.',
  'unresolved':
    'Growth signal not yet wired for this metro — verdict draws on the affordability × hazard cross only.',
};

const TRADEOFF_NARRATIVE: Record<DominantSignal, string> = {
  'affordable-and-growing':
    'The affordability-plus-growth combination usually means a metro is still in the early stage of a popularity cycle. Cost-of-living calculators tied to last year\'s ACS will understate housing if the growth band sustains; readers on a 3-5 year horizon should pressure-test the math against continued appreciation.',
  'affordable-but-shrinking':
    'The hardest trade-off to read. Today\'s affordability is real, but it sits inside a structural pattern (population loss) that compresses long-term value. Rent, not buy, is usually the safer hypothesis until the local job-market story is independently verified.',
  'affordable-with-hazard-pressure':
    'The affordability gain is partially offset by the climate-risk premium that shows up in insurance pricing and long-horizon home-value risk. The honest comparison is "affordable home + above-average insurance + climate-risk discount on resale" against a higher-cost-but-lower-hazard metro.',
  'expensive-but-growing':
    'The classic "growth premium" pattern. Today\'s buyer pays the affordability tax in exchange for an expected continued tailwind. Whether the trade is worth it depends on the reader\'s holding horizon and the headroom remaining in the local growth story.',
  'expensive-and-shrinking':
    'A structural warning sign. The high price-to-income ratio plus the population-loss signal suggests the housing market is repricing later than the underlying economy. Treat the listing price as a maximum, not a market clearing level.',
  'expensive-with-hazard-pressure':
    'Two compounding costs — the housing premium and the climate-risk premium — applied to the same buyer. The combination is common on the coastal Southeast and parts of the Mountain West and is the reason a metro\'s "cost of living" headline number understates the true cost of ownership in these tiers.',
  'balanced':
    'No single lever dominates the others; the relocation decision here is more about reader-specific weighting than a single signal. Readers should rank "affordability vs growth vs hazard" by personal priority and re-evaluate the metro through that lens.',
  'unresolved':
    'Without a wired growth band, the trade-off frame collapses to a 2-axis (affordability × hazard) read. The methodology page lists which counties have paired Decennial-to-ACS data ingested; the rest are reported honestly as Unknown rather than filled with a synthetic estimate.',
};

export function interpretCity(input: {
  cityName: string;
  affordability: AffordabilityResult;
  growth: GrowthBandResult;
  hazard: HazardTierResult;
  dominantHazardLabelText: string;
}): CityInterpretation {
  const { cityName, affordability, growth, hazard, dominantHazardLabelText } = input;

  const signal = pickDominantSignal(affordability.tier, growth.band, hazard.tier);

  const affordabilityP = AFFORDABILITY_PARAGRAPH[affordability.tier](cityName, affordability.ratio);
  const growthP =
    growth.band === 'Unknown'
      ? GROWTH_PARAGRAPH.Unknown(cityName, null)
      : GROWTH_PARAGRAPH[growth.band](cityName, growth.annualizedRate);
  const hazardP =
    hazard.confidence === 'low'
      ? null
      : HAZARD_PARAGRAPH[hazard.tier](cityName, dominantHazardLabelText, hazard.veryHighHazardCount);

  return {
    verdict: SIGNAL_VERDICT[signal],
    dominantSignal: signal,
    paragraphs: {
      affordability: affordabilityP,
      growth: growth.band === 'Unknown' ? growthP : growthP,
      hazard: hazardP,
      tradeoff: TRADEOFF_NARRATIVE[signal],
    },
    evidence: {
      affordability: affordability.evidence,
      growth: growth.evidence,
      hazard: hazard.evidence,
    },
  };
}

export const INTERPRETATION_AXES = [
  {
    axis: 'Affordability',
    classifier: 'CityAffordabilityTier',
    source: 'Census ACS B25077 ÷ B19013',
    bands: 5,
    bandsList: 'Affordable / Modest / Stretched / Strained / Severe',
  },
  {
    axis: 'Population trajectory',
    classifier: 'PopulationGrowthBand',
    source: 'Census Decennial 2010 → ACS 2024 (paired)',
    bands: 5,
    bandsList: 'Booming / Growing / Stable / Slipping / Shrinking (Unknown when data unwired)',
  },
  {
    axis: 'Natural-hazard exposure',
    classifier: 'HazardTier',
    source: 'FEMA National Risk Index v2024',
    bands: 5,
    bandsList: 'Low / Moderate / Elevated / High / Extreme',
  },
];
