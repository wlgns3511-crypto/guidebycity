/**
 * Phase 7 P5 — Internal cross-walk bridge (§8.3 portfolio matrix, risk-cluster row).
 *
 * guidebycity's /city/[slug]/ joins the risk-cluster cohort by the city's
 * full STATE name (kebab) rather than the city slug, because the 4 siblings
 * (safecitypeek / floodriskpeek / earthquakepeek / wellwaterpeek) serve a
 * uniform /state/{name-kebab}/ surface but only partially serve /city/
 * (slug topology drift — verified via curl probe 2026-05-20).
 *
 * State code → name kebab mapping is inlined here to avoid a stale shared
 * import; the 50-state + DC set is stable USPS data.
 *
 * Footprint discipline (Trap #118): anchor copy keeps each link's intent
 * honestly different (safety vs flood vs quake vs well-water). Order is fixed.
 */

interface SiblingLink {
  href: string;
  label: string;
  blurb: string;
}

const STATE_NAME_BY_CODE: Record<string, string> = {
  AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california',
  CO: 'colorado', CT: 'connecticut', DE: 'delaware', DC: 'district-of-columbia',
  FL: 'florida', GA: 'georgia', HI: 'hawaii', ID: 'idaho', IL: 'illinois',
  IN: 'indiana', IA: 'iowa', KS: 'kansas', KY: 'kentucky', LA: 'louisiana',
  ME: 'maine', MD: 'maryland', MA: 'massachusetts', MI: 'michigan', MN: 'minnesota',
  MS: 'mississippi', MO: 'missouri', MT: 'montana', NE: 'nebraska', NV: 'nevada',
  NH: 'new-hampshire', NJ: 'new-jersey', NM: 'new-mexico', NY: 'new-york',
  NC: 'north-carolina', ND: 'north-dakota', OH: 'ohio', OK: 'oklahoma',
  OR: 'oregon', PA: 'pennsylvania', RI: 'rhode-island', SC: 'south-carolina',
  SD: 'south-dakota', TN: 'tennessee', TX: 'texas', UT: 'utah', VT: 'vermont',
  VA: 'virginia', WA: 'washington', WV: 'west-virginia', WI: 'wisconsin', WY: 'wyoming',
};

const STATE_NAME_DISPLAY: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export function CrosswalkBridge({ stateCode }: { stateCode: string | null }) {
  if (!stateCode) return null;
  const slug = STATE_NAME_BY_CODE[stateCode.toUpperCase()];
  const display = STATE_NAME_DISPLAY[stateCode.toUpperCase()];
  if (!slug || !display) return null;

  const siblings: SiblingLink[] = [
    {
      href: `https://safecitypeek.com/state/${slug}/`,
      label: `${display} safety + crime profile`,
      blurb: 'FBI UCR violent + property crime rates rolled up to the state cohort.',
    },
    {
      href: `https://floodriskpeek.com/state/${slug}/`,
      label: `${display} flood-risk band`,
      blurb: 'FEMA NRI riverine + coastal flood layered with NFIP claims history.',
    },
    {
      href: `https://earthquakepeek.com/state/${slug}/`,
      label: `${display} earthquake exposure`,
      blurb: 'USGS NSHM peak-ground-acceleration projections + felt-event density.',
    },
    {
      href: `https://wellwaterpeek.com/state/${slug}/`,
      label: `${display} groundwater + well water`,
      blurb: 'USGS NWIS well-water network + EPA SDWIS public-system snapshot.',
    },
  ];

  return (
    <aside className="my-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-2">
        Cross-walk {display} risk on the DataPeek network
      </h3>
      <p className="text-xs text-slate-600 mb-3">
        Same {display} join, different lens — each sibling decodes a risk
        dimension this cost-of-living profile does not surface.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {siblings.map((sib) => (
          <li key={sib.href} className="rounded-md bg-white border border-slate-100 p-2.5">
            <a
              href={sib.href}
              rel="external noopener"
              className="text-sm font-medium text-indigo-700 hover:underline"
            >
              {sib.label} →
            </a>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{sib.blurb}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
