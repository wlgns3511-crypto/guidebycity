import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import zipKeepList from './lib/generated/zip-keep.json';
import compareKeepList from './lib/generated/compare-keep.json';

const ZIP_KEEP_SET: Set<string> = new Set(zipKeepList as string[]);
const COMPARE_KEEP_SET: Set<string> = new Set(compareKeepList as string[]);

// 2026-05-05 — Phase 6 state full-name redirect. /state/<slug>/ is keyed
// by 2-letter abbr ("wa") but users type "washington". Static 50-state +
// DC + PR map driven from app/state/[slug]/page.tsx STATE_NAMES.
const STATE_FULL_TO_ABBR: Record<string, string> = {
  alabama: 'al', alaska: 'ak', arizona: 'az', arkansas: 'ar', california: 'ca',
  colorado: 'co', connecticut: 'ct', delaware: 'de', 'district-of-columbia': 'dc',
  florida: 'fl', georgia: 'ga', hawaii: 'hi', idaho: 'id', illinois: 'il',
  indiana: 'in', iowa: 'ia', kansas: 'ks', kentucky: 'ky', louisiana: 'la',
  maine: 'me', maryland: 'md', massachusetts: 'ma', michigan: 'mi', minnesota: 'mn',
  mississippi: 'ms', missouri: 'mo', montana: 'mt', nebraska: 'ne', nevada: 'nv',
  'new-hampshire': 'nh', 'new-jersey': 'nj', 'new-mexico': 'nm', 'new-york': 'ny',
  'north-carolina': 'nc', 'north-dakota': 'nd', ohio: 'oh', oklahoma: 'ok',
  oregon: 'or', pennsylvania: 'pa', 'rhode-island': 'ri', 'south-carolina': 'sc',
  'south-dakota': 'sd', tennessee: 'tn', texas: 'tx', utah: 'ut', vermont: 'vt',
  virginia: 'va', washington: 'wa', 'west-virginia': 'wv', wisconsin: 'wi', wyoming: 'wy',
  'puerto-rico': 'pr',
};

/**
 * Canonicalise a /compare/ slug so "a-vs-b" and "b-vs-a" map to the same
 * whitelist entry. We can't call DB-backed getCityBySlug here (Edge), so we
 * split on every "-vs-" occurrence and pick the ordering that matches the
 * whitelist. This is what app/compare/[slugs]/page.tsx does at request time.
 */
function canonicalCompareSlug(raw: string): string | null {
  if (COMPARE_KEEP_SET.has(raw)) return raw;
  const marker = '-vs-';
  let idx = raw.indexOf(marker);
  while (idx !== -1) {
    const a = raw.slice(0, idx);
    const b = raw.slice(idx + marker.length);
    const sorted = [a, b].sort().join(marker);
    if (COMPARE_KEEP_SET.has(sorted)) return sorted;
    idx = raw.indexOf(marker, idx + 1);
  }
  return null;
}

/**
 * HCU cleanup — return 410 Gone for pruned /zip/ and /compare/ URLs.
 * Pre-04-22 sitemap had 32,286 /zip/ + ~500 /compare/ pairs. After Option B+
 * prune we keep 500 /zip/ + 100 /compare/. The rest were still 404-ing in
 * GSC (132 explicit 404 + ~891 crawled-not-indexed) — noise for Google and
 * crawl-budget waste. 410 signals intentional deletion → faster deindex.
 *
 * Bypass for anything serving valuable content (HTML static, api, favicon, …).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /zip/<slug>/ — 410 if not in prebuilt keep set
  if (pathname.startsWith('/zip/')) {
    const slug = pathname.slice(5).replace(/\/$/, '');
    if (slug && !slug.includes('/') && !ZIP_KEEP_SET.has(slug)) {
      return new NextResponse('Gone', { status: 410 });
    }
  }

  // /compare/<slugs>/ — 410 if the pair (either ordering) is not whitelisted
  if (pathname.startsWith('/compare/')) {
    const raw = pathname.slice(9).replace(/\/$/, '');
    if (raw && !raw.includes('/') && raw.includes('-vs-')) {
      const canonical = canonicalCompareSlug(raw);
      if (canonical === null) {
        return new NextResponse('Gone', { status: 410 });
      }
    }
  }

  // Phase 6.1 — state full-name redirect. /state/washington/ → /state/wa/
  if (pathname.startsWith('/state/')) {
    const slug = pathname.slice(7).replace(/\/$/, '');
    const abbr = slug && !slug.includes('/') ? STATE_FULL_TO_ABBR[slug] : undefined;
    if (abbr) {
      const url = request.nextUrl.clone();
      url.pathname = `/state/${abbr}/`;
      return NextResponse.redirect(url, 301);
    }
  }

  // Existing behaviour — propagate pathname header for downstream components.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml|api).*)'],
};
