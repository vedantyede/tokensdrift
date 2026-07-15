import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#16171c',
          padding: '80px 88px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: '#eeece6' }}>
          tokens<span style={{ color: '#ff8657' }}>drift</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 700,
              color: '#eeece6',
              lineHeight: 1.15,
              maxWidth: 920,
            }}
          >
            Your design system is drifting. Here&rsquo;s your score.
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#b7b6ae' }}>
            npx tokensdrift — free, local, zero dependencies
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {[
            '#2f6f5a',
            '#3d8a70',
            '#4ba384',
            '#5cb996',
            '#F5F5F5',
            '#1D4ED8',
          ].map((color, i) => (
            <div
              key={color}
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                background: color,
                ...(i >= 4 ? { transform: `rotate(${(i - 3) * 8}deg)` } : {}),
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
