'use client'
// ─────────────────────────────────────────────────────────────
//  src/app/today/page.tsx
//  Today's Reading — personal daily prediction for the loaded chart
// ─────────────────────────────────────────────────────────────

import React from 'react'
import dynamic from 'next/dynamic'
import { useChart } from '@/components/providers/ChartProvider'
import { useTranslations } from 'next-intl'

// Client-only: the reading depends on the current time and browser storage.
const TodayReadingPanel = dynamic(
  () => import('@/components/today/TodayReadingPanel').then(m => m.TodayReadingPanel),
  { ssr: false },
)

export default function TodayPage() {
  const { chart, openBirthForm } = useChart()
  const t = useTranslations('today.page')

  if (!chart) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '1.25rem', padding: '6rem 2rem', textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontWeight: 600, margin: 0 }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 460, fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
          {t('empty')}
        </p>
        <button type="button" onClick={openBirthForm} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          {t('openForm')}
        </button>
      </div>
    )
  }

  return <TodayReadingPanel chart={chart} />
}
