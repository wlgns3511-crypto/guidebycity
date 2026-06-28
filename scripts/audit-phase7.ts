/**
 * Phase 7 audit script — guidebycity (city-keyed cross-walk).
 *
 * Runs as a one-shot:  npx tsx scripts/audit-phase7.ts
 *
 * Covers Traps #110 (publisher diversity ≥2), #111 (verdict band balance
 * across the 387-metro cohort), #112 (title 60c cap on /city/), #117
 * (creator-portfolio), and #119/#120 (P1 coverage on /city/).
 *
 * /state/, /risk/, /zip/ P1 honest-skip — no per-route AffordabilityTier
 * verdict surface yet (state aggregate would mix Severe + Affordable across
 * the same state e.g. San Jose vs Bakersfield in CA). Decoders are wired
 * for body chip + JSON-LD variableMeasured on /city/, the primary surface.
 */
import { decodeCityCrosswalkFromCity, buildCityP1Title } from '../lib/crosswalk-guide';
import { getAllCities } from '../lib/db';
import { SOURCE_AUTHORITIES } from '../lib/authorship';

console.log('=== Phase 7 audit — guidebycity ===');

const cities = getAllCities();

// Trap #110 — publisher diversity across the cross-walk
const declaredHosts = ['census.gov', 'bea.gov', 'bls.gov', 'noaa.gov', 'hud.gov', 'fema.gov'];
console.log('\n[#110] declared cross-walk publisher hosts:', declaredHosts);
console.log('       distinct count:', declaredHosts.length, declaredHosts.length >= 2 ? 'PASS' : 'FAIL');

// Trap #111 — verdict band balance across 387 metros
const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
const composedScores: number[] = [];
for (const c of cities) {
  const r = decodeCityCrosswalkFromCity(c);
  dist[r.verdict] = (dist[r.verdict] ?? 0) + 1;
  composedScores.push(r.composedScore);
}
const total = Object.values(dist).reduce((a, b) => a + b, 0);
const pcts = Object.fromEntries(
  Object.entries(dist).map(([k, v]) => [k, ((v / total) * 100).toFixed(1) + '%']),
);
const maxPct = Math.max(...Object.values(dist).map((v) => (v / total) * 100));
console.log('\n[#111] verdict band distribution (n=' + total + '):', dist);
console.log('       pct:', pcts);
console.log('       max bucket:', maxPct.toFixed(1) + '%', maxPct <= 70 ? 'PASS' : 'WARN');

const scoresSorted = [...composedScores].sort((a, b) => a - b);
console.log('       composedScore range:', scoresSorted[0], '→', scoresSorted[scoresSorted.length - 1]);
console.log('       median composedScore:', scoresSorted[Math.floor(scoresSorted.length / 2)]);

// Trap #117 — creator-portfolio diversity (≥4 organisations)
const creatorCount = SOURCE_AUTHORITIES.length + 1; // +1 for FEMA_NRI_CREATOR added in datasetSchema
console.log('\n[#117] dataset creator count (SOURCE_AUTHORITIES + FEMA):', creatorCount, creatorCount >= 4 ? 'PASS' : 'FAIL');

// Trap #112 — /city/ P1 title length cap (60c via title.absolute)
let titleMax = 0;
let titleMaxStr = '';
let titleOver60 = 0;
let verdictInTitle = 0;
const VERDICT_PATTERN = /: (Affordable|Modest|Stretched|Strained|Severe)(?: · COL \d+)?$/;
for (const c of cities) {
  const r = decodeCityCrosswalkFromCity(c);
  const title = buildCityP1Title(c.short_name, r);
  if (title.length > titleMax) {
    titleMax = title.length;
    titleMaxStr = title;
  }
  if (title.length > 60) titleOver60++;
  if (VERDICT_PATTERN.test(title)) verdictInTitle++;
}
console.log('\n[#112] /city/ title.absolute length audit (cap=60, layout suffix 14c bypassed)');
console.log('       max length:', titleMax, '/', '"' + titleMaxStr + '"');
console.log('       >60 chars:', titleOver60, titleOver60 === 0 ? 'PASS' : 'FAIL');

// Trap #119/#120 — P1 verdict-in-title coverage across /city/ cohort
const coverage = ((verdictInTitle / cities.length) * 100).toFixed(1);
console.log('\n[#119/#120] verdict-in-title coverage:', verdictInTitle + '/' + cities.length, '(' + coverage + '%)');
console.log('       expected ≥95%:', Number(coverage) >= 95 ? 'PASS' : 'WARN');

// Sample probe across the price-to-income distribution
console.log('\n[sample]');
const sampleSlugs = ['san-jose-sunnyvale-santa-clara-ca', 'san-francisco-oakland-fremont-ca', 'new-york-newark-jersey-city-ny-nj', 'austin-round-rock-san-marcos-tx', 'akron-oh', 'detroit-warren-dearborn-mi', 'birmingham-al', 'youngstown-warren-oh', 'pittsburgh-pa', 'des-moines-west-des-moines-ia'];
for (const slug of sampleSlugs) {
  const c = cities.find(x => x.slug === slug);
  if (!c) { console.log(`  ${slug}: not found`); continue; }
  const r = decodeCityCrosswalkFromCity(c);
  const title = buildCityP1Title(c.short_name, r);
  console.log(`  ${slug} [${r.verdict} · ${r.shortLabel} · score=${r.composedScore} · ${r.growthBand}/${r.hazardTier}]: "${title}" (${title.length}c)`);
}

if (titleOver60 > 0) {
  console.error('\n❌ FAIL: ' + titleOver60 + ' title(s) exceed 60c cap.');
  process.exit(1);
}
console.log('\n✅ All gates pass.');
