'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraTaramandalTab.tsx
//  Taramandal workspace — constellation groups (≠ Navtara)
//  Free: full mandal catalog + chart planet map
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { Compass, Crown, Layers, Sparkles, Star } from 'lucide-react'
import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'
import {
  analyzeTaramandalChart,
  type TaramandalChartView,
  type TaramandalId,
} from '@/lib/engine/nakshatraTaramandal'

type Section = 'chart' | 'mandals' | 'reference'

const SECTIONS: { id: Section; label: string; Icon: typeof Star }[] = [
  { id: 'chart', label: 'Your Chart', Icon: Compass },
  { id: 'mandals', label: 'All Mandals', Icon: Layers },
  { id: 'reference', label: 'About', Icon: Sparkles },
]

const MANDAL_ACCENT: Record<TaramandalId, string> = {
  garuda: '#f59e0b',
  naga: '#34d399',
  deva: '#818cf8',
  rakshasa: '#f87171',
  pitru: '#c084fc',
  marut: '#67e8f9',
  agni: '#fb923c',
  soma: '#93c5fd',
  vaishya: '#fbbf24',
  pashu: '#a3e635',
  mrityu_karma: '#94a3b8',
  gyan: '#e879f9',
}

export function NakshatraTaramandalTab({ chart }: { chart: ChartOutput }) {
  const [section, setSection] = useState<Section>('chart')
  const [openId, setOpenId] = useState<TaramandalId | null>(null)

  const analysis = useMemo(() => analyzeTaramandalChart(chart), [chart])

  const activeViews = useMemo(
    () => analysis.mandals.filter(v => v.mandal.complete && (v.planetHits.length > 0 || v.moonInMandal || v.lagnaInMandal)),
    [analysis.mandals],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
        Taramandal is not Navtara. Each nakshatra is held by one or more constellation groups;
        planets in a group take on that mandal&apos;s cosmic work.
      </p>

      <div
        className="mobile-tab-scroll"
        style={{
          display: 'flex',
          gap: 3,
          flexWrap: 'nowrap',
          background: 'var(--surface-3)',
          borderRadius: 'var(--r-md)',
          padding: 4,
          border: '1px solid var(--border-soft)',
          overflowX: 'auto',
        }}
        role="tablist"
        aria-label="Taramandal sections"
      >
        {SECTIONS.map(s => {
          const active = section === s.id
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSection(s.id)}
              style={{
                flex: '1 1 auto',
                padding: '0.42rem 0.65rem',
                background: active ? 'var(--surface-1)' : 'transparent',
                border: 'none',
                borderRadius: 'calc(var(--r-md) - 2px)',
                cursor: 'pointer',
                color: active ? 'var(--text-gold)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 400,
                fontSize: '0.72rem',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,.2)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
              }}
            >
              <s.Icon size={13} aria-hidden />
              {s.label}
            </button>
          )
        })}
      </div>

      {section === 'chart' && (
        <ChartSection
          analysis={analysis}
          activeViews={activeViews}
          openId={openId}
          setOpenId={setOpenId}
        />
      )}
      {section === 'mandals' && (
        <MandalsSection
          views={analysis.mandals}
          openId={openId}
          setOpenId={setOpenId}
        />
      )}
      {section === 'reference' && <ReferenceSection uncovered={analysis.uncoveredNakshatras} />}
    </div>
  )
}

function ChartSection({
  analysis,
  activeViews,
  openId,
  setOpenId,
}: {
  analysis: ReturnType<typeof analyzeTaramandalChart>
  activeViews: TaramandalChartView[]
  openId: TaramandalId | null
  setOpenId: (id: TaramandalId | null) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{
        padding: '0.85rem 1rem',
        background: 'linear-gradient(135deg,rgba(201,168,76,.12),rgba(139,124,246,.08))',
        border: '1px solid rgba(201,168,76,.28)',
        borderRadius: 'var(--r-md)',
      }}>
        <div style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>
          Janma Nakshatra · Taramandal
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--text-gold)', fontWeight: 600 }}>
          {analysis.birthNakshatraName}
        </div>
        {analysis.birthMemberships.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.55rem' }}>
            {analysis.birthMemberships.map(m => (
              <span
                key={m.mandalId}
                style={{
                  fontSize: '0.68rem',
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: 'var(--surface-2)',
                  border: `1px solid ${MANDAL_ACCENT[m.mandalId]}66`,
                  color: 'var(--text-primary)',
                }}
              >
                {m.isKing && <Crown size={11} aria-hidden style={{ verticalAlign: '-1px', marginRight: 4, color: MANDAL_ACCENT[m.mandalId] }} />}
                {m.mandalName}
                {m.role === 'partial' ? ' · partial' : ''}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Not yet mapped to a complete Taramandal in the current teaching set.
          </p>
        )}
        <p style={{ margin: '0.65rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {analysis.insight}
        </p>
      </div>

      {activeViews.length === 0 ? (
        <EmptyHint text="No complete mandal currently holds Moon, Lagna, or a core planet in this chart’s taught memberships." />
      ) : (
        activeViews.map(view => (
          <MandalCard
            key={view.mandal.id}
            view={view}
            expanded={openId === view.mandal.id}
            onToggle={() => setOpenId(openId === view.mandal.id ? null : view.mandal.id)}
            highlightChart
          />
        ))
      )}
    </div>
  )
}

function MandalsSection({
  views,
  openId,
  setOpenId,
}: {
  views: TaramandalChartView[]
  openId: TaramandalId | null
  setOpenId: (id: TaramandalId | null) => void
}) {
  const complete = views.filter(v => v.mandal.complete)
  const pending = views.filter(v => !v.mandal.complete)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        {complete.length} taught mandals · each nakshatra is held like a king’s member of a constellation group.
      </p>
      {complete.map(view => (
        <MandalCard
          key={view.mandal.id}
          view={view}
          expanded={openId === view.mandal.id}
          onToggle={() => setOpenId(openId === view.mandal.id ? null : view.mandal.id)}
        />
      ))}
      {pending.length > 0 && (
        <>
          <div className="label-caps" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Forthcoming (king only)
          </div>
          {pending.map(view => (
            <MandalCard
              key={view.mandal.id}
              view={view}
              expanded={openId === view.mandal.id}
              onToggle={() => setOpenId(openId === view.mandal.id ? null : view.mandal.id)}
            />
          ))}
        </>
      )}
    </div>
  )
}

function MandalCard({
  view,
  expanded,
  onToggle,
  highlightChart = false,
}: {
  view: TaramandalChartView
  expanded: boolean
  onToggle: () => void
  highlightChart?: boolean
}) {
  const { mandal, planetHits, moonInMandal, lagnaInMandal } = view
  const accent = MANDAL_ACCENT[mandal.id]
  const kingName = mandal.kingIndex != null ? NAKSHATRA_NAMES[mandal.kingIndex] : '—'

  return (
    <div style={{
      border: `1px solid ${expanded ? accent : 'var(--border-soft)'}`,
      borderRadius: 'var(--r-md)',
      background: expanded ? 'var(--surface-2)' : 'var(--surface-2)',
      overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '0.75rem 0.9rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {mandal.name}
              </span>
              {!mandal.complete && (
                <span style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', border: '1px solid var(--border-soft)', padding: '1px 6px', borderRadius: 4 }}>
                  Pending
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {mandal.aka ? `${mandal.aka} · ` : ''}King · {kingName}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            {(moonInMandal || lagnaInMandal) && (
              <div style={{ display: 'flex', gap: 4 }}>
                {moonInMandal && <MiniPill>Moon</MiniPill>}
                {lagnaInMandal && <MiniPill>Lagna</MiniPill>}
              </div>
            )}
            {planetHits.length > 0 && (
              <span style={{ fontSize: '0.62rem', color: accent, fontWeight: 600 }}>
                {planetHits.length} planet{planetHits.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
        <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {mandal.theme}
        </p>
      </button>

      {expanded && (
        <div style={{ padding: '0 0.9rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {mandal.pendingNote && (
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {mandal.pendingNote}
            </p>
          )}

          <div>
            <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: 6 }}>Members</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {mandal.members.map(mem => {
                const isKing = mandal.kingIndex === mem.nakshatraIndex
                return (
                  <span
                    key={`${mem.nakshatraIndex}-${mem.role}`}
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: isKing ? `${accent}22` : 'var(--surface-3)',
                      border: `1px solid ${isKing ? accent : 'var(--border-soft)'}`,
                      color: 'var(--text-primary)',
                      fontWeight: isKing ? 700 : 400,
                    }}
                  >
                    {isKing && '★ '}
                    {NAKSHATRA_NAMES[mem.nakshatraIndex]}
                    {mem.role === 'partial' ? ' (partial)' : ''}
                  </span>
                )
              })}
            </div>
          </div>

          {mandal.kingWhy && (
            <div>
              <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: 4 }}>Why this king</div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{mandal.kingWhy}</p>
            </div>
          )}

          {mandal.functions.length > 0 && (
            <BulletBlock title="Functions" items={mandal.functions} />
          )}
          {mandal.works.length > 0 && (
            <BulletBlock title="Works" items={mandal.works} />
          )}

          {(highlightChart || planetHits.length > 0) && (
            <div>
              <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                Planets in this mandal
              </div>
              {planetHits.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>None in this chart.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {planetHits.map(hit => (
                    <div
                      key={hit.grahaId}
                      style={{
                        padding: '0.65rem 0.75rem',
                        background: 'var(--surface-3)',
                        borderRadius: 'var(--r-sm)',
                        border: '1px solid var(--border-soft)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-gold)', fontSize: '0.88rem' }}>
                          {GRAHA_NAMES[hit.grahaId] ?? hit.grahaName}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {hit.nakshatraName} P{hit.pada}
                          {hit.isKing ? ' · king star' : ''}
                          {hit.role === 'partial' ? ' · partial' : ''}
                        </span>
                      </div>
                      {hit.notes && (
                        <>
                          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {hit.notes.summary}
                          </p>
                          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.5 }}>
                            {hit.notes.details.map(d => <li key={d}>{d}</li>)}
                          </ul>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

function MiniPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '0.55rem',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '2px 6px',
      borderRadius: 4,
      background: 'var(--gold-faint)',
      color: 'var(--text-gold)',
      fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div style={{
      padding: '1rem',
      border: '1px dashed var(--border-soft)',
      borderRadius: 'var(--r-md)',
      color: 'var(--text-muted)',
      fontSize: '0.78rem',
      textAlign: 'center',
      lineHeight: 1.5,
    }}>
      {text}
    </div>
  )
}

function ReferenceSection({
  uncovered,
}: {
  uncovered: Array<{ index: number; name: string }>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{
        padding: '0.9rem 1rem',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-md)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-gold)', marginBottom: 6 }}>
          Taramandal ≠ Navtara
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Navtara counts nine tara steps from the birth star. Taramandal is a different system:
          fixed constellation groups that hold every nakshatra as a member. When planets fall in a
          mandal, their signification shifts with that group&apos;s cosmic energy — including patterns
          sometimes mistaken for stelliums.
        </p>
      </div>

      <div style={{
        padding: '0.9rem 1rem',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-md)',
      }}>
        <div className="label-caps" style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          Teaching coverage gaps
        </div>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Remaining gaps are only the forthcoming Mrityu Karma / Gyan mandals (kings recorded; full groups pending).
          Partial members elsewhere still count.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {uncovered.map(n => (
            <span
              key={n.index}
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 20,
                background: 'var(--surface-3)',
                border: '1px solid var(--border-soft)',
                color: 'var(--text-primary)',
              }}
            >
              {n.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
