'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraNavtaraTab.tsx
//  Navtara chakra + prediction: dasha window, natal planet tara,
//  live gochara, muhurta booking gate, relationship tara.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import type { ChartOutput, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import {
  getNavtaraChakra,
  TARA_NAMES,
  TARA_QUALITIES,
  type TaraName,
} from '@/lib/engine/nakshatraAdvanced'
import {
  buildGocharaNavtaraReport,
  checkMuhurtaNavtara,
  getNavtaraPrediction,
  getRelationshipNavtara,
  TARA_DECISION_PROFILES,
  type GocharaNavtaraReport,
  type TaraTone,
} from '@/lib/engine/navtaraPrediction'
import type { TransitPlanetRow } from '@/types/reel-transit'
import { QC } from '@/components/ui/PlanetDetailCard'

const TONE_COL: Record<TaraTone, { text: string; border: string; bg: string }> = {
  supportive:     { text: 'var(--teal)',  border: 'rgba(45,212,191,.35)',  bg: 'rgba(45,212,191,.08)' },
  challenging:    { text: 'var(--rose)',  border: 'rgba(244,63,94,.35)',   bg: 'rgba(244,63,94,.08)' },
  neutral:        { text: 'var(--amber)', border: 'rgba(251,191,36,.35)',  bg: 'rgba(251,191,36,.08)' },
  transformative: { text: 'var(--gold)',  border: 'rgba(201,168,76,.4)',   bg: 'rgba(201,168,76,.1)' },
}

const CAP_LABEL: Record<string, string> = {
  full: 'Full promise',
  reduced: 'Reduced delivery',
  mixed: 'Mixed / identity',
}

export function NakshatraNavtaraTab({
  chart,
  birthNakIdx,
}: {
  chart: ChartOutput
  birthNakIdx: number
}) {
  const navtara = useMemo(() => getNavtaraChakra(birthNakIdx), [birthNakIdx])
  const prediction = useMemo(() => getNavtaraPrediction(chart), [chart])

  const [transitDate, setTransitDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [gochara, setGochara] = useState<GocharaNavtaraReport | null>(null)
  const [gocharaLoading, setGocharaLoading] = useState(false)
  const [gocharaError, setGocharaError] = useState<string | null>(null)

  const [muhurtaDayNak, setMuhurtaDayNak] = useState(birthNakIdx)
  const [partnerNak, setPartnerNak] = useState((birthNakIdx + 8) % 27)

  const activeDashaKey = prediction.current.path.map(p => p.lord).join('/')
  const ayanamsha = chart.meta?.settings?.ayanamsha ?? 'lahiri'

  useEffect(() => {
    let cancelled = false
    const activeDashaLords = activeDashaKey
      ? (activeDashaKey.split('/') as GrahaId[])
      : []
    async function load() {
      setGocharaLoading(true)
      setGocharaError(null)
      try {
        const qs = new URLSearchParams({ date: transitDate, ayanamsha: String(ayanamsha) })
        const res = await fetch(`/api/transits/planets?${qs}`)
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Transit fetch failed')
        const grahas = (json.grahas as TransitPlanetRow[]).map(g => ({
          id: g.id as GrahaId,
          name: g.name,
          nakshatraIndex: g.nakshatraIndex,
          nakshatraName: g.nakshatraName,
          isRetro: g.isRetro,
        }))
        if (!cancelled) {
          setGochara(buildGocharaNavtaraReport(birthNakIdx, grahas, activeDashaLords, transitDate))
        }
      } catch (err) {
        if (!cancelled) {
          setGochara(null)
          setGocharaError(err instanceof Error ? err.message : 'Could not load transits')
        }
      } finally {
        if (!cancelled) setGocharaLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [transitDate, birthNakIdx, ayanamsha, activeDashaKey])

  const muhurtaCheck = useMemo(
    () => checkMuhurtaNavtara(birthNakIdx, muhurtaDayNak, 'booking / agreement'),
    [birthNakIdx, muhurtaDayNak],
  )

  const relationship = useMemo(
    () => getRelationshipNavtara(birthNakIdx, partnerNak, 'You', 'Other'),
    [birthNakIdx, partnerNak],
  )

  const groups = useMemo(() => {
    const g: Record<string, typeof navtara> = {}
    navtara.forEach(n => {
      if (!g[n.tara]) g[n.tara] = []
      g[n.tara].push(n)
    })
    return g
  }, [navtara])

  const tone = TONE_COL[prediction.current.experienceTone]
  const maha = prediction.current.maha
  const antar = prediction.current.antar

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Method note */}
      <div
        style={{
          padding: '0.85rem 1rem',
          background: 'var(--surface-3)',
          border: '1px solid var(--border-soft)',
          borderLeft: '3px solid var(--gold)',
          borderRadius: 'var(--r-md)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: 'var(--text-gold)' }}>How to use Navtara</strong>
        {' — '}
        Confirm <em>what</em> happens with dasha + gochara and natal placement.
        Use Navtara for the <em>nature</em> of the experience and your decision window
        (Vipat / Pratyari / Vadha = extra caution). Gochara without matching dasha = energy only.
      </div>

      {/* Current prediction window */}
      <section
        style={{
          padding: '1rem 1.1rem',
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          borderRadius: 'var(--r-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              Current Navtara window
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: tone.text }}>
              {maha ? `${maha.tara} · ${maha.lordName} MD` : 'Dasha unavailable'}
              {antar ? ` / ${antar.tara} · ${antar.lordName} AD` : ''}
            </div>
          </div>
          <span
            style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
              background: 'var(--surface-1)',
              border: `1px solid ${tone.border}`,
              color: tone.text,
            }}
          >
            {prediction.current.experienceTone}
          </span>
        </div>

        {(maha || antar) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.5rem' }}>
            {maha && (
              <PeriodChip
                label="Mahadasha"
                lord={maha.lordName}
                tara={maha.tara}
                hindi={maha.profile.hindi}
                hard={maha.profile.isHard}
              />
            )}
            {antar && (
              <PeriodChip
                label="Antardasha"
                lord={antar.lordName}
                tara={antar.tara}
                hindi={antar.profile.hindi}
                hard={antar.profile.isHard}
              />
            )}
            {prediction.current.path[2] && (
              <PeriodChip
                label="Pratyantar"
                lord={prediction.current.path[2].lordName}
                tara={prediction.current.path[2].tara}
                hindi={prediction.current.path[2].profile.hindi}
                hard={prediction.current.path[2].profile.isHard}
              />
            )}
          </div>
        )}

        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {prediction.current.synthesis}
        </p>
        <div
          style={{
            padding: '0.65rem 0.75rem',
            background: 'var(--surface-1)',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border-soft)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--text-gold)' }}>Decision window:</strong>{' '}
          {prediction.current.decisionAdvice}
        </div>
      </section>

      {/* Live gochara */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
            Live gochara Navtara
          </div>
          <input
            type="date"
            value={transitDate}
            onChange={e => setTransitDate(e.target.value)}
            style={{
              padding: '0.35rem 0.55rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
            }}
          />
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Transit stars vs your Janma nakshatra. Event candidates need dasha match (MD/AD/PD lord).
        </p>
        {gocharaLoading && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading transits…</div>
        )}
        {gocharaError && (
          <div style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>{gocharaError}</div>
        )}
        {gochara && !gocharaLoading && (
          <>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {gochara.summary}
            </p>
            {gochara.moonTara && (
              <div
                style={{
                  padding: '0.55rem 0.7rem',
                  background: gochara.moonTara.profile.isHard ? 'rgba(244,63,94,.08)' : 'var(--surface-2)',
                  border: `1px solid ${gochara.moonTara.profile.isHard ? 'rgba(244,63,94,.3)' : 'var(--border-soft)'}`,
                  borderRadius: 'var(--r-sm)',
                  fontSize: '0.75rem',
                }}
              >
                <strong style={{ color: 'var(--text-gold)' }}>Moon:</strong>{' '}
                {gochara.moonTara.nakshatraName} → {gochara.moonTara.tara} · {gochara.moonTara.profile.shortLabel}
              </div>
            )}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                <thead>
                  <tr>
                    {['Planet', 'Nak', 'Tara', 'Event'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '0.4rem 0.55rem',
                          textAlign: 'left',
                          fontSize: '0.55rem',
                          textTransform: 'uppercase',
                          letterSpacing: '.08em',
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gochara.planets.map(p => {
                    const c = QC[p.profile.isHard ? 'inauspicious' : p.profile.tone === 'neutral' ? 'neutral' : 'auspicious']
                    return (
                      <tr key={p.grahaId}>
                        <td style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', fontWeight: 600 }}>
                          {p.grahaName}{p.isRetro ? ' ℞' : ''}
                        </td>
                        <td style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                          {p.nakshatraName}
                        </td>
                        <td style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: c.text, fontWeight: 600 }}>
                          {p.tara}
                        </td>
                        <td style={{ padding: '0.4rem 0.55rem', borderBottom: '1px solid var(--border-soft)', color: p.eventLikelihood === 'active' ? 'var(--teal)' : 'var(--text-muted)' }}>
                          {p.eventLikelihood === 'active' ? 'Active' : 'Energy'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Muhurta booking gate */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          Muhurta booking gate
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Pick the day&apos;s Moon nakshatra before booking vehicle delivery, renovation start, or agreements.
          Vipat / Pratyari / Vadha → avoid.
        </p>
        <select
          value={muhurtaDayNak}
          onChange={e => setMuhurtaDayNak(Number(e.target.value))}
          style={{
            padding: '0.5rem 0.65rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            maxWidth: 280,
          }}
        >
          {NAKSHATRA_NAMES.map((n, i) => (
            <option key={i} value={i}>{n}</option>
          ))}
        </select>
        <div
          style={{
            padding: '0.75rem 0.85rem',
            background:
              muhurtaCheck.verdict === 'avoid'
                ? 'rgba(244,63,94,.08)'
                : muhurtaCheck.verdict === 'caution'
                  ? 'rgba(251,191,36,.08)'
                  : 'rgba(45,212,191,.08)',
            border: `1px solid ${
              muhurtaCheck.verdict === 'avoid'
                ? 'rgba(244,63,94,.3)'
                : muhurtaCheck.verdict === 'caution'
                  ? 'rgba(251,191,36,.35)'
                  : 'rgba(45,212,191,.3)'
            }`,
            borderRadius: 'var(--r-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {muhurtaCheck.tara} · score {muhurtaCheck.score}
            </span>
            <span
              style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color:
                  muhurtaCheck.verdict === 'avoid'
                    ? 'var(--rose)'
                    : muhurtaCheck.verdict === 'caution'
                      ? 'var(--amber)'
                      : 'var(--teal)',
              }}
            >
              {muhurtaCheck.verdict}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {muhurtaCheck.advice}
          </p>
        </div>
      </section>

      {/* Relationship tara */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          Relationship Navtara
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          How your birth star experiences theirs, and theirs yours — support vs hard-window friction.
        </p>
        <select
          value={partnerNak}
          onChange={e => setPartnerNak(Number(e.target.value))}
          style={{
            padding: '0.5rem 0.65rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            maxWidth: 280,
          }}
        >
          {NAKSHATRA_NAMES.map((n, i) => (
            <option key={i} value={i}>Other: {n}</option>
          ))}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.5rem' }}>
          {[relationship.aToB, relationship.bToA].map(side => {
            const c = QC[side.profile.isHard ? 'inauspicious' : side.profile.tone === 'neutral' ? 'neutral' : 'auspicious']
            return (
              <div
                key={side.fromLabel}
                style={{
                  padding: '0.65rem 0.75rem',
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: 'var(--r-sm)',
                }}
              >
                <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>
                  {side.fromLabel} → {side.toNakName}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text, marginTop: 4 }}>
                  {side.tara}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {side.profile.shortLabel}
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {relationship.summary}
        </p>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {relationship.advice}
        </p>
      </section>

      {/* Natal planet result capacity */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          Natal planets by Navtara
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          From {prediction.birthNakshatraName}. Planets in Vipat / Pratyari / Vadha often cannot deliver
          100% of their chart promise; Mitra / Ati-Mitra lords tend to leave a benefit trail even through challenges.
        </p>
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr>
                {['Planet', 'Nakshatra', 'Tara', 'Capacity'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '0.45rem 0.6rem',
                      textAlign: 'left',
                      fontSize: '0.58rem',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prediction.natalPlanets.map(p => {
                const c = QC[p.profile.isHard ? 'inauspicious' : p.profile.tone === 'neutral' ? 'neutral' : 'auspicious']
                return (
                  <tr key={p.grahaId}>
                    <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-soft)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.grahaName}
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                      {p.nakshatraName}
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-soft)' }}>
                      <span style={{ color: c.text, fontWeight: 600 }}>
                        {p.taraNumber}. {p.tara}
                      </span>
                    </td>
                    <td style={{ padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>
                      {CAP_LABEL[p.resultCapacity]}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {(prediction.reducedResultLords.length > 0 || prediction.supportiveLords.length > 0) && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.7rem' }}>
            {prediction.reducedResultLords.length > 0 && (
              <span style={{ color: 'var(--rose)' }}>
                Reduced: {prediction.reducedResultLords.map(id => GRAHA_NAMES[id]).join(', ')}
              </span>
            )}
            {prediction.supportiveLords.length > 0 && (
              <span style={{ color: 'var(--teal)' }}>
                Supportive: {prediction.supportiveLords.map(id => GRAHA_NAMES[id]).join(', ')}
              </span>
            )}
          </div>
        )}
      </section>

      {/* Dasha lord → tara map */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          Vimshottari MD → Navtara map
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Birth mahadasha lord = Janma; each next lord in Vimshottari order advances one tara.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '0.4rem' }}>
          {prediction.dashaSequence.map(d => {
            const active = maha?.lord === d.lord
            const c = QC[d.profile.isHard ? 'inauspicious' : d.profile.tone === 'neutral' ? 'neutral' : 'auspicious']
            return (
              <div
                key={d.lord}
                style={{
                  padding: '0.55rem 0.5rem',
                  background: active ? c.bg : 'var(--surface-2)',
                  border: `1px solid ${active ? c.border : 'var(--border-soft)'}`,
                  borderRadius: 'var(--r-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {d.taraNumber}. {d.tara}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: active ? c.text : 'var(--text-primary)', marginTop: 2 }}>
                  {d.lordName}
                </div>
                {d.profile.isHard && (
                  <div style={{ fontSize: '0.52rem', color: 'var(--rose)', fontWeight: 600, marginTop: 2 }}>HARD</div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Nine tara groups with decision profiles */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-gold)' }}>
          Nine Tara groups from {prediction.birthNakshatraName}
        </div>
        {(TARA_NAMES as TaraName[]).map((tara, idx) => {
          const group = groups[tara] || []
          const q = TARA_QUALITIES[tara]
          const profile = TARA_DECISION_PROFILES[tara]
          const c = QC[q.quality]
          return (
            <div
              key={tara}
              style={{
                padding: '0.75rem',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 'var(--r-md)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  color: 'var(--text-primary)',
                }}
              >
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: c.text }}>
                    {tara} Tara{' '}
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>({profile.hindi})</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.55rem',
                      textTransform: 'uppercase',
                      letterSpacing: '.1em',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: c.border,
                      color: c.text,
                      fontWeight: 700,
                    }}
                  >
                    {profile.shortLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  {group.map(n => (
                    <span
                      key={n.nakshatraIndex}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 7px',
                        background: 'var(--surface-2)',
                        borderRadius: 20,
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-soft)',
                        fontWeight: n.nakshatraIndex === birthNakIdx ? 700 : 400,
                      }}
                    >
                      {n.nakshatraIndex === birthNakIdx && '★ '}
                      {n.nakshatraName}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 4 }}>
                  {profile.experience}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Decide:</strong> {profile.decisionWindow}
                  {profile.trap ? ` · Trap: ${profile.trap}` : ''}
                </div>
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function PeriodChip({
  label,
  lord,
  tara,
  hindi,
  hard,
}: {
  label: string
  lord: string
  tara: string
  hindi: string
  hard: boolean
}) {
  return (
    <div
      style={{
        padding: '0.55rem 0.65rem',
        background: 'var(--surface-1)',
        border: `1px solid ${hard ? 'rgba(244,63,94,.3)' : 'var(--border-soft)'}`,
        borderRadius: 'var(--r-sm)',
      }}
    >
      <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 2 }}>{lord}</div>
      <div style={{ fontSize: '0.68rem', color: hard ? 'var(--rose)' : 'var(--teal)', marginTop: 2 }}>
        {tara} ({hindi})
      </div>
    </div>
  )
}
