'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/dasha/KalachakraAnalysisPanel.tsx
//  Visual Kalachakra row: Deha, Jeeva, the nine sign periods,
//  and the prediction for the period under the pointer.
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import type { DashaNode, GrahaData, Rashi } from '@/types/astrology'
import {
  analyzeKalachakra,
  kalachakraAntars,
  type KalachakraPeriodView,
  type KalachakraTone,
} from '@/lib/engine/dasha/kalachakraAnalysis'

interface Props {
  moonLonSidereal: number
  nodes: DashaNode[]
  grahas: GrahaData[]
  ascRashi: Rashi
  timezone?: string
  /** Seed, the mahadasha bar, and one prediction. Hides antardasha and area tiles. */
  compact?: boolean
}

function ordinal(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function toneColor(tone: KalachakraTone): string {
  if (tone === 'supportive') return 'var(--teal)'
  if (tone === 'caution') return 'var(--rose)'
  return 'var(--gold)'
}

function toneBg(tone: KalachakraTone): string {
  if (tone === 'supportive') return 'rgba(78,205,196,0.16)'
  if (tone === 'caution') return 'rgba(224,123,142,0.16)'
  return 'var(--gold-faint)'
}

function formatRange(startMs: number, endMs: number, timezone?: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', timeZone: timezone || undefined }
  const start = new Date(startMs)
  const end = new Date(endMs)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return ''
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`
}

function PeriodBar({
  periods,
  selectedKey,
  onSelect,
  label,
}: {
  periods: KalachakraPeriodView[]
  selectedKey: string | null
  onSelect: (key: string) => void
  label: string
}) {
  const total = periods.reduce((sum, period) => sum + period.durationMs, 0) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 2 }} role="listbox" aria-label={label}>
        {periods.map((period) => {
          const selected = period.key === selectedKey
          return (
            <button
              key={period.key}
              type="button"
              role="option"
              aria-selected={selected}
              title={`${period.signName}. ${period.headline}`}
              onClick={() => onSelect(period.key)}
              style={{
                flex: `${Math.max(period.durationMs / total, 0.04)} 1 0`,
                minWidth: 42,
                borderRadius: 6,
                border: selected ? '1px solid var(--text-primary)' : '1px solid transparent',
                background: toneBg(period.tone),
                color: toneColor(period.tone),
                padding: '0.35rem 0.2rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: period.isCurrent ? 800 : 600,
                boxShadow: period.isCurrent ? 'inset 0 -2px 0 var(--teal)' : 'none',
              }}
            >
              {period.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FocusCard({
  kicker,
  signName,
  occupants,
  text,
}: {
  kicker: string
  signName: string
  occupants: string[]
  text: string
}) {
  return (
    <div style={{
      flex: '1 1 220px',
      padding: '0.7rem 0.75rem',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--r-sm)',
      background: 'var(--surface-2)',
    }}>
      <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>{kicker}</div>
      <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--text-primary)' }}>
        {signName}
      </div>
      <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {occupants.length ? occupants.map((name) => (
          <span key={name} style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            padding: '0.1rem 0.35rem',
            borderRadius: 999,
            background: 'var(--gold-faint)',
            color: 'var(--text-gold)',
          }}>{name}</span>
        )) : (
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>No planet</span>
        )}
      </div>
      <p style={{ margin: '0.45rem 0 0', fontSize: '0.75rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  )
}

export function KalachakraAnalysisPanel({
  moonLonSidereal,
  nodes,
  grahas,
  ascRashi,
  timezone,
  compact = false,
}: Props) {
  const slim = useMemo(
    () => grahas.map((g) => ({ id: g.id, rashi: g.rashi, dignity: g.dignity })),
    [grahas],
  )
  const analysis = useMemo(
    () => analyzeKalachakra({
      moonLonSidereal,
      nodes,
      grahas: slim,
      ascRashi,
    }),
    [moonLonSidereal, nodes, slim, ascRashi],
  )

  const [mahaKey, setMahaKey] = useState<string | null>(null)
  const [antarKey, setAntarKey] = useState<string | null>(null)
  const selectedMaha = analysis.mahadashas.find((p) => p.key === mahaKey)
    ?? analysis.mahadashas.find((p) => p.isCurrent)
    ?? analysis.mahadashas[0]
  const mahaNode = selectedMaha
    ? nodes.find((n) => `${n.level}:${n.lord}:${new Date(n.start).getTime()}` === selectedMaha.key)
    : undefined
  const antars = useMemo(
    () => kalachakraAntars(mahaNode, ascRashi, slim, moonLonSidereal, analysis.currentAntarKey),
    [mahaNode, ascRashi, slim, moonLonSidereal, analysis.currentAntarKey],
  )
  const selectedAntar = antars.find((p) => p.key === antarKey)
    ?? antars.find((p) => p.isCurrent)
    ?? antars[0]
  const focus = compact ? selectedMaha : (selectedAntar ?? selectedMaha)

  if (!analysis.mahadashas.length) return null
  const seed = analysis.seed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
        {analysis.summary}
      </p>
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        {[
          `${seed.nakshatraName} pada ${seed.pada}`,
          seed.gati,
          `Paramayu ${seed.paramayu}y`,
        ].map((chip) => (
          <span key={chip} style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            padding: '0.15rem 0.4rem',
            borderRadius: 999,
            border: '1px solid var(--border-soft)',
            color: 'var(--text-muted)',
          }}>{chip}</span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <FocusCard kicker="Deha · body" signName={analysis.deha.signName} occupants={analysis.deha.occupants} text={analysis.deha.text} />
        <FocusCard kicker="Jeeva · life" signName={analysis.jeeva.signName} occupants={analysis.jeeva.occupants} text={analysis.jeeva.text} />
      </div>

      <PeriodBar
        label="Mahadasha"
        periods={analysis.mahadashas}
        selectedKey={selectedMaha?.key ?? null}
        onSelect={(key) => {
          setMahaKey(key)
          setAntarKey(null)
        }}
      />

      {!compact && antars.length > 0 && (
        <PeriodBar
          label={`${selectedMaha?.signName ?? 'Sign'} antardasha`}
          periods={antars}
          selectedKey={selectedAntar?.key ?? null}
          onSelect={setAntarKey}
        />
      )}

      {focus && (
        <div style={{
          padding: '0.75rem 0.8rem',
          borderRadius: 'var(--r-sm)',
          border: `1px solid ${toneColor(focus.tone)}`,
          background: `linear-gradient(135deg, var(--surface-1), ${toneBg(focus.tone)})`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', color: 'var(--text-primary)' }}>
              {focus.signName}
              <span style={{ marginLeft: 8, fontSize: '0.68rem', fontWeight: 700, color: toneColor(focus.tone), textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {focus.tone}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {formatRange(focus.startMs, focus.endMs, timezone)}
            </div>
          </div>
          {focus.gati && (
            <div style={{ marginTop: 4, fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-gold)' }}>
              {focus.gati.name} · {ordinal(focus.gati.house)} from the previous sign
            </div>
          )}
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            {focus.prediction}
          </p>
          {!compact && (
            <div style={{
              marginTop: '0.7rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.45rem',
            }}>
              {focus.areas.map((area) => (
                <div key={area.id} style={{
                  padding: '0.45rem 0.5rem',
                  borderRadius: 6,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-soft)',
                }}>
                  <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{area.title}</div>
                  <div style={{ marginTop: 3, fontSize: '0.72rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>{area.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
