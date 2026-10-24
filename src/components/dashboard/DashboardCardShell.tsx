'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dashboard/DashboardCardShell.tsx
//  Shared panel chrome and row primitives for dashboard insight cards
// ─────────────────────────────────────────────────────────────

import React from 'react'

export type CardTone = 'good' | 'watch' | 'alert' | 'neutral'

export const TONE_COLOR: Record<CardTone, string> = {
  good: 'var(--teal)',
  watch: 'var(--amber)',
  alert: 'var(--rose)',
  neutral: 'var(--text-muted)',
}

interface DashCardProps {
  title: string
  /** Small right-aligned text in the header (e.g. a date). */
  meta?: React.ReactNode
  /** Optional header action, e.g. "Open →". */
  actionLabel?: string
  onAction?: () => void
  children: React.ReactNode
}

export function DashCard({ title, meta, actionLabel, onAction, children }: DashCardProps) {
  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span>{title}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          {meta ? (
            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{meta}</span>
          ) : null}
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {actionLabel}
            </button>
          ) : null}
        </span>
      </div>
      <div style={{ padding: '0.35rem 0.55rem' }}>{children}</div>
    </div>
  )
}

export function DashRow({
  label,
  value,
  tone = 'neutral',
  dot = false,
}: {
  label: string
  value: React.ReactNode
  tone?: CardTone
  dot?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '0.5rem',
        padding: '0.2rem 0',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.6rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        {dot ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: TONE_COLOR[tone], display: 'inline-block' }} /> : null}
        {label}
      </span>
      <span style={{ fontSize: '0.68rem', color: tone === 'neutral' ? 'var(--text-primary)' : TONE_COLOR[tone], textAlign: 'right', minWidth: 0 }}>
        {value}
      </span>
    </div>
  )
}

export function DashNote({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0.35rem 0 0.1rem', fontSize: '0.58rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{children}</p>
}

export function DashEmpty({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, padding: '0.3rem 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{children}</p>
}
