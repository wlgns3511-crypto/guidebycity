import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllZipGuides, getZipGuideBySlug, getZipGuidesByState } from "@/lib/db";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { AdSlot } from "@/components/AdSlot";
import { FreshnessTag } from "@/components/FreshnessTag";

interface Props { params: Promise<{ slug: string }> }

function fmt(v: number | null): string { return v ? '$' + v.toLocaleString('en-US') : 'N/A'; }
function fmtPct(v: number | null): string { return v !== null && v !== undefined ? v.toFixed(1) + '%' : 'N/A'; }

export const dynamicParams = true;
export const revalidate = 86400; // 24 hours

export async function generateStaticParams() {
  // Only pre-render top 500 by population; rest served via ISR
  const zips = getAllZipGuides().slice(0, 500);
  return zips.map((z) => ({ slug: z.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const z = getZipGuideBySlug(slug);
  if (!z) return {};
  return {
    title: `${z.zip_code} ${z.city}, ${z.state} - Demographics, Income & Housing Guide`,
    description: `${z.zip_code} ${z.city}, ${z.state}: median income ${fmt(z.median_income)}, median rent ${fmt(z.median_rent)}, home value ${fmt(z.median_home_value)}. Population${z.population ? ': ' + z.population.toLocaleString() : ' data'}, poverty rate ${fmtPct(z.poverty_rate)}.`,
    alternates: { canonical: `/zip/${slug}` },
  };
}

export default async function ZipGuidePage({ params }: Props) {
  const { slug } = await params;
  const z = getZipGuideBySlug(slug);
  if (!z) notFound();

  const nearbyZips = getZipGuidesByState(z.state)
    .filter((nz) => nz.zip_code !== z.zip_code)
    .slice(0, 12);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: z.state, href: `/state/${z.state.toLowerCase()}/` },
    { label: `${z.zip_code} ${z.city}` },
  ];

  const faqs = [
    {
      question: `What is the median income in ${z.zip_code} ${z.city}?`,
      answer: `The median household income in ${z.zip_code} ${z.city}, ${z.state} is ${fmt(z.median_income)} per year.`,
    },
    {
      question: `What is the average rent in ${z.zip_code}?`,
      answer: `The median monthly rent in ${z.zip_code} ${z.city}, ${z.state} is ${fmt(z.median_rent)}.`,
    },
    {
      question: `What is the population of ${z.zip_code}?`,
      answer: z.population
        ? `The population of ${z.zip_code} ${z.city}, ${z.state} is approximately ${z.population.toLocaleString()}.`
        : `Population data for ${z.zip_code} is not currently available.`,
    },
  ];

  return (
    <article className="max-w-4xl mx-auto">
      <nav className="text-sm text-slate-500 mb-4">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && " › "}
            {c.href ? <a href={c.href} className="hover:text-teal-700">{c.label}</a> : c.label}
          </span>
        ))}
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(crumbs.map(c => ({ name: c.label, url: c.href || "" })))) }} />

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-teal-700 mb-3">
          {z.zip_code} {z.city}, {z.state} — Neighborhood Guide
        </h1>
        <FreshnessTag source="U.S. Census Bureau, ACS 5-Year Estimates" />
      </header>

      <AdSlot id="top" />

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {z.population && (
          <div className="bg-teal-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-teal-700">{z.population.toLocaleString()}</div>
            <div className="text-xs text-slate-500">Population</div>
          </div>
        )}
        <div className="bg-teal-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-teal-700">{fmt(z.median_income)}</div>
          <div className="text-xs text-slate-500">Median Income</div>
        </div>
        <div className="bg-teal-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-teal-700">{fmt(z.median_rent)}</div>
          <div className="text-xs text-slate-500">Median Rent</div>
        </div>
        <div className="bg-teal-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-teal-700">{fmt(z.median_home_value)}</div>
          <div className="text-xs text-slate-500">Home Value</div>
        </div>
      </div>

      {/* Demographics table */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Demographics & Economy</h2>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="px-4 py-3 font-medium">Median Age</td><td className="px-4 py-3 text-right">{z.median_age ?? 'N/A'}</td></tr>
              <tr className="border-b bg-slate-50/50"><td className="px-4 py-3 font-medium">Poverty Rate</td><td className="px-4 py-3 text-right">{fmtPct(z.poverty_rate)}</td></tr>
              <tr className="border-b"><td className="px-4 py-3 font-medium">Bachelor&apos;s Degree or Higher</td><td className="px-4 py-3 text-right">{fmtPct(z.bachelors_pct)}</td></tr>
              <tr className="border-b bg-slate-50/50"><td className="px-4 py-3 font-medium">Homeownership Rate</td><td className="px-4 py-3 text-right">{fmtPct(z.homeowner_rate)}</td></tr>
              <tr><td className="px-4 py-3 font-medium">Unemployment Rate</td><td className="px-4 py-3 text-right">{fmtPct(z.unemployment_rate)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <AdSlot id="middle" />

      {/* Housing */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Housing</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-lg p-5">
            <div className="text-sm text-slate-500">Median Home Value</div>
            <div className="text-2xl font-bold text-teal-700 mt-1">{fmt(z.median_home_value)}</div>
          </div>
          <div className="border border-slate-200 rounded-lg p-5">
            <div className="text-sm text-slate-500">Median Monthly Rent</div>
            <div className="text-2xl font-bold text-teal-700 mt-1">{fmt(z.median_rent)}</div>
            {z.median_rent && z.median_income && (
              <div className="text-xs text-slate-400 mt-1">
                {((z.median_rent * 12 / z.median_income) * 100).toFixed(1)}% of income spent on rent
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Nearby ZIPs */}
      {nearbyZips.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Other ZIP Codes in {z.state}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {nearbyZips.map((nz) => (
              <a key={nz.zip_code} href={`/zip/${nz.slug}/`}
                className="block p-3 border border-slate-200 rounded-lg hover:border-teal-300 hover:shadow-sm transition-all text-sm">
                <span className="font-medium text-teal-700">{nz.zip_code}</span>{" "}
                <span className="text-slate-600">{nz.city}</span>
                <div className="text-xs text-slate-400 mt-1">Income: {fmt(nz.median_income)}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      <AdSlot id="bottom" />

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="border border-slate-200 rounded-lg">
              <summary className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-50">{faq.question}</summary>
              <p className="px-4 pb-3 text-sm text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
