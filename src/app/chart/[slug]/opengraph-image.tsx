// src/app/chart/[slug]/opengraph-image.tsx
// Dynamic OG image for public chart pages with premium aesthetic
import { ImageResponse } from 'next/og'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

export const runtime = 'nodejs'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vedaansh.com'
  
  try {
    await connectDB()
    const chartRaw = await Chart.findOne({ slug, isPublic: true })
      .select('name birthDate birthPlace').lean()

    if (!chartRaw) throw new Error('Not found')

    const chart = chartRaw as any
    const name  = chart?.name      ?? 'Vedic Chart'
    const date  = chart?.birthDate
      ? (() => { const d = new Date(chart.birthDate + 'T12:00:00Z'); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` })()
      : ''
    const place = chart?.birthPlace ?? ''

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            background: '#0e0e18',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'serif',
            position: 'relative',
          }}
        >
          {/* Main Background Gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 50%, #16162a 0%, #0e0e18 100%)',
            display: 'flex',
          }} />

          {/* Decorative Corner Ornaments (Simulated with div) */}
          <div style={{ position: 'absolute', top: 40, left: 40, width: 60, height: 60, borderTop: '2px solid rgba(201,168,76,0.4)', borderLeft: '2px solid rgba(201,168,76,0.4)', display: 'flex' }} />
          <div style={{ position: 'absolute', top: 40, right: 40, width: 60, height: 60, borderTop: '2px solid rgba(201,168,76,0.4)', borderRight: '2px solid rgba(201,168,76,0.4)', display: 'flex' }} />
          <div style={{ position: 'absolute', bottom: 40, left: 40, width: 60, height: 60, borderBottom: '2px solid rgba(201,168,76,0.4)', borderLeft: '2px solid rgba(201,168,76,0.4)', display: 'flex' }} />
          <div style={{ position: 'absolute', bottom: 40, right: 40, width: 60, height: 60, borderBottom: '2px solid rgba(201,168,76,0.4)', borderRight: '2px solid rgba(201,168,76,0.4)', display: 'flex' }} />

          {/* Inner Border */}
          <div style={{
            position: 'absolute', inset: 60,
            border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12,
            display: 'flex',
          }} />

          {/* Branding Logo */}
          <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${baseUrl}/veda-icon.png`} width="80" height="80" alt="" style={{ opacity: 0.9 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#c9a84c', letterSpacing: 2, fontFamily: 'serif' }}>VEDAANSH</span>
              <span style={{ fontSize: 12, color: '#8b7cf6', letterSpacing: 3, fontWeight: 600 }}>॥ ज्योतिष्मते नमः ॥</span>
            </div>
          </div>

          {/* Glass Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '48px 80px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            maxWidth: '85%',
          }}>
            <div style={{
              fontSize: 72, fontWeight: 800, color: '#ffffff',
              textAlign: 'center', lineHeight: 1.1, marginBottom: 24,
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}>
              {name}
            </div>

            {(date || place) && (
              <div style={{
                fontSize: 32, color: '#bbb5d8', textAlign: 'center',
                display: 'flex', gap: 32, alignItems: 'center',
              }}>
                {date  && <span style={{ fontWeight: 500 }}>{date}</span>}
                {date && place && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a84c', opacity: 0.6 }} />}
                {place && <span style={{ fontWeight: 500 }}>{place}</span>}
              </div>
            )}
          </div>

          {/* Bottom Badge */}
          <div style={{
            position: 'absolute', bottom: 80,
            background: 'rgba(201,168,76,0.1)',
            padding: '8px 24px', borderRadius: 99,
            border: '1px solid rgba(201,168,76,0.3)',
            color: '#c9a84c', fontSize: 20, fontWeight: 600,
            letterSpacing: 1,
          }}>
            Vedic Birth Analysis
          </div>
        </div>
      ),
      {
        ...size,
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
      }
    )
  } catch (err) {
    console.error('[OG-IMAGE ERROR]', err)
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', background: '#0e0e18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c', fontSize: 64, fontFamily: 'serif', gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${baseUrl}/veda-icon.png`} width="80" height="80" alt="" />
          VEDAANSH
        </div>
      ),
      size
    )
  }
}