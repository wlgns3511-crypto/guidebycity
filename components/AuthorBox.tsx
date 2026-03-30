export function AuthorBox() {
  return (
    <div className="mt-10 flex gap-4 p-5 bg-blue-50 border-blue-200 border rounded-xl">
      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
        <span>🏙️</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-slate-900 text-sm">City Research Team</span>
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">Urban Data Specialists</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">Our analysts compile and verify city-level economic and demographic data from multiple authoritative government sources, ensuring accurate cost of living, income, and housing metrics for 380+ US metropolitan areas.</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">✓ US Census Bureau</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">✓ Bureau of Labor Statistics</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">✓ Cost of Living Indexes</span>
        </div>
      </div>
    </div>
  );
}
