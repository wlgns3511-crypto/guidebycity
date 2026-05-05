import { DB_UPDATED, EDITORIAL_TEAM, PUBLISHER, SOURCE_AUTHORITIES, SOURCE_VINTAGES } from "@/lib/authorship";

interface Props {
  /** Per-entity vintage (overrides DB_UPDATED). Pass CITY_VINTAGE / STATE_VINTAGE / etc. */
  vintage?: string;
  /** Data source label for the bottom meta line. */
  source?: string;
}

export function AuthorBox({ vintage, source = "Census ACS + BEA RPP + BLS CPI + NOAA + HUD" }: Props = {}) {
  const reviewedAt = vintage ?? DB_UPDATED;

  return (
    <div className="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-sm">
            Reviewed by the {EDITORIAL_TEAM.name}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Part of the <a href={PUBLISHER.url} className="text-slate-700 hover:underline" rel="noopener">{PUBLISHER.name}</a>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-3">
        Each entry is cross-referenced against {SOURCE_AUTHORITIES.map((s, i) => (
          <span key={s.name}>
            {i > 0 && (i === SOURCE_AUTHORITIES.length - 1 ? ', and ' : ', ')}
            <a href={s.url} className="text-slate-700 underline underline-offset-2 hover:text-slate-900" rel="noopener" target="_blank">
              {s.name}
            </a>
          </span>
        ))} before publication. Our editorial workflow audits source URLs, calculation methods, and per-source data vintage on every release cycle.
      </p>
      <div className="text-xs text-slate-500 mb-3 leading-relaxed">
        <span className="font-medium text-slate-600">Source vintages:</span>{" "}
        {SOURCE_AUTHORITIES.map((s, i) => {
          const v = SOURCE_VINTAGES[s.name];
          if (!v) return null;
          const short = s.name
            .replace('U.S. ', '')
            .replace('National Centers for Environmental Information', 'NCEI')
            .replace('Bureau of Economic Analysis', 'BEA')
            .replace('Bureau of Labor Statistics', 'BLS')
            .replace('Department of Housing and Urban Development', 'HUD')
            .replace('Census Bureau', 'Census');
          return (
            <span key={s.name}>
              {i > 0 && ' · '}
              <span className="text-slate-700">{short}</span> {v}
            </span>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {reviewedAt && (
          <>
            <span>Last reviewed: <time dateTime={reviewedAt}>{reviewedAt}</time></span>
            <span className="text-slate-300">·</span>
          </>
        )}
        <span>Data source: {source}</span>
        <span className="text-slate-300">·</span>
        <a href="https://datapeekfacts.com/editorial-policy/" className="underline underline-offset-2 hover:text-slate-900" rel="noopener">Editorial policy</a>
        <span className="text-slate-300">·</span>
        <a href="/methodology/" className="underline underline-offset-2 hover:text-slate-900">Methodology</a>
        <span className="text-slate-300">·</span>
        <a href="/contact/" className="underline underline-offset-2 hover:text-slate-900">Send a correction</a>
      </div>
    </div>
  );
}
