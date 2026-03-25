import type { MetadataRoute } from "next";
import { getAllCities, getAllStates, getTopComparisons } from "@/lib/db";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guidebycity.com";
export default function sitemap(): MetadataRoute.Sitemap {
  const cities = getAllCities();
  const states = getAllStates();
  const comparisons = getTopComparisons(3000);
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/city`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.9 },
    ...states.map((s) => ({ url: `${SITE_URL}/state/${s.toLowerCase()}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...cities.map((c) => ({ url: `${SITE_URL}/city/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...comparisons.map((p) => { const [a, b] = [p.slugA, p.slugB].sort(); return { url: `${SITE_URL}/compare/${a}-vs-${b}`, changeFrequency: "monthly" as const, priority: 0.5 }; }),
  ];
}
