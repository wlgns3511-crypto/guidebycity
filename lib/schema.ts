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

export function datasetSchema(
  name: string,
  description: string,
  urlPath: string,
  creatorOverride?: { '@type': 'Organization'; name: string; url: string },
) {
  // schema.org/Dataset.creator = entity that CREATED the underlying data
  // (Census/BEA/BLS/NOAA/HUD/FEMA) — NOT the platform that publishes the view.
  // PUBLISHER stays in `publisher`. EDITORIAL_TEAM goes in `reviewedBy`.
  // sourceOrganization enumerates every data source the page composites.
  // creatorOverride lets a page name a more specific origin (e.g. FEMA for
  // a HazardTier dataset, when FEMA is not in the default SOURCE_AUTHORITIES).
  // See trap-105 (Dataset.creator honest attribution).
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: `${SITE_URL}${urlPath}`,
    creator: creatorOverride ?? SOURCE_AUTHORITIES[0],
    publisher: { '@type': 'Organization', name: PUBLISHER.name, url: PUBLISHER.url },
    sourceOrganization: SOURCE_AUTHORITIES,
    reviewedBy: { '@type': 'Organization', name: EDITORIAL_TEAM.name, url: EDITORIAL_TEAM.url },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
  };
}

export const FEMA_NRI_CREATOR = {
  '@type': 'Organization' as const,
  name: 'Federal Emergency Management Agency',
  url: 'https://hazards.fema.gov/nri/',
};

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
