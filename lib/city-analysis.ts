/**
 * City livability analysis from cost, income, and weather data
 */

const US_AVG = {
  cost_index: 100,
  median_income: 75149,
  median_rent: 1163,
  median_home: 281900,
};

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

interface WeatherMonth { avg_high: number; avg_low: number; precip_mm: number }

export interface CityAnalysis {
  summary: string;
  pros: string[];
  cons: string[];
  climateNote: string;
  bestTimeToVisit: string;
  whoShouldLive: string[];
}

function fmtDollar(v: number | null): string {
  return v ? `$${v.toLocaleString("en-US")}` : "N/A";
}

export function analyzeCity(
  c: CityData,
  weather: Record<string, WeatherMonth> | null
): CityAnalysis {
  const cost = c.cost_index || 100;
  const housing = c.housing_index || 100;
  const income = c.median_income || 0;
  const rent = c.median_rent || 0;

  // Pros
  const pros: string[] = [];
  if (cost < 95) pros.push(`Cost of living is ${(100 - cost).toFixed(1)}% below the national average`);
  if (housing < 90) pros.push(`Housing is very affordable compared to most US cities`);
  if (income > US_AVG.median_income * 1.2) pros.push(`Higher than average incomes (${fmtDollar(c.median_income)})`);
  if (rent > 0 && rent < 900) pros.push(`Low rent at ${fmtDollar(c.median_rent)}/month`);
  if (c.goods_index && c.goods_index < 97) pros.push(`Everyday goods are cheaper than average`);

  // Weather pros
  if (weather) {
    const months = Object.values(weather);
    const avgHigh = months.reduce((s, m) => s + m.avg_high, 0) / months.length;
    const freezingMonths = months.filter(m => m.avg_low < 32).length;
    const hotMonths = months.filter(m => m.avg_high > 90).length;
    if (avgHigh >= 65 && avgHigh <= 80 && freezingMonths <= 2) pros.push("Mild, pleasant climate year-round");
    if (freezingMonths === 0) pros.push("No freezing temperatures — great for outdoor activities");
    if (hotMonths <= 1 && avgHigh < 85) pros.push("Comfortable summers without extreme heat");
  }

  // Cons
  const cons: string[] = [];
  if (cost > 110) cons.push(`Cost of living is ${(cost - 100).toFixed(1)}% above the national average`);
  if (housing > 130) cons.push(`Housing costs are significantly above average`);
  if (rent > 2000) cons.push(`High rent at ${fmtDollar(c.median_rent)}/month`);
  if (income < US_AVG.median_income * 0.8) cons.push(`Below-average median income (${fmtDollar(c.median_income)})`);
  if (c.utilities_index && c.utilities_index > 110) cons.push(`Utility costs are above average`);

  if (weather) {
    const months = Object.values(weather);
    const freezingMonths = months.filter(m => m.avg_low < 32).length;
    const hotMonths = months.filter(m => m.avg_high > 95).length;
    const rainyMonths = months.filter(m => m.precip_mm > 100).length;
    if (freezingMonths >= 4) cons.push(`Long, cold winters (${freezingMonths} months below freezing)`);
    if (hotMonths >= 3) cons.push(`Extreme summer heat (${hotMonths} months above 95°F)`);
    if (rainyMonths >= 6) cons.push(`Frequent rainfall throughout the year`);
  }

  // Climate note
  let climateNote = "";
  let bestTimeToVisit = "";
  if (weather) {
    const entries = Object.entries(weather).sort(([a], [b]) => Number(a) - Number(b));
    const months = entries.map(([, w]) => w);
    const avgHighs = months.map(m => m.avg_high);
    const warmest = avgHighs.indexOf(Math.max(...avgHighs));
    const coolest = avgHighs.indexOf(Math.min(...avgHighs));
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    climateNote = `${c.short_name}'s warmest month is ${monthNames[warmest]} (avg high: ${months[warmest].avg_high}°F) and coolest month is ${monthNames[coolest]} (avg high: ${months[coolest].avg_high}°F).`;

    // Best time: months with high between 65-85
    const pleasant = entries.filter(([, w]) => w.avg_high >= 60 && w.avg_high <= 85 && w.precip_mm < 120);
    if (pleasant.length > 0) {
      const first = monthNames[Number(pleasant[0][0]) - 1];
      const last = monthNames[Number(pleasant[pleasant.length - 1][0]) - 1];
      bestTimeToVisit = `The best time to visit ${c.short_name} is ${first} through ${last}, when temperatures are comfortable and rainfall is moderate.`;
    }
  }

  // Who should live here
  const whoShouldLive: string[] = [];
  if (cost < 95 && income > 50000) whoShouldLive.push("Budget-conscious families");
  if (cost > 110 && income > US_AVG.median_income * 1.3) whoShouldLive.push("High-earning professionals");
  if (rent < 1000) whoShouldLive.push("Young professionals & students");
  if (c.median_home_value && c.median_home_value < 200000) whoShouldLive.push("First-time homebuyers");
  if (weather) {
    const months = Object.values(weather);
    const freezing = months.filter(m => m.avg_low < 32).length;
    if (freezing === 0) whoShouldLive.push("Retirees seeking warm weather");
    if (freezing >= 3) whoShouldLive.push("Winter sports enthusiasts");
  }
  if (whoShouldLive.length === 0) whoShouldLive.push("A wide range of residents");

  // Summary
  const costLabel = cost > 105 ? "above" : cost < 95 ? "below" : "near";
  const parts = [
    `${c.short_name} has a cost of living ${costLabel} the national average (index: ${cost.toFixed(1)}).`,
    income > 0 ? `The median household income is ${fmtDollar(c.median_income)}.` : "",
    pros.length > 0 ? `Key advantage: ${pros[0].toLowerCase()}.` : "",
    climateNote,
  ].filter(Boolean);

  return { summary: parts.join(" "), pros, cons, climateNote, bestTimeToVisit, whoShouldLive };
}
