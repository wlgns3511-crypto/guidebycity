import { getAllCities } from "@/lib/db";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "All Cities", description: "Browse 380+ US cities with cost of living and income data." };
export default function CitiesPage() {
  const cities = getAllCities();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">All Cities ({cities.length})</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
        {cities.map((c) => (
          <a key={c.slug} href={`/city/${c.slug}`} className="p-2 border border-slate-100 rounded hover:bg-teal-50">
            {c.short_name}
          </a>
        ))}
      </div>
    </div>
  );
}
