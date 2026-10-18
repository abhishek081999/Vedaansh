'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/LagnaSpiritualGuide.tsx
//  Lagna as spiritual consciousness lens — chart-aware teaching
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, Sparkles } from 'lucide-react'
import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import {
  getChartLagnaSpirituality,
  getLagnaElementRows,
  getLagnaSpiritualRows,
  type LagnaElementId,
} from '@/lib/engine/lagnaSpirituality'

interface LagnaSpiritualGuideProps {
  ascRashi: Rashi
}

const ELEMENT_TONE: Record<LagnaElementId, string> = {
  fire: 'var(--amber, #d4a017)',
  earth: 'var(--teal, #4ecdc4)',
  air: 'var(--text-gold, var(--gold))',
  water: 'var(--rose, #e07a7a)',
}

export function LagnaSpiritualGuide({ ascRashi }: LagnaSpiritualGuideProps) {
  const data = useMemo(() => getChartLagnaSpirituality(ascRashi), [ascRashi])
  const elementRows = useMemo(() => getLagnaElementRows(), [])
  const lagnaRows = useMemo(() => getLagnaSpiritualRows(), [])
  const [elementsOpen, setElementsOpen] = useState(false)
  const [allLagnasOpen, setAllLagnasOpen] = useState(false)
  const [principlesOpen, setPrinciplesOpen] = useState(true)

  const { lagna, element, principles, note } = data
  const tone = ELEMENT_TONE[element.id]

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
          <Sparkles size={12} aria-hidden style={{ color: 'var(--gold)' }} />
          Spiritual Lagna · this chart
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {note}
        </p>
      </div>

      {/* This chart's lagna */}
      <div
        style={{
          padding: '0.9rem 1rem',
          borderRadius: 'var(--r-md)',
          border: `1px solid ${tone}40`,
          background: `${tone}10`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '0.5rem',
            marginBottom: '0.65rem',
          }}
        >
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {lagna.name} ({lagna.sanskrit})
            </div>
            <div style={{ fontSize: '0.72rem', color: tone, fontWeight: 600, marginTop: 2 }}>
              {element.name} · {element.sanskrit}
            </div>
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: 4,
              background: `${tone}18`,
              color: tone,
              border: `1px solid ${tone}40`,
            }}
          >
            Your Lagna
          </span>
        </div>

        <Field label="Primary consciousness" value={lagna.primaryConsciousness} />
        <Field label="Subconscious energy" value={lagna.subconsciousEnergy} />
        <Field label="Invisible fear" value={lagna.invisibleFear} />
        <Field label="Ego type" value={lagna.egoType} />
        <Field label="Purpose" value={lagna.purpose} />
        <Field label="Life pattern" value={lagna.lifePattern} />
        <Field label="What breaks the pattern" value={lagna.whatBreaksPattern} />

        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-soft)',
          }}
        >
          <div style={miniLabel}>Element · birth consciousness</div>
          <p style={bodyText}>{element.birthConsciousness}</p>
          <div style={{ ...miniLabel, marginTop: '0.55rem' }}>Spiritual path</div>
          <p style={bodyText}>{element.spiritualPath}</p>
          <div style={{ ...miniLabel, marginTop: '0.55rem' }}>Understanding method</div>
          <p style={bodyText}>{element.understandingMethod}</p>
          <div style={{ ...miniLabel, marginTop: '0.55rem' }}>Liberation practice</div>
          <p style={bodyText}>
            {element.liberationPath}
            <span style={{ color: 'var(--text-muted)' }}> · {element.liberationSanskrit}</span>
          </p>
          <div style={{ ...miniLabel, marginTop: '0.55rem' }}>Challenge</div>
          <p style={bodyText}>{element.challenge}</p>
        </div>
      </div>

      {/* Four elements table */}
      <Collapsible
        open={elementsOpen}
        onToggle={() => setElementsOpen((o) => !o)}
        title="Four elements · spiritual direction"
      >
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              minWidth: 640,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '6.5rem 7rem 1.2fr 1fr 1fr',
                gap: '0.45rem',
                padding: '0.55rem 0.75rem',
                background: 'var(--surface-3)',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-soft)',
              }}
            >
              <span>Element</span>
              <span>Signs</span>
              <span>Path · method</span>
              <span>Liberation</span>
              <span>Fear pattern</span>
            </div>
            {elementRows.map((row) => {
              const active = row.id === element.id
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '6.5rem 7rem 1.2fr 1fr 1fr',
                    gap: '0.45rem',
                    padding: '0.65rem 0.75rem',
                    borderBottom: '1px solid var(--border-soft)',
                    fontSize: '0.74rem',
                    lineHeight: 1.45,
                    background: active ? `${ELEMENT_TONE[row.id]}12` : 'transparent',
                  }}
                >
                  <span style={{ fontWeight: 700, color: ELEMENT_TONE[row.id] }}>
                    {row.name}
                    <div style={{ fontWeight: 500, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {row.sanskrit}
                    </div>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {row.signs.map((s) => RASHI_NAMES[s]).join(', ')}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {row.spiritualPath}
                    <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{row.understandingMethod}</div>
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {row.liberationPath}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.fearPattern}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Collapsible>

      {/* All 12 lagnas */}
      <Collapsible
        open={allLagnasOpen}
        onToggle={() => setAllLagnasOpen((o) => !o)}
        title="All twelve Lagnas · consciousness map"
      >
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
              minWidth: 720,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '7rem 4.5rem 1.1fr 1fr 1fr',
                gap: '0.45rem',
                padding: '0.55rem 0.75rem',
                background: 'var(--surface-3)',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-soft)',
              }}
            >
              <span>Lagna</span>
              <span>Element</span>
              <span>Consciousness · fear</span>
              <span>Purpose · pattern</span>
              <span>Breaks pattern</span>
            </div>
            {lagnaRows.map((row) => {
              const active = row.rashi === ascRashi
              const el = ELEMENT_TONE[row.elementId]
              return (
                <div
                  key={row.rashi}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '7rem 4.5rem 1.1fr 1fr 1fr',
                    gap: '0.45rem',
                    padding: '0.65rem 0.75rem',
                    borderBottom: '1px solid var(--border-soft)',
                    fontSize: '0.74rem',
                    lineHeight: 1.45,
                    background: active ? `${el}12` : 'transparent',
                  }}
                >
                  <span style={{ fontWeight: 700, color: active ? el : 'var(--text-primary)' }}>
                    {row.name}
                    <div style={{ fontWeight: 500, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {row.sanskrit}
                    </div>
                  </span>
                  <span style={{ color: el, fontWeight: 600, textTransform: 'capitalize' }}>
                    {row.elementId}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {row.primaryConsciousness}
                    <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{row.invisibleFear}</div>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {row.purpose}
                    <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{row.lifePattern}</div>
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {row.whatBreaksPattern}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Collapsible>

      {/* Principles */}
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
          onClick={() => setPrinciplesOpen((o) => !o)}
          aria-expanded={principlesOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            textAlign: 'left',
          }}
        >
          <BookOpen size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} aria-hidden />
          <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            Key spiritual principles
          </span>
          <ChevronDown
            size={16}
            aria-hidden
            style={{
              color: 'var(--text-muted)',
              transform: principlesOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
        {principlesOpen ? (
          <div
            style={{
              padding: '0 1rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              borderTop: '1px solid var(--border-soft)',
            }}
          >
            {principles.map((p) => (
              <div key={p.id} style={{ paddingTop: '0.75rem' }}>
                <h4
                  style={{
                    margin: '0 0 0.3rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-gold, var(--gold))',
                  }}
                >
                  {p.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '0.45rem' }}>
      <div style={miniLabel}>{label}</div>
      <p style={{ ...bodyText, margin: 0 }}>{value}</p>
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
  fontSize: '0.6rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 2,
}

const bodyText: React.CSSProperties = {
  margin: 0,
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
}
