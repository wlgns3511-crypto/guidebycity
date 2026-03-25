import { getMostExpensive, getCheapest } from "@/lib/db";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Compare Cities", description: "Compare US cities side by side." };
export default function ComparePage() {
  const exp = getMostExpensive(10); const cheap = getCheapest(10);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Compare Cities</h1>
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        {exp.slice(0, 10).map((a, i) => { const b = cheap[i]; if (!b) return null; const [x, y] = [a.slug, b.slug].sort();
          return (<a key={i} href={`/compare/${x}-vs-${y}`} className="p-3 border rounded-lg hover:bg-teal-50 text-teal-600">{a.short_name} vs {b.short_name}</a>);
        })}
      </div>
    </div>
  );
}
