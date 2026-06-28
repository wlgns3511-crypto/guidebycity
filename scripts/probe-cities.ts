import { getAllCities } from '../lib/db';

const cities = getAllCities();
console.log('Total cities:', cities.length);

const sorted = [...cities].sort((a, b) => b.short_name.length - a.short_name.length);
console.log('\nLongest short_names:');
sorted.slice(0, 10).forEach(c => {
  console.log(`  ${c.short_name.length}c "${c.short_name}, ${c.state}" slug=${c.slug}`);
});

const buckets: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
for (const c of cities) {
  const len = c.short_name.length + (c.state?.length || 0) + 2;
  if (len < 15) buckets.A++;
  else if (len < 25) buckets.B++;
  else if (len < 35) buckets.C++;
  else if (len < 45) buckets.D++;
  else buckets.E++;
}
console.log('\nName-with-state length buckets (<15 / 15-25 / 25-35 / 35-45 / 45+):', buckets);

console.log('\nSample slugs:');
cities.slice(0, 10).forEach(c => console.log(`  ${c.slug} → ${c.short_name}, ${c.state}`));
