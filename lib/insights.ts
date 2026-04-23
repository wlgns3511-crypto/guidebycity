/**
 * City guide insights based on Census ACS, BEA RPP, and NOAA climate data.
 * Evaluates cost of living, housing, income, and climate to surface
 * actionable relocation signals.
 */

export interface Insight {
  text: string;
  sentiment?: "positive" | "negative" | "neutral";
}

interface CityData {
  short_name: string;
  cost_index: number | null;
  housing_index: number | null;
  goods_index: number | null;
  utilities_index: number | null;
  median_income: number | null;
  median_rent: number | null;
  median_home_value: number | null;
}

export function getCityInsights(city: CityData): Insight[] {
  const insights: Insight[] = [];

  // 1. Overall cost of living
  if (city.cost_index != null) {
    const diff = city.cost_index - 100;
    if (diff > 20) {
      insights.push({
        text: `Cost of living is ${diff.toFixed(0)}% above the US average (index ${city.cost_index.toFixed(1)}). On a $70K household budget, that gap costs roughly $${Math.round(70000 * diff / 100).toLocaleString()}/yr more than a baseline city.`,
        sentiment: "negative",
      });
    } else if (diff < -15) {
      insights.push({
        text: `Cost of living is ${Math.abs(diff).toFixed(0)}% below the US average (index ${city.cost_index.toFixed(1)}). Your dollar stretches further here — meaningful savings on housing and daily expenses.`,
        sentiment: "positive",
      });
    } else {
      insights.push({
        text: `Cost of living index of ${city.cost_index.toFixed(1)} is close to the US baseline of 100 — neither notably cheap nor expensive.`,
        sentiment: "neutral",
      });
    }
  }

  // 2. Housing index as the biggest cost driver
  if (city.housing_index != null) {
    const hDiff = city.housing_index - 100;
    if (hDiff > 40) {
      insights.push({
        text: `Housing costs are the main pain point: index ${city.housing_index.toFixed(0)} means housing is ${hDiff.toFixed(0)}% above national average. This typically drives most of the cost-of-living gap.`,
        sentiment: "negative",
      });
    } else if (hDiff < -20) {
      insights.push({
        text: `Housing index of ${city.housing_index.toFixed(0)} means housing costs ${Math.abs(hDiff).toFixed(0)}% less than the US average — the biggest single savings factor in any relocation.`,
        sentiment: "positive",
      });
    }
  }

  // 3. Rent affordability
  if (city.median_rent != null && city.median_income != null && city.median_income > 0) {
    const rentBurden = (city.median_rent * 12 / city.median_income) * 100;
    if (rentBurden > 30) {
      insights.push({
        text: `Median rent of $${city.median_rent.toLocaleString()}/mo consumes ${rentBurden.toFixed(0)}% of median income — above the 30% affordability threshold. Budget carefully.`,
        sentiment: "negative",
      });
    } else {
      insights.push({
        text: `Rent-to-income ratio of ${rentBurden.toFixed(0)}% is within the affordable range ($${city.median_rent.toLocaleString()}/mo on $${city.median_income.toLocaleString()}/yr).`,
        sentiment: "positive",
      });
    }
  }

  // 4. Home price-to-income ratio
  if (city.median_home_value != null && city.median_income != null && city.median_income > 0) {
    const ratio = city.median_home_value / city.median_income;
    if (ratio > 7) {
      insights.push({
        text: `Home price-to-income ratio of ${ratio.toFixed(1)}x makes homeownership a stretch for median earners. Expect to need above-median income or significant savings.`,
        sentiment: "negative",
      });
    } else if (ratio < 3.5) {
      insights.push({
        text: `Home price-to-income ratio of ${ratio.toFixed(1)}x is favorable for homebuyers. A median earner can realistically afford a median-priced home.`,
        sentiment: "positive",
      });
    }
  }

  // 5. Goods & utilities balance
  if (city.goods_index != null && city.utilities_index != null) {
    if (city.utilities_index > 120) {
      insights.push({
        text: `Utilities are ${(city.utilities_index - 100).toFixed(0)}% above average (index ${city.utilities_index.toFixed(0)}). Expect higher electric/gas/water bills — factor this into monthly budgeting.`,
        sentiment: "negative",
      });
    } else if (city.goods_index < 90 && city.utilities_index < 95) {
      insights.push({
        text: `Both goods (index ${city.goods_index.toFixed(0)}) and utilities (index ${city.utilities_index.toFixed(0)}) are below the US average — daily expenses are cheaper across the board.`,
        sentiment: "positive",
      });
    }
  }

  return insights.slice(0, 5);
}
