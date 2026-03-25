import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'GuideByCity - US City Guides';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 'bold', marginBottom: 20 }}>
          GuideByCity
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          US City Guides
        </div>
      </div>
    ),
    { ...size }
  );
}
