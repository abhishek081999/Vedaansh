// ─────────────────────────────────────────────────────────────
//  src/components/ui/BhinnashtakavargaGuide.tsx
//  Planet-wise BAV gochar/dasha guide from class transcript rules
// ─────────────────────────────────────────────────────────────
'use client'

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
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
import type { AshtakavargaResult, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_SHORT } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'

function signName(rashi: number, hi: boolean): string {
  const r = rashi as Rashi
  return hi ? (RASHI_HI[r] ?? String(rashi)) : (RASHI_SHORT[r] ?? String(rashi))
}

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
  const t = useTranslations('ashtakavarga')
  const { hi } = useLang()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-gold)' }}>{guide.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {guide.natalHouse != null && guide.natalRashi != null
                ? t('bav.natal', { house: guide.natalHouse, sign: signName(guide.natalRashi, hi) })
                : t('bav.natalMissing')}
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
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-gold)' }}>{t('bav.applied')}</div>
          {guide.natalFindings.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.55rem' }}>
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--rose)', marginBottom: '0.4rem' }}>
            {t('bav.weakSigns')}
          </div>
          {guide.weakTransitSigns.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('bav.noneWeak')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {guide.weakTransitSigns.map((s) => (
                <div key={s.rashi} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {t('insights.house', { n: s.house })} · {signName(s.rashi, hi)}
                  </span>
                  <b style={{ color: 'var(--rose)' }}>{s.bindus}</b>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--teal)', marginBottom: '0.4rem' }}>
            {t('bav.strongSigns')}
          </div>
          {guide.strongTransitSigns.length === 0 ? (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('bav.noneStrong')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {guide.strongTransitSigns.map((s) => (
                <div key={s.rashi} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {t('insights.house', { n: s.house })} · {signName(s.rashi, hi)}
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
            {t('bav.notes')}
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
  const t = useTranslations('ashtakavarga')
  const { lang, hi } = useLang()
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
      lang,
    })
  }, [ashtakavarga, ascRashi, grahas, transitGrahas, dashaLord, janmaNakshatraIndex, lang])

  if (!guide) {
    return (
      <div className="card" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        {t('bav.needGrahas')}
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
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSub(tab.id)}
            className={`${styles.subTabBtn} ${sub === tab.id ? styles.subTabBtnActive : ''}`}
          >
            {tab.icon}
            {t(`bav.sub.${tab.id}`)}
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
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)' }}>{t('bav.findings')}</div>
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
                {t('bav.fatherTitle')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.4rem', marginBottom: '0.55rem' }}>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.45rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('bav.tenth')}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--blue, #60a5fa)' }}>{guide.fatherTiming.lagnaTenthBindus}</div>
                </div>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.45rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('bav.ninth')}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--blue, #60a5fa)' }}>{guide.fatherTiming.sunNinthBindus}</div>
                </div>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.45rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('bav.sumStar')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                    {guide.fatherTiming.adjusted} · {guide.fatherTiming.targetNakshatraName}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {guide.fatherTiming.note}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                {t('bav.trines')}{' '}
                {guide.fatherTiming.trineRashis.map((r) => signName(r, hi)).join(', ')}
              </div>
            </div>
          ) : null}

          {guide.maternalRelatives ? (
            <div className="card" style={{ padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
                <Users size={14} style={{ color: 'var(--text-gold)' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)' }}>
                  {t('bav.maternal')}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginBottom: '0.45rem' }}>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('bav.mama')}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{guide.maternalRelatives.mamaPoints}</div>
                </div>
                <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t('bav.mausi')}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{guide.maternalRelatives.mausiPoints}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {t('bav.fourth', { sign: signName(guide.maternalRelatives.rashi, hi) })}{' '}
                {guide.maternalRelatives.note}
              </div>
            </div>
          ) : null}

          <div className="card" style={{ padding: '0.85rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--text-gold)' }}>{t('bav.remember')}</b> {t('bav.rememberBody')}
          </div>
        </div>
      ) : null}

      {sub === 'transit' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {t('bav.transitHint')}
          </div>
          {guide.transitWatch.length === 0 ? (
            <div className="card" style={{ padding: '0.85rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              {t('bav.transitMissing')}
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
                      {hi ? (GRAHA_HI[row.planet] ?? row.planet) : (GRAHA_NAMES[row.planet] ?? row.planet)}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: strengthColor(row.strength) }}>
                      {row.natalBav}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {t('insights.house', { n: row.transitHouse })} · {signName(row.transitRashi, hi)} · {row.strength}
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
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-gold)', marginBottom: '0.45rem' }}>{t('bav.kakshya')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.45rem' }}>
                {kakshyaRows.map((row) => (
                  <div key={`k-${row.planet}`} style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', padding: '0.5rem', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {kakshyaNote(row, lang)}
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


