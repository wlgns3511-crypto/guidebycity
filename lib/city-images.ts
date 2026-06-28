/**
 * City-image lookup. Reads the manifest produced by
 * scripts/process-city-images.ts at module load (build time on Mac, then
 * baked into the SSG output — no runtime fs cost on the VPS).
 *
 * Covers the 387 US metros from BEA RPP. All metros have a Wikipedia
 * pageimage match via the fetch script's principal-city + state-full
 * candidate generation (Springfield, MA vs Springfield, MO disambiguated).
 */
import manifest from '@/scripts/data/city-images-manifest.json';

export interface CityImage {
  slug: string;
  shortName: string;
  state: string;
  avifPath: string;
  jpgPath: string;
  finalWidth: number;
  finalHeight: number;
  commonsFileUrl: string;
  wikipediaUrl: string;
  wikipediaTitle: string;
  licenseShort: string;
  licenseUrl: string | null;
  artistText: string | null;
  artistHtml: string | null;
}

interface ManifestEntry {
  slug: string;
  shortName: string;
  state: string;
  avifPath?: string;
  jpgPath?: string;
  finalWidth?: number;
  finalHeight?: number;
  commonsFileUrl: string;
  wikipediaUrl: string;
  wikipediaTitle: string;
  licenseShort: string;
  licenseUrl: string | null;
  artistText: string | null;
  artistHtml: string | null;
}

const BY_SLUG: ReadonlyMap<string, CityImage> = (() => {
  const m = new Map<string, CityImage>();
  for (const raw of (manifest as ManifestEntry[])) {
    if (!raw.avifPath || !raw.jpgPath || !raw.finalWidth || !raw.finalHeight) continue;
    m.set(raw.slug, {
      slug: raw.slug,
      shortName: raw.shortName,
      state: raw.state,
      avifPath: raw.avifPath,
      jpgPath: raw.jpgPath,
      finalWidth: raw.finalWidth,
      finalHeight: raw.finalHeight,
      commonsFileUrl: raw.commonsFileUrl,
      wikipediaUrl: raw.wikipediaUrl,
      wikipediaTitle: raw.wikipediaTitle,
      licenseShort: raw.licenseShort,
      licenseUrl: raw.licenseUrl,
      artistText: raw.artistText,
      artistHtml: raw.artistHtml,
    });
  }
  return m;
})();

export function getCityImage(slug: string): CityImage | undefined {
  return BY_SLUG.get(slug);
}

export function hasCityImage(slug: string): boolean {
  return BY_SLUG.has(slug);
}
