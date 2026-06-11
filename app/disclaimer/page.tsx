import type { Metadata } from "next";
import { LEGAL_VINTAGES } from "@/lib/authorship";
import { AuthorBox } from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer and limitations of liability for GuideByCity. Data origin, limits on each source, and how to read our HazardTier rollup.",
  alternates: { canonical: "/disclaimer/" },
  openGraph: { url: "/disclaimer/" },
};

export default function DisclaimerPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-teal-700 mb-6">Disclaimer</h1>
      <p className="text-sm text-slate-500 mb-8">
        Last updated: <time dateTime={LEGAL_VINTAGES.disclaimer}>{LEGAL_VINTAGES.disclaimer}</time>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Scope of the Site</h2>
      <p>
        GuideByCity is a US city, state, and ZIP information resource. We compile public datasets from the U.S. Census Bureau (American Community Survey), the U.S. Bureau of Economic Analysis (Regional Price Parities), the U.S. Bureau of Labor Statistics (Consumer Price Index), NOAA National Centers for Environmental Information (Climate Normals), and the U.S. Department of Housing and Urban Development (Fair Market Rent). Pages are informational; they do not represent personalised advice for any specific household, household member, or property.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Not Professional Advice</h2>
      <p>
        Nothing on GuideByCity is legal, financial, insurance, real-estate, or relocation advice. Cost-of-living figures, hazard-risk classifications, and demographic comparisons are starting points for further diligence, not substitutes for a licensed advisor, an insurance underwriter, a property inspector, or a state-specific real-estate professional. Decisions involving substantial money, contractual commitment, or insurance coverage should be confirmed with a qualified professional in the jurisdiction of interest.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Data Origin and Limits</h2>
      <p>
        Every numeric value we surface inherits the limits of the originating public dataset. We surface those limits page-by-page in our methodology, but the headline constraints to be aware of:
      </p>
      <ul>
        <li><strong>U.S. Census Bureau (ACS):</strong> 5-year rolling estimates released annually. Small-area estimates (ZIP, sub-metro) carry sampling error materially larger than national or state totals. The Census Bureau does not warrant the use of ACS for individual decisions.</li>
        <li><strong>U.S. Bureau of Economic Analysis (RPP):</strong> Regional Price Parities are annual, metro-level, and exclude housing-quality differences. The BEA explicitly cautions that RPPs are not a substitute for a market-basket cost calculator.</li>
        <li><strong>U.S. Bureau of Labor Statistics (CPI):</strong> CPI series are national or metro-level monthly indices. They measure inflation, not absolute cost; we use BLS CPI as a freshness anchor, not for cross-metro absolute comparison.</li>
        <li><strong>NOAA National Centers for Environmental Information:</strong> Climate Normals are 30-year reference values (currently 1991–2020). NOAA documentation notes Normals describe average conditions, not extremes; users planning around extreme weather should consult NOAA Storm Events DB and event-frequency products separately.</li>
        <li><strong>U.S. Department of Housing and Urban Development:</strong> Fair Market Rents are annual fiscal-year estimates derived for HUD programme administration. HUD&apos;s own publications caution that FMRs are not market rents — they reflect the 40th percentile of standard-quality rentals.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">HazardTier and FEMA NRI</h2>
      <p>
        Our HazardTier 5-band classification (Low → Extreme) is a guidebycity-derived rollup of the FEMA National Risk Index v2024, combining the metro&apos;s primary-county overall rating with the count of FEMA &ldquo;Very High&rdquo;-rated hazards in the metro&apos;s top-3 hazard set. HazardTier is not a FEMA-issued rating and is not endorsed by FEMA, NOAA, or the U.S. Department of Housing and Urban Development. FEMA NRI is itself a screening tool, not a parcel-level risk certification; use the FEMA Flood Map Service Center, USGS National Seismic Hazard Maps, and equivalent source-of-truth products for parcel-specific decisions.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">External Links</h2>
      <p>
        We link to the U.S. Census Bureau, the U.S. Bureau of Economic Analysis, the U.S. Bureau of Labor Statistics, NOAA, the U.S. Department of Housing and Urban Development, FEMA, USGS, and other federal and state agencies for source verification. We do not control those sites and do not warrant their availability, accuracy, or future changes. External links open in a new tab where supported by the user&apos;s browser.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Advertising</h2>
      <p>
        GuideByCity displays third-party advertisements via Google AdSense and other ad networks. Advertised products and services are not endorsed by GuideByCity, and the appearance of an ad does not constitute a recommendation. Federal data sources (Census Bureau, BEA, BLS, NOAA, HUD) do not sponsor, endorse, or advertise on GuideByCity.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Limitation of Liability</h2>
      <p>
        In no event shall GuideByCity, the DataPeek Research Network, its operators, or its contributors be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use of this website or any reliance placed on the data displayed. Public datasets from Census, BEA, BLS, NOAA, and HUD are reproduced and adapted for screening purposes; the originating agencies make their own warranty disclaimers, which apply in addition to ours.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p>
        For corrections to data or factual content, see our <a href="/corrections-policy/" className="text-teal-700 hover:underline">corrections policy</a>. For general inquiries, visit our <a href="/contact" className="text-teal-700 hover:underline">contact page</a>.
      </p>

      <AuthorBox source="Census ACS · BEA RPP · BLS CPI · NOAA NCEI Climate Normals · HUD FMR · FEMA NRI v2024 (HazardTier rollup)" />
    </article>
  );
}
