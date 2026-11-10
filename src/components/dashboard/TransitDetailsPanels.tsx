'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { analyzeTransitMoment, type PositionVerdict } from '@/lib/engine/transitMomentAnalysis'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { useLang } from '@/i18n/useLang'
import { GRAHA_HI, RASHI_HI, termHi } from '@/i18n/jyotish'
import styles from './transit-scrubber.module.css'
import { buildPointGroups, type PointPos } from './transitPoints'

const VERDICT_CLASS: Record<PositionVerdict, string> = {
  good: styles.verdictGood,
  mixed: styles.verdictMixed,
  caution: styles.verdictCaution,
}

function grahaHouse(rashi: Rashi, ascRashi: Rashi): number {
  return ((rashi - ascRashi + 12) % 12) + 1
}

function fmtDeg(deg: number): string {
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  return `${d}°${String(m).padStart(2, '0')}'`
}

function fmtIsoDate(dateStr: string, tag: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr
  const d = new Date(`${dateStr.slice(0, 10)}T12:00:00Z`)
  if (!Number.isFinite(d.getTime())) return dateStr
  return new Intl.DateTimeFormat(tag, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(d)
}

function fmtIsoTime(t: string, tag: string): string {
  const match = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return t.slice(0, 8)
  const d = new Date(Date.UTC(2020, 0, 1, Number(match[1]), Number(match[2]), Number(match[3] ?? 0)))
  return new Intl.DateTimeFormat(tag, {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC',
  }).format(d)
}

interface DetailRowProps {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className={styles.detailsRow}>
      <span className={styles.detailsLabel}>{label}</span>
      <span className={styles.detailsValue}>{value}</span>
    </div>
  )
}

interface TransitDetailsPanelsProps {
  natalChart: ChartOutput
  transitChart: ChartOutput | null
  targetDate: string
  targetTime: string
  timezone: string
  asOf: Date
  formatDisplayDate: (d: string) => string
  formatDisplayTime: (t: string) => string
  timeForInput: (t: string) => string
}

export function TransitDetailsPanels({
  natalChart,
  transitChart,
  targetDate,
  targetTime,
  timezone,
  asOf,
  formatDisplayDate,
  formatDisplayTime,
  timeForInput,
}: TransitDetailsPanelsProps) {
  const t = useTranslations('transit.scrubber.details')
  const { lang, tag, hi } = useLang()
  const planetAnalysis = React.useMemo(() => {
    if (!transitChart) return null
    return analyzeTransitMoment(natalChart, transitChart, lang)
  }, [natalChart, transitChart, lang])

  const pointGroups = React.useMemo(
    () => buildPointGroups(natalChart, transitChart, lang),
    [natalChart, transitChart, lang],
  )

  const rashiName = (r: Rashi) => (hi ? RASHI_HI[r] : RASHI_NAMES[r])
  const nakName = (name: string) => (hi ? termHi(name) : name)
  const grahaName = (id: GrahaId) => (hi ? GRAHA_HI[id] : GRAHA_NAMES[id]) ?? id

  const fmtPlanetLine = (g: PointPos, ascRashi: Rashi): string => {
    const house = grahaHouse(g.rashi, ascRashi)
    const nak = hi ? (g.nakshatraName || '—') : (g.nakshatraName?.split(' ')[0] ?? '—')
    return t('pointLine', {
      rashi: hi ? RASHI_HI[g.rashi] : RASHI_SHORT[g.rashi],
      deg: fmtDeg(g.degree),
      nak,
      pada: g.pada,
      house,
    })
  }

  const natalMoon = natalChart.grahas.find(g => g.id === 'Mo')
  const natalSun = natalChart.grahas.find(g => g.id === 'Su')
  const transitMoon = transitChart?.grahas.find(g => g.id === 'Mo')
  const transitSun = transitChart?.grahas.find(g => g.id === 'Su')

  const natalAsc = natalChart.lagnas.ascRashi
  const transitAsc = transitChart?.lagnas.ascRashi
  const vimshottariAtMoment = React.useMemo(
    () => getDashaPathAt(natalChart.dashas.vimshottari ?? [], asOf.getTime()),
    [natalChart.dashas.vimshottari, asOf],
  )
  const vimshottariLabel = vimshottariAtMoment.length
    ? vimshottariAtMoment.map(n => grahaName(n.lord as GrahaId) ?? n.lord).join(' / ')
    : '—'

  const showDate = (d: string) => (hi ? fmtIsoDate(d, tag) : formatDisplayDate(d))
  const showTime = (time: string) => (hi ? fmtIsoTime(time, tag) : formatDisplayTime(time))

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className={styles.detailsGrid}>
        <div className={`${styles.detailsCard} ${styles.detailsCardNatal}`}>
          <h3 className={`${styles.detailsCardTitle} ${styles.detailsCardTitleNatal}`}>{t('natalTitle')}</h3>
          <DetailRow label={t('name')} value={natalChart.meta.name} />
          <DetailRow
            label={t('birthDate')}
            value={hi ? fmtIsoDate(natalChart.meta.birthDate, tag) : natalChart.meta.birthDate}
          />
          <DetailRow
            label={t('birthTime')}
            value={hi ? fmtIsoTime(natalChart.meta.birthTime, tag) : natalChart.meta.birthTime.slice(0, 8)}
          />
          <DetailRow label={t('place')} value={natalChart.meta.birthPlace} />
          <DetailRow
            label={t('lagna')}
            value={`${rashiName(natalAsc)} ${fmtDeg(natalChart.lagnas.ascDegreeInRashi)}`}
          />
          {natalMoon && (
            <DetailRow
              label={t('moon')}
              value={t('moonValue', {
                rashi: rashiName(natalMoon.rashi),
                nak: nakName(natalMoon.nakshatraName),
                pada: natalMoon.pada,
              })}
            />
          )}
          {natalSun && (
            <DetailRow label={t('sun')} value={`${rashiName(natalSun.rashi)} ${fmtDeg(natalSun.degree)}`} />
          )}
          <DetailRow label={t('vimshottari')} value={vimshottariLabel} />
        </div>

        <div className={`${styles.detailsCard} ${styles.detailsCardTransit}`}>
          <h3 className={`${styles.detailsCardTitle} ${styles.detailsCardTitleTransit}`}>{t('momentTitle')}</h3>
          <DetailRow label={t('date')} value={showDate(targetDate)} />
          <DetailRow
            label={t('time')}
            value={t('timeValue', { display: showTime(targetTime), clock: timeForInput(targetTime) })}
          />
          <DetailRow label={t('timezone')} value={timezone} />
          {transitChart && transitAsc ? (
            <>
              <DetailRow
                label={t('transitLagna')}
                value={`${rashiName(transitAsc)} ${fmtDeg(transitChart.lagnas.ascDegreeInRashi)}`}
              />
              {transitMoon && (
                <DetailRow
                  label={t('transitMoon')}
                  value={t('moonValue', {
                    rashi: rashiName(transitMoon.rashi),
                    nak: nakName(transitMoon.nakshatraName),
                    pada: transitMoon.pada,
                  })}
                />
              )}
              {transitSun && (
                <DetailRow
                  label={t('transitSun')}
                  value={`${rashiName(transitSun.rashi)} ${fmtDeg(transitSun.degree)}`}
                />
              )}
            </>
          ) : (
            <DetailRow label={t('status')} value={t('calculating')} />
          )}
        </div>
      </div>

      <div className={styles.compareSection}>
        <h3 className={styles.compareTitle}>{t('compareTitle')}</h3>
        <div className={styles.compareScroll}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th>{t('thPlanet')}</th>
                <th>{t('thNatal')}</th>
                <th>{t('thTransit')}</th>
                <th>{t('thTransitH')}</th>
                <th>{t('thPosition')}</th>
                <th>{t('thShift')}</th>
              </tr>
            </thead>
            <tbody>
              {pointGroups.map(group => (
                <React.Fragment key={group.kind}>
                  <tr>
                    <th colSpan={6} scope="colgroup" className={styles.compareGroupRow}>
                      {t(`groups.${group.kind}`)}
                    </th>
                  </tr>
                  {group.rows.map(row => {
                    const { natal, transit } = row
                    if (!natal) return null

                    const natalH = grahaHouse(natal.rashi, natalAsc)
                    const transitH = transit ? grahaHouse(transit.rashi, natalAsc) : null
                    const shifted = transitH != null && transitH !== natalH
                    const pa = row.grahaId
                      ? planetAnalysis?.planets.find(p => p.planetId === row.grahaId)
                      : undefined

                    return (
                      <tr key={row.key}>
                        <td className={styles.planetCell}>
                          {row.label}
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.25rem' }}>({row.code})</span>
                        </td>
                        <td className={styles.natalCol}>{fmtPlanetLine(natal, natalAsc)}</td>
                        <td className={styles.transitCol}>
                          {transit ? (
                            <>
                              {fmtPlanetLine(transit, natalAsc)}
                              {transit.isRetro && <span className={styles.retroMark}>℞</span>}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{transitH != null ? t('house', { n: transitH }) : '—'}</td>
                        <td>
                          {pa ? (
                            <span className={`${styles.verdictBadge} ${VERDICT_CLASS[pa.transitVerdict]}`}>
                              {t(`verdict.${pa.transitVerdict}`)}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {transitH != null ? (
                            <span className={`${styles.houseShift} ${shifted ? styles.houseShiftMoved : styles.houseShiftSame}`}>
                              {shifted ? t('shift', { from: natalH, to: transitH }) : t('sameHouse')}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: '0.85rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {t.rich('footnote', { b: (chunks) => <strong>{chunks}</strong> })}
        </p>
      </div>
    </section>
  )
}
