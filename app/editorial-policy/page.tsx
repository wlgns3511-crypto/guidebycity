import type { Metadata } from "next";
import { LEGAL_VINTAGES, EDITORIAL_TEAM, PUBLISHER } from "@/lib/authorship";
import { AuthorBox } from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "How GuideByCity sources, reviews, and updates data — including the separation between data origin (Census, BEA, BLS, NOAA, HUD, FEMA) and editorial review.",
  alternates: { canonical: "/editorial-policy/" },
  openGraph: { url: "/editorial-policy/" },
};

export default function EditorialPolicyPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-teal-700 mb-6">Editorial Policy</h1>
      <p className="text-sm text-slate-500 mb-8">
        Last updated: <time dateTime={LEGAL_VINTAGES.terms}>{LEGAL_VINTAGES.terms}</time>
      </p>

      <p>
        GuideByCity surfaces public-sector US data on metros, states, and ZIPs. Our editorial policy describes how
        we separate the role of the data <strong>creator</strong> (the federal agency that produced the underlying
        dataset) from the role of the data <strong>reviewer</strong> (the {EDITORIAL_TEAM.name}), so users can audit
        which claims on the site originate where.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Source vs. Review — Two Separate Roles</h2>
      <p>
        Every numeric value on GuideByCity has two attributions in its schema.org Dataset markup:
      </p>
      <ul>
        <li><strong>creator</strong> — the federal agency that produced the underlying data. For our core cost / demographic / climate / housing pages this is one of: U.S. Census Bureau, U.S. Bureau of Economic Analysis, U.S. Bureau of Labor Statistics, NOAA National Centers for Environmental Information, U.S. Department of Housing and Urban Development.</li>
        <li><strong>reviewedBy</strong> — the {EDITORIAL_TEAM.name}, which is part of the {PUBLISHER.name}. The editorial team performs the review described below; it does not create or replace any of the source-agency data.</li>
      </ul>
      <p>
        We split these two so that anyone — a reader, an AdSense reviewer, a search engine crawler — can verify that
        we are not presenting ourselves as the data origin. The data origin is always a federal agency; the editorial
        layer is what we add on top.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Source Agencies and Their Release Cycles</h2>
      <p>
        We track the published release cycle of each source agency rather than asserting a single sitewide
        &ldquo;last updated&rdquo; date, because the agencies refresh on independent schedules:
      </p>
      <ul>
        <li><strong>U.S. Census Bureau:</strong> American Community Survey 5-year estimates, released annually (typically December for the current vintage). We refresh the cities database within 30 days of each December release.</li>
        <li><strong>U.S. Bureau of Economic Analysis:</strong> Regional Price Parities, released annually (typically November for the prior year&apos;s parities). We update BEA-derived cost-of-living indices within 30 days.</li>
        <li><strong>U.S. Bureau of Labor Statistics:</strong> Consumer Price Index, monthly release (mid-month). We use BLS CPI as a freshness anchor rather than for cross-metro absolute comparison.</li>
        <li><strong>NOAA National Centers for Environmental Information:</strong> Climate Normals, 30-year reference period (currently 1991–2020), updated once per decade. NOAA Storm Events DB events are continuously appended; we re-pull on the FEMA NRI refresh cycle.</li>
        <li><strong>U.S. Department of Housing and Urban Development:</strong> Fair Market Rents, annual fiscal-year release (October FY start). We update HUD-derived rent figures at the FY rollover.</li>
        <li><strong>FEMA National Risk Index:</strong> Annual version refresh (v2024 is current). HazardTier rollup is recomputed at each NRI version.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">What the Editorial Team Reviews</h2>
      <p>
        The {EDITORIAL_TEAM.name} reviews three things on each release cycle, in this order:
      </p>
      <ol>
        <li><strong>Source URL validity.</strong> Every source we cite (Census ACS, BEA RPP, BLS CPI, NOAA NCEI, HUD FMR, FEMA NRI) is fetched and checked for HTTP 200, page-title match, and table-format stability before we re-ingest.</li>
        <li><strong>Calculation methodology.</strong> Our derived figures — cost-of-living index normalisation, HazardTier rollup thresholds, state-level aggregates — are re-computed against the new source release and audited for consistency with the prior cycle&apos;s output.</li>
        <li><strong>Per-source vintage labelling.</strong> Each entity (city / state / ZIP) carries its own dateModified reflecting the most recent source-agency release the entity inherits from, not a sitewide build date.</li>
      </ol>
      <p>
        The editorial team does not author the underlying figures. It audits the path from source to surface — that the
        Census number on the page matches the Census release, that the BEA index normalisation matches the BEA
        documentation, that the FEMA NRI primary-county mapping has not silently shifted between versions.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">HazardTier — Our Only Editorial Derivation</h2>
      <p>
        The single non-trivial editorial derivation we publish is HazardTier, a 5-band rollup of FEMA NRI v2024.
        HazardTier is not a FEMA-issued rating. The exact rule that produces each tier is published verbatim on the
        <a href="/methodology/" className="text-teal-700 hover:underline"> methodology page</a> and at the top of
        the <a href="/risk/" className="text-teal-700 hover:underline">/risk hub</a>, so reviewers can replay the
        classification against any FEMA NRI download. We do not publish &ldquo;risk scores&rdquo; that are not
        derivable from a public source.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Conflicts and Independence</h2>
      <p>
        GuideByCity is part of the {PUBLISHER.name}, a public-data aggregator network. We display third-party
        advertising via Google AdSense, but advertising relationships do not influence which datasets we ingest or
        how we classify them. The U.S. Census Bureau, BEA, BLS, NOAA, HUD, and FEMA do not sponsor, endorse, or
        advertise on GuideByCity.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p>
        Editorial questions can be raised via our <a href="/contact" className="text-teal-700 hover:underline">contact page</a>;
        corrections follow the separate <a href="/corrections-policy/" className="text-teal-700 hover:underline">corrections policy</a>.
      </p>

      <AuthorBox source="Editorial policy — separation between Census/BEA/BLS/NOAA/HUD source roles and editorial review by the GuideByCity team." />
    </article>
  );
}
