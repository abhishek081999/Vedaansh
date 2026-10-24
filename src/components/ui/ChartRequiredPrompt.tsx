'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/ChartRequiredPrompt.tsx
//  Shown by chart-dependent routes when no birth chart is loaded.
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { useChart } from '@/components/providers/ChartProvider'

interface Props {
  title: string
  description: string
}

export function ChartRequiredPrompt({ title, description }: Props) {
  const { openBirthForm } = useChart()

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '1.25rem', padding: '6rem 2rem', textAlign: 'center',
    }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-gold)', fontWeight: 600, margin: 0 }}>
        {title}
      </h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: 460, fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
      <button type="button" onClick={openBirthForm} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
        Open Birth Form
      </button>
    </div>
  )
}
