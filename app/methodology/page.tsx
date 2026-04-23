import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Methodology — How GuideByCity Builds Its City Data",
  description:
    "How GuideByCity sources US city data — combining Census ACS demographics, BEA Regional Price Parities for cost of living, BLS CPI, NOAA climate data, and MIT Living Wage Calculator.",
  alternates: { canonical: "/methodology/" },
  openGraph: { url: "/methodology/" },
};

export default function MethodologyPage() {
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <h1>Our Methodology</h1>
      <p className="lead text-lg text-slate-600">
        Choosing where to live is one of the biggest decisions a US
        household makes. You deserve to know exactly where our city
        statistics come from, what they cover, and what only direct
        experience can tell you about a specific place.
      </p>

      <h2>Primary sources</h2>
      <ul>
        <li>
          <a
            href="https://www.census.gov/programs-surveys/acs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            US Census Bureau American Community Survey (ACS)
          </a>{" "}
          &mdash; the source for population, median household income,
          median home value, median rent, age distribution, and
          educational attainment.
        </li>
        <li>
          <a
            href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area"
            target="_blank"
            rel="noopener noreferrer"
          >
            BEA Regional Price Parities (RPP)
          </a>{" "}
          &mdash; the Bureau of Economic Analysis publishes
          standardized cost-of-living indices for US metros.
        </li>
        <li>
          <a
            href="https://www.bls.gov/cpi/"
            target="_blank"
            rel="noopener noreferrer"
          >
            BLS Consumer Price Index
          </a>{" "}
          &mdash; the underlying price data behind BEA RPP.
        </li>
        <li>
          <a
            href="https://www.ncei.noaa.gov/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NOAA Climate Data
          </a>{" "}
          &mdash; the National Centers for Environmental Information
          publishes 30-year climate normals for thousands of US
          stations.
        </li>
        <li>
          <a
            href="https://livingwage.mit.edu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT Living Wage Calculator
          </a>{" "}
          &mdash; an academic tool that estimates the hourly wage
          needed to support a household by family size and county.
        </li>
      </ul>

      <h2>What we publish per city</h2>
      <ul>
        <li>
          <strong>Cost of living index</strong> &mdash; from BEA RPP,
          normalized to US average = 100.
        </li>
        <li>
          <strong>Component indices</strong> &mdash; housing, goods,
          and utilities sub-indices.
        </li>
        <li>
          <strong>Median household income</strong> &mdash; from ACS.
        </li>
        <li>
          <strong>Median home value</strong> &mdash; from ACS.
        </li>
        <li>
          <strong>Median rent</strong> &mdash; from ACS.
        </li>
        <li>
          <strong>Climate summary</strong> &mdash; average high/low
          temperatures, precipitation, and best months to visit, from
          NOAA normals.
        </li>
        <li>
          <strong>City pros and cons</strong> &mdash; computed
          deterministically from the above indices.
        </li>
      </ul>

      <h2>Cross-reference and verification</h2>
      <ul>
        <li>
          <a
            href="https://data.census.gov/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Census Data Explorer
          </a>{" "}
          &mdash; the official interface to ACS tables.
        </li>
        <li>
          <a
            href="https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area"
            target="_blank"
            rel="noopener noreferrer"
          >
            BEA RPP
          </a>{" "}
          &mdash; the primary RPP source.
        </li>
        <li>
          <a
            href="https://livingwage.mit.edu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT Living Wage Calculator
          </a>{" "}
          &mdash; for family-size cost estimates.
        </li>
        <li>
          <a
            href="https://www.ncei.noaa.gov/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NOAA NCEI
          </a>{" "}
          &mdash; the climate data source.
        </li>
      </ul>

      <h2>Update frequency</h2>
      <p>
        Census ACS publishes new 5-year estimates each December. BEA
        RPP publishes annually. NOAA climate normals update on a
        30-year cycle. We refresh our combined dataset quarterly.
      </p>

      <h2>Limitations you should know about</h2>
      <ul>
        <li>
          <strong>Metro-level resolution.</strong> Our data is at the
          metro or city level. Within a large city, neighborhoods can
          have very different cost, income, and safety profiles.
        </li>
        <li>
          <strong>Lag.</strong> Census ACS 5-year estimates lag by
          12-18 months. BEA RPP lags 12-24 months.
        </li>
        <li>
          <strong>Subjective factors not captured.</strong> Quality
          of life, community vibe, and cultural fit are real factors
          that no statistic can measure. Visit before relocating.
        </li>
        <li>
          <strong>Climate normals are 30-year averages.</strong>
          Recent climate trends may not be fully reflected.
        </li>
        <li>
          <strong>Not relocation, financial, or legal advice.</strong>
          For decisions with real money on the line, work with a
          licensed professional.
        </li>
      </ul>

      <h2>Corrections and feedback</h2>
      <p>
        If a published Census, BEA, BLS, or NOAA figure disagrees with
        what you see here, please <a href="/contact">contact us</a>{" "}
        with the source URL.
      </p>

      <p className="text-sm text-slate-500 border-t pt-4 mt-8">
        This methodology page was last reviewed in March 2026. Material
        changes to how we source or compute the data will be reflected
        here before they reach production pages.
      </p>
    </article>
  );
}
