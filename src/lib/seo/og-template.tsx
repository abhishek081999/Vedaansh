import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

type OgBrandedOptions = {
  title: string
  subtitle?: string
  badge?: string
}

/** Shared branded OG card for marketing routes */
export function ogBrandedImage({ title, subtitle, badge }: OgBrandedOptions) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vedaansh.com'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0e0e18',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, #16162a 0%, #0e0e18 100%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 60,
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: 12,
            display: 'flex',
          }}
        />
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${baseUrl}/veda-icon.png`} width="72" height="72" alt="" style={{ opacity: 0.9 }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#c9a84c', letterSpacing: 2 }}>VEDAANSH</span>
            <span style={{ fontSize: 11, color: '#8b7cf6', letterSpacing: 3, fontWeight: 600 }}>
              ॥ ज्योतिष्मते नमः ॥
            </span>
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '40px 64px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '90%',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#ffffff',
              textAlign: 'center',
              lineHeight: 1.15,
              marginBottom: subtitle ? 16 : 0,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 28, color: '#bbb5d8', textAlign: 'center', fontWeight: 500 }}>
              {subtitle}
            </div>
          )}
        </div>
        {badge && (
          <div
            style={{
              position: 'absolute',
              bottom: 72,
              background: 'rgba(201,168,76,0.1)',
              padding: '8px 24px',
              borderRadius: 99,
              border: '1px solid rgba(201,168,76,0.3)',
              color: '#c9a84c',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {badge}
          </div>
        )}
      </div>
    ),
    OG_SIZE,
  )
}
