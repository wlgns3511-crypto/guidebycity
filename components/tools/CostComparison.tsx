"use client";

import { useState, useMemo } from "react";

interface CostComparisonProps {
  cityName: string;
  costIndex: number;
  housingIndex: number | null;
  goodsIndex: number | null;
  utilitiesIndex: number | null;
  medianIncome: number | null;
  medianRent: number | null;
}

export function CostComparison({
  cityName,
  costIndex,
  housingIndex,
  goodsIndex,
  utilitiesIndex,
  medianIncome,
  medianRent,
}: CostComparisonProps) {
  const [currentIncome, setCurrentIncome] = useState(
    medianIncome ? Math.round(medianIncome / 5000) * 5000 : 65000
  );

  const results = useMemo(() => {
    const ratio = costIndex / 100;
    const requiredIncome = Math.round(currentIncome * ratio);
    const diff = requiredIncome - currentIncome;
    const monthlyRequired = Math.round(requiredIncome / 12);
    const monthlyCurrent = Math.round(currentIncome / 12);

    // Monthly breakdown based on typical US budget proportions
    // Housing ~33%, Food ~13%, Transport ~16%, Healthcare ~8%, Utilities ~6%, Other ~24%
    const hIdx = housingIndex ?? costIndex;
    const gIdx = goodsIndex ?? costIndex;
    const uIdx = utilitiesIndex ?? costIndex;

    // Base amounts on a $65K national average baseline
    const baseMonthly = currentIncome / 12;
    const housing = Math.round(baseMonthly * 0.33 * (hIdx / 100));
    const food = Math.round(baseMonthly * 0.13 * (gIdx / 100));
    const transport = Math.round(baseMonthly * 0.16 * (costIndex / 100));
    const healthcare = Math.round(baseMonthly * 0.08 * (costIndex / 100));
    const utilities = Math.round(baseMonthly * 0.06 * (uIdx / 100));
    const other = Math.round(baseMonthly * 0.24 * (costIndex / 100));
    const totalExpenses = housing + food + transport + healthcare + utilities + other;
    const surplus = monthlyCurrent - totalExpenses;

    return {
      requiredIncome,
      diff,
      monthlyRequired,
      monthlyCurrent,
      housing,
      food,
      transport,
      healthcare,
      utilities,
      other,
      totalExpenses,
      surplus,
    };
  }, [currentIncome, costIndex, housingIndex, goodsIndex, utilitiesIndex]);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const maxBar = Math.max(results.monthlyCurrent, results.monthlyRequired);

  return (
    <section className="mt-8 mb-6">
      <h2 className="text-xl font-bold mb-4">Cost of Living Calculator</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <p className="text-sm text-slate-500 mb-5">
          Enter your current annual income to see how far it goes in {cityName} compared to the national average.
        </p>

        {/* Income Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Your Current Annual Income: {fmt(currentIncome)}
          </label>
          <input
            type="range"
            min={30000}
            max={200000}
            step={5000}
            value={currentIncome}
            onChange={(e) => setCurrentIncome(Number(e.target.value))}
            className="w-full accent-teal-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>$30K</span>
            <span>$200K</span>
          </div>
        </div>

        {/* Key Result */}
        <div className={`rounded-lg p-4 mb-6 ${
          results.diff <= 0 ? "bg-green-50 border border-green-200" :
          results.diff <= currentIncome * 0.15 ? "bg-amber-50 border border-amber-200" :
          "bg-red-50 border border-red-200"
        }`}>
          <p className={`text-lg font-bold ${
            results.diff <= 0 ? "text-green-700" :
            results.diff <= currentIncome * 0.15 ? "text-amber-700" :
            "text-red-700"
          }`}>
            To maintain your lifestyle in {cityName}, you&apos;d need {fmt(results.requiredIncome)}/year.
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {results.diff > 0
              ? `That's ${fmt(results.diff)} more than your current income (${fmt(Math.round(results.diff / 12))}/mo extra needed).`
              : results.diff < 0
                ? `That's ${fmt(Math.abs(results.diff))} less than you earn now — you'd save ${fmt(Math.round(Math.abs(results.diff) / 12))}/mo.`
                : `That matches your current income exactly.`}
          </p>
        </div>

        {/* Income vs Required Bars */}
        <div className="space-y-3 mb-6">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Your Monthly Income</span>
              <span className="font-medium">{fmt(results.monthlyCurrent)}</span>
            </div>
            <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all flex items-center justify-end pr-2"
                style={{ width: `${maxBar > 0 ? (results.monthlyCurrent / maxBar) * 100 : 0}%` }}
              >
                <span className="text-xs text-white font-medium">{fmt(results.monthlyCurrent)}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Required in {cityName}</span>
              <span className="font-medium">{fmt(results.monthlyRequired)}</span>
            </div>
            <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all flex items-center justify-end pr-2 ${
                  results.diff <= 0 ? "bg-green-500" : "bg-amber-500"
                }`}
                style={{ width: `${maxBar > 0 ? (results.monthlyRequired / maxBar) * 100 : 0}%` }}
              >
                <span className="text-xs text-white font-medium">{fmt(results.monthlyRequired)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Estimated Monthly Breakdown in {cityName}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-2.5 text-left font-semibold border border-slate-200">Category</th>
                  <th className="p-2.5 text-right font-semibold border border-slate-200">Index</th>
                  <th className="p-2.5 text-right font-semibold border border-slate-200">Est. Monthly</th>
                  <th className="p-2.5 text-right font-semibold border border-slate-200">% of Income</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Housing", value: results.housing, idx: housingIndex ?? costIndex, pct: 33, color: "bg-teal-500" },
                  { label: "Transportation", value: results.transport, idx: costIndex, pct: 16, color: "bg-blue-500" },
                  { label: "Food & Groceries", value: results.food, idx: goodsIndex ?? costIndex, pct: 13, color: "bg-amber-500" },
                  { label: "Healthcare", value: results.healthcare, idx: costIndex, pct: 8, color: "bg-red-400" },
                  { label: "Utilities", value: results.utilities, idx: utilitiesIndex ?? costIndex, pct: 6, color: "bg-purple-500" },
                  { label: "Other", value: results.other, idx: costIndex, pct: 24, color: "bg-slate-400" },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-slate-100">
                    <td className="p-2.5 border border-slate-200">
                      <span className="flex items-center gap-2">
                        <span className={`inline-block w-3 h-3 rounded-sm ${row.color}`} />
                        {row.label}
                      </span>
                    </td>
                    <td className={`p-2.5 text-right border border-slate-200 ${row.idx > 100 ? "text-red-600" : "text-green-600"}`}>
                      {row.idx.toFixed(1)}
                    </td>
                    <td className="p-2.5 text-right font-medium border border-slate-200">{fmt(row.value)}</td>
                    <td className="p-2.5 text-right text-slate-500 border border-slate-200">
                      {results.monthlyCurrent > 0 ? ((row.value / results.monthlyCurrent) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="p-2.5 border border-slate-200">Total Expenses</td>
                  <td className="p-2.5 text-right border border-slate-200">{costIndex.toFixed(1)}</td>
                  <td className="p-2.5 text-right border border-slate-200">{fmt(results.totalExpenses)}</td>
                  <td className="p-2.5 text-right border border-slate-200">
                    {results.monthlyCurrent > 0 ? ((results.totalExpenses / results.monthlyCurrent) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Surplus / Deficit */}
        <div className={`rounded-lg p-4 mb-4 ${results.surplus >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Monthly Surplus / Deficit</span>
            <span className={`text-xl font-bold ${results.surplus >= 0 ? "text-green-700" : "text-red-700"}`}>
              {results.surplus >= 0 ? "+" : ""}{fmt(results.surplus)}/mo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {results.surplus >= 0
              ? `On your income, you'd have roughly ${fmt(results.surplus)} left each month after typical expenses in ${cityName}.`
              : `On your income, you'd need an extra ${fmt(Math.abs(results.surplus))}/mo to cover typical expenses in ${cityName}.`}
          </p>
        </div>

        {/* Rent reality check */}
        {medianRent && (
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Median Rent in {cityName}</span>
              <span className="text-lg font-bold text-slate-800">{fmt(medianRent)}/mo</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              That&apos;s {results.monthlyCurrent > 0 ? ((medianRent / results.monthlyCurrent) * 100).toFixed(1) : "N/A"}% of
              your monthly income. Lenders recommend keeping housing below 30%.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Estimates are based on the BEA Regional Price Parities index for {cityName} (index {costIndex.toFixed(1)} vs national baseline of 100)
            and typical US household budget proportions. Individual costs vary by lifestyle, household size, and spending habits.
            Housing, goods, and utility sub-indexes are used where available. Source: Census ACS, BEA RPP, BLS CPI.
          </p>
        </div>
      </div>
    </section>
  );
}
