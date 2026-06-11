#!/usr/bin/env tsx
/**
 * build-keep-sets.ts — Generate keep-set JSON dumps for middleware.ts.
 *
 * WHY: middleware runs on Edge Runtime (no better-sqlite3). We need to
 * return 410 Gone for pruned /zip/ and /compare/ URLs — but the authoritative
 * keep lists live in SQLite. Dump them at build time as static JSON so the
 * middleware can import them without touching the DB at request time.
 *
 * KEEP SETS:
 *   zip-keep.json     — first 500 zip slugs (matches app/zip/[slug] generateStaticParams)
 *   compare-keep.json — 100 canonical compare pair slugs (matches STATIC_COMPARISON_SLUGS)
 *
 * Anything outside these sets is a post-04-22 prune zombie still in Google's
 * memory. Serving 410 lets Googlebot deindex fast (vs. 404's slower cycle).
 *
 * USAGE:
 *   npx tsx scripts/build-keep-sets.ts
 * Runs as part of `npm run build` (before build:sitemap).
 */
import * as fs from 'fs';
import * as path from 'path';
import { getAllZipGuides, getZipGuideBySlug, getAllCities } from '../lib/db';
import { STATIC_COMPARISON_SLUGS } from '../lib/compare-whitelist';

const OUT_DIR = path.resolve(__dirname, '..', 'lib', 'generated');
fs.mkdirSync(OUT_DIR, { recursive: true });

// HCU 2026-05-04 — Bing impressions auto-union (separate index from Google).
const BING_JSON_DIR = path.resolve(__dirname, '..', '..', '_shared', 'data', 'bing_analyze');
const BING_DOMAIN = 'guidebycity.com';
const BING_MIN_IMP = 1;

function loadBingSlugs(routeRe: RegExp): string[] {
  if (!fs.existsSync(BING_JSON_DIR)) return [];
  const files = fs.readdirSync(BING_JSON_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  if (!files.length) return [];
  try {
    // 2026-06-11 partial-run shadow fix (kalimawize 2026-05-15 pattern): the
    // absolute-latest snapshot may be a partial run without this domain —
    // scan newest-first and use the first file that actually contains us.
    // Source-side carry-forward also added to analyze_bing_pages.py same day;
    // this is defense-in-depth for historical partial files.
    let site: any;
    for (let i = files.length - 1; i >= 0; i--) {
      const json = JSON.parse(fs.readFileSync(path.join(BING_JSON_DIR, files[i]), 'utf8'));
      if (json[BING_DOMAIN] && Array.isArray(json[BING_DOMAIN].pages)) { site = json[BING_DOMAIN]; break; }
    }
    if (!site || !Array.isArray(site.pages)) return [];
    const out = new Map<string, number>();
    for (const pg of site.pages) {
      const url = String(pg.url || '');
      const pathOnly = url.replace(/^https?:\/\/[^/]+/, '');
      const m = routeRe.exec(pathOnly);
      if (!m) continue;
      const slug = decodeURIComponent(m[1]);
      const imp = Number(pg.impressions) || 0;
      out.set(slug, (out.get(slug) || 0) + imp);
    }
    return [...out.entries()].filter(([, i]) => i >= BING_MIN_IMP).map(([s]) => s);
  } catch {
    return [];
  }
}

// /zip/ — matches slice(0, 500) in app/zip/[slug]/page.tsx generateStaticParams
const zipSet = new Set<string>(getAllZipGuides().slice(0, 500).map((z) => z.slug));
const baseZipCount = zipSet.size;
const bingZips = loadBingSlugs(/^\/zip\/([^/]+)\/?$/);
let zipBingAdded = 0;
for (const slug of bingZips) {
  if (zipSet.has(slug)) continue;
  if (getZipGuideBySlug(slug)) { zipSet.add(slug); zipBingAdded++; }
}
const zipSlugs = Array.from(zipSet).sort();
fs.writeFileSync(
  path.join(OUT_DIR, 'zip-keep.json'),
  JSON.stringify(zipSlugs),
);

// /compare/ — canonical slugs from STATIC_COMPARISON_SLUGS (CAP=100)
fs.writeFileSync(
  path.join(OUT_DIR, 'compare-keep.json'),
  JSON.stringify(STATIC_COMPARISON_SLUGS),
);

// 2026-05-05 — Phase 6.1: short-slug whitelist for /city/ middleware redirect.
// City canonical slugs are verbose ("seattle-tacoma-bellevue-wa"). Short queries
// — both dashless ("seattle") and dashed ("san-francisco", "new-york",
// "los-angeles") — 100% 404 today. Middleware redirects ≤20-char slugs to
// /search/?q=<slug> unless the slug is itself a real MSA. ~268 real ≤20-char
// city slugs (ames-ia / bend-or / akron-oh ...) — this whitelist captures all
// of them so static pages keep serving.
const SHORT_LEN = 20;
const validCityShorts = getAllCities()
  .map((c) => c.slug)
  .filter((s) => s.length <= SHORT_LEN)
  .sort();
fs.writeFileSync(
  path.join(OUT_DIR, 'city-shorts.json'),
  JSON.stringify(validCityShorts),
);

console.log(
  `✓ keep-sets: zip=${zipSlugs.length} (${baseZipCount} base + ${zipBingAdded} Bing) compare=${STATIC_COMPARISON_SLUGS.length} city-shorts=${validCityShorts.length}`,
);
