'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyGridSection.tsx
//  Lo Shu / Vedic grid, planes (yogas), missing & repeated
//  numbers with remedies, Pythagorean arrows and Kua directions
// ─────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { NumerologyCoreReport, GridSource } from '@/lib/engine/numerology/calc'
import { getNumberProfile, type CoreNumber } from '@/lib/engine/numerology/data'
import { getPythagoreanArrows, type ArrowHit } from '@/lib/engine/numerology/arrows'
import type { EngineLang } from '@/lib/engine/lang'
import { KeyValue, SectionCard, gridColumns, useNumerologyLang } from './shared'

const PLANE_COLOR = { complete: 'var(--teal)', partial: 'var(--gold)', empty: 'var(--rose)' } as const

export function NumerologyGridSection({ report }: { report: NumerologyCoreReport }) {
  const t = useTranslations('numerology.grid')
  const tp = useTranslations('numerology.plane')
  const tg = useTranslations('numerology.group')
  const lang = useNumerologyLang()
  const [layout, setLayout] = useState<'vedic' | 'loshu'>('vedic')
  const { grid, kua } = report
  const cells = layout === 'vedic' ? grid.layout.vedic : grid.layout.loshu
  const arrows = useMemo(() => getPythagoreanArrows(report.date, lang), [report.date, lang])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(300)}>
        <SectionCard
          title={layout === 'vedic' ? t('vedic') : t('loshu')}
          subtitle={kua ? t('builtKua') : t('built')}
        >
          <div className="tab-bar" role="tablist" aria-label={t('layoutAria')}>
            {(['vedic', 'loshu'] as const).map(l => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={layout === l}
                className={`tab-btn${layout === l ? ' active' : ''}`}
                onClick={() => setLayout(l)}
              >
                {l === 'vedic' ? t('vedicTab') : t('loshuTab')}
              </button>
            ))}
          </div>

          <div
            role="grid"
            aria-label={t('gridAria')}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxWidth: 320, width: '100%', margin: '0 auto' }}
          >
            {cells.flat().map(n => <GridCell key={n} n={n} count={grid.counts[n]} sources={grid.sources[n]} lang={lang} />)}
          </div>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {layout === 'vedic' ? t('vedicNote') : t('loshuNote')}
          </p>
        </SectionCard>

        <SectionCard title={t('planesTitle')} subtitle={t('planesSub')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {grid.planes.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, marginTop: 2,
                  border: `1px solid ${PLANE_COLOR[p.status]}`, color: PLANE_COLOR[p.status],
                  textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 78, textAlign: 'center',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {tp(p.status)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({p.numbers.join('-')})</span>
                  </div>
                  {p.status !== 'partial' && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      {p.status === 'complete' ? p.complete : p.empty}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={gridColumns(300)}>
        <SectionCard title={t('missingTitle')} subtitle={t('missingSub')} accent="var(--rose)">
          {grid.missing.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--teal)' }}>{t('allPresent')}</p>
          ) : grid.missing.map(m => (
            <div key={m.number} style={{ display: 'flex', gap: '0.6rem' }}>
              <CellBadge n={m.number} />
              <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                <div style={{ color: 'var(--text-secondary)' }}>{m.effect}</div>
                <div style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-gold)' }}>{t('remedy')}</strong> {m.remedy}</div>
              </div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title={t('repeatTitle')} subtitle={t('repeatSub')}>
          {grid.repeated.map(r => (
            <div key={r.number} style={{ display: 'flex', gap: '0.6rem' }}>
              <CellBadge n={r.number} />
              <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{r.count}×</strong> {r.effect}
              </div>
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard title={t('arrowsTitle')} subtitle={t('arrowsSub')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start' }}>
          <div
            role="grid"
            aria-label={t('pythAria')}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: 4, flexShrink: 0 }}
          >
            {arrows.layout.flat().map(n => {
              const c = arrows.counts[n]
              return (
                <div key={n} role="gridcell" aria-label={c ? t('cellTimes', { n, count: c }) : t('cellMissing', { n })} style={{
                  height: 44, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: c ? 'var(--gold-faint)' : 'var(--surface-2)',
                  border: `1px solid ${c ? 'var(--border-bright)' : 'var(--border-soft)'}`,
                  fontSize: c > 2 ? '0.72rem' : '0.9rem', fontWeight: 600,
                  color: c ? 'var(--text-gold)' : 'var(--text-muted)', opacity: c ? 1 : 0.4,
                }}>
                  {c ? String(n).repeat(c) : n}
                </div>
              )
            })}
          </div>
          <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {arrows.strengths.map(a => <ArrowRow key={a.name} arrow={a} tone="strength" />)}
            {arrows.weaknesses.map(a => <ArrowRow key={a.name} arrow={a} tone="weakness" />)}
            {arrows.strengths.length + arrows.weaknesses.length === 0 && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('noArrows')}</p>
            )}
          </div>
        </div>
      </SectionCard>

      {kua ? (
        <SectionCard title={t('kuaTitle', { value: kua.value, group: tg(kua.group) })} subtitle={t('kuaSub', { year: kua.solarYear })}>
          <div style={gridColumns(150)}>
            <KeyValue label={t('success')} value={kua.directions.success} />
            <KeyValue label={t('health')} value={kua.directions.health} />
            <KeyValue label={t('love')} value={kua.directions.love} />
            <KeyValue label={t('growth')} value={kua.directions.growth} />
          </div>
        </SectionCard>
      ) : (
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          {t('kuaHint')}
        </p>
      )}
    </div>
  )
}

function GridCell({ n, count, sources, lang }: { n: CoreNumber; count: number; sources: GridSource[]; lang: EngineLang }) {
  const t = useTranslations('numerology.grid')
  const ts = useTranslations('numerology.source')
  const present = count > 0
  const planet = getNumberProfile(n, lang).planet
  const extra = sources.filter(s => s !== 'dob').map(s => ts(s))
  const title = present
    ? t('cellPresent', { n, count, planet, extra: extra.length ? t('includes', { list: extra.join(', ') }) : '' })
    : t('cellAbsent', { n, planet })
  return (
    <div
      role="gridcell"
      title={title}
      aria-label={title}
      style={{
        aspectRatio: '1', borderRadius: 'var(--r-md)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        background: present ? 'var(--gold-faint)' : 'var(--surface-2)',
        border: `1px solid ${present ? 'var(--border-bright)' : 'var(--border-soft)'}`,
      }}
    >
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 4vw, 1.5rem)', fontWeight: 600, letterSpacing: '0.08em',
        color: present ? 'var(--text-gold)' : 'var(--text-muted)', opacity: present ? 1 : 0.35,
      }}>
        {present ? String(n).repeat(count) : n}
      </span>
      <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {planet}
      </span>
    </div>
  )
}

function ArrowRow({ arrow, tone }: { arrow: ArrowHit; tone: 'strength' | 'weakness' }) {
  const t = useTranslations('numerology.arrow')
  const color = tone === 'strength' ? 'var(--teal)' : 'var(--rose)'
  return (
    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
      <span style={{
        fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, marginTop: 2,
        border: `1px solid ${color}`, color, textTransform: 'uppercase', letterSpacing: '0.05em',
        minWidth: 72, textAlign: 'center', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {t(tone)}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {arrow.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({arrow.numbers.join('-')})</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{arrow.meaning}</div>
      </div>
    </div>
  )
}

function CellBadge({ n }: { n: CoreNumber }) {
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 'var(--r-sm)', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)', border: '1px solid var(--border-soft)',
      fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-gold)',
    }}>
      {n}
    </span>
  )
}
