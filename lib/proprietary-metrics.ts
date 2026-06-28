import { type CityCrosswalkResult } from './crosswalk-guide';

export interface RelocationProprietaryMetrics {
  housingAffordabilityScore: number;
  economicVitalityScore: number;
  environmentalResilienceScore: number;
  overallGrade: string;
  commentary: string;
}

/**
 * Returns a deterministic commentary paragraph based on city name, verdict, growth band, and slug-based hash
 * to rotate content variation and prevent duplicate content.
 */
function getDeterministicCommentary(
  cityName: string,
  verdict: string,
  growthBand: string,
  hazardTier: string,
  slug: string
): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 3;

  const isAffordable = verdict === 'A' || verdict === 'B';
  const isStretched = verdict === 'C';
  const isGrowing = growthBand === 'Booming' || growthBand === 'Growing';

  let key = 'MID_STABLE';
  if (isAffordable) {
    key = isGrowing ? 'AFFORDABLE_GROWING' : 'AFFORDABLE_STABLE';
  } else if (isStretched) {
    key = 'STRETCHED';
  } else {
    key = 'STRAINED_SEVERE';
  }

  const variations: Record<string, string[]> = {
    AFFORDABLE_GROWING: [
      `Relocating to ${cityName} represents a compelling financial opportunity. Its strong housing affordability profile, combined with robust population growth, highlights a vibrant local economy where home ownership remains within reach for median earners.`,
      `${cityName} is an appealing destination for relocators seeking value and expansion. The area combines lower entry prices for homes with positive net migration, signaling solid economic momentum and long-term equity potential.`,
      `With solid price-to-income metrics and a growing populace, ${cityName} stands out as a balanced growth hub. Buying a home here is far less burdensome than in typical coastal metros, backed by strong regional demand.`
    ],
    AFFORDABLE_STABLE: [
      `${cityName} offers excellent stability and budget-friendly living. While local population growth is moderate, the affordable housing market ensures low financial friction, making it ideal for retirees or remote workers.`,
      `For buyers prioritizing affordability over rapid growth, ${cityName} provides an attractive and stable cost structure. Housing prices are well-proportioned to household incomes, ensuring low risk of real estate volatility.`,
      `Low entry costs and stable market dynamics make ${cityName} a reliable relocation choice. The absence of intense growth pressures helps keep local services and housing prices highly predictable.`
    ],
    STRETCHED: [
      `Purchasing a home in ${cityName} requires careful budgeting, as prices are moderately stretched relative to median local incomes. However, the region remains a popular landing spot with solid structural demand.`,
      `${cityName} represents a transition zone where housing costs are elevated but not entirely out of reach. Relocators should carefully weigh their earnings potential against monthly mortgage payments.`,
      `A stretched price-to-income ratio in ${cityName} suggests that buyer budgets will feel tighter. Active shopping and seeking favorable neighborhoods are necessary to secure solid real estate value.`
    ],
    STRAINED_SEVERE: [
      `${cityName} is a premium, high-cost market where homeownership presents a major hurdle. Successful relocation typically requires significant existing home equity or a top-tier household income.`,
      `With house prices significantly exceeding local median incomes, ${cityName} is highly strained. Buyers must brace for a competitive market and should evaluate whether high local amenities justify the premium.`,
      `The real estate market in ${cityName} is characterized by high demand and substantial price-to-income imbalances. Multi-earner households or substantial down payments are standard requirements to enter the local market.`
    ]
  };

  const list = variations[key] || variations['MID_STABLE'];
  return list[index];
}

/**
 * Calculates proprietary relocation metrics from the resolved city crosswalk result.
 */
export function calculateProprietaryMetrics(
  cw: CityCrosswalkResult,
  cityName: string,
  slug: string
): RelocationProprietaryMetrics {
  // 1. Housing Affordability Score (0-100)
  let housingAffordabilityScore = 50;
  const ratio = cw.priceToIncomeRatio;
  if (ratio !== null) {
    housingAffordabilityScore = Math.round(100 - (ratio - 2.0) * 11);
    housingAffordabilityScore = Math.max(12, Math.min(98, housingAffordabilityScore));
  } else {
    const tierScores: Record<string, number> = {
      Affordable: 92,
      Modest: 78,
      Stretched: 62,
      Strained: 45,
      Severe: 22,
    };
    housingAffordabilityScore = tierScores[cw.affordabilityTier] || 50;
  }

  // 2. Economic Vitality Score (0-100)
  const growthScores: Record<string, number> = {
    Booming: 96,
    Growing: 82,
    Stable: 68,
    Slipping: 45,
    Shrinking: 25,
    Unknown: 55,
  };
  const economicVitalityScore = growthScores[cw.growthBand] || 50;

  // 3. Environmental Resilience Score (0-100)
  const hazardScores: Record<string, number> = {
    Low: 94,
    Moderate: 80,
    Elevated: 64,
    High: 42,
    Extreme: 20,
  };
  const environmentalResilienceScore = hazardScores[cw.hazardTier] || 50;

  // 4. Overall Relocation Grade (composite score where higher is better)
  const composite = 0.5 * housingAffordabilityScore + 0.3 * economicVitalityScore + 0.2 * environmentalResilienceScore;
  let overallGrade = 'C';
  if (composite >= 90) overallGrade = 'A+';
  else if (composite >= 85) overallGrade = 'A';
  else if (composite >= 80) overallGrade = 'A-';
  else if (composite >= 75) overallGrade = 'B+';
  else if (composite >= 70) overallGrade = 'B';
  else if (composite >= 65) overallGrade = 'B-';
  else if (composite >= 60) overallGrade = 'C+';
  else if (composite >= 55) overallGrade = 'C';
  else if (composite >= 50) overallGrade = 'C-';
  else if (composite >= 45) overallGrade = 'D+';
  else if (composite >= 40) overallGrade = 'D';
  else overallGrade = 'F';

  // 5. Commentary
  const commentary = getDeterministicCommentary(cityName, cw.verdict, cw.growthBand, cw.hazardTier, slug);

  return {
    housingAffordabilityScore,
    economicVitalityScore,
    environmentalResilienceScore,
    overallGrade,
    commentary,
  };
}
