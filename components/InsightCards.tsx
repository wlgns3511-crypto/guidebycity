import { getCostRank, getIncomeRank, getNationalAvgIncome, getNationalAvgCost } from "@/lib/db";
import type { City } from "@/lib/db";

interface Props {
  city: City;
}

export function InsightCards({ city }: Props) {
  const costRank = getCostRank(city.slug);
  const incomeRank = getIncomeRank(city.slug);
  const nationalAvgIncome = getNationalAvgIncome();
  const nationalAvgCost = getNationalAvgCost();

  // Livability score heuristic
  const livability = (() => {
    let score = 50;
    if (city.cost_index != null) {
      if (city.cost_index < 90) score += 20;
      else if (city.cost_index < 100) score += 10;
      else if (city.cost_index > 120) score -= 15;
      else if (city.cost_index > 110) score -= 5;
    }
    if (city.median_income != null && nationalAvgIncome > 0) {
      const incomeRatio = city.median_income / nationalAvgIncome;
      if (incomeRatio > 1.3) score += 15;
      else if (incomeRatio > 1.1) score += 10;
      else if (incomeRatio < 0.7) score -= 10;
    }
    if (city.population != null) {
      if (city.population > 100000) score += 5;
    }
    return Math.max(0, Math.min(100, score));
  })();
  const livLabel = livability >= 75 ? "Excellent" : livability >= 60 ? "Good" : livability >= 45 ? "Average" : "Below Avg";
  const livColor = livability >= 75 ? "text-teal-700" : livability >= 60 ? "text-green-600" : livability >= 45 ? "text-yellow-600" : "text-red-600";

  // Cost tier
  const costTier = city.cost_index != null
    ? city.cost_index > 130 ? "Very Expensive" : city.cost_index > 110 ? "Above Average" : city.cost_index > 90 ? "Average" : city.cost_index > 70 ? "Affordable" : "Very Affordable"
    : null;
  const costColor = city.cost_index != null
    ? city.cost_index > 130 ? "text-red-600" : city.cost_index > 110 ? "text-orange-600" : city.cost_index > 90 ? "text-yellow-600" : "text-teal-700"
    : "text-slate-500";

  // Size category
  const sizeCategory = city.population != null
    ? city.population > 500000 ? "Major City" : city.population > 100000 ? "Large City" : city.population > 50000 ? "Mid-Size" : city.population > 10000 ? "Small City" : "Town"
    : null;

  const cards: { label: string; value: string; sub: string; color: string }[] = [];

  cards.push({
    label: "Livability",
    value: `${livability}`,
    sub: livLabel,
    color: livColor,
  });

  if (costTier && costRank.rank > 0) {
    cards.push({
      label: "Cost Tier",
      value: costTier.split(" ").length > 1 ? costTier.split(" ").map(w => w[0]).join("") : costTier,
      sub: `#${costRank.rank} of ${costRank.total} cities`,
      color: costColor,
    });
  }

  if (incomeRank.rank > 0 && city.median_income) {
    const vsAvg = Math.round(((city.median_income - nationalAvgIncome) / nationalAvgIncome) * 100);
    cards.push({
      label: "Income Rank",
      value: `#${incomeRank.rank}`,
      sub: `${vsAvg > 0 ? "+" : ""}${vsAvg}% vs national avg`,
      color: incomeRank.rank <= incomeRank.total * 0.25 ? "text-teal-700" : incomeRank.rank <= incomeRank.total * 0.5 ? "text-green-600" : "text-yellow-600",
    });
  }

  if (sizeCategory && city.population) {
    cards.push({
      label: "Size",
      value: sizeCategory,
      sub: `Pop. ${city.population.toLocaleString("en-US")}`,
      color: "text-teal-700",
    });
  }

  if (cards.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-teal-900 mb-3">City Insights</h2>
      <div className={`grid grid-cols-2 ${cards.length >= 4 ? "sm:grid-cols-4" : `sm:grid-cols-${cards.length}`} gap-3`}>
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
