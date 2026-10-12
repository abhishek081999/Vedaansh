'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/shared.tsx
//  Shared display atoms for the Vedic Numerology sections
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { HARMONY_LABEL, type Harmony } from '@/lib/engine/numerology/calc'
import type { CompoundQuality } from '@/lib/engine/numerology/data'

export const HARMONY_COLOR: Record<Harmony, string> = {
  excellent: 'var(--teal)',
  good: 'var(--teal)',
  neutral: 'var(--text-muted)',
  mixed: 'var(--gold)',
  challenging: 'var(--rose)',
}

export const QUALITY_COLOR: Record<CompoundQuality, string> = {
  fortunate: 'var(--teal)',
  mixed: 'var(--gold)',
  warning: 'var(--rose)',
}

export function HarmonyPill({ harmony }: { harmony: Harmony }) {
  const color = HARMONY_COLOR[harmony]
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      border: `1px solid ${color}`, color, letterSpacing: '0.05em', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {HARMONY_LABEL[harmony]}
    </span>
  )
}

export function NumberOrb({ value, size = 56, muted = false }: { value: number; size?: number; muted?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: muted ? 'var(--surface-3)' : 'var(--gold-faint)',
      border: `1.5px solid ${muted ? 'var(--border-soft)' : 'var(--border-bright)'}`,
      fontFamily: 'var(--font-display)', fontSize: size * 0.48, fontWeight: 600,
      color: muted ? 'var(--text-muted)' : 'var(--text-gold)',
    }}>
      {value}
    </div>
  )
}

export function SectionCard({ title, subtitle, children, accent }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  accent?: string
}) {
  return (
    <section style={{
      background: 'var(--surface-1)', border: '1px solid var(--border-soft)',
      borderLeft: accent ? `3px solid ${accent}` : '1px solid var(--border-soft)',
      borderRadius: 'var(--r-lg)', padding: 'clamp(0.85rem, 2vw, 1.25rem)',
      display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0,
    }}>
      <header>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-gold)' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  )
}

export function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

export function TagList({ items, color }: { items: (string | number)[]; color?: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
      {items.map(item => (
        <span key={item} style={{
          fontSize: '0.72rem', padding: '2px 9px', borderRadius: 'var(--r-sm)',
          background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
          color: color ?? 'var(--text-secondary)',
        }}>
          {item}
        </span>
      ))}
    </div>
  )
}

export const gridColumns = (min: number): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}px), 1fr))`,
  gap: '0.75rem',
})
