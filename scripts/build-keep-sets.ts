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
import { getAllZipGuides } from '../lib/db';
import { STATIC_COMPARISON_SLUGS } from '../lib/compare-whitelist';

const OUT_DIR = path.resolve(__dirname, '..', 'lib', 'generated');
fs.mkdirSync(OUT_DIR, { recursive: true });

// /zip/ — matches slice(0, 500) in app/zip/[slug]/page.tsx generateStaticParams
const zipSlugs = getAllZipGuides().slice(0, 500).map((z) => z.slug);
fs.writeFileSync(
  path.join(OUT_DIR, 'zip-keep.json'),
  JSON.stringify(zipSlugs),
);

// /compare/ — canonical slugs from STATIC_COMPARISON_SLUGS (CAP=100)
fs.writeFileSync(
  path.join(OUT_DIR, 'compare-keep.json'),
  JSON.stringify(STATIC_COMPARISON_SLUGS),
);

console.log(
  `✓ keep-sets: zip=${zipSlugs.length} compare=${STATIC_COMPARISON_SLUGS.length}`,
);
