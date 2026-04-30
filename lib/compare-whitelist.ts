import { getTopComparisons, getCityBySlug } from "./db";

const CAP = 100;

// GSC evidence (HCU 2026-04-25 rescue): /compare/ URLs earning >= 1 click
// in 28d window (2026-03-24 ~ 2026-04-21) per get_gsc_report. The initial
// keep-set (top-100 by |cost_index_a - cost_index_b| DESC) killed all 5
// earning URLs — they're mid-cost-index pairs that lost the "most different"
// lottery. All 5 cities exist in DB → renderable. Refresh each re-cut.
const GSC_EVIDENCE_COMPARES = [
  "miami-fort-lauderdale-west-palm-beach-fl-vs-traverse-city-mi",
  "albany-ga-vs-albany-schenectady-troy-ny",
  "albany-schenectady-troy-ny-vs-albuquerque-nm",
  "albany-schenectady-troy-ny-vs-portland-south-portland-me",
  "harrisonburg-va-vs-staunton-stuarts-draft-va",
];

// Canonicalise each GSC slug: try every -vs- split and pick the one where
// both halves resolve to a valid city. Then sort a < b. This protects
// against GSC reporting the reverse ordering of our canonical form.
function canonicaliseGscSlug(raw: string): string | null {
  const marker = "-vs-";
  let idx = raw.indexOf(marker);
  while (idx !== -1) {
    const a = raw.slice(0, idx);
    const b = raw.slice(idx + marker.length);
    if (getCityBySlug(a) && getCityBySlug(b)) {
      return [a, b].sort().join(marker);
    }
    idx = raw.indexOf(marker, idx + 1);
  }
  return null;
}

const base = getTopComparisons(CAP).map((p) =>
  [p.slugA, p.slugB].sort().join("-vs-"),
);

const slugSet = new Set<string>(base);
for (const raw of GSC_EVIDENCE_COMPARES) {
  const canonical = canonicaliseGscSlug(raw);
  if (canonical) slugSet.add(canonical);
}

export const STATIC_COMPARISON_SLUGS: string[] = Array.from(slugSet);

export const STATIC_COMPARISON_SET: Set<string> = new Set(STATIC_COMPARISON_SLUGS);

export function toCanonicalComparisonSlug(slugA: string, slugB: string): string {
  return [slugA, slugB].sort().join("-vs-");
}

export function isValidComparePair(slugA: string, slugB: string): boolean {
  return STATIC_COMPARISON_SET.has(toCanonicalComparisonSlug(slugA, slugB));
}
