/**
 * content-helpers.ts — costbycity HCU 5-chunk patch (2026-04-29).
 *
 * Reusable formatters and slug-hash variant pickers shared across
 * cost-facts.ts, cost-commentary.ts, insight-topics.ts, and page files.
 *
 * Pattern source: nameblooms canonical → caloriewize → salarybycity → here.
 *
 * RATIONALE — slug-hash rotation:
 *   The same slug always renders the same variant across rebuilds (idempotent
 *   for indexing), but corpus-wide N variants are used → defeats template
 *   detection. Google sees N copies, not 1 with parameter-stuffing.
 */

/**
 * Slug-hash variant selector. Same key always → same option, but corpus-wide
 * we cycle through all options. Defeats template detection because Google
 * sees N variants, not 1 with parameter-stuffing.
 *
 * @param key - slug or page key (deterministic input)
 * @param options - candidate variants
 * @param salt - optional salt to rotate variants per insight slot, so two
 *               adjacent slots on the same page don't collide
 */
export function pickVariant<T>(key: string, options: readonly T[], salt = 0): T {
  if (!options.length) throw new Error('pickVariant: empty options');
  let h = salt;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return options[Math.abs(h) % options.length];
}

/** Format integer counts with locale separators (e.g. 12345 → "12,345"). */
export function fmtCount(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

/** Format USD: 84320 → "$84,320". Optional digits for cents. */
export function fmtUSD(n: number | null | undefined, digits = 0): string {
  if (n == null || !isFinite(n)) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/** Format USD compactly: 84320 → "$84.3K", 124500 → "$124K", 1250000 → "$1.25M". */
export function fmtUSDCompact(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 100_000) return `$${Math.round(n / 1000)}K`;
  if (Math.abs(n) >= 10_000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US')}`;
}

/** Format a fraction as percentage: 0.123 → "12.3%". */
export function fmtPct(p: number | null | undefined, digits = 1): string {
  if (p == null || !isFinite(p)) return '—';
  return `${(p * 100).toFixed(digits)}%`;
}

/** Format ratio: 1.85 → "1.85×". */
export function fmtRatio(r: number | null | undefined, digits = 2): string {
  if (r == null || !isFinite(r)) return '—';
  return `${r.toFixed(digits)}×`;
}

/** Format BEA RPP index value: 124.7 → "124.7" (1 decimal). */
export function fmtIndex(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return '—';
  return v.toFixed(1);
}

/**
 * Format an RPP index as signed delta vs 100:
 *   124.7 → "+24.7%"
 *   89.3  → "−10.7%"
 *   100.0 → "±0%"
 */
export function fmtIndexDelta(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return '—';
  const d = v - 100;
  if (Math.abs(d) < 0.05) return '±0%';
  const sign = d > 0 ? '+' : '−';
  return `${sign}${Math.abs(d).toFixed(1)}%`;
}

/** Ordinal suffix: 1 → "1st", 2 → "2nd", 21 → "21st". */
export function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Round to N decimal places, returning a Number (not string). */
export function roundTo(n: number, digits = 1): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

/** Title-case a slug: "san-francisco-ca" → "San Francisco Ca". */
export function titleCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Bucket a numeric value into a percentile band label.
 *   ≥0.95 → "top 5%"
 *   ≥0.90 → "top 10%"
 *   ≥0.75 → "top quartile"
 *   ≥0.50 → "above median"
 *   ≥0.25 → "below median"
 *   else  → "bottom quartile"
 */
export function percentileBand(p: number | null | undefined): string {
  if (p == null || !isFinite(p)) return 'unranked';
  if (p >= 0.95) return 'top 5%';
  if (p >= 0.90) return 'top 10%';
  if (p >= 0.75) return 'top quartile';
  if (p >= 0.50) return 'above median';
  if (p >= 0.25) return 'below median';
  return 'bottom quartile';
}

/** "above"/"below"/"near" verdict for a pct delta vs 0. */
export function aboveBelowNear(delta: number, epsilon = 1): 'above' | 'below' | 'near' {
  if (delta > epsilon) return 'above';
  if (delta < -epsilon) return 'below';
  return 'near';
}

/** Compute year-over-year delta in points. Returns null if either side null. */
export function pointDelta(latest: number | null | undefined, earliest: number | null | undefined): number | null {
  if (latest == null || earliest == null || !isFinite(latest) || !isFinite(earliest)) return null;
  return latest - earliest;
}

/** Real (RPP-adjusted) income: nominal / (rpp/100). */
export function realIncome(nominal: number | null | undefined, rppAll: number | null | undefined): number | null {
  if (!nominal || !rppAll || rppAll <= 0) return null;
  return Math.round((nominal * 100) / rppAll);
}

/** English article based on first letter. */
export function aOrAn(word: string): string {
  if (!word) return 'a';
  const first = word[0].toLowerCase();
  return 'aeiou'.includes(first) ? 'an' : 'a';
}
