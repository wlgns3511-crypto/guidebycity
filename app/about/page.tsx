import type { Metadata } from "next";
import { AuthorBox } from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "About GuideByCity",
  description: "Learn about GuideByCity, our mission, and data sources.",
  alternates: { canonical: "/about/" },
  openGraph: { url: "/about/" },
};

export default function AboutPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-teal-700 mb-6">About GuideByCity</h1>

      <p>
        GuideByCity is a free resource for exploring and comparing cities across the United States. We provide
        detailed profiles for over 380 cities, covering cost of living, income levels, housing data, demographics,
        and more. Our city-to-city comparison tool makes it easy to evaluate different locations side by side.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Our Mission</h2>
      <p>
        Whether you are planning a move, researching potential neighborhoods, or simply curious about life in
        different parts of the country, GuideByCity is here to help. Our mission is to make comprehensive city data
        accessible and easy to understand, empowering you to make informed decisions about where to live, work, and
        build your future.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Sources</h2>
      <p>
        Every figure on GuideByCity is sourced from a public federal dataset. The <strong>U.S. Census Bureau</strong>{" "}
        American Community Survey (Census ACS) is the largest single source — Census ACS B25077 supplies median
        home value, Census ACS B19013 supplies median household income, Census ACS B25064 and B25070 supply
        median rent and rent-burden series, and the Census ACS population tables supply per-metro population
        estimates. The <strong>U.S. Census Bureau Decennial Census</strong> (Census Decennial 2010) supplies the
        anchored population baseline that pairs with the Census ACS estimate to compute PopulationGrowthBand.
      </p>
      <p>
        The <strong>U.S. Bureau of Economic Analysis (BEA)</strong> Regional Price Parities supplies the metro-level
        cost-of-living index. The <strong>U.S. Bureau of Labor Statistics (BLS)</strong> Consumer Price Index supplies
        the underlying price data behind BEA Regional Price Parities. The <strong>NOAA National Centers for
        Environmental Information (NOAA NCEI)</strong> supplies the 30-year Climate Normals (1991–2020) used for
        per-city climate summaries. The <strong>U.S. Department of Housing and Urban Development (HUD)</strong> Fair
        Market Rent (HUD FMR) series supplies the per-county rent benchmark cross-referenced against Census ACS
        B25064. The <strong>FEMA National Risk Index (FEMA NRI v2024)</strong> supplies the per-county hazard rating
        and the per-hazard rating that drives HazardTier.
      </p>
      <p>
        We update each source on its own release cadence. Census ACS publishes new 5-year estimates each December.
        Census Decennial 2010 is fixed until the Census Decennial 2030 release lands. BEA Regional Price Parities
        publishes annually each November. BLS Consumer Price Index publishes monthly. NOAA Climate Normals updates
        every 10 years on a rolling 30-year baseline. HUD FMR updates annually each October for the new fiscal year.
        FEMA NRI publishes a new release roughly annually; we re-ingest within 60 days of each new FEMA NRI version.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Editorial Posture</h2>
      <p>
        GuideByCity does not author the underlying federal figures. The U.S. Census Bureau is the creator of the
        Census ACS B25077, Census ACS B19013, Census ACS B25064, and Census ACS B25070 tables; the U.S. Census
        Bureau is also the creator of the Census Decennial 2010 anchored population count. The U.S. Bureau of
        Economic Analysis is the creator of the BEA Regional Price Parities. The U.S. Bureau of Labor Statistics is
        the creator of the BLS Consumer Price Index. NOAA National Centers for Environmental Information is the
        creator of the NOAA Climate Normals. The U.S. Department of Housing and Urban Development is the creator
        of the HUD Fair Market Rent series. FEMA is the creator of the FEMA NRI v2024 risk dataset.
      </p>
      <p>
        Atop those raw federal records, GuideByCity computes three editorial classifiers. <strong>HazardTier</strong> is
        a 5-band rollup of FEMA NRI v2024 (combining the FEMA NRI primary-county overall rating with FEMA NRI top-3
        hazard ratings). <strong>CityAffordabilityTier</strong> is a 5-band classifier of the Census ACS B25077 over
        Census ACS B19013 price-to-income ratio (Demographia + FRB Atlanta HOAM convention).{" "}
        <strong>PopulationGrowthBand</strong> is a 5-band classifier of the Census Decennial 2010 → Census ACS 2024
        annualized population change rate. All three classifiers are GuideByCity editorial constructs, not
        FEMA-issued or Census-issued tiers; the cutoffs are documented at <a href="/methodology/" className="text-teal-600 hover:underline">/methodology/</a>{" "}
        and the deeper per-classifier explainers live at /guide/city-affordability-tier/, /guide/population-growth-band/,
        and /guide/reading-city-pages/.
      </p>
      <p>
        See our <a href="/editorial-policy/" className="text-teal-600 hover:underline">editorial policy</a> for
        the source-vs-review separation, and our <a href="/corrections-policy/" className="text-teal-600 hover:underline">corrections policy</a> for
        how to flag a mismatch between a Census ACS, Census Decennial, BEA Regional Price Parities, BLS Consumer
        Price Index, NOAA Climate Normals, HUD Fair Market Rent, or FEMA NRI value and what GuideByCity displays.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">What GuideByCity does not do</h2>
      <p>
        We do not author city profiles around aspirational marketing copy. Every figure on a GuideByCity city
        page traces back to a Census ACS, Census Decennial, BEA Regional Price Parities, BLS Consumer Price Index,
        NOAA Climate Normals, HUD Fair Market Rent, or FEMA NRI value that any reader can independently verify
        against the source agency&apos;s released file. We do not synthesize plausible-looking numbers when the
        Census ACS, Census Decennial, BEA Regional Price Parities, BLS Consumer Price Index, NOAA Climate Normals,
        HUD Fair Market Rent, or FEMA NRI record does not support them — the PopulationGrowthBand &ldquo;Unknown&rdquo;
        suppression and the HazardTier confidence: low suppression are the explicit honesty contracts.
      </p>
      <p>
        We do not provide relocation, financial, legal, real estate, insurance, or medical advice. We surface the
        Census ACS, Census Decennial, BEA Regional Price Parities, BLS Consumer Price Index, NOAA Climate Normals,
        HUD Fair Market Rent, and FEMA NRI record at metro resolution; the disclaimer page documents what that
        scope does and does not support.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact Us</h2>
      <p>
        Have questions or feedback? Visit our <a href="/contact" className="text-teal-600 hover:underline">Contact page</a> to get in touch.
      </p>

      <AuthorBox source="Census ACS · BEA RPP · BLS CPI · NOAA NCEI · HUD FMR · FEMA NRI v2024" />
    </article>
  );
}
