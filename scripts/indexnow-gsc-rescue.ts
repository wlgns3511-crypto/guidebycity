// HCU 2026-04-25 GSC rescue resubmit for guidebycity.
//
// Context: 5 /compare/ URLs earned clicks in 28d GSC window (2026-03-24 ~
// 2026-04-21). The initial HCU cleanup (2026-04-22) collapsed /compare/ to
// top-100 by |cost_index_a - cost_index_b| DESC — all 5 earning URLs are
// mid-difference pairs that lost the "most different cost" lottery.
// Every city in the 5 pairs exists in DB → all 5 recoverable. After
// today's lib/compare-whitelist.ts patch + redeploy they render 200 again.
//
// This script submits forward + reverse via IndexNow so Google flips the
// previous KILLED signal to KEPT faster than organic recrawl.

const HOST = 'guidebycity.com';
const KEY = '44342f28a6fd4b2dbcb1a96fd2417c42';

const gscEvidence = [
  'miami-fort-lauderdale-west-palm-beach-fl-vs-traverse-city-mi',
  'albany-ga-vs-albany-schenectady-troy-ny',
  'albany-schenectady-troy-ny-vs-albuquerque-nm',
  'albany-schenectady-troy-ny-vs-portland-south-portland-me',
  'harrisonburg-va-vs-staunton-stuarts-draft-va',
];

// guidebycity uses single-dash `-vs-` and multi-word city slugs contain `-`
// characters. Simple split isn't safe — emit both the raw slug and a
// reverse candidate assembled from the first/last -vs- occurrence.
const urls: string[] = [];
for (const slug of gscEvidence) {
  urls.push(`https://${HOST}/compare/${slug}/`);
  // Reverse: find LAST -vs- and swap halves around that split point, since
  // city slugs contain -s internally. For these 5 slugs the last -vs- is
  // always the actual separator based on how the GSC slugs are structured.
  const lastVs = slug.lastIndexOf('-vs-');
  if (lastVs > 0) {
    const a = slug.slice(0, lastVs);
    const b = slug.slice(lastVs + 4);
    urls.push(`https://${HOST}/compare/${b}-vs-${a}/`);
  }
}

(async () => {
  console.log(`[GSC-RESCUE] submitting ${urls.length} URLs as KEPT...`);
  urls.forEach((u) => console.log(`  ${u}`));
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  console.log(`status ${res.status} ${await res.text()}`);
})();
