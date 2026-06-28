/**
 * CityInterpretation — visual surface for the affordability × growth × hazard
 * 3-axis verdict synthesis. Renders the verdict, the three axis paragraphs,
 * and the trade-off narrative.
 *
 * Data shape comes from lib/city-interpretation.ts → interpretCity().
 */

import type { CityInterpretation } from '@/lib/city-interpretation';
import type { AffordabilityTier } from '@/lib/city-affordability-tier';
import type { GrowthBand } from '@/lib/population-growth-band';
import type { HazardTier } from '@/lib/hazard-tier';

const AFF_PILL: Record<AffordabilityTier, string> = {
  Affordable: 'bg-emerald-100 text-emerald-900',
  Modest: 'bg-sky-100 text-sky-900',
  Stretched: 'bg-amber-100 text-amber-900',
  Strained: 'bg-orange-100 text-orange-900',
  Severe: 'bg-rose-100 text-rose-900',
};

const GROWTH_PILL: Record<GrowthBand, string> = {
  Booming: 'bg-emerald-100 text-emerald-900',
  Growing: 'bg-sky-100 text-sky-900',
  Stable: 'bg-slate-100 text-slate-800',
  Slipping: 'bg-amber-100 text-amber-900',
  Shrinking: 'bg-rose-100 text-rose-900',
  Unknown: 'bg-slate-100 text-slate-700',
};

const HAZARD_PILL: Record<HazardTier, string> = {
  Low: 'bg-emerald-100 text-emerald-900',
  Moderate: 'bg-amber-100 text-amber-900',
  Elevated: 'bg-orange-100 text-orange-900',
  High: 'bg-rose-100 text-rose-900',
  Extreme: 'bg-red-200 text-red-900',
};

export interface CityInterpretationProps {
  cityName: string;
  affordabilityTier: AffordabilityTier;
  growthBand: GrowthBand;
  hazardTier: HazardTier;
  interpretation: CityInterpretation;
}

export function CityInterpretationStrip({
  cityName,
  affordabilityTier,
  growthBand,
  hazardTier,
  interpretation,
}: CityInterpretationProps) {
  return (
    <section
      data-upgrade="city-interpretation"
      aria-label={`GuideByCity interpretation strip for ${cityName}`}
      className="mb-8 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-slate-900">
          Reading {cityName} across three axes
        </h2>
        How the 3-axis read works →
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
        <span
          className={`inline-block px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${AFF_PILL[affordabilityTier]}`}
        >
          Affordability · {affordabilityTier}
        </span>
        <span
          className={`inline-block px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${GROWTH_PILL[growthBand]}`}
        >
          Growth · {growthBand}
        </span>
        <span
          className={`inline-block px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${HAZARD_PILL[hazardTier]}`}
        >
          Hazard · {hazardTier}
        </span>
      </div>

      <p className="text-base font-semibold text-slate-900 leading-snug mb-4">
        {interpretation.verdict}
      </p>

      <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>{interpretation.paragraphs.affordability}</p>
        {interpretation.paragraphs.growth && (
          <p>{interpretation.paragraphs.growth}</p>
        )}
        {interpretation.paragraphs.hazard && (
          <p>{interpretation.paragraphs.hazard}</p>
        )}
        <p className="border-l-4 border-emerald-400 bg-emerald-50 pl-4 py-2 italic text-slate-800">
          {interpretation.paragraphs.tradeoff}
        </p>
      </div>

      <details className="mt-4 text-xs text-slate-500">
        <summary className="cursor-pointer hover:text-slate-700">
          Source evidence (3 axes)
        </summary>
        <div className="mt-2 space-y-1 pl-4">
          <p>
            <strong>Affordability:</strong> {interpretation.evidence.affordability}
          </p>
          <p>
            <strong>Growth:</strong> {interpretation.evidence.growth}
          </p>
          <p>
            <strong>Hazard:</strong> {interpretation.evidence.hazard}
          </p>
        </div>
      </details>
    </section>
  );
}
