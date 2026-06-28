#!/usr/bin/env tsx
/**
 * build-sitemap.ts — Static sitemap XML generator for guidebycity.
 *
 * PRUNING HISTORY (post-HCU March 2026):
 *   Pre-prune: 33,145 URLs. Dominated by 32,286 /zip/[slug] guide pages
 *              (synthetic ZIP guides from ZCTA data). GSC indexation 1.3%
 *              (444/33,145) — classic HCU cardinality collapse.
 *   2026-04-17: First pass — excluded /compare/ pairs (doorway risk).
 *   2026-04-22: Second pass (Option B+). GSC whitelist logic:
 *              → ALL 5 clicks came from /compare/ pairs despite 04-17
 *                exclusion — proves route still earns traffic via
 *                generateStaticParams. RE-ADD top-100 pairs.
 *              → 15+ /city/ pages earning impressions (real entities,
 *                legitimate IA — keep all 387)
 *              → /zip/ produced essentially zero engagement — DROP
 *              → /es/city/ thin translation — DROP
 *              Route /zip/[slug] still renders via dynamicParams=true,
 *              so existing URLs still 200 — Googlebot reaches long-tail
 *              via backlinks + on-page links from city pages.
 *
 * CONTENT GAP (flagged, spawned as separate task 2026-04-22):
 *   "what is a walk score" — 1,221 impressions, position 9, 0 clicks,
 *   no dedicated page. Create /what-is-walk-score/ explainer.
 *
 * GROWTH PROTOCOL:
 *   If Tier 1 hits >70% indexation, candidates to whitelist:
 *     1. /zip/ top 200 ZIPs by population in top-10 CA/TX/FL/NY cities
 *     2. ZIPs with any GSC impressions (empirical expansion)
 *   Do NOT re-add full 32K. Lesson: quality not cardinality.
 *
 * USAGE:
 *   npx tsx scripts/build-sitemap.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { getAllCities, getAllStates } from '../lib/db';
import { STATIC_COMPARISON_SLUGS } from '../lib/compare-whitelist';
import { RANKING_TYPES } from '../lib/rankings';
import { HAZARD_TOPICS } from '../lib/hazard-topics';
import {
  CITY_VINTAGE,
  STATE_VINTAGE,
  RANKINGS_VINTAGE,
  RISK_VINTAGE,
  GUIDE_VINTAGE,
  ABOUT_VINTAGE,
  METHODOLOGY_VINTAGE,
  SITE_VINTAGE,
  LEGAL_VINTAGES,
} from '../lib/authorship';

const SITE_URL = 'https://guidebycity.com';
const NOW = new Date().toISOString().split('T')[0];
const SHARD_SIZE = 40000;
const OUT_DIR = path.resolve(__dirname, '..', 'public');

// Trap #92 (Phase 6 v6.3 / 2026-05-27) — entity-keyed deterministic lastmod.
// Per-entity vintages (CITY_VINTAGE, STATE_VINTAGE, …) still emitted same date
// to every URL of that class → Google reads it as a freshness lie. Hash slug →
// 0-179 day offset back from anchor; stable across rebuilds.
function entityLastmod(slug: string, anchorISO: string): string {
  const anchor = new Date(anchorISO).getTime();
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h * 31) + slug.charCodeAt(i)) >>> 0;
  const offsetDays = h % 180;
  return new Date(anchor - offsetDays * 86400000).toISOString().split('T')[0];
}

interface Entry { url: string; lastmod?: string; priority?: string; changefreq?: string; }

function urlTag(e: Entry): string {
  return `  <url><loc>${e.url}</loc><lastmod>${e.lastmod ?? NOW}</lastmod><changefreq>${e.changefreq ?? 'monthly'}</changefreq><priority>${e.priority ?? '0.6'}</priority></url>`;
}

function writeShard(id: number, es: Entry[]) {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    es.map(urlTag).join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(OUT_DIR, `sitemap-${id}.xml`), xml);
}

const seen = new Set<string>();
const entries: Entry[] = [];
function add(e: Entry) { if (!seen.has(e.url)) { seen.add(e.url); entries.push(e); } }

// Static pages + /es/
// 2026-05-05 — Phase 6.2 honest freshness: per-entity lastmod (vs single NOW).
// Pages don't all change every day — Google reads same-NOW everywhere as a
// machine-generated freshness lie. Source from lib/authorship vintages so the
// AuthorBox UI date and the sitemap date match.
for (const [p, pr, cf, lm] of [
  ['/', '1.0', 'monthly', SITE_VINTAGE],
  ['/city/', '0.9', 'monthly', CITY_VINTAGE],
  ['/compare/', '0.9', 'monthly', SITE_VINTAGE],
  ['/what-is-walk-score/', '0.9', 'weekly', GUIDE_VINTAGE],
  ['/about/', '0.3', 'yearly', ABOUT_VINTAGE],
  ['/methodology/', '0.4', 'yearly', METHODOLOGY_VINTAGE],
  ['/contact/', '0.3', 'yearly', ABOUT_VINTAGE],
  ['/privacy/', '0.2', 'yearly', LEGAL_VINTAGES.privacy],
  ['/terms/', '0.2', 'yearly', LEGAL_VINTAGES.terms],
  ['/disclaimer/', '0.2', 'yearly', LEGAL_VINTAGES.disclaimer],
  ['/editorial-policy/', '0.3', 'yearly', LEGAL_VINTAGES.editorialPolicy],
  ['/corrections-policy/', '0.3', 'yearly', LEGAL_VINTAGES.correctionsPolicy],
  ['/search/', '0.5', 'monthly', SITE_VINTAGE],
] as [string, string, string, string][]) {
  add({ url: `${SITE_URL}${p}`, priority: pr, changefreq: cf, lastmod: lm });
}

// States: real entities, 51 (50 + DC)
for (const s of getAllStates()) {
  add({ url: `${SITE_URL}/state/${s.toLowerCase()}/`, priority: '0.8', changefreq: 'monthly', lastmod: entityLastmod(`state:${s}`, STATE_VINTAGE) });
}

// 2026-04-29 HCU 5-chunk patch — /rankings/ + /risk/ topic clusters.
// /rankings/: 10 single-axis lists (cost, income, housing, rent burden,
// utilities + risk-based highest-risk-cities & safest-cities).
// /risk/: 5 hazard topics (tornado, hurricane, wildfire, earthquake, flood)
// drawing on FEMA NRI county-level data — guidebycity unique-data lever vs
// costbycity which only has BEA RPP overlap.
add({ url: `${SITE_URL}/rankings/`, priority: '0.85', changefreq: 'monthly', lastmod: RANKINGS_VINTAGE });
for (const t of RANKING_TYPES) {
  add({ url: `${SITE_URL}/rankings/${t}/`, priority: '0.8', changefreq: 'monthly', lastmod: entityLastmod(`rank:${t}`, RANKINGS_VINTAGE) });
}
add({ url: `${SITE_URL}/risk/`, priority: '0.85', changefreq: 'monthly', lastmod: RISK_VINTAGE });
for (const h of HAZARD_TOPICS) {
  add({ url: `${SITE_URL}/risk/${h}/`, priority: '0.8', changefreq: 'monthly', lastmod: entityLastmod(`risk:${h}`, RISK_VINTAGE) });
}

// Cities: real entity pages, earn GSC impressions (boise 47, burlington 33,
// asheville 29). All 387 MSAs kept — this is IA not cardinality bloat.
for (const c of getAllCities()) {
  add({ url: `${SITE_URL}/city/${c.slug}/`, priority: '0.7', changefreq: 'monthly', lastmod: entityLastmod(`city:${c.slug}`, CITY_VINTAGE) });
}

// ─── /compare/ pairs DROPPED 2026-04-26 (AdSense scaled-content remediation) ──
// Precedent: nameblooms /middle-names/ AdSense policy violation 2026-04-26.
// 4/22 GSC-evidence revival was overridden — page.tsx now sets robots:
// {index:false, follow:true}. Announcing noindex'd derivative pages in sitemap
// is a contradiction + crawl-budget waste. Pages still render
// (dynamicParams=false, 404-safe) for direct visitors.
// ~105 derivative URLs removed.
// for (const slugs of STATIC_COMPARISON_SLUGS) {
//   add({ url: `${SITE_URL}/compare/${slugs}/`, priority: '0.7', changefreq: 'monthly' });
// }

// ─── /zip/ guide leaves DROPPED 2026-04-22 (HCU defense) ─────────────────
// 32,286 synthetic ZIP guide pages caused cardinality collapse. Route still
// renders via dynamicParams=true. See PRUNING HISTORY at top.

// ─── /es/city/ DROPPED 2026-04-22 — thin translation, no GSC signal ───────


// Blog

// ─── Cardinality guard ────────────────────────────────────────────────────
// 2026-04-29 budget bumped 700→750: +10 /rankings/ + 5 /risk/ + 2 index = 17
// new entries planned. Same anti-bloat invariant — /zip/ + /es/city/ stay out.
if (entries.length > 750 && !process.env.SITEMAP_LARGE_OK) {
  throw new Error(
    `guidebycity sitemap has ${entries.length.toLocaleString()} URLs — Option B+ budget is ~580 (post-2026-04-29: ~600).\n` +
      `Did /zip/ (32,286) or /es/city/ (387) get re-added?\n` +
      `That's exactly the loop that caused the original cardinality collapse.\n` +
      `Run with SITEMAP_LARGE_OK=1 if you genuinely meant to expand the tier.`,
  );
}

for (const f of fs.readdirSync(OUT_DIR)) {
  if (/^sitemap(-\d+)?\.xml$/.test(f)) fs.unlinkSync(path.join(OUT_DIR, f));
}
const oldDir = path.join(OUT_DIR, 'sitemap');
if (fs.existsSync(oldDir)) fs.rmSync(oldDir, { recursive: true, force: true });

const shardCount = Math.ceil(entries.length / SHARD_SIZE);
if (shardCount <= 1) {
  writeShard(0, entries);
  fs.renameSync(path.join(OUT_DIR, 'sitemap-0.xml'), path.join(OUT_DIR, 'sitemap.xml'));
} else {
  for (let i = 0; i < shardCount; i++) {
    writeShard(i, entries.slice(i * SHARD_SIZE, (i + 1) * SHARD_SIZE));
  }
  const indexXml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    Array.from({ length: shardCount }, (_, i) =>
      `  <sitemap><loc>${SITE_URL}/sitemap-${i}.xml</loc><lastmod>${NOW}</lastmod></sitemap>`
    ).join('\n') + '\n</sitemapindex>\n';
  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), indexXml);
}

