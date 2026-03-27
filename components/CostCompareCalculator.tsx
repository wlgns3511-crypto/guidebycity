"use client";

import { useState, useMemo } from "react";

interface Props {
  cityName: string;
  defaultCostIndex: number;
}

export function CostCompareCalculator({ cityName, defaultCostIndex }: Props) {
  const [salary, setSalary] = useState(65000);
  const [currentIndex, setCurrentIndex] = useState(defaultCostIndex);
  const [targetIndex, setTargetIndex] = useState(100);
  const [housingPct, setHousingPct] = useState(30);

  const results = useMemo(() => {
    const ratio = targetIndex / currentIndex;
    const equivalentSalary = Math.round(salary * ratio);
    const monthlyDiff = Math.round((equivalentSalary - salary) / 12);
    const annualImpact = equivalentSalary - salary;
    const currentHousing = Math.round((salary * housingPct) / 100 / 12);
    const targetHousing = Math.round((equivalentSalary * housingPct) / 100 / 12);
    return { equivalentSalary, monthlyDiff, annualImpact, currentHousing, targetHousing };
  }, [salary, currentIndex, targetIndex, housingPct]);

  const maxIdx = Math.max(currentIndex, targetIndex, 100);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4">Cost of Living Comparison Calculator</h2>
      <div className="bg-teal-50 rounded-xl border border-teal-100 p-6">
        {/* Inputs */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Current Annual Salary</span>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value) || 0)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Current City Cost Index</span>
            <input
              type="number"
              step="0.1"
              value={currentIndex}
              onChange={(e) => setCurrentIndex(Number(e.target.value) || 100)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Target City Cost Index</span>
            <input
              type="number"
              step="0.1"
              value={targetIndex}
              onChange={(e) => setTargetIndex(Number(e.target.value) || 100)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <span className="text-xs text-slate-400 mt-1 block">100 = national average</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Housing Budget %</span>
            <input
              type="number"
              min={1}
              max={100}
              value={housingPct}
              onChange={(e) => setHousingPct(Math.min(100, Math.max(1, Number(e.target.value) || 30)))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </label>
        </div>

        {/* Visual bar comparison */}
        <div className="mb-6 space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>{cityName} (Index: {currentIndex})</span>
              <span>${salary.toLocaleString()}</span>
            </div>
            <div className="h-5 bg-white rounded-full overflow-hidden border border-teal-200">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{ width: `${Math.min((currentIndex / maxIdx) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Target City (Index: {targetIndex})</span>
              <span>${results.equivalentSalary.toLocaleString()}</span>
            </div>
            <div className="h-5 bg-white rounded-full overflow-hidden border border-teal-200">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min((targetIndex / maxIdx) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 text-center border border-teal-100">
            <div className="text-xs text-slate-500 mb-1">Equivalent Salary Needed</div>
            <div className="text-lg font-bold text-teal-700">${results.equivalentSalary.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-teal-100">
            <div className="text-xs text-slate-500 mb-1">Monthly Difference</div>
            <div className={`text-lg font-bold ${results.monthlyDiff > 0 ? "text-red-600" : "text-green-600"}`}>
              {results.monthlyDiff > 0 ? "+" : ""}${results.monthlyDiff.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-teal-100">
            <div className="text-xs text-slate-500 mb-1">Annual Savings Impact</div>
            <div className={`text-lg font-bold ${results.annualImpact > 0 ? "text-red-600" : "text-green-600"}`}>
              {results.annualImpact > 0 ? "+" : ""}${results.annualImpact.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-teal-100">
            <div className="text-xs text-slate-500 mb-1">Housing Budget /mo</div>
            <div className="text-sm font-bold text-slate-700">
              ${results.currentHousing.toLocaleString()} → ${results.targetHousing.toLocaleString()}
            </div>
          </div>
        </div>

        {/* High-CPC footer */}
        <div className="border-t border-teal-200 pt-4">
          <p className="text-xs text-slate-500 mb-2">Planning a move? Explore these resources:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 bg-white rounded-full border border-slate-200 text-slate-600">Auto Insurance Quotes</span>
            <span className="px-2.5 py-1 bg-white rounded-full border border-slate-200 text-slate-600">Moving Company Estimates</span>
            <span className="px-2.5 py-1 bg-white rounded-full border border-slate-200 text-slate-600">Apartment Search Tools</span>
            <span className="px-2.5 py-1 bg-white rounded-full border border-slate-200 text-slate-600">Utility Cost Comparison</span>
          </div>
        </div>
      </div>
    </section>
  );
}
