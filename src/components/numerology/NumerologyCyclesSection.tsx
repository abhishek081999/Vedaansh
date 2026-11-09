'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/numerology/NumerologyCyclesSection.tsx
//  Personal year / month / day, 9-year forecast, lucky dates,
//  yearly .ics calendar export
// ─────────────────────────────────────────────────────────────

import React from 'react'
import { useTranslations } from 'next-intl'
import type { NumerologyCoreReport } from '@/lib/engine/numerology/calc'
import { getNumberProfile, personalYearTheme, type CoreNumber } from '@/lib/engine/numerology/data'
import { reduceToCore } from '@/lib/engine/numerology/core'
import { HarmonyPill, NumberOrb, SectionCard, gridColumns, useNumerologyLang } from './shared'
import { YearCalendarExport, type CalendarLocation } from './YearCalendarExport'
import { SegmentRing, TimelineBand, type BandSegment } from '@/components/ui/viz'

const LIFE_SPAN = 90

export function NumerologyCyclesSection({ report, canExport, location }: {
  report: NumerologyCoreReport
  canExport: boolean
  location: CalendarLocation | null
}) {
  const t = useTranslations('numerology.cycles')
  const lang = useNumerologyLang()
  const { cycles, upcomingYears, luckyDates, moolank, timeline, date } = report
  const birthDate = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const activePinnacle = timeline.pinnacles.find(x => x.active)
  const activePhase = timeline.lifePhases.find(x => x.active)
  const themeOf = (n: CoreNumber) => personalYearTheme(n, lang).theme
  const items = [
    { id: 'year', label: t('personalYear'), value: cycles.personalYear, detail: t('fromBirthday', { theme: cycles.yearTheme.theme, year: cycles.cycleYear }) },
    { id: 'month', label: t('personalMonth'), value: cycles.personalMonth, detail: themeOf(cycles.personalMonth) },
    { id: 'day', label: t('personalDay'), value: cycles.personalDay, detail: themeOf(cycles.personalDay) },
    { id: 'universal', label: t('universalDay'), value: cycles.universalDay, detail: t('ruled', { planet: getNumberProfile(cycles.universalDay, lang).planet }) },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={gridColumns(200)}>
        {items.map(i => (
          <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: 'var(--r-lg)', background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}>
            <NumberOrb value={i.value} size={50} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{i.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{i.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {(activePhase || activePinnacle) && (
        <SectionCard title={t('where')} subtitle={t('age', { age: timeline.ageNow })}>
          <TimelineBand
            segments={[
              ...timeline.lifePhases.map((ph): BandSegment => ({
                key: `ph-${ph.id}`,
                start: ph.ageFrom,
                end: ph.ageTo ?? LIFE_SPAN,
                lane: 0,
                color: ph.id === 'transition' ? 'var(--accent)' : 'var(--gold)',
                label: `${ph.label.split(' ')[0]} ${ph.ruling}`,
                emphasis: ph.active,
                title: `${ph.label} · ${ph.rulingLabel} · ${t('ages', { from: ph.ageFrom, to: ph.ageTo != null ? `–${ph.ageTo}` : '+' })}`,
              })),
              ...timeline.pinnacles.map((pn): BandSegment => ({
                key: `pn-${pn.index}`,
                start: pn.fromAge,
                end: pn.toAge ?? LIFE_SPAN,
                lane: 1,
                color: pn.index % 2 ? 'var(--teal)' : 'var(--accent)',
                label: `P${pn.index} · ${pn.value}`,
                emphasis: pn.active,
                title: t('pinnacleTitle', {
                  index: pn.index,
                  value: pn.value,
                  theme: pn.theme,
                  from: pn.fromAge,
                  to: pn.toAge ?? '+',
                }),
              })),
            ]}
            laneLabels={[t('phaseLane'), t('pinnacleLane')]}
            from={0}
            to={LIFE_SPAN}
            now={timeline.ageNow}
            ticks={9}
            laneHeight={22}
            tickFormat={v => `${Math.round(v)}`}
            ariaLabel={t('bandAria')}
          />
          <div style={gridColumns(260)}>
            {activePhase && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-gold)' }}>{activePhase.label}</strong> — {activePhase.rulingLabel}. {activePhase.description}
              </p>
            )}
            {activePinnacle && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-gold)' }}>{t('pinnacleNow', { index: activePinnacle.index, value: activePinnacle.value })}</strong> — {activePinnacle.theme}. {activePinnacle.guidance}
                {' '}{t('ages', { from: activePinnacle.fromAge, to: activePinnacle.toAge != null ? `–${activePinnacle.toAge}` : '+' })}.
              </p>
            )}
          </div>
        </SectionCard>
      )}

      <SectionCard title={t('yearTitle', { n: cycles.personalYear, theme: cycles.yearTheme.theme })} accent="var(--gold)">
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{cycles.yearTheme.guidance}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {t('universalLine', { day: cycles.universalDay, m: moolank.value })}
          </span>
          <HarmonyPill harmony={cycles.dayHarmony} />
        </div>
      </SectionCard>

      <SectionCard title={t('forecastTitle')} subtitle={t('forecastSub')}>
        <div style={{ maxWidth: 240, margin: '0 auto' }}>
          <SegmentRing
            segments={Array.from({ length: 9 }, (_, i) => ({
              label: String(i + 1),
              value: i + 1 <= cycles.personalYear ? 1 : 0,
              max: 1,
              color: i + 1 === cycles.personalYear ? 'var(--gold)' : 'var(--accent)',
              active: i + 1 === cycles.personalYear,
              title: t('ringTitle', { n: i + 1, theme: personalYearTheme((i + 1) as CoreNumber, lang).theme }),
            }))}
            size={190}
            thickness={20}
            centerValue={cycles.personalYear}
            centerLabel={t('center', { n: cycles.personalYear })}
            ariaLabel={t('ringAria', { n: cycles.personalYear })}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 420 }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                {[t('year'), t('ageCol'), t('pyCol'), t('theme'), t('harmony')].map(h => (
                  <th key={h} style={{ padding: '0.4rem 0.5rem', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-soft)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcomingYears.map(y => (
                <tr key={y.year} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>{y.year}</td>
                  <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-muted)' }}>{y.age}</td>
                  <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-gold)', fontWeight: 700 }}>{y.personalYear}</td>
                  <td style={{ padding: '0.45rem 0.5rem', color: 'var(--text-secondary)' }}>{y.theme}</td>
                  <td style={{ padding: '0.45rem 0.5rem' }}><HarmonyPill harmony={y.harmony} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title={t('luckyTitle')} subtitle={t('luckySub')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, maxWidth: 420 }}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
            const tone = luckyDates.best.includes(d) ? 'best' : luckyDates.good.includes(d) ? 'good' : luckyDates.avoid.includes(d) ? 'avoid' : 'neutral'
            const color = tone === 'best' ? 'var(--teal)' : tone === 'good' ? 'var(--gold)' : tone === 'avoid' ? 'var(--rose)' : 'var(--text-muted)'
            return (
              <div key={d} title={t(tone)} style={{
                padding: '0.4rem 0', textAlign: 'center', borderRadius: 'var(--r-sm)', fontSize: '0.8rem',
                fontWeight: tone === 'best' ? 700 : 500, color,
                background: tone === 'neutral' ? 'var(--surface-2)' : 'var(--surface-1)',
                border: `1px solid ${tone === 'neutral' ? 'var(--border-soft)' : color}`,
              }}>
                {d}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
          <span style={{ color: 'var(--teal)' }}>■ {t('best')}</span>
          <span style={{ color: 'var(--gold)' }}>■ {t('good')}</span>
          <span style={{ color: 'var(--text-muted)' }}>■ {t('neutral')}</span>
          <span style={{ color: 'var(--rose)' }}>■ {t('avoid')}</span>
        </div>
      </SectionCard>

      <SectionCard title={t('powerTitle')} subtitle={t('powerSub')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {timeline.powerDays.map(pd => {
            const power = reduceToCore(pd.day) === moolank.value
            return (
              <span
                key={`${pd.day}-${pd.reason}`}
                title={pd.reason}
                style={{
                  fontSize: '0.78rem', padding: '4px 10px', borderRadius: 'var(--r-sm)',
                  background: power ? 'var(--gold-faint)' : 'var(--surface-2)',
                  border: '1px solid var(--border-soft)', color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--text-gold)' }}>{pd.day}</strong>
                {' · '}{power ? t('power') : t('destiny')}
              </span>
            )
          })}
        </div>
      </SectionCard>

      <YearCalendarExport
        birthDate={birthDate}
        name={report.name?.words.map(w => w.word).join(' ') ?? ''}
        entitled={canExport}
        location={location}
      />
    </div>
  )
}
