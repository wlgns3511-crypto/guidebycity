/**
 * State-level city guide insights comparing aggregate metrics for
 * all cities in a state against national averages.
 */

import type { City } from './db';

export interface StateInsight {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export function getStateInsights(stateName: string, cities: City[], nationalAvgIncome: number, nationalAvgCost: number): StateInsight[] {
  const insights: StateInsight[] = [];

  if (cities.length === 0) return insights;

  // Calculate state aggregates
  const withCost = cities.filter(c => c.cost_index != null);
  const withIncome = cities.filter(c => c.median_income != null);
  const withRent = cities.filter(c => c.median_rent != null);
  const withHome = cities.filter(c => c.median_home_value != null);

  const avgCost = withCost.length > 0 ? withCost.reduce((s, c) => s + (c.cost_index ?? 0), 0) / withCost.length : null;
  const avgIncome = withIncome.length > 0 ? Math.round(withIncome.reduce((s, c) => s + (c.median_income ?? 0), 0) / withIncome.length) : null;
  const avgRent = withRent.length > 0 ? Math.round(withRent.reduce((s, c) => s + (c.median_rent ?? 0), 0) / withRent.length) : null;
  const avgHome = withHome.length > 0 ? Math.round(withHome.reduce((s, c) => s + (c.median_home_value ?? 0), 0) / withHome.length) : null;

  // 1. Cost of living overview
  if (avgCost != null) {
    const diff = avgCost - nationalAvgCost;
    const diffPct = Math.round(((avgCost - nationalAvgCost) / nationalAvgCost) * 100);
    if (diff > 10) {
      insights.push({
        text: `Across ${withCost.length} cities tracked in ${stateName}, the average cost of living index is ${avgCost.toFixed(1)} — ${diffPct}% above the national average of ${nationalAvgCost.toFixed(1)}. Housing costs are typically the largest driver of this premium, especially in metro areas.`,
        sentiment: 'negative',
      });
    } else if (diff < -10) {
      insights.push({
        text: `${stateName}'s ${withCost.length} tracked cities average a cost of living index of ${avgCost.toFixed(1)}, which is ${Math.abs(diffPct)}% below the national average of ${nationalAvgCost.toFixed(1)}. Your dollar stretches further here, particularly for housing and everyday expenses.`,
        sentiment: 'positive',
      });
    } else {
      insights.push({
        text: `The average cost of living across ${stateName}'s ${withCost.length} cities (index ${avgCost.toFixed(1)}) is close to the national average of ${nationalAvgCost.toFixed(1)}. Individual cities can vary significantly, so check each city's breakdown below.`,
        sentiment: 'neutral',
      });
    }
  }

  // 2. Income context
  if (avgIncome != null) {
    const incomeDiffPct = Math.round(((avgIncome - nationalAvgIncome) / nationalAvgIncome) * 100);
    if (incomeDiffPct > 15) {
      insights.push({
        text: `Median household income in ${stateName} cities averages $${avgIncome.toLocaleString()}/year, ${incomeDiffPct}% above the national average of $${nationalAvgIncome.toLocaleString()}. Higher earnings help offset the cost of living${avgCost && avgCost > 100 ? ', though they may not fully compensate for above-average costs' : ''}.`,
        sentiment: 'positive',
      });
    } else if (incomeDiffPct < -15) {
      insights.push({
        text: `Median household income across ${stateName} cities averages $${avgIncome.toLocaleString()}/year, ${Math.abs(incomeDiffPct)}% below the national average of $${nationalAvgIncome.toLocaleString()}. ${avgCost && avgCost < 95 ? 'Lower incomes are partially offset by below-average living costs.' : 'Combined with living costs, household budgets may feel tighter here.'}`,
        sentiment: incomeDiffPct < -25 ? 'negative' : 'neutral',
      });
    } else {
      insights.push({
        text: `Household income in ${stateName} cities averages $${avgIncome.toLocaleString()}/year, within ${Math.abs(incomeDiffPct)}% of the $${nationalAvgIncome.toLocaleString()} national average.`,
        sentiment: 'neutral',
      });
    }
  }

  // 3. Rent affordability
  if (avgRent != null && avgIncome != null && avgIncome > 0) {
    const rentBurden = Math.round((avgRent * 12 / avgIncome) * 100);
    insights.push({
      text: `Average rent across ${stateName} cities is $${avgRent.toLocaleString()}/month, consuming ${rentBurden}% of median household income. ${rentBurden > 30 ? 'This exceeds the 30% affordability threshold — renters may need roommates or supplemental income.' : 'This falls within the 30% affordability guideline, leaving reasonable room for other expenses.'}`,
      sentiment: rentBurden > 30 ? 'negative' : 'positive',
    });
  }

  // 4. Homeownership context
  if (avgHome != null && avgIncome != null && avgIncome > 0) {
    const priceToIncome = (avgHome / avgIncome).toFixed(1);
    insights.push({
      text: `The average median home value in ${stateName} is $${avgHome.toLocaleString()}, a ${priceToIncome}x price-to-income ratio. ${Number(priceToIncome) > 6 ? 'Homeownership is a stretch for median earners without significant savings or dual incomes.' : Number(priceToIncome) < 3.5 ? 'This is favorable for first-time homebuyers — a median-income household can realistically afford a median-priced home.' : 'This is within a typical range, though individual city markets vary widely.'}`,
      sentiment: Number(priceToIncome) > 6 ? 'negative' : Number(priceToIncome) < 3.5 ? 'positive' : 'neutral',
    });
  }

  // 5. City diversity / range
  if (withCost.length >= 3) {
    const costs = withCost.map(c => c.cost_index!).sort((a, b) => a - b);
    const cheapest = costs[0];
    const priciest = costs[costs.length - 1];
    const range = priciest - cheapest;
    if (range > 40) {
      insights.push({
        text: `Cost of living varies dramatically across ${stateName}: from an index of ${cheapest.toFixed(1)} to ${priciest.toFixed(1)} (a ${range.toFixed(0)}-point spread). Choosing the right city within the state can save thousands of dollars per year.`,
        sentiment: 'neutral',
      });
    } else {
      insights.push({
        text: `Living costs across ${stateName} cities are relatively uniform, ranging from ${cheapest.toFixed(1)} to ${priciest.toFixed(1)} on the cost index. City choice within the state matters less for cost and more for job access, schools, and lifestyle.`,
        sentiment: 'neutral',
      });
    }
  }

  return insights;
}
