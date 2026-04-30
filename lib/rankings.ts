/**
 * rankings.ts — guidebycity HCU 5-chunk patch (2026-04-29).
 *
 * 10-type ranking registry. Each type has a SQL builder, label, blurb, and
 * row formatter. Powers both /rankings/ index and /rankings/[type]/ pages.
 *
 * 8 types lift cost/income axes from the existing DB (BEA RPP + ACS); 2 new
 * types (highest-risk-cities, safest-cities) draw on the NRI cbsa_risk table
 * imported 2026-04-29 — that's the unique-data lever vs costbycity.
 */

import { getDb } from './db';
import type { City } from './db';

export type RankingType =
  | 'most-expensive-cities'
  | 'most-affordable-cities'
  | 'cheapest-housing'
  | 'most-expensive-housing'
  | 'income-leaders'
  | 'value-leaders'
  | 'cheapest-utilities'
  | 'rent-burden-highest'
  | 'highest-risk-cities'
  | 'safest-cities';

export interface RankingProfile {
  type: RankingType;
  title: string;
  shortLabel: string;
  blurb: string;
  metaTitle: string;
  metaDescription: string;
  primaryLabel: string;
  primaryFmt: (v: number | null) => string;
  secondaryLabel?: string;
  secondaryFmt?: (v: number | null) => string;
  tone: 'red' | 'emerald' | 'amber' | 'sky' | 'indigo' | 'orange' | 'teal' | 'violet';
}

const fmtIdx = (v: number | null) => v == null ? '—' : v.toFixed(1);
const fmtUSD = (v: number | null) => v == null ? '—' : `$${Math.round(v).toLocaleString('en-US')}`;
const fmtPct = (v: number | null) => v == null ? '—' : `${v.toFixed(1)}%`;
const fmtScore = (v: number | null) => v == null ? '—' : v.toFixed(1);

export const RANKING_PROFILES: Record<RankingType, RankingProfile> = {
  'most-expensive-cities': {
    type: 'most-expensive-cities',
    title: 'Most Expensive US Cities',
    shortLabel: 'Most expensive',
    blurb: 'Metro areas with the highest BEA-derived cost-of-living index. Big-coastal-metro housing markets dominate the top of the list, with West Coast tech hubs and Northeast finance corridors leading.',
    metaTitle: 'Most Expensive US Cities — Top 25 Cost of Living Rankings',
    metaDescription: 'The 25 most expensive US metro areas ranked by cost-of-living index from BEA Regional Price Parities. See the gap to the national baseline of 100.',
    primaryLabel: 'Cost Index',
    primaryFmt: fmtIdx,
    secondaryLabel: 'Median Rent',
    secondaryFmt: fmtUSD,
    tone: 'red',
  },
  'most-affordable-cities': {
    type: 'most-affordable-cities',
    title: 'Most Affordable US Cities',
    shortLabel: 'Most affordable',
    blurb: 'Metros where the BEA cost-of-living index sits well below the national baseline of 100. Most of the top of this list is the inland South, Rust Belt, and small-Midwest metros where housing costs anchor the index low.',
    metaTitle: 'Most Affordable US Cities — Top 25 by Cost of Living',
    metaDescription: 'The 25 most affordable US metros, ranked by lowest BEA cost-of-living index. See where your dollar stretches furthest on housing, goods, and services.',
    primaryLabel: 'Cost Index',
    primaryFmt: fmtIdx,
    secondaryLabel: 'Median Income',
    secondaryFmt: fmtUSD,
    tone: 'emerald',
  },
  'cheapest-housing': {
    type: 'cheapest-housing',
    title: 'Cheapest Housing Markets',
    shortLabel: 'Cheapest housing',
    blurb: 'Metros where the BEA housing component of the cost index is lowest. Housing is typically the single largest line in the cost-of-living gap, so these rankings often diverge from the overall index — a few inland metros rank cheaper here than on overall cost.',
    metaTitle: 'Cheapest Housing Markets — Top 25 US Metros',
    metaDescription: 'The 25 US metros with the lowest BEA housing-cost index. Where rent and home prices stretch a household budget furthest.',
    primaryLabel: 'Housing Index',
    primaryFmt: fmtIdx,
    secondaryLabel: 'Median Home',
    secondaryFmt: fmtUSD,
    tone: 'sky',
  },
  'most-expensive-housing': {
    type: 'most-expensive-housing',
    title: 'Most Expensive Housing Markets',
    shortLabel: 'Most expensive housing',
    blurb: 'Metros where the BEA housing index runs furthest above the national baseline. Coastal supply constraints, strong job markets, and limited land combine here to push housing well above goods or services costs in the same metro.',
    metaTitle: 'Most Expensive Housing Markets — Top 25 US Metros',
    metaDescription: 'The 25 US metros with the highest BEA housing-cost index. Where housing is the dominant driver of the overall cost-of-living gap.',
    primaryLabel: 'Housing Index',
    primaryFmt: fmtIdx,
    secondaryLabel: 'Median Home',
    secondaryFmt: fmtUSD,
    tone: 'orange',
  },
  'income-leaders': {
    type: 'income-leaders',
    title: 'Highest Median Income Cities',
    shortLabel: 'Income leaders',
    blurb: 'Metros with the highest ACS median household income. High income alone is not the full story — these rankings should be read alongside the local cost index. A high-income metro with elevated housing costs may deliver less real purchasing power than the headline figure suggests.',
    metaTitle: 'Highest Median Income US Cities — Top 25 by ACS Data',
    metaDescription: 'The 25 US metros with the highest ACS median household income. See where headline incomes are largest before adjusting for cost of living.',
    primaryLabel: 'Median Income',
    primaryFmt: fmtUSD,
    secondaryLabel: 'Cost Index',
    secondaryFmt: fmtIdx,
    tone: 'emerald',
  },
  'value-leaders': {
    type: 'value-leaders',
    title: 'Best Real-Income Cities (Cost-Adjusted)',
    shortLabel: 'Value leaders',
    blurb: 'Metros where median income converted to real (cost-adjusted) dollars is highest. Real income = nominal median × (100 / cost index). This rewards cities that combine reasonable wages with affordable housing — usually inland metros with strong industries that have not yet been priced into the housing market.',
    metaTitle: 'Best Real-Income Cities — Top 25 Cost-Adjusted Rankings',
    metaDescription: 'The 25 US metros with the highest cost-adjusted real income. Where actual purchasing power lands after applying the BEA cost-of-living index to ACS household income.',
    primaryLabel: 'Real Income',
    primaryFmt: fmtUSD,
    secondaryLabel: 'Cost Index',
    secondaryFmt: fmtIdx,
    tone: 'teal',
  },
  'cheapest-utilities': {
    type: 'cheapest-utilities',
    title: 'Cheapest Utility Markets',
    shortLabel: 'Cheapest utilities',
    blurb: 'Metros where the BEA utilities component runs furthest below the national baseline. Utility costs are usually the smallest of the three index components but can become a deal-breaker in extreme-climate metros where heating or cooling demand is heavy year-round.',
    metaTitle: 'Cheapest Utility Markets — Top 25 US Metros',
    metaDescription: 'The 25 US metros with the lowest BEA utilities-cost index. Where electric, gas, and water bills stretch a budget furthest.',
    primaryLabel: 'Utilities Index',
    primaryFmt: fmtIdx,
    secondaryLabel: 'Cost Index',
    secondaryFmt: fmtIdx,
    tone: 'indigo',
  },
  'rent-burden-highest': {
    type: 'rent-burden-highest',
    title: 'Highest Rent-Burden Cities',
    shortLabel: 'Highest rent burden',
    blurb: 'Metros where annual median rent consumes the highest share of median household income. HUD considers >30% the cost-burden threshold; cities above 35% combine high rents with relatively flat wages, often in tourism-heavy or high-demand-low-supply markets.',
    metaTitle: 'Highest Rent-Burden US Cities — Where Rent Eats the Most',
    metaDescription: 'The 25 US metros with the highest rent-to-income ratios. Where housing affordability is most stretched against ACS median household income.',
    primaryLabel: 'Rent Burden',
    primaryFmt: fmtPct,
    secondaryLabel: 'Median Rent',
    secondaryFmt: fmtUSD,
    tone: 'amber',
  },
  'highest-risk-cities': {
    type: 'highest-risk-cities',
    title: 'Highest-Risk US Cities (FEMA NRI)',
    shortLabel: 'Highest natural-hazard risk',
    blurb: 'Metros with the highest FEMA National Risk Index composite score. The NRI folds 18 hazards (hurricane, tornado, wildfire, earthquake, flooding, hail, heat wave, cold wave, etc.) and adjusts for population at risk and expected annual loss. Top scores tend to cluster in densely populated coastal and high-fire metros.',
    metaTitle: 'Highest-Risk US Cities — Top 25 by FEMA National Risk Index',
    metaDescription: 'The 25 US metros with the highest FEMA NRI composite hazard score, drawing on 18 named natural hazards plus population and asset exposure.',
    primaryLabel: 'NRI Score',
    primaryFmt: fmtScore,
    secondaryLabel: 'Cost Index',
    secondaryFmt: fmtIdx,
    tone: 'red',
  },
  'safest-cities': {
    type: 'safest-cities',
    title: 'Safest US Cities (FEMA NRI)',
    shortLabel: 'Lowest natural-hazard risk',
    blurb: 'Metros with the lowest FEMA National Risk Index composite score. These are typically inland counties outside major hurricane / tornado / wildfire / seismic corridors, with modest at-risk population and few hazards reaching above-average annualized losses. Lower NRI scores correlate with cheaper homeowner insurance and fewer disaster-related housing-stock disruptions.',
    metaTitle: 'Safest US Cities — Top 25 by FEMA National Risk Index',
    metaDescription: 'The 25 US metros with the lowest FEMA NRI composite hazard score. Where natural-hazard exposure is lowest and disaster-related insurance pricing softest.',
    primaryLabel: 'NRI Score',
    primaryFmt: fmtScore,
    secondaryLabel: 'Cost Index',
    secondaryFmt: fmtIdx,
    tone: 'emerald',
  },
};

export const RANKING_TYPES: RankingType[] = Object.keys(RANKING_PROFILES) as RankingType[];

export function getRankingProfile(type: string): RankingProfile | null {
  return RANKING_PROFILES[type as RankingType] ?? null;
}

export interface RankingRow {
  city: City;
  primary: number | null;
  secondary: number | null;
}

export function getRankingRows(type: RankingType, limit = 25): RankingRow[] {
  const db = getDb();
  switch (type) {
    case 'most-expensive-cities': {
      const rows = db.prepare(`SELECT * FROM cities WHERE cost_index IS NOT NULL ORDER BY cost_index DESC LIMIT ?`).all(limit) as City[];
      return rows.map(c => ({ city: c, primary: c.cost_index, secondary: c.median_rent }));
    }
    case 'most-affordable-cities': {
      const rows = db.prepare(`SELECT * FROM cities WHERE cost_index IS NOT NULL ORDER BY cost_index ASC LIMIT ?`).all(limit) as City[];
      return rows.map(c => ({ city: c, primary: c.cost_index, secondary: c.median_income }));
    }
    case 'cheapest-housing': {
      const rows = db.prepare(`SELECT * FROM cities WHERE housing_index IS NOT NULL ORDER BY housing_index ASC LIMIT ?`).all(limit) as City[];
      return rows.map(c => ({ city: c, primary: c.housing_index, secondary: c.median_home_value }));
    }
    case 'most-expensive-housing': {
      const rows = db.prepare(`SELECT * FROM cities WHERE housing_index IS NOT NULL ORDER BY housing_index DESC LIMIT ?`).all(limit) as City[];
      return rows.map(c => ({ city: c, primary: c.housing_index, secondary: c.median_home_value }));
    }
    case 'income-leaders': {
      const rows = db.prepare(`SELECT * FROM cities WHERE median_income IS NOT NULL ORDER BY median_income DESC LIMIT ?`).all(limit) as City[];
      return rows.map(c => ({ city: c, primary: c.median_income, secondary: c.cost_index }));
    }
    case 'value-leaders': {
      // real_income = median_income / cost_index * 100
      const rows = db.prepare(`
        SELECT *, (median_income * 100.0 / cost_index) AS real_income
        FROM cities
        WHERE median_income IS NOT NULL AND cost_index IS NOT NULL AND cost_index > 0
        ORDER BY real_income DESC LIMIT ?
      `).all(limit) as (City & { real_income: number })[];
      return rows.map(c => ({ city: c as City, primary: Math.round(c.real_income), secondary: c.cost_index }));
    }
    case 'cheapest-utilities': {
      const rows = db.prepare(`SELECT * FROM cities WHERE utilities_index IS NOT NULL ORDER BY utilities_index ASC LIMIT ?`).all(limit) as City[];
      return rows.map(c => ({ city: c, primary: c.utilities_index, secondary: c.cost_index }));
    }
    case 'rent-burden-highest': {
      const rows = db.prepare(`
        SELECT *, (median_rent * 12.0 / median_income * 100) AS burden
        FROM cities
        WHERE median_rent IS NOT NULL AND median_income IS NOT NULL AND median_income > 0
        ORDER BY burden DESC LIMIT ?
      `).all(limit) as (City & { burden: number })[];
      return rows.map(c => ({ city: c as City, primary: Math.round(c.burden * 10) / 10, secondary: c.median_rent }));
    }
    case 'highest-risk-cities': {
      const rows = db.prepare(`
        SELECT c.*, r.risk_score
        FROM cities c JOIN cbsa_risk r ON c.fips = r.cbsa_fips
        WHERE r.risk_score IS NOT NULL
        ORDER BY r.risk_score DESC LIMIT ?
      `).all(limit) as (City & { risk_score: number })[];
      return rows.map(c => ({ city: c as City, primary: Math.round(c.risk_score * 10) / 10, secondary: c.cost_index }));
    }
    case 'safest-cities': {
      const rows = db.prepare(`
        SELECT c.*, r.risk_score
        FROM cities c JOIN cbsa_risk r ON c.fips = r.cbsa_fips
        WHERE r.risk_score IS NOT NULL
        ORDER BY r.risk_score ASC LIMIT ?
      `).all(limit) as (City & { risk_score: number })[];
      return rows.map(c => ({ city: c as City, primary: Math.round(c.risk_score * 10) / 10, secondary: c.cost_index }));
    }
  }
}
