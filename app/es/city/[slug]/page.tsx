import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCityBySlug, getAllCities, getWeather, monthName } from "@/lib/db";
import { analyzeCity } from "@/lib/city-analysis";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AdSlot } from "@/components/AdSlot";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://guidebycity.com";

interface Props { params: Promise<{ slug: string }> }

function fmt(v: number | null): string { return v ? '$' + v.toLocaleString('en-US') : 'N/A'; }
function fmtIdx(v: number | null): string { return v ? v.toFixed(1) : 'N/A'; }

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  return getAllCities().slice(0, 300).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCityBySlug(slug);
  if (!c) return {};
  return {
    title: `${c.short_name} - Guía de la Ciudad, Costo de Vida e Ingresos`,
    description: `Guía de ${c.short_name}: costo de vida ${fmtIdx(c.cost_index)}, ingreso mediano ${fmt(c.median_income)}, alquiler mediano ${fmt(c.median_rent)}.`,
    alternates: {
      canonical: `${SITE_URL}/es/city/${slug}/`,
      languages: { en: `${SITE_URL}/city/${slug}/`, es: `${SITE_URL}/es/city/${slug}/` },
    },
  };
}

export default async function EsCityPage({ params }: Props) {
  const { slug } = await params;
  const c = getCityBySlug(slug);
  if (!c) notFound();
  const t = await getDictionary("es");

  const weather = getWeather(c);
  const analysis = analyzeCity(c, weather);

  return (
    <div>
      <nav className="text-sm text-slate-500 mb-4">
        <a href="/es/" className="hover:underline">Inicio</a> / <span className="text-slate-800">{c.short_name}</span>
      </nav>

      <div className="mb-4">
        <a href={`/city/${slug}`} className="text-teal-600 hover:underline text-sm">{t.viewInEnglish}</a>
      </div>

      <h1 className="text-3xl font-bold mb-2">{t.cityGuide}: {c.short_name}</h1>
      <p className="text-slate-500 mb-6">{c.name}</p>

      {/* Key metrics */}
      <div className="bg-teal-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {c.cost_index && <div><div className="text-sm text-slate-500">{t.costOfLiving}</div><div className={`text-2xl font-bold ${c.cost_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.cost_index)}</div></div>}
          {c.median_income && <div><div className="text-sm text-slate-500">{t.medianIncome}</div><div className="text-2xl font-bold">{fmt(c.median_income)}</div></div>}
          {c.median_rent && <div><div className="text-sm text-slate-500">{t.medianRent}</div><div className="text-2xl font-bold">{fmt(c.median_rent)}/mes</div></div>}
          {c.median_home_value && <div><div className="text-sm text-slate-500">{t.medianHome}</div><div className="text-2xl font-bold">{fmt(c.median_home_value)}</div></div>}
        </div>
      </div>

      <AdSlot id="city-top" />

      {/* City Overview */}
      <section className="mb-6">
        <h2 className="text-xl font-bold mb-3">{t.livingIn} {c.short_name}</h2>
        <div className="bg-teal-50 border-l-4 border-teal-400 p-4 rounded-r-lg">
          <p className="text-slate-700 text-sm">{analysis.summary}</p>
        </div>
      </section>

      {/* Pros / Cons */}
      {(analysis.pros.length > 0 || analysis.cons.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {analysis.pros.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 mb-2">{t.pros}</h3>
              <ul className="space-y-1">
                {analysis.pros.map((p, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">{"\u2713"}</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.cons.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-2">{t.cons}</h3>
              <ul className="space-y-1">
                {analysis.cons.map((con, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">{"\u2717"}</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Best For */}
      {analysis.whoShouldLive.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3">{t.bestFor}</h2>
          <div className="flex flex-wrap gap-2">
            {analysis.whoShouldLive.map((w, i) => (
              <span key={i} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200">{w}</span>
            ))}
          </div>
        </section>
      )}

      {/* Cost Breakdown */}
      {(c.housing_index || c.goods_index || c.utilities_index) && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">{t.costBreakdown}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {c.housing_index && <div className="border rounded-lg p-4 text-center"><div className="text-sm text-slate-500">{t.housing}</div><div className={`text-xl font-bold ${c.housing_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.housing_index)}</div></div>}
            {c.goods_index && <div className="border rounded-lg p-4 text-center"><div className="text-sm text-slate-500">{t.goods}</div><div className={`text-xl font-bold ${c.goods_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.goods_index)}</div></div>}
            {c.utilities_index && <div className="border rounded-lg p-4 text-center"><div className="text-sm text-slate-500">{t.utilities}</div><div className={`text-xl font-bold ${c.utilities_index > 100 ? 'text-red-600' : 'text-green-600'}`}>{fmtIdx(c.utilities_index)}</div></div>}
          </div>
        </section>
      )}

      <AdSlot id="city-mid" />

      {/* Weather */}
      {weather && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">{t.climate}: {c.short_name}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-slate-100">
                <th className="p-2 text-left">Mes</th>
                <th className="p-2 text-right">M&aacute;xima</th>
                <th className="p-2 text-right">M&iacute;nima</th>
                <th className="p-2 text-right">Precipitaci&oacute;n</th>
              </tr></thead>
              <tbody>
                {Object.entries(weather).sort(([a],[b]) => Number(a) - Number(b)).map(([m, w]) => (
                  <tr key={m} className="border-b border-slate-100">
                    <td className="p-2">{monthName(Number(m))}</td>
                    <td className="p-2 text-right text-red-500">{w.avg_high}&deg;F</td>
                    <td className="p-2 text-right text-blue-500">{w.avg_low}&deg;F</td>
                    <td className="p-2 text-right text-slate-500">{(w.precip_mm / 25.4).toFixed(1)} in</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
