'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/CareerProfessionPanel.tsx
//  Birth-chart career and profession desk
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { RASHI_SHORT } from '@/types/astrology'
import { ChakraSelector } from '@/components/chakra/ChakraSelector'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { useAppLayout } from '@/components/providers/LayoutProvider'
import { VedaanshLoader } from '@/components/ui/primitives/VedaanshLoader'
import { ScoreMeter } from '@/components/ui/marriedLifeUi'
import { CareerMethodPanel } from '@/components/ui/CareerMethodPanel'
import {
  analyzeCareerProfession,
  readCareerTransits,
  type CareerNote,
  type CareerTone,
  type CareerFit,
  type CareerTracker,
  type CareerTransitReading,
  type CareerTrackSegment,
} from '@/lib/engine/careerProfession'

type CareerMode = 'desk' | 'method'

const CAREER_METHODS: { id: CareerMode; code: string; name: string; topic: string }[] = [
  {
    id: 'desk',
    code: 'M1',
    name: 'Career reading',
    topic: 'The first method. The 10th house and its lord, whether the career can be delivered, the turns of the work, and who helps or blocks the post.',
  },
  {
    id: 'method',
    code: 'M2',
    name: 'Professional method',
    topic: 'The second method. The karma field, then the pair that is joined, then how the nakshatra behaves. Dashamsha comes after the birth chart.',
  },
]

type View = 'delivery' | 'strength' | 'chain' | 'turns' | 'support' | 'overview' | 'houses' | 'yogas' | 'planets' | 'stars' | 'confirm' | 'timing' | 'remedies' | 'brief'

const VIEWS: { id: View; label: string }[] = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'strength', label: 'Strength' },
  { id: 'chain', label: 'Chain' },
  { id: 'turns', label: 'Turns' },
  { id: 'support', label: 'Support' },
  { id: 'overview', label: 'Significators' },
  { id: 'houses', label: 'Houses' },
  { id: 'yogas', label: 'Yogas' },
  { id: 'planets', label: 'Planets' },
  { id: 'stars', label: 'Nakshatra' },
  { id: 'confirm', label: 'D9 · D10 · A10' },
  { id: 'timing', label: 'Tracker' },
  { id: 'remedies', label: 'What to do' },
  { id: 'brief', label: 'Brief' },
]

const TONE: Record<CareerTone, string> = {
  supportive: 'var(--teal)',
  caution: 'var(--rose)',
  mixed: 'var(--text-gold)',
}

const FIT_COLOR: Record<CareerFit, string> = {
  good: 'var(--teal)',
  mixed: 'var(--text-gold)',
  poor: 'var(--rose)',
}

interface Props {
  chart: ChartOutput
  userPlan?: UserPlan
}

function firstSentence(text: string): string {
  const cut = text.split(/(?<=\.)\s/)[0] ?? text
  return cut.length > 180 ? `${cut.slice(0, 177).trim()}…` : cut
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-caps" style={{ fontSize: '0.62rem', letterSpacing: '0.08em', marginBottom: 6 }}>
      {children}
    </div>
  )
}

function NoteList({ notes }: { notes: CareerNote[] }) {
  if (!notes.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {notes.map(n => (
        <article
          key={n.id}
          style={{
            padding: '0.8rem 0.9rem',
            borderLeft: `3px solid ${TONE[n.tone]}`,
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-sm)',
          }}
        >
          <div style={{ fontWeight: 750, fontSize: '0.82rem', marginBottom: 4 }}>{n.title}</div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.detail}</p>
        </article>
      ))}
    </div>
  )
}

function AnswerGrid({ notes }: { notes: { id: string; title: string; answer: string; reading: string; tone: CareerTone }[] }) {
  if (!notes.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.55rem' }}>
      {notes.map(n => (
        <article
          key={n.id}
          style={{
            padding: '0.8rem 0.9rem',
            borderLeft: `3px solid ${TONE[n.tone]}`,
            background: 'var(--surface-2)',
            borderRadius: 'var(--r-sm)',
          }}
        >
          <SectionLabel>{n.title}</SectionLabel>
          <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 6 }}>{n.answer}</div>
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{n.reading}</p>
        </article>
      ))}
    </div>
  )
}

function PeriodBar({
  segments,
  height,
  minShare = 9,
}: {
  segments: CareerTrackSegment[]
  height: number
  minShare?: number
}) {
  return (
    <div style={{ display: 'flex', height, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {segments.map(seg => (
        <div
          key={seg.id}
          title={`${seg.lord} · ${seg.label}. ${seg.reason}`}
          style={{
            width: `${seg.share}%`,
            minWidth: 0,
            background: `color-mix(in srgb, ${FIT_COLOR[seg.fit]} 70%, var(--surface-1))`,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: height > 28 ? '0.68rem' : '0.56rem',
            fontWeight: 750,
            boxShadow: seg.live ? 'inset 0 0 0 2px var(--text-primary)' : undefined,
            overflow: 'hidden',
          }}
        >
          {seg.share >= minShare ? seg.lord : ''}
        </div>
      ))}
    </div>
  )
}

function ZoomTrack({
  caption,
  segments,
  nowShare,
}: {
  caption: string
  segments: CareerTrackSegment[]
  nowShare: number | null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div className="label-caps" style={{ fontSize: '0.58rem' }}>{caption}</div>
      <div style={{ position: 'relative' }}>
        <PeriodBar segments={segments} height={30} minShare={7} />
        {nowShare != null && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: `${Math.min(100, Math.max(0, nowShare))}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: 'var(--text-primary)',
              transform: 'translateX(-1px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.4rem' }}>
        {segments.map(seg => (
          <article key={seg.id} style={{ padding: '0.65rem 0.75rem', borderLeft: `3px solid ${FIT_COLOR[seg.fit]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <SectionLabel>{seg.live ? 'Now · ' : ''}{seg.lord} · {seg.start} to {seg.end}</SectionLabel>
            <div style={{ fontWeight: 750, fontSize: '0.78rem', marginBottom: 4 }}>{seg.label}</div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{seg.reason}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function CareerPeriodTracker({
  tracker,
  transits,
}: {
  tracker: CareerTracker
  transits: CareerTransitReading | null
}) {
  if (!tracker.mahas.length) {
    return (
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{tracker.headline}</p>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tracker.headline}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
        {(['good', 'mixed', 'poor'] as CareerFit[]).map(fit => (
          <span key={fit} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: FIT_COLOR[fit] }} />
            {fit === 'good' ? 'Good for career' : fit === 'poor' ? 'Not for career' : 'Mixed for career'}
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4 }}>Mahadasha</div>
        <PeriodBar segments={tracker.mahas} height={38} />
        {tracker.antars.length ? (
          <>
            <div className="label-caps" style={{ fontSize: '0.58rem', margin: '0.45rem 0 4px' }}>Antardasha</div>
            <PeriodBar segments={tracker.antars} height={22} />
          </>
        ) : null}
        {tracker.nowShare != null && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: `${Math.min(100, Math.max(0, tracker.nowShare))}%`,
              top: 16,
              bottom: 0,
              width: 2,
              background: 'var(--text-primary)',
              transform: 'translateX(-1px)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tracker.nowLabel}</p>
      {tracker.pratyantars.length ? (
        <ZoomTrack
          caption={`Pratyantardasha · ${tracker.pratyantarWindow}`}
          segments={tracker.pratyantars}
          nowShare={tracker.pratyantarNowShare}
        />
      ) : tracker.pratyantarWindow ? (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{tracker.pratyantarWindow}</p>
      ) : null}
      {tracker.sookshmas.length ? (
        <ZoomTrack
          caption={`Sookshma · ${tracker.sookshmaWindow}`}
          segments={tracker.sookshmas}
          nowShare={tracker.sookshmaNowShare}
        />
      ) : null}
      <div>
        <div className="label-caps" style={{ fontSize: '0.58rem', marginBottom: 4 }}>Transit · gochar</div>
        {!transits ? (
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reading the current transits.</p>
        ) : !transits.available ? (
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{transits.headline}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{transits.headline}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.4rem' }}>
              {transits.hits.map(hit => (
                <article key={hit.id} style={{ padding: '0.65rem 0.75rem', borderLeft: `3px solid ${FIT_COLOR[hit.fit]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                  <SectionLabel>{hit.planet} · house {hit.house} · {hit.signName}{hit.retro ? ' · retrograde' : ''}</SectionLabel>
                  <div style={{ fontWeight: 750, fontSize: '0.78rem', marginBottom: 4 }}>{hit.label}</div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{hit.reading}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {tracker.mahas.map(seg => (
          <article key={seg.id} style={{ padding: '0.75rem 0.85rem', borderLeft: `3px solid ${FIT_COLOR[seg.fit]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <SectionLabel>{seg.live ? 'Now · ' : ''}{seg.lord} · {seg.start} to {seg.end}</SectionLabel>
            <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 4 }}>{seg.label}</div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{seg.reason}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function CareerCharts({ chart, showD10, highlight, d10Highlight }: { chart: ChartOutput; showD10: boolean; highlight: number[]; d10Highlight: number[] }) {
  const moonNakIndex = chart.grahas.find(g => g.id === 'Mo')?.nakshatraIndex ?? 0
  const d1Asc = chart.lagnas.ascRashi as Rashi
  const d10Asc = (chart.vargaLagnas?.D10 ?? d1Asc) as Rashi
  const d10Grahas = chart.vargas?.D10 ?? []
  const card: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    background: 'var(--surface-1)',
    padding: '0.65rem',
    minWidth: 0,
    overflow: 'hidden',
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '0.75rem' }}>
      <article style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <span className="label-caps" style={{ fontSize: '0.62rem' }}>D1 · Lagna chart</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-gold)' }}>{RASHI_SHORT[d1Asc]} lagna</span>
        </div>
        <ChakraSelector
          ascRashi={d1Asc}
          grahas={chart.vargas?.D1 ?? chart.grahas}
          vargaName="D1"
          moonNakIndex={moonNakIndex}
          arudhas={chart.arudhas}
          tithiNumber={chart.panchang?.tithi?.number}
          varaNumber={chart.panchang?.vara?.number}
          lagnas={chart.lagnas}
          defaultStyle="north"
          size={280}
          highlightHouses={highlight}
        />
      </article>
      {showD10 && d10Grahas.length ? (
        <article style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <span className="label-caps" style={{ fontSize: '0.62rem' }}>D10 · Dashamsha</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-gold)' }}>{RASHI_SHORT[d10Asc]} lagna</span>
          </div>
          <ChakraSelector
            ascRashi={d10Asc}
            grahas={d10Grahas}
            vargaName="D10"
            moonNakIndex={moonNakIndex}
            lagnas={chart.lagnas}
            defaultStyle="north"
            size={280}
            highlightHouses={d10Highlight}
          />
        </article>
      ) : null}
    </div>
  )
}

function CareerReading({ chart, userPlan = 'free' }: Props) {
  const full = planMeetsUiGate(userPlan, 'gold')
  const { setActiveTab } = useAppLayout()
  const data = useMemo(() => analyzeCareerProfession(chart), [chart])
  const [mode, setMode] = useState<CareerMode>('desk')
  const [view, setView] = useState<View>('delivery')
  const [copied, setCopied] = useState(false)
  const [transits, setTransits] = useState<CareerTransitReading | null>(null)
  const ascRashi = chart.lagnas?.ascRashi

  useEffect(() => {
    if (!ascRashi) return
    let cancel = false
    setTransits(null)
    fetch(`/api/transit?ascRashi=${ascRashi}`)
      .then(res => res.json())
      .then(body => {
        if (cancel) return
        const positions = Array.isArray(body?.currentPositions)
          ? body.currentPositions.flatMap((row: { planetId?: GrahaId; sign?: Rashi; isRetro?: boolean }) => {
              if (!row.planetId || !row.sign) return []
              return [{ id: row.planetId, rashi: row.sign, isRetro: row.isRetro === true }]
            })
          : []
        setTransits(readCareerTransits(chart, positions))
      })
      .catch(() => {
        if (!cancel) {
          setTransits({ available: false, headline: 'Transit could not be read.', hits: [] })
        }
      })
    return () => { cancel = true }
  }, [ascRashi, chart])

  if (!data) {
    return (
      <div style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        This chart has no ascendant, so career and profession cannot be read yet.
      </div>
    )
  }

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(data.brief.plain)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '0.85rem' }}>
      <header>
        <div className="label-caps" style={{ fontSize: '0.62rem', marginBottom: 6 }}>Career and profession</div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem', maxWidth: 420 }}>
          <span className="label-caps" style={{ fontSize: '0.58rem' }}>Method</span>
          <select
            aria-label="Select career method"
            value={mode}
            onChange={e => setMode(e.target.value as CareerMode)}
            style={{
              width: '100%',
              padding: '0.4rem 0.5rem',
              background: 'var(--surface-2)',
              color: 'var(--gold)',
              border: '1px solid rgba(201,168,76,0.45)',
              borderRadius: '4px',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            {CAREER_METHODS.map(m => (
              <option key={m.id} value={m.id}>
                {m.code} · {m.name}
              </option>
            ))}
          </select>
        </label>
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 760 }}>
          {CAREER_METHODS.find(m => m.id === mode)?.topic}
        </p>
        {mode === 'desk' && (
          <>
            <h2 style={{ margin: '0.7rem 0 0', fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 650 }}>{data.headline}</h2>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 760 }}>
              {data.summary}
            </p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: 'var(--text-gold)', fontWeight: 700, lineHeight: 1.5, maxWidth: 760 }}>
              {data.advanced.delivery.verdict}
            </p>
          </>
        )}
      </header>

      <CareerCharts
        chart={chart}
        showD10={full}
        highlight={mode === 'method' ? [1, 6, 7, 10, 11] : [10]}
        d10Highlight={mode === 'method' ? [1, 5, 10] : [10]}
      />

      {mode === 'method' && <CareerMethodPanel chart={chart} userPlan={userPlan} />}

      {mode === 'desk' && !full && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.65rem' }}>
            {data.scores.map(d => (
              <ScoreMeter key={d.id} label={d.label} planet={d.planet} score={d.score} summary={firstSentence(d.summary)} />
            ))}
          </div>
          <PlanGate userPlan={userPlan} required="gold" featureName="Career and profession">
            <div style={{ minHeight: 112, padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Full reading is on Gold</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Profession fields, job or business, yogas, D9 and D10 confirmation, A10, timing, and the consultant brief.
              </div>
            </div>
          </PlanGate>
        </>
      )}

      {mode === 'desk' && full && (
        <>
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
              padding: '0.55rem 0',
              background: 'var(--bg-page, var(--surface-1))',
              borderBottom: '1px solid var(--border-soft)',
            }}
            role="tablist"
            aria-label="Career and profession sections"
          >
            {VIEWS.map(v => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  border: `1px solid ${view === v.id ? 'var(--text-gold)' : 'var(--border)'}`,
                  background: view === v.id ? 'var(--surface-3)' : 'var(--surface-1)',
                  color: view === v.id ? 'var(--text-gold)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: view === v.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {view === 'delivery' && (
            <>
              <article style={{ padding: '0.95rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <SectionLabel>Can the promise be delivered?</SectionLabel>
                <h3 style={{ margin: '0 0 0.4rem', fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 650, color: TONE[data.advanced.delivery.tone] }}>
                  {data.advanced.delivery.verdict}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.advanced.delivery.reading}</p>
              </article>
              <SectionLabel>Witnesses</SectionLabel>
              <AnswerGrid notes={data.advanced.delivery.votes} />
              <SectionLabel>Fruit of the work</SectionLabel>
              <AnswerGrid notes={data.advanced.prosperity.notes} />
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.advanced.prosperity.closing}</p>
            </>
          )}

          {view === 'strength' && (
            <>
              <SectionLabel>Career planets</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {data.advanced.strength.rows.map(row => (
                  <article key={row.id} style={{ padding: '0.85rem', borderLeft: `3px solid ${TONE[row.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <SectionLabel>{row.role} · {row.planet}</SectionLabel>
                    <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 6 }}>{row.dignity}</div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{row.reading}</p>
                  </article>
                ))}
              </div>
              {data.advanced.strength.houses.length ? (
                <>
                  <SectionLabel>Livelihood houses</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.55rem' }}>
                    {data.advanced.strength.houses.map(h => (
                      <article key={h.house} style={{ padding: '0.8rem 0.9rem', borderLeft: `3px solid ${TONE[h.tone]}`, background: 'var(--surface-1)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                        <SectionLabel>House {h.house} · {h.label}</SectionLabel>
                        <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 6 }}>
                          {[h.bindus != null ? `${h.bindus} bindus` : '', h.bhava ?? ''].filter(Boolean).join(' · ')}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{h.reading}</p>
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.advanced.strength.closing}</p>
            </>
          )}

          {view === 'chain' && (
            <>
              <SectionLabel>Dispositor chain</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {data.advanced.chain.steps.map((step, index) => (
                  <article key={`${step.planet}-${index}`} style={{ padding: '0.85rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <SectionLabel>Step {index + 1} · house {step.house}</SectionLabel>
                    <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 6 }}>{step.planet} in {step.signName}</div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{step.reading}</p>
                  </article>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.advanced.chain.closing}</p>
              <SectionLabel>Who sees the career</SectionLabel>
              <AnswerGrid notes={data.advanced.chain.aspects} />
              <SectionLabel>Condition of the career planets</SectionLabel>
              <AnswerGrid notes={data.advanced.chain.conditions} />
              <SectionLabel>Varga ladder of the 10th lord</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.55rem' }}>
                {data.advanced.ladder.rows.map(row => (
                  <article key={row.varga} style={{ padding: '0.8rem 0.9rem', borderLeft: `3px solid ${TONE[row.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <SectionLabel>{row.varga}{row.house != null ? ` · house ${row.house}` : ''}</SectionLabel>
                    <div style={{ fontWeight: 750, fontSize: '0.84rem', marginBottom: 6 }}>{row.signName}</div>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{row.reading}</p>
                  </article>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.advanced.ladder.closing}</p>
            </>
          )}

          {view === 'turns' && (
            <>
              <article style={{ padding: '0.95rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <SectionLabel>The turns of the career</SectionLabel>
                <h3 style={{ margin: '0 0 0.45rem', fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 650 }}>
                  {data.advanced.turns.headline}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.advanced.turns.closing}</p>
              </article>
              <AnswerGrid notes={data.advanced.turns.notes} />
            </>
          )}

          {view === 'support' && (
            <>
              <article style={{ padding: '0.95rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                <SectionLabel>Who helps the career</SectionLabel>
                <h3 style={{ margin: '0 0 0.45rem', fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 650, color: TONE[data.advanced.support.tone] }}>
                  {data.advanced.support.headline}
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.advanced.support.closing}</p>
              </article>
              <SectionLabel>Argala on the 10th</SectionLabel>
              <AnswerGrid notes={data.advanced.support.argala} />
              <SectionLabel>The room of the work</SectionLabel>
              <AnswerGrid notes={data.advanced.support.room} />
            </>
          )}

          {view === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.65rem' }}>
                {data.scores.map(d => (
                  <ScoreMeter key={d.id} label={d.label} planet={d.planet} score={d.score} summary={d.summary} />
                ))}
              </div>
              <SectionLabel>The questions</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.65rem' }}>
                {data.significators.map(s => (
                  <article
                    key={s.id}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      borderTop: `3px solid ${TONE[s.tone]}`,
                      background: 'var(--surface-1)',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', margin: '0.2rem 0 0.35rem' }}>{s.question}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>{s.placement}</div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{s.reading}</p>
                  </article>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.65rem' }}>
                <article style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <SectionLabel>{data.track.headline}</SectionLabel>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.track.prediction}</p>
                  <p style={{ margin: '0.55rem 0 0', fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{data.track.doThis}</p>
                  {data.track.factors.length ? (
                    <p style={{ margin: '0.55rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {data.track.factors.join(' · ')}
                    </p>
                  ) : null}
                </article>
                <article style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                  <SectionLabel>{data.foreign.headline}</SectionLabel>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.foreign.prediction}</p>
                  {data.foreign.factors.length ? (
                    <p style={{ margin: '0.55rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {data.foreign.factors.join(' · ')}
                    </p>
                  ) : null}
                </article>
              </div>
              <SectionLabel>Profession fields</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.55rem' }}>
                {data.fields.map(f => (
                  <article key={f.field} style={{ padding: '0.75rem 0.85rem', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <div style={{ fontWeight: 750, fontSize: '0.82rem' }}>{f.field}</div>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.why}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {view === 'houses' && (
            <>
              <SectionLabel>Houses that feed the livelihood</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.65rem' }}>
                {data.houses.map(h => (
                  <article key={h.house} style={{ padding: '0.85rem', borderLeft: `3px solid ${TONE[h.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <SectionLabel>House {h.house} · {h.signName}</SectionLabel>
                    <div style={{ fontWeight: 750, fontSize: '0.82rem', marginBottom: 4 }}>{h.role}</div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{h.reading}</p>
                  </article>
                ))}
              </div>
              {(data.fromMoon || data.fromSun) && (
                <>
                  <SectionLabel>Phaladeepika — 10th from Moon and Sun</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.65rem' }}>
                    {[data.fromMoon, data.fromSun].filter(Boolean).map(card => (
                      <article key={card!.title} style={{ padding: '0.85rem', borderLeft: `3px solid ${TONE[card!.tone]}`, background: 'var(--surface-1)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                        <SectionLabel>{card!.title} · {card!.signName}</SectionLabel>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{card!.reading}</p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {view === 'yogas' && (
            <>
              <SectionLabel>Career yogas</SectionLabel>
              <NoteList notes={data.yogas} />
            </>
          )}

          {view === 'planets' && (
            <>
              <SectionLabel>What each planet is doing for the work</SectionLabel>
              <NoteList notes={data.planets} />
            </>
          )}

          {view === 'stars' && (
            <>
              <SectionLabel>Nakshatra formula</SectionLabel>
              <article style={{ padding: '0.9rem 1rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.nakshatra.formula}</p>
              </article>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {data.nakshatra.rows.map(row => (
                  <article key={row.label} style={{ padding: '0.85rem', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.84rem' }}>{row.label}</strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-gold)', fontWeight: 700 }}>{row.priority}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.4rem' }}>
                      {row.nakshatra} · pada {row.pada}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{row.line}</p>
                    {row.fields.length ? (
                      <p style={{ margin: '0.45rem 0 0', fontSize: '0.74rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {row.fields.join(' · ')}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem' }}>
                <Link href="/nakshatra/profession" style={{ color: 'var(--text-gold)', fontWeight: 700, textDecoration: 'none' }}>
                  Open the nakshatra profession lab
                </Link>
              </p>
            </>
          )}

          {view === 'confirm' && (
            <>
              <SectionLabel>Does the promise hold?</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {data.navamsha && (
                  <article style={{ padding: '0.85rem', borderLeft: `3px solid ${TONE[data.navamsha.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <SectionLabel>Navamsha of the 10th lord · {data.navamsha.signName}</SectionLabel>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.navamsha.reading}</p>
                  </article>
                )}
                {data.dashamsha && (
                  <article style={{ padding: '0.85rem', borderLeft: `3px solid ${TONE[data.dashamsha.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <SectionLabel>Dashamsha · {data.dashamsha.lagnaName} lagna</SectionLabel>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.dashamsha.reading}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashamsa')}
                      style={{
                        marginTop: '0.65rem',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '999px',
                        border: '1px solid var(--text-gold)',
                        background: 'transparent',
                        color: 'var(--text-gold)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Open Dashamsha
                    </button>
                  </article>
                )}
                {data.a10 && (
                  <article style={{ padding: '0.85rem', borderLeft: `3px solid ${TONE[data.a10.tone]}`, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <SectionLabel>A10 · {data.a10.signName} · house {data.a10.house}</SectionLabel>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{data.a10.reading}</p>
                  </article>
                )}
                {!data.navamsha && !data.dashamsha && !data.a10 && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Recalculate the chart so Navamsha, Dashamsha, and A10 are included.
                  </p>
                )}
              </div>
            </>
          )}

          {view === 'timing' && (
            <>
              <SectionLabel>Which periods are for the career</SectionLabel>
              <CareerPeriodTracker tracker={data.tracker} transits={transits} />
            </>
          )}

          {view === 'remedies' && (
            <>
              <SectionLabel>What to do with this chart</SectionLabel>
              <NoteList notes={data.remedies} />
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{data.ethics}</p>
            </>
          )}

          {view === 'brief' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <SectionLabel>Consultant brief</SectionLabel>
                <button
                  type="button"
                  onClick={copyBrief}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '999px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {data.brief.sections.map(s => (
                <article key={s.heading} style={{ padding: '0.85rem 1rem', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}>
                  <SectionLabel>{s.heading}</SectionLabel>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{s.body}</p>
                </article>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

export function CareerProfessionPanel({ chart, userPlan = 'free' }: Props) {
  const [shown, setShown] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setShown(false)
    const frame = requestAnimationFrame(() => {
      startTransition(() => setShown(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [chart, startTransition])

  if (!shown) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, padding: '3rem 1rem' }}>
        <VedaanshLoader size={44} message="Reading career and profession…" />
      </div>
    )
  }
  return <CareerReading chart={chart} userPlan={userPlan} />
}
