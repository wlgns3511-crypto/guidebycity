import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCitiesByState, getAllStates } from "@/lib/db";
interface Props { params: Promise<{ slug: string }> }
export function generateStaticParams() { return getAllStates().map((s) => ({ slug: s.toLowerCase() })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Cities in ${slug.toUpperCase()}`, description: `Browse cities in ${slug.toUpperCase()} with cost of living and income data.` };
}
export default async function StatePage({ params }: Props) {
  const { slug } = await params;
  const state = slug.toUpperCase();
  const cities = getCitiesByState(state);
  if (cities.length === 0) notFound();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Cities in {state}</h1>
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        {cities.map((c) => (
          <a key={c.slug} href={`/city/${c.slug}`} className="flex justify-between p-3 border rounded-lg hover:bg-teal-50">
            <span>{c.short_name}</span>
            <span className="text-slate-400">{c.cost_index ? c.cost_index.toFixed(1) : '-'}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
