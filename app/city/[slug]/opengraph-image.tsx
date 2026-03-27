import { ImageResponse } from 'next/og';
import { getCityBySlug, getAllCities, getWeather } from '@/lib/db';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getAllCities().slice(0, 1000).map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCityBySlug(slug);

  if (!c) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#0284c7', color: 'white', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', fontSize: 48 }}>GUIDEBYCITY</div>
      </div>,
      { ...size }
    );
  }

  const weather = getWeather(c);
  const weatherEntries = weather ? Object.entries(weather).sort(([a], [b]) => Number(a) - Number(b)) : [];
  const avgHigh = weatherEntries.length > 0
    ? Math.round(weatherEntries.reduce((sum, [, w]) => sum + w.avg_high, 0) / weatherEntries.length)
    : null;
  const avgLow = weatherEntries.length > 0
    ? Math.round(weatherEntries.reduce((sum, [, w]) => sum + w.avg_low, 0) / weatherEntries.length)
    : null;

  const stats = [
    ...(c.population ? [{ label: 'Population', value: c.population.toLocaleString('en-US') }] : []),
    ...(c.median_income ? [{ label: 'Median Income', value: '$' + c.median_income.toLocaleString('en-US') }] : []),
    ...(c.median_rent ? [{ label: 'Median Rent', value: '$' + c.median_rent.toLocaleString('en-US') + '/mo' }] : []),
    ...(c.cost_index ? [{ label: 'Cost Index', value: c.cost_index.toFixed(1) }] : []),
  ].slice(0, 4);

  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#f0f9ff', fontFamily: 'sans-serif', padding: '48px 56px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 18, color: '#0284c7', fontWeight: 700, letterSpacing: 2 }}>GUIDEBYCITY</div>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, color: '#0c1a2e', marginTop: 8, lineHeight: 1.1 }}>
            {c.short_name}
          </div>
          <div style={{ display: 'flex', fontSize: 22, color: '#64748b', marginTop: 6 }}>
            {c.name}, {c.state}
          </div>
        </div>
        {(avgHigh !== null && avgLow !== null) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#e0f2fe', borderRadius: 16, padding: '16px 28px', border: '2px solid #bae6fd' }}>
            <div style={{ display: 'flex', fontSize: 14, color: '#0369a1', fontWeight: 600, marginBottom: 4 }}>Avg Climate</div>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 800, color: '#0284c7' }}>{avgHigh}°F</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#0369a1' }}>High / {avgLow}°F Low</div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {stats.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'white', borderRadius: 12, padding: '20px 16px', border: '2px solid #bae6fd', alignItems: 'center' }}>
              <div style={{ display: 'flex', fontSize: 14, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
              <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: '#0c1a2e' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Accent bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, backgroundColor: '#0284c7', marginTop: 'auto', marginBottom: 16 }} />

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#94a3b8' }}>
        <div style={{ display: 'flex', color: '#0284c7', fontWeight: 600 }}>guidebycity.com</div>
        <div>City Guide · Cost of Living · Climate</div>
      </div>
    </div>,
    { ...size }
  );
}
