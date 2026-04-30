import type { Metadata } from "next";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "What Is a Walk Score? The 0-100 Walkability Metric Explained",
  description:
    "A complete explainer on Walk Score — what the 0-100 scale means, how it's calculated from nearby amenities, the four walkability bands, and common misconceptions.",
  alternates: { canonical: "/what-is-walk-score/" },
  openGraph: { url: "/what-is-walk-score/" },
};

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "What Is a Walk Score?", url: "/what-is-walk-score/" },
];

const faqs = [
  {
    question: "What is considered a good Walk Score?",
    answer:
      "Anything 70 or higher is considered 'very walkable,' meaning most daily errands can be done on foot. Scores of 90-100 qualify as a 'Walker's Paradise' where a car is usually unnecessary. Scores below 50 indicate a car-dependent neighborhood, and scores below 25 mean almost every errand requires driving.",
  },
  {
    question: "Who owns Walk Score and where does the data come from?",
    answer:
      "Walk Score was launched in 2007 by Front Seat, a Seattle civic-software company, and was acquired by Redfin in 2014. It is now operated as a Redfin product. Scores are calculated from commercial and public datasets of nearby amenities — grocery stores, restaurants, schools, parks, coffee shops, banks, entertainment venues, and more.",
  },
  {
    question: "Does Walk Score measure how safe a neighborhood is?",
    answer:
      "No. Walk Score only measures access to amenities within walking distance. It does not account for crime, traffic collision rates, sidewalk quality, street lighting, weather, topography, or how pleasant the walk actually feels. Two addresses can share an identical Walk Score yet offer very different real-world walking experiences.",
  },
  {
    question: "How accurate is Walk Score for a specific address?",
    answer:
      "Walk Score uses a distance-decay algorithm that rewards amenities within roughly a 5-minute walk and gives progressively less credit out to 30 minutes. It is reasonably accurate for dense urban grids but can overstate walkability in places with highways, gated communities, unconnected cul-de-sacs, or missing sidewalks, because it does not always see the true pedestrian network.",
  },
  {
    question: "Can a rural town or small city have a high Walk Score?",
    answer:
      "Yes, but usually only in the compact historic core. Many small American downtowns score 80-95 around the main street, then drop below 30 a mile away. Total Walk Scores you see for an entire city are typically averages or medians that can hide very different scores from one block to the next.",
  },
  {
    question: "What is the difference between Walk Score, Transit Score, and Bike Score?",
    answer:
      "Walk Score measures walkable amenity density. Transit Score, also on a 0-100 scale, measures the usefulness of nearby public transit — frequency, coverage, and the variety of routes. Bike Score combines bike infrastructure, topography, destination density, and the share of bike commuters. All three use the same four-band labeling system.",
  },
];

export default function WhatIsWalkScorePage() {
  return (
    <>
      <article className="prose prose-slate max-w-3xl mx-auto">
        <nav className="text-sm text-slate-500 mb-4 not-prose">
          <a href="/" className="hover:underline">Home</a>
          {" / "}
          <span className="text-slate-800">What Is a Walk Score?</span>
        </nav>

        <h1>What Is a Walk Score? The 0-100 Walkability Metric Explained</h1>
        <p className="lead text-lg text-slate-600">
          Walk Score is a 0-to-100 number that estimates how easily
          you can live day-to-day life on foot from a given address.
          It is the most widely cited walkability metric in the United
          States, and it shows up on real-estate listings, relocation
          guides, and city-data pages — including ours. This page
          explains what the number actually measures, how it is
          calculated, and, just as importantly, what it does not tell
          you.
        </p>

        <h2>What a Walk Score is</h2>
        <p>
          Walk Score is a proprietary index created in 2007 by Front
          Seat, a Seattle-based civic-software company, and acquired
          by the real-estate brokerage Redfin in 2014. It assigns any
          US address a single integer from 0 to 100. A higher score
          means more daily needs — groceries, restaurants, schools,
          parks, coffee, errands — can be met within a short walk.
          A lower score means a car is effectively required.
        </p>
        <p>
          The index is used by Redfin, Zillow, apartment-search
          sites, city planners, transportation researchers, and
          academic studies on public health and housing affordability.
          Because it is free to look up and easy to compare, it has
          become a de facto shorthand for &ldquo;walkability&rdquo; in
          American real estate, even though the concept of walkability
          is much richer than any single number.
        </p>

        <h2>How Walk Score is calculated</h2>
        <p>
          The algorithm is a distance-decay model over nearby
          amenities. For a given address, Walk Score looks at how
          close the nearest grocery store, restaurant, coffee shop,
          bar, park, school, bank, bookstore, entertainment venue,
          and a handful of other categories are. Each amenity
          category contributes points based on how far away its
          closest instances are.
        </p>
        <ul>
          <li>
            Amenities within about a 5-minute walk (roughly a
            quarter mile) earn close to full points.
          </li>
          <li>
            Credit decays smoothly as distance increases, reaching
            zero at roughly a 30-minute walk (about 1.5 miles).
          </li>
          <li>
            Additional adjustments penalize addresses with long
            blocks, low intersection density, and few nearby
            intersections — proxies for places where you can
            physically walk from one point to another without being
            forced onto a highway or a cul-de-sac loop.
          </li>
        </ul>
        <p>
          The scores for every amenity category are weighted and
          summed, then normalized onto the 0-100 scale. Redfin has
          documented the general shape of the algorithm publicly, but
          the exact weights, amenity datasets, and decay curves are
          proprietary and have been refined over the years.
        </p>

        <h2>The four Walk Score bands</h2>
        <p>
          Every Walk Score falls into one of four named bands. These
          bands are the labels you will see in most real-estate
          listings and relocation guides.
        </p>
        <ul>
          <li>
            <strong>90-100 &mdash; Walker&rsquo;s Paradise.</strong>
            Daily errands do not require a car. Typical of central
            Manhattan, downtown San Francisco, Cambridge MA, and a
            small number of dense urban cores.
          </li>
          <li>
            <strong>70-89 &mdash; Very Walkable.</strong> Most
            errands can be accomplished on foot. Common in older
            streetcar neighborhoods, university towns, and compact
            downtown districts.
          </li>
          <li>
            <strong>50-69 &mdash; Somewhat Walkable.</strong> Some
            errands can be accomplished on foot, but a car makes
            life much easier. Describes many inner-ring suburbs and
            mid-size American downtowns.
          </li>
          <li>
            <strong>0-49 &mdash; Car-Dependent.</strong> Most
            errands require a car. 25-49 means a car is nearly
            essential; under 25 means almost every errand requires
            driving. Typical of postwar suburbs, exurbs, and rural
            areas.
          </li>
        </ul>

        <h2>How to find and interpret a Walk Score</h2>
        <p>
          The simplest way to look up a score is the official Redfin
          Walk Score site, which accepts any US address. Most major
          real-estate portals also display the score next to a
          listing. When you see a score, keep two things in mind.
        </p>
        <p>
          <strong>First, the score is per address, not per city.</strong>
          A city-wide number is almost always an average or a median
          of its neighborhoods. A city with a headline Walk Score
          of 55 can easily contain blocks that score 95 and other
          blocks that score 20. On our city pages, we report the
          Walk Score for the functional downtown or urban core, which
          is usually the highest-walking district. To compare
          whole metros, look at walkability alongside the cost of
          living and income data on each city page.
        </p>
        <p>
          <strong>Second, the score is a starting point, not a
          verdict.</strong> Two addresses with the same Walk Score
          can feel completely different on the ground. One may have
          continuous sidewalks, street trees, and short crosswalks;
          the other may have six-lane arterials, missing sidewalks,
          and 45-mph traffic. Before you commit to a move, walk the
          streets at the times of day you would actually use them.
        </p>

        <h2>Common misconceptions</h2>
        <p>
          Walk Score gets invoked in a lot of arguments it was never
          designed to settle. The most common misreadings:
        </p>
        <ul>
          <li>
            <strong>It is not a safety score.</strong> Walk Score
            does not look at crime, pedestrian collision rates, or
            fatality data. A high score tells you amenities are
            close; it tells you nothing about whether the walk is
            safe.
          </li>
          <li>
            <strong>It is not a quality-of-walk score.</strong> The
            algorithm does not know whether the sidewalk is in good
            repair, whether the block has shade, or whether the
            crosswalks have signals. A highway frontage road with
            many restaurants can score surprisingly well.
          </li>
          <li>
            <strong>It ignores weather and terrain.</strong> A 90 in
            Minneapolis in February and a 90 in San Diego in June
            are not the same walk. The algorithm does not discount
            for snow, heat, humidity, or hills.
          </li>
          <li>
            <strong>It does not capture destination quality.</strong>
            A block counts a nearby corner store the same way it
            counts a full-service grocery. A coffee shop counts
            whether or not it is any good.
          </li>
          <li>
            <strong>It assumes you are physically able to walk.</strong>
            A score that treats a quarter-mile as a 5-minute walk
            assumes a typical adult pace. For anyone using a
            wheelchair, pushing a stroller, or walking with limited
            mobility, effective walkability depends far more on curb
            cuts, gradient, and sidewalk continuity than on amenity
            density.
          </li>
        </ul>

        <h2>Transit Score and Bike Score</h2>
        <p>
          Walk Score has two sibling indices on the same 0-100
          scale, computed by the same company and shown in the same
          places.
        </p>
        <p>
          <strong>Transit Score</strong> measures the usefulness of
          the public transit around an address. It factors in the
          frequency of nearby bus and rail service, the number of
          distinct routes, and the types of service available
          (rail, bus rapid transit, ferry, local bus). It will
          penalize a neighborhood where a single hourly bus is the
          only option and reward one with high-frequency service
          on several modes. It is available in most large US
          metros.
        </p>
        <p>
          <strong>Bike Score</strong> estimates how good a place is
          for biking. It combines the density of bike
          infrastructure (lanes and trails), topography (hills hurt
          the score), destination density, and the share of the
          local population that commutes by bike. Bike Score is a
          newer and sparser dataset than the other two.
        </p>

        <h2>How to improve — or just correctly read — a neighborhood&rsquo;s score</h2>
        <p>
          Residents and civic groups often ask what they can do to
          raise a block&rsquo;s Walk Score. The honest answer is that
          the score is a downstream measurement, not a lever. What
          raises it over time is slow, structural, and mostly out of
          any one resident&rsquo;s control:
        </p>
        <ul>
          <li>
            Denser, mixed-use zoning so that homes and shops sit on
            the same streets.
          </li>
          <li>
            Shorter blocks and more intersections so the pedestrian
            network actually connects.
          </li>
          <li>
            New grocery, school, or park openings, which count as
            new amenities in the algorithm.
          </li>
          <li>
            Complete-streets retrofits — adding sidewalks, bike
            lanes, and crosswalks to streets that were built purely
            for cars.
          </li>
        </ul>
        <p>
          If you are relocating and walkability matters to you, the
          most useful posture is to treat Walk Score as one of three
          or four signals. Look at the number, walk the block at
          different hours, check the transit and biking options,
          and read{" "}
          <a href="/methodology/">our methodology</a> so you know
          what else we measure and what we intentionally leave out.
          From there, browse{" "}
          <a href="/city/">all cities</a> to find walkability
          alongside the cost of living, income, and climate data that
          actually determine whether a place fits your life.
        </p>

        <h2>Frequently asked questions</h2>
        {faqs.map((f) => (
          <div key={f.question}>
            <h3>{f.question}</h3>
            <p>{f.answer}</p>
          </div>
        ))}

        <p className="text-sm text-slate-500 border-t pt-4 mt-8">
          Walk Score&reg; is a registered trademark of Redfin. This
          explainer is independent reference material and is not
          affiliated with or endorsed by Walk Score or Redfin. Last
          reviewed April 2026.
        </p>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...breadcrumbSchema(breadcrumbs),
            author: { "@type": "Organization", name: "DataPeek" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...faqSchema(faqs),
            author: { "@type": "Organization", name: "DataPeek" },
          }),
        }}
      />
    </>
  );
}
