/**
 * hazard-topics.ts — guidebycity HCU 5-chunk patch (2026-04-29).
 *
 * 5 hazard topic profiles for /risk/[hazard]/ pages. Each renders the top-25
 * cities ranked by hazard-specific RISKS score, with a hook narrative
 * (regional pattern) and outro implication (insurance / preparedness).
 *
 * Five chosen because they deliver enough cross-state metro coverage to fill
 * a 25-row table while staying recognisable to a relocation searcher:
 *   tornado, hurricane, wildfire, earthquake, riverine-flood
 */

import type { City } from './db';
import { getCitiesByHazard } from './risk-facts';

export type HazardTopic = 'tornado' | 'hurricane' | 'wildfire' | 'earthquake' | 'riverine-flood';

export interface HazardProfile {
  hazard: HazardTopic;
  title: string;
  shortLabel: string;
  metaTitle: string;
  metaDescription: string;
  hookHeadline: string;
  hook: string;          // 2-3 sentences explaining the regional pattern
  outro: string;         // implication for relocators
  fmtAfreq: (v: number | null) => string;
  afreqLabel: string;
}

const fmtAnnual = (v: number | null) => v == null ? '—' : `${v.toFixed(2)}/yr`;
const fmtAcre = (v: number | null) => v == null ? '—' : `${v.toFixed(2)} acres/yr`;

export const HAZARD_PROFILES: Record<HazardTopic, HazardProfile> = {
  'tornado': {
    hazard: 'tornado',
    title: 'Highest Tornado-Risk US Cities',
    shortLabel: 'Tornado',
    metaTitle: 'Highest Tornado-Risk US Cities — FEMA NRI Top 25',
    metaDescription: 'The 25 US metros with the highest FEMA NRI tornado risk score. Annualised tornado frequency for the metro\'s primary county, drawing on the Storm Prediction Center tornado history.',
    hookHeadline: 'Tornado Alley still dominates — but it\'s wider than the headline geography',
    hook: 'Tornado risk in the FEMA NRI is a function of historical tornado frequency, the EF-rating distribution, and how much population and built infrastructure sit in the typical track corridor. The classical "Tornado Alley" of Oklahoma–Kansas–Texas–Nebraska shows up clearly, but Dixie Alley (Mississippi, Alabama, Tennessee) often outranks it on annualised loss because tornadoes there strike denser populations and more vulnerable housing stock.',
    outro: 'For relocators: tornado-risk metros do not require insurance riders the way coastal hurricane zones do — standard homeowner policies cover wind damage. The bigger preparedness lever is housing choice (above-grade vs basement-equipped, mobile-home density of the surrounding subdivision) and personal sheltering plan. Insurance pricing tends to be modest even at the top of this list, but homeowner deductibles for wind damage can be higher than for other perils.',
    fmtAfreq: fmtAnnual,
    afreqLabel: 'Tornadoes/yr',
  },
  'hurricane': {
    hazard: 'hurricane',
    title: 'Highest Hurricane-Risk US Cities',
    shortLabel: 'Hurricane',
    metaTitle: 'Highest Hurricane-Risk US Cities — FEMA NRI Top 25',
    metaDescription: 'The 25 US metros with the highest FEMA NRI hurricane risk score. Drawn from NOAA HURDAT historical tracks plus modeled storm surge and inland wind exposure.',
    hookHeadline: 'Gulf and Southeast Atlantic coast — the only band that scores Very High',
    hook: 'Hurricane risk in the FEMA NRI is essentially binary geography: only metros within a few hundred miles of the Gulf and Atlantic coasts register meaningful scores. Within that band, the rankings spread by historical track frequency (Florida Keys to Cape Hatteras), storm-surge vulnerability (low-lying coastal Louisiana, Galveston, Charleston), and inland wind exposure (Houston, New Orleans, much of Florida\'s peninsula).',
    outro: 'For relocators: hurricane-risk metros routinely require windstorm-zone insurance riders (often called "named-storm deductibles") and may sit in flood-zone areas requiring NFIP coverage on top of the homeowner policy. Combined cost can run several thousand dollars more per year than in inland metros at the same nominal home value. House age and roof attachment matter — post-1995 Florida construction (post-Andrew code) materially reduces real wind damage and insurance cost.',
    fmtAfreq: fmtAnnual,
    afreqLabel: 'Hurricane events/yr',
  },
  'wildfire': {
    hazard: 'wildfire',
    title: 'Highest Wildfire-Risk US Cities',
    shortLabel: 'Wildfire',
    metaTitle: 'Highest Wildfire-Risk US Cities — FEMA NRI Top 25',
    metaDescription: 'The 25 US metros with the highest FEMA NRI wildfire risk score. Drawn from USFS wildland-urban interface analysis and historical burn-area data.',
    hookHeadline: 'Wildfire risk has expanded well beyond the classic California map',
    hook: 'Wildfire risk in the FEMA NRI is a function of fuel load, climate trend, ignition rate, and the wildland-urban interface (the boundary where homes meet flammable wildland). California still leads, but the ranking has broadened materially over the last decade: Colorado Front Range, Oregon-Washington east of the Cascades, the Mountain West corridor, and increasingly parts of Texas and the Southwest.',
    outro: 'For relocators: wildfire-zone insurance has tightened dramatically. Some carriers have stopped writing new policies in California\'s highest-risk ZIPs, and the FAIR plan or surplus-line carriers may be the only path. Defensible-space requirements (clearance distance, ember-resistant vents, Class A roofing) are now codified in many states and carry real insurance discounts. Verify carrier availability before committing — replacement-cost gap can be substantial.',
    fmtAfreq: fmtAcre,
    afreqLabel: 'Burn area/yr',
  },
  'earthquake': {
    hazard: 'earthquake',
    title: 'Highest Earthquake-Risk US Cities',
    shortLabel: 'Earthquake',
    metaTitle: 'Highest Earthquake-Risk US Cities — FEMA NRI Top 25',
    metaDescription: 'The 25 US metros with the highest FEMA NRI earthquake risk score. Drawn from USGS National Seismic Hazard Maps and population-weighted shake intensity data.',
    hookHeadline: 'Pacific Coast plus a New Madrid corridor most relocators miss',
    hook: 'Earthquake risk in the FEMA NRI combines USGS National Seismic Hazard maps with population at risk. The Pacific Coast (San Francisco Bay, Los Angeles, Seattle, Anchorage, Honolulu) dominates the top of the list, but the New Madrid Seismic Zone running through Memphis–St. Louis carries surprisingly elevated risk for an inland US region. Utah\'s Wasatch Front and parts of the Mountain West also register.',
    outro: 'For relocators: earthquake coverage is excluded from standard US homeowner policies and must be purchased separately. In California, earthquake premium can rival or exceed the base policy on older homes; deductibles are typically 10-20% of dwelling coverage rather than a fixed dollar amount. Tile roofs, brick chimneys, and unreinforced masonry construction sharply raise both physical risk and premium.',
    fmtAfreq: fmtAnnual,
    afreqLabel: 'Earthquake events/yr',
  },
  'riverine-flood': {
    hazard: 'riverine-flood',
    title: 'Highest Riverine-Flood-Risk US Cities',
    shortLabel: 'Riverine flood',
    metaTitle: 'Highest Riverine-Flood-Risk US Cities — FEMA NRI Top 25',
    metaDescription: 'The 25 US metros with the highest FEMA NRI riverine flooding risk score. Derived from NFIP claims data and floodplain elevation analysis.',
    hookHeadline: 'River cities anchor the top — but flood zones cross every state',
    hook: 'Riverine flooding risk in the FEMA NRI weighs floodplain population, NFIP claims history, and modeled inundation depth. Cities along major rivers — the Mississippi, Missouri, Ohio, and their tributaries — concentrate at the top. Flash-flood-prone metros in the Texas Hill Country and along Appalachian river basins also rank high. Coastal flood is tracked separately from this hazard.',
    outro: 'For relocators: NFIP flood insurance is required for any mortgaged property in a designated Special Flood Hazard Area (SFHA). Premium varies sharply by elevation certificate and flood zone (AE vs X). Even outside an SFHA, optional flood coverage is increasingly common in formerly low-risk inland metros — claims now occur outside mapped zones in roughly 25% of NFIP losses. Confirm flood-zone status during diligence rather than relying on the headline metro rating.',
    fmtAfreq: fmtAnnual,
    afreqLabel: 'Flood events/yr',
  },
};

export const HAZARD_TOPICS: HazardTopic[] = Object.keys(HAZARD_PROFILES) as HazardTopic[];

export function getHazardProfile(slug: string): HazardProfile | null {
  return HAZARD_PROFILES[slug as HazardTopic] ?? null;
}

export function getHazardRows(hazard: HazardTopic, limit = 25): { city: City; ratng: string; score: number; afreq: number | null }[] {
  return getCitiesByHazard(hazard, limit);
}
