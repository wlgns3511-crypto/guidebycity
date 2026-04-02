/** Pure CSS bar chart — cost of living index vs national avg (100) */
export function CostBreakdownBar({
  housing,
  goods,
  utilities,
  costIndex,
}: {
  housing: number | null;
  goods: number | null;
  utilities: number | null;
  costIndex: number | null;
}) {
  const items = [
    { label: 'Overall', value: costIndex },
    { label: 'Housing', value: housing },
    { label: 'Goods & Groceries', value: goods },
    { label: 'Utilities', value: utilities },
  ].filter((d) => d.value != null) as { label: string; value: number }[];

  if (items.length === 0) return null;

  const maxVal = Math.max(...items.map((d) => d.value), 120);

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-1">Cost Index Comparison</h2>
      <p className="text-xs text-slate-500 mb-4">
        National average = 100. Values above 100 mean higher than average cost.
      </p>
      <div className="space-y-3">
        {items.map((d) => {
          const pct = Math.round((d.value / maxVal) * 100);
          const avgPct = Math.round((100 / maxVal) * 100);
          const above = d.value >= 100;
          return (
            <div key={d.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">{d.label}</span>
                <span className={above ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {d.value.toFixed(1)}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({above ? '+' : ''}{(d.value - 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${above ? 'bg-red-400' : 'bg-green-400'}`}
                  style={{ width: `${pct}%` }}
                />
                {/* National avg marker */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-slate-800 opacity-60"
                  style={{ left: `${avgPct}%` }}
                  title="National avg (100)"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-400" /> Below avg
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-400" /> Above avg
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-slate-800 opacity-60" /> National avg (100)
        </span>
      </div>
    </section>
  );
}
