'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/today/page.tsx
//  Today's Reading — personal daily prediction for the loaded chart
// ─────────────────────────────────────────────────────────────

import React from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'

// Client-only: the reading depends on the current time and browser storage.
const TodayReadingPanel = dynamic(
  () => import('@/components/today/TodayReadingPanel').then(m => m.TodayReadingPanel),
  { ssr: false },
)

export default function TodayPage() {
  const { chart, openBirthForm } = useChart()

  if (!chart) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '1.25rem', padding: '6rem 2rem', textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontWeight: 600, margin: 0 }}>
          Today&apos;s Reading
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 460, fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
          Load or create your birth chart to get a personal reading for today, built from your Moon, running dasha,
          live transits and today&apos;s panchang.
        </p>
        <button type="button" onClick={openBirthForm} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          Open Birth Form
        </button>
      </div>
    )
  }

  return <TodayReadingPanel chart={chart} />
}
