import type { Metadata } from "next";
import { LEGAL_VINTAGES } from "@/lib/authorship";
import { AuthorBox } from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description: "How GuideByCity handles factual corrections — what we will correct, what falls outside our remit, and how to request a correction.",
  alternates: { canonical: "/corrections-policy/" },
  openGraph: { url: "/corrections-policy/" },
};

export default function CorrectionsPolicyPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-teal-700 mb-6">Corrections Policy</h1>
      <p className="text-sm text-slate-500 mb-8">
        Last updated: <time dateTime={LEGAL_VINTAGES.terms}>{LEGAL_VINTAGES.terms}</time>
      </p>

      <p>
        GuideByCity surfaces public-sector US data. Most numbers on the site come unchanged from a federal source
        (the U.S. Census Bureau, U.S. Bureau of Economic Analysis, U.S. Bureau of Labor Statistics, NOAA, HUD, or
        FEMA). Some figures — most notably our HazardTier 5-band rollup — are deterministic derivations we compute
        from those sources. This page describes how we handle correction requests on both kinds of figures.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">What We Will Correct</h2>
      <ul>
        <li><strong>Source-vs-page mismatches.</strong> If a value on a guidebycity page does not match the originating Census ACS, BEA RPP, BLS CPI, NOAA NCEI, HUD FMR, or FEMA NRI release for the same entity and same vintage, that is a correction we will fix on the current release cycle.</li>
        <li><strong>HazardTier classifier errors.</strong> If our HazardTier classifier produces a tier that does not match the rule published on the <a href="/methodology/" className="text-teal-700 hover:underline">methodology page</a> when applied to the FEMA NRI v2024 record for that metro, that is a correction we will fix immediately.</li>
        <li><strong>Stale primary-county mapping.</strong> If a metro&apos;s primary county has been re-defined by OMB and our cbsa_risk table still references the prior mapping, we will re-ingest within 30 days of the OMB notice.</li>
        <li><strong>Methodology drift.</strong> If our published methodology no longer matches the calculation actually running in code, we will either fix the code to match the doc or update the doc to match the code, with the change-log noted on the methodology page.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">What Falls Outside Our Remit</h2>
      <p>
        We do not unilaterally re-publish source-agency data with our own corrections. If a Census ACS estimate looks
        wrong, the path is via the Census Bureau&apos;s own data-quality reporting (<a href="https://www.census.gov/programs-surveys/acs/quality.html" className="text-teal-700 hover:underline" rel="noopener" target="_blank">Census ACS Data Quality</a>), not via guidebycity. We will display the
        Census value as published. The same applies to BEA RPP figures, BLS CPI series, NOAA Climate Normals, HUD FMR
        tables, and FEMA NRI scores — each agency has its own correction channel that is the source of truth.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">How to Request a Correction</h2>
      <p>
        Send a correction request via the <a href="/contact" className="text-teal-700 hover:underline">contact page</a> with:
      </p>
      <ol>
        <li>The exact URL on guidebycity where you noticed the value.</li>
        <li>The value as displayed on the page.</li>
        <li>The corresponding value at the source (Census, BEA, BLS, NOAA, HUD, or FEMA — with a link to the agency&apos;s table).</li>
        <li>The vintage of the source value you are citing.</li>
      </ol>
      <p>
        We will acknowledge correction requests within 5 business days, investigate, and either fix the page or
        respond with the reason the discrepancy is intentional (most commonly: different vintage between source and
        page during an ingest window).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Vintage Windows and Apparent Discrepancies</h2>
      <p>
        Each source agency releases on its own schedule. Between a source release and our next ingest cycle, page
        values for the agency&apos;s data will lag the agency&apos;s freshest release. This is not a correction-eligible
        error; it is a vintage window, and the per-page metadata reports the source vintage we ingested. Common
        windows:
      </p>
      <ul>
        <li>Census ACS December release → ingest within 30 days.</li>
        <li>BEA RPP November release → ingest within 30 days.</li>
        <li>BLS CPI monthly release → ingest within 14 days where surfaced.</li>
        <li>NOAA Climate Normals (decadal) → ingest within 90 days of the decadal release.</li>
        <li>HUD FMR October FY release → ingest at FY rollover.</li>
        <li>FEMA NRI annual version → HazardTier re-rollup within 60 days.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Correction Log</h2>
      <p>
        Material corrections that change a published derived figure (HazardTier band, ranking position, state
        aggregate) are noted in the page-level change log embedded in the methodology page. Routine source refreshes
        on the cycles above are not logged individually — the per-page vintage already exposes that.
      </p>

      <AuthorBox source="Corrections policy — coverage of Census / BEA / BLS / NOAA / HUD / FEMA-sourced figures and the HazardTier rollup derivation." />
    </article>
  );
}
