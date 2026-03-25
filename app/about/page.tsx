import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About GuideByCity",
  description: "Learn about GuideByCity, our mission, and data sources.",
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
        Our data comes from trusted government sources including the <strong>Bureau of Economic Analysis (BEA)</strong>{" "}
        and the <strong>U.S. Census Bureau</strong>. The BEA provides Regional Price Parities and personal income
        data, while the Census Bureau supplies population, housing, and demographic statistics. We update our data
        regularly as new releases become available to ensure accuracy.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact Us</h2>
      <p>
        Have questions or feedback? Visit our <a href="/contact" className="text-teal-600 hover:underline">Contact page</a> to get in touch.
      </p>
    </article>
  );
}
