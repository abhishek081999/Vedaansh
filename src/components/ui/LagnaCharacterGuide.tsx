'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LagnaCharacterGuide.tsx
//  Ascendant character profile (general traits) + per-house callout
//  Renders nothing for Lagnas that do not have a profile yet
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { ChevronDown, UserRound } from 'lucide-react'
import type { Rashi } from '@/types/astrology'
import type { HouseNumber } from '@/lib/engine/houseInterpretations'
import {
  getLagnaCharacterProfile,
  getLagnaHouseReading,
  LAGNA_CHARACTER_METHOD_NOTES,
  LAGNA_CHARACTER_NOTE,
} from '@/lib/engine/lagnaCharacter'

interface LagnaCharacterGuideProps {
  ascRashi: Rashi
}

export function LagnaCharacterGuide({ ascRashi }: LagnaCharacterGuideProps) {
  const profile = useMemo(() => getLagnaCharacterProfile(ascRashi), [ascRashi])
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [methodOpen, setMethodOpen] = useState(false)

  if (!profile) return null

  const houseRows = Object.values(profile.houses).sort((a, b) => a.house - b.house)

  return (
    <div
      className="card"
      style={{
        padding: '1rem 1.15rem',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.62rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-gold)',
            fontWeight: 700,
            marginBottom: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <UserRound size={12} aria-hidden style={{ color: 'var(--gold)' }} />
          Ascendant character · {profile.title}
        </div>
        <p style={bodyText}>{profile.intro}</p>
        <p style={{ ...bodyText, marginTop: '0.45rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          {LAGNA_CHARACTER_NOTE}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {profile.traits.map((group) => (
          <div key={group.id}>
            <h4
              style={{
                margin: '0 0 0.3rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-gold, var(--gold))',
              }}
            >
              {group.title}
            </h4>
            <ul style={list}>
              {group.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {profile.exceptions.length > 0 ? (
        <div style={callout}>
          <div style={miniLabel}>Lagna-specific exception</div>
          <ul style={list}>
            {profile.exceptions.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Collapsible
        open={summaryOpen}
        onToggle={() => setSummaryOpen((o) => !o)}
        title="House-by-house summary"
      >
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              minWidth: 480,
              marginTop: '0.75rem',
            }}
          >
            <div style={{ ...summaryRow, ...summaryHeader }}>
              <span>House</span>
              <span>Sign</span>
              <span>Key theme</span>
            </div>
            {houseRows.map((row) => (
              <div key={row.house} style={summaryRow}>
                <span style={{ fontWeight: 700, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
                  H{row.house}
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.signName}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{row.theme}</span>
              </div>
            ))}
          </div>
        </div>
      </Collapsible>

      <Collapsible
        open={methodOpen}
        onToggle={() => setMethodOpen((o) => !o)}
        title="How to apply this Lagna reading"
      >
        <div style={{ paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ul style={list}>
            {profile.readingNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div style={miniLabel}>General method</div>
          <ul style={list}>
            {LAGNA_CHARACTER_METHOD_NOTES.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </Collapsible>
    </div>
  )
}

/** Per-house callout for the Lagna profile; null when no profile or reading exists. */
export function LagnaHouseCallout({ ascRashi, house }: { ascRashi: Rashi; house: HouseNumber }) {
  const reading = useMemo(() => getLagnaHouseReading(ascRashi, house), [ascRashi, house])
  const profile = useMemo(() => getLagnaCharacterProfile(ascRashi), [ascRashi])
  if (!reading || !profile) return null

  return (
    <div style={callout}>
      <div style={miniLabel}>
        {profile.title} · House {house} ({reading.signName})
      </div>
      <p style={{ ...bodyText, fontWeight: 600, color: 'var(--text-primary)', margin: '0.3rem 0 0' }}>
        {reading.theme}
      </p>
      <ul style={{ ...list, marginTop: '0.4rem' }}>
        {reading.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  )
}

function Collapsible({
  open,
  onToggle,
  title,
  children,
}: {
  open: boolean
  onToggle: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        background: 'var(--surface-3)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.75rem 1rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {title}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>
      {open ? (
        <div style={{ padding: '0 0.75rem 0.85rem', borderTop: '1px solid var(--border-soft)' }}>
          {children}
        </div>
      ) : null}
    </div>
  )
}

const miniLabel: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-gold)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const bodyText: React.CSSProperties = {
  margin: 0,
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.55,
}

const list: React.CSSProperties = {
  margin: '0.35rem 0 0',
  paddingLeft: '1.1rem',
  color: 'var(--text-secondary)',
  fontSize: '0.78rem',
  lineHeight: 1.55,
}

const callout: React.CSSProperties = {
  padding: '0.85rem',
  background: 'rgba(201,168,76,0.06)',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border-soft)',
}

const summaryRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '3rem 6.5rem minmax(0, 1fr)',
  gap: '0.5rem',
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid var(--border-soft)',
  fontSize: '0.76rem',
  lineHeight: 1.45,
  alignItems: 'start',
}

const summaryHeader: React.CSSProperties = {
  background: 'var(--surface-3)',
  fontSize: '0.6rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
