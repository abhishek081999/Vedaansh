// ─────────────────────────────────────────────────────────────
//  src/components/ui/BhinnashtakavargaGuide.tsx
//  Planet-wise BAV gochar/dasha guide from class transcript rules
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Orbit,
  Users,
  Clock,
  BookOpen,
} from 'lucide-react'
import {
  analyzeBhinnashtakavargaGuide,
  type BavFinding,
  type BavStrengthBand,
  type PlanetBavGuide,
} from '@/lib/engine/bhinnashtakavargaGuide'
import styles from '@/components/ui/AshtakavargaWorkspace.module.css'
import { buildKakshyaTransitWatch, kakshyaNote } from '@/lib/engine/ashtakavargaKakshya'
import type { AshtakavargaResult, GrahaData, GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'

type SubTab = 'overview' | 'planet' | 'timing' | 'transit'

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Sparkles size={14} /> },
  { id: 'planet', label: 'Planet Guide', icon: <BookOpen size={14} /> },
  { id: 'timing', label: 'Special Timing', icon: <Clock size={14} /> },
  { id: 'transit', label: 'Gochar Watch', icon: <Orbit size={14} /> },
]

const PLANET_ORDER = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const

function strengthColor(band: BavStrengthBand | null): string {
  switch (band) {
    case 'critical':
    case 'weak':
      return 'var(--rose)'
    case 'borderline':
      return 'var(--text-gold)'
    case 'good':
      return 'var(--blue, #60a5fa)'
    case 'strong':
      return 'var(--teal)'
    default:
      return 'var(--text-muted)'
  }
}

function severityIcon(sev: BavFinding['severity']) {
  switch (sev) {
    case 'positive':
      return <CheckCircle2 size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
    case 'caution':
    case 'critical':
      return <AlertTriangle size={14} style={{ color: 'var(--rose)', flexShrink: 0 }} />
    default:
      return <Info size={14} style={{ color: 'var(--blue, #60a5fa)', flexShrink: 0 }} />
  }
}

function FindingCard({ finding }: { finding: BavFinding }) {
  const border =
    finding.severity === 'positive'
      ? 'color-mix(in srgb, var(--teal) 35%, var(--border-soft))'
      : finding.severity === 'critical' || finding.severity === 'caution'
        ? 'color-mix(in srgb, var(--rose) 35%, var(--border-soft))'
        : 'var(--border-soft)'
  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 'var(--r-sm)',
        padding: '0.55rem 0.65rem',
        background: 'var(--surface-1)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
        {severityIcon(finding.severity)}
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
          {finding.title}
        </div>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45, paddingLeft: '1.15rem' }}>
        {finding.detail}
      </div>
    </div>
  )
}

function StrengthBadge({ band, label, bindus }: { band: BavStrengthBand | null; label: string; bindus: number | null }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--r-sm)',
        padding: '0.25rem 0.5rem',
        fontSize: '0.72rem',
      }}
    >
      <span style={{ fontWeight: 800, color: strengthColor(band), fontVariantNumeric: 'tabular-nums' }}>
        {bindus ?? '—'}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

function PlanetPanel({ guide }: { guide: PlanetBavGuide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-gold)' }}>{guide.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {guide.natalHouse != null && guide.natalRashi != null
                ? `Natal H${guide.natalHouse} · ${RASHI_SHORT[guide.natalRashi as keyof typeof RASHI_SHORT]}`
                : 'Natal position unavailable'}
            </div>
          </div>
          <StrengthBadge band={guide.strength} label={guide.strengthLabel} bindus={guide.selfBindus} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.55rem' }}>
          {guide.significations.map((s) => (
            <span
              key={s}
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--r-sm)',
                padding: '0.15rem 0.4rem',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {guide.natalFindings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-gold)' }}>Applied natal findings</div>
          {guide.natalFindings.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.55rem' }}>
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--rose)', marginBottom: '0.4rem' }}>
            Weak gochar signs (≤3)
          </div>
          {guide.weakTransitSigns.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>None — all signs ≥4</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {guide.weakTransitSigns.map((s) => (
                <div key={s.rashi} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    H{s.house} · {RASHI_SHORT[s.rashi as keyof typeof RASHI_SHORT]}
                  </span>
                  <b style={{ color: 'var(--rose)' }}>{s.bindus}</b>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--teal)', marginBottom: '0.4rem' }}>
            Strong gochar signs (6+)
          </div>
          {guide.strongTransitSigns.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No 6+ signs</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {guide.strongTransitSigns.map((s) => (
                <div key={s.rashi} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    H{s.house} · {RASHI_SHORT[s.rashi as keyof typeof RASHI_SHORT]}
                  </span>
                  <b style={{ color: 'var(--teal)' }}>{s.bindus}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {guide.transitNotes.length > 0 ? (
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-gold)', marginBottom: '0.35rem' }}>
            Gochar & dasha notes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {guide.transitNotes.map((n, i) => (
              <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {i + 1}. {n}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function BhinnashtakavargaGuide({
  ashtakavarga,
  ascRashi,
  grahas,
  transitGrahas,
  dashaLord,
  janmaNakshatraIndex,
  ayanamsha: _ayanamsha,
}: {
  ashtakavarga: AshtakavargaResult
  ascRashi: number
  grahas?: GrahaData[]
  transitGrahas?: GrahaData[]
  dashaLord?: string
  janmaNakshatraIndex?: number
  ayanamsha?: string
}) {
  const [sub, setSub] = useState<SubTab>('overview')
  const [planet, setPlanet] = useState<GrahaId>('Su')

  const kakshyaRows = useMemo(() => {
    if (!transitGrahas?.length || !ashtakavarga.prastara) return []
    return buildKakshyaTransitWatch(ashtakavarga, transitGrahas)
  }, [ashtakavarga, transitGrahas])

  const guide = useMemo(() => {
    if (!grahas?.length) return null
    const moon = grahas.find((g) => g.id === 'Mo')
    return analyzeBhinnashtakavargaGuide({
      ashtakavarga,
      ascRashi,
      grahas,
      transitGrahas,
      dashaLord,
      janmaNakshatraIndex: janmaNakshatraIndex ?? moon?.nakshatraIndex,
      janmaPada: moon?.pada,
    })
  }, [ashtakavarga, ascRashi, grahas, transitGrahas, dashaLord, janmaNakshatraIndex])

  if (!guide) {
    return (
      <div className="card" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Chart grahas are required for Bhinnashtakavarga guidance.
      </div>
    )
  }

  const selected = guide.planets.find((p) => p.planet === planet) ?? guide.planets[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {guide.usageNote}
        </div>
      </div>

      <div className={styles.subTabScroll}>
        <div className={styles.subTabRow}>
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSub(t.id)}
            className={`${styles.subTabBtn} ${sub === t.id ? styles.subTabBtnActive : ''}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      </div>

      {sub === 'overview' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.45rem' }}>
            {guide.planets.map((p) => (
              <button
                key={p.planet}
                type="button"
                onClick={() => {
                  setPlanet(p.planet)
                  setSub('planet')
                }}
                style={{
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--r-sm)',
                  padding: '0.55rem',
                  background: 'var(--surface-1)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{p.name}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: strengthColor(p.strength) }}>
                    {p.selfBindus ?? '—'}
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {p.natalHouse != null ? `H${p.natalHouse}` : '—'} · {p.strength ?? 'n/a'}
                </div>
              </button>
            ))}
          </div>

          {guide.crossFindings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)' }}>Chart-level findings</div>
              {guide.crossFindings.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {sub === 'planet' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div className={styles.planetGrid}>
            {PLANET_ORDER.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlanet(p)}
                className={`${styles.planetBtn} ${planet === p ? styles.planetBtnActive : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
          {selected ? <PlanetPanel guide={selected} /> : null}
        </div>
      ) : null}

      {sub === 'timing' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {guide.fatherTiming ? (
            <div className="card" style={{ padding: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)', marginBottom: '0.45rem' }}>
                Sun BAV — father crisis window
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.4rem', marginBottom: '0.55rem' }}>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.45rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>10th from Lagna</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--blue, #60a5fa)' }}>{guide.fatherTiming.lagnaTenthBindus}</div>
                </div>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.45rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>9th from Sun</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--blue, #60a5fa)' }}>{guide.fatherTiming.sunNinthBindus}</div>
                </div>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.45rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Sum → Nakshatra</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                    {guide.fatherTiming.adjusted} · {guide.fatherTiming.targetNakshatraName}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {guide.fatherTiming.note}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Trine signs to watch for Saturn gochar:{' '}
                {guide.fatherTiming.trineRashis.map((r) => RASHI_SHORT[r as keyof typeof RASHI_SHORT]).join(', ')}
              </div>
            </div>
          ) : null}

          {guide.maternalRelatives ? (
            <div className="card" style={{ padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
                <Users size={14} style={{ color: 'var(--text-gold)' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                  Maternal relatives (Moon → 4th)
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginBottom: '0.45rem' }}>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Mama (uncles) points</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{guide.maternalRelatives.mamaPoints}</div>
                </div>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Mausi (aunts) points</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{guide.maternalRelatives.mausiPoints}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                4th from Moon in {RASHI_SHORT[guide.maternalRelatives.rashi as keyof typeof RASHI_SHORT]}.{' '}
                {guide.maternalRelatives.note}
              </div>
            </div>
          ) : null}

          <div className="card" style={{ padding: '0.85rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--text-gold)' }}>Remember:</b> Bhinnashtakavarga timings activate when dasha/antardasha
            supports and gochar hits the sensitive sign/degree (±1° often peaks the event; Moon degree refines the day).
          </div>
        </div>
      ) : null}

      {sub === 'transit' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Current transit planet in each natal BAV sign — low scores need caution when dasha also runs.
          </div>
          {guide.transitWatch.length === 0 ? (
            <div className="card" style={{ padding: '0.85rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Transit positions not available in this view.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.45rem' }}>
              {guide.transitWatch.map((row) => (
                <div
                  key={row.planet}
                  style={{
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--r-sm)',
                    padding: '0.55rem 0.6rem',
                    background: 'var(--surface-1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                      {GRAHA_NAMES[row.planet] ?? row.planet}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: strengthColor(row.strength) }}>
                      {row.natalBav}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    H{row.transitHouse} · {RASHI_SHORT[row.transitRashi as keyof typeof RASHI_SHORT]} · {row.strength}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    {row.domains}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                    {row.note}
                  </div>
                </div>
              ))}
            </div>
          )}
          {kakshyaRows.length > 0 ? (
            <div className="card" style={{ padding: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)', marginBottom: '0.45rem' }}>Kakshya (degree-level)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.45rem' }}>
                {kakshyaRows.map((row) => (
                  <div key={`k-${row.planet}`} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {kakshyaNote(row)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}


