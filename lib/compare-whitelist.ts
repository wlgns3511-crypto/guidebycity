import { getTopComparisons } from "./db";

const CAP = 100;

export const STATIC_COMPARISON_SLUGS: string[] = getTopComparisons(CAP).map((p) =>
  [p.slugA, p.slugB].sort().join("-vs-"),
);

export const STATIC_COMPARISON_SET: Set<string> = new Set(STATIC_COMPARISON_SLUGS);

export function toCanonicalComparisonSlug(slugA: string, slugB: string): string {
  return [slugA, slugB].sort().join("-vs-");
}

export function isValidComparePair(slugA: string, slugB: string): boolean {
  return STATIC_COMPARISON_SET.has(toCanonicalComparisonSlug(slugA, slugB));
}
