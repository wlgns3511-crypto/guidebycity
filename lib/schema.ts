import { PUBLISHER, EDITORIAL_TEAM, SOURCE_AUTHORITIES } from './authorship';

const SITE_NAME = 'GuideByCity';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guidebycity.com';
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: `${SITE_URL}${item.url}` })) };
}
export function faqSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function itemListSchema(name: string, urlPath: string, items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: `${SITE_URL}${urlPath}`,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      url: `${SITE_URL}${it.url}`,
    })),
  };
}

type CreatorOrg = { '@type': 'Organization'; name: string; url: string };

export const FEMA_NRI_CREATOR: CreatorOrg = {
  '@type': 'Organization' as const,
  name: 'Federal Emergency Management Agency',
  url: 'https://hazards.fema.gov/nri/',
};

// Phase 7 P4 expansion (2026-05-20): default multi-creator set spans 6
// distinct registrable .gov publishers — census.gov, bea.gov, bls.gov,
// noaa.gov, hud.gov, fema.gov — satisfying the Trap #110 ≥2-publisher
// floor with substantial headroom. Per-page overrides still accept a
// single org (e.g. /risk/[hazard]/ scopes creator to FEMA alone).
const DEFAULT_DATASET_CREATORS: CreatorOrg[] = [
  ...SOURCE_AUTHORITIES,
  FEMA_NRI_CREATOR,
];

export function datasetSchema(
  name: string,
  description: string,
  urlPath: string,
  creatorOverride?: CreatorOrg | CreatorOrg[],
) {
  // schema.org/Dataset.creator = entity that CREATED the underlying data
  // (Census/BEA/BLS/NOAA/HUD/FEMA) — NOT the platform that publishes the view.
  // PUBLISHER stays in `publisher`. EDITORIAL_TEAM goes in `reviewedBy`.
  // sourceOrganization enumerates every data source the page composites.
  // creatorOverride lets a page name a more specific origin (e.g. FEMA for
  // a HazardTier dataset). When omitted, creator is the full 6-publisher
  // array — schema.org/Dataset.creator accepts Organization OR array of
  // Organization, so this stays spec-clean.
  // See trap-105 (Dataset.creator honest attribution) + trap-110 (≥2 hosts).
  const creator: CreatorOrg | CreatorOrg[] =
    creatorOverride ?? DEFAULT_DATASET_CREATORS;
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: `${SITE_URL}${urlPath}`,
    creator,
    publisher: { '@type': 'Organization', name: PUBLISHER.name, url: PUBLISHER.url },
    sourceOrganization: SOURCE_AUTHORITIES,
    // 2026-05-22 — GSC enhancement panel parses `{@type:'Dataset', name, url}` entries
    // as child Datasets and flags each for missing description/license/creator (critical).
    // URL string array is the safe shape (schema.org/isBasedOn accepts URL).
    isBasedOn: SOURCE_AUTHORITIES.map(s => s.url),
    variableMeasured: [
      { '@type': 'PropertyValue' as const, name: 'CityAffordabilityTier', description: '5-band classification of Census ACS B25077 ÷ B19013 price-to-income ratio (Affordable → Severe).' },
      { '@type': 'PropertyValue' as const, name: 'PopulationGrowthBand', description: '5-band annualized population trajectory (Booming → Shrinking) from Census Decennial + ACS.' },
      { '@type': 'PropertyValue' as const, name: 'HazardTier', description: '5-band composite hazard exposure (Low → Extreme) from FEMA NRI v2024.' },
    ],
    reviewedBy: { '@type': 'Organization', name: EDITORIAL_TEAM.name, url: EDITORIAL_TEAM.url },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
  };
}

export function articleSchema(post: { title: string; description: string; slug: string; urlPath?: string; publishedAt: string; updatedAt?: string; category?: string }) {
  const articlePath = post.urlPath ?? (post.slug.includes('/') ? `/${post.slug.replace(/^\/+|\/+$/g, '')}/` : `/blog/${post.slug}/`);
  const url = `${SITE_URL}${articlePath}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Organization', name: EDITORIAL_TEAM.name, url: EDITORIAL_TEAM.url },
    publisher: { '@type': 'Organization', name: PUBLISHER.name, url: PUBLISHER.url },
    mainEntityOfPage: url,
    ...(post.category && { articleSection: post.category }),
  };
}
