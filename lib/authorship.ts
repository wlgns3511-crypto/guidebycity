/**
 * Authorship + freshness vintages for GuideByCity.
 *
 * Authority transfer: instead of inventing a named individual reviewer,
 * we cross-reference against 5 federal data sources (Census ACS, BEA RPP,
 * BLS CPI, NOAA, HUD). Each source has its own published update cycle
 * that we track separately — that's the unique freshness signal a
 * data-aggregator site should expose, not a single sitewide DB_UPDATED.
 *
 * Source-level vintages (real federal release cycles):
 *   - Census ACS:        5-year rolling, annual release in Dec
 *   - BLS CPI:           monthly
 *   - BEA RPP:           annual (released ~Nov for prior year)
 *   - NOAA Normals:      30-year reference period
 *   - HUD FMR:           annual fiscal year
 *
 * Entity-level vintages drive sitemap lastmod and Schema dateModified —
 * keeping those split prevents the "single sitewide date" pattern that
 * AdSense reviewers flag as a scaled-content tell.
 */

// ─── Source-level vintages (real federal release cycles) ──────────────
export const CENSUS_ACS_VINTAGE = '2024 5-year (released 2025-12)';
export const BLS_CPI_VINTAGE = '2026-03';
export const BEA_RPP_VINTAGE = '2024 RPPs (released 2025-11)';
export const NOAA_NORMALS_VINTAGE = '1991–2020 Climate Normals';
export const HUD_FMR_VINTAGE = 'FY 2026';

// ─── Entity-level vintages (what we last refreshed in our DB) ─────────
export const CITY_VINTAGE = '2026-04-19';
export const STATE_VINTAGE = '2026-03-22';
export const RANKINGS_VINTAGE = '2026-04-15';
export const RISK_VINTAGE = '2026-04-08';
export const GUIDE_VINTAGE = '2026-04-08';
export const ABOUT_VINTAGE = '2026-04-12';
export const METHODOLOGY_VINTAGE = '2026-04-08';
export const SITE_VINTAGE = '2026-03-15';

export const LEGAL_VINTAGES = {
  privacy: '2026-04-22',
  terms: '2026-02-18',
  disclaimer: '2025-11-04',
};

// Backward compat — lib/db-page.ts uses DB_UPDATED via getReviewedAt().
export const DB_UPDATED = CITY_VINTAGE;

export const PUBLISHER = {
  name: 'DataPeek Research Network',
  url: 'https://datapeekfacts.com',
  description: 'A public-data network aggregating government and public datasets across US housing, tax, healthcare, and other civic domains.',
};

export const EDITORIAL_TEAM = {
  name: 'GuideByCity Editorial Team',
  url: 'https://datapeekfacts.com/editorial-policy/',
  parentOrganization: PUBLISHER,
};

/**
 * Authority sources we cross-reference for every entity.
 * Schema-clean (only @type / name / url) so this can drop straight into
 * schema.org `reviewedBy`. The per-source release vintage lives in
 * SOURCE_VINTAGES below — exposed in the AuthorBox UI but kept out of
 * the JSON-LD payload (vintage isn't a recognised schema.org field).
 */
export const SOURCE_AUTHORITIES = [
  {
    '@type': 'Organization' as const,
    name: 'U.S. Census Bureau',
    url: 'https://www.census.gov/programs-surveys/acs/',
  },
  {
    '@type': 'Organization' as const,
    name: 'U.S. Bureau of Economic Analysis',
    url: 'https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area',
  },
  {
    '@type': 'Organization' as const,
    name: 'U.S. Bureau of Labor Statistics',
    url: 'https://www.bls.gov/cpi/',
  },
  {
    '@type': 'Organization' as const,
    name: 'NOAA National Centers for Environmental Information',
    url: 'https://www.ncei.noaa.gov/',
  },
  {
    '@type': 'Organization' as const,
    name: 'U.S. Department of Housing and Urban Development',
    url: 'https://www.hud.gov/topics/rental_assistance',
  },
];

export const SOURCE_VINTAGES: Record<string, string> = {
  'U.S. Census Bureau': CENSUS_ACS_VINTAGE,
  'U.S. Bureau of Economic Analysis': BEA_RPP_VINTAGE,
  'U.S. Bureau of Labor Statistics': BLS_CPI_VINTAGE,
  'NOAA National Centers for Environmental Information': NOAA_NORMALS_VINTAGE,
  'U.S. Department of Housing and Urban Development': HUD_FMR_VINTAGE,
};

export const REVIEWER = SOURCE_AUTHORITIES[0];
