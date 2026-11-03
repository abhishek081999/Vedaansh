'use client'

import React from 'react'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { analyzeTransitMoment, type PositionVerdict } from '@/lib/engine/transitMomentAnalysis'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import styles from './transit-scrubber.module.css'
import { buildPointGroups, type PointPos } from './transitPoints'

const VERDICT_LABEL: Record<PositionVerdict, string> = {
  good: 'Good',
  mixed: 'Mixed',
  caution: 'Caution',
}

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

function fmtPlanetLine(g: PointPos, ascRashi: Rashi): string {
  const h = grahaHouse(g.rashi, ascRashi)
  return `${RASHI_SHORT[g.rashi]} ${fmtDeg(g.degree)} · ${g.nakshatraName?.split(' ')[0] ?? '—'} P${g.pada} · H${h}`
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
  const planetAnalysis = React.useMemo(() => {
    if (!transitChart) return null
    return analyzeTransitMoment(natalChart, transitChart)
  }, [natalChart, transitChart])

  const pointGroups = React.useMemo(
    () => buildPointGroups(natalChart, transitChart),
    [natalChart, transitChart],
  )

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
    ? vimshottariAtMoment.map(n => GRAHA_NAMES[n.lord as GrahaId] ?? n.lord).join(' / ')
    : '—'

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className={styles.detailsGrid}>
        {/* Natal */}
        <div className={`${styles.detailsCard} ${styles.detailsCardNatal}`}>
          <h3 className={`${styles.detailsCardTitle} ${styles.detailsCardTitleNatal}`}>Natal chart</h3>
          <DetailRow label="Name" value={natalChart.meta.name} />
          <DetailRow label="Birth date" value={natalChart.meta.birthDate} />
          <DetailRow label="Birth time" value={natalChart.meta.birthTime.slice(0, 8)} />
          <DetailRow label="Place" value={natalChart.meta.birthPlace} />
          <DetailRow
            label="Lagna"
            value={`${RASHI_NAMES[natalAsc]} ${fmtDeg(natalChart.lagnas.ascDegreeInRashi)}`}
          />
          {natalMoon && (
            <DetailRow
              label="Moon"
              value={`${RASHI_NAMES[natalMoon.rashi]} · ${natalMoon.nakshatraName} P${natalMoon.pada}`}
            />
          )}
          {natalSun && (
            <DetailRow label="Sun" value={`${RASHI_NAMES[natalSun.rashi]} ${fmtDeg(natalSun.degree)}`} />
          )}
          <DetailRow label="Vimshottari" value={vimshottariLabel} />
        </div>

        {/* Transit */}
        <div className={`${styles.detailsCard} ${styles.detailsCardTransit}`}>
          <h3 className={`${styles.detailsCardTitle} ${styles.detailsCardTitleTransit}`}>Transit moment</h3>
          <DetailRow label="Date" value={formatDisplayDate(targetDate)} />
          <DetailRow label="Time" value={`${formatDisplayTime(targetTime)} (${timeForInput(targetTime)})`} />
          <DetailRow label="Timezone" value={timezone} />
          {transitChart && transitAsc ? (
            <>
              <DetailRow
                label="Transit lagna"
                value={`${RASHI_NAMES[transitAsc]} ${fmtDeg(transitChart.lagnas.ascDegreeInRashi)}`}
              />
              {transitMoon && (
                <DetailRow
                  label="Transit Moon"
                  value={`${RASHI_NAMES[transitMoon.rashi]} · ${transitMoon.nakshatraName} P${transitMoon.pada}`}
                />
              )}
              {transitSun && (
                <DetailRow label="Transit Sun" value={`${RASHI_NAMES[transitSun.rashi]} ${fmtDeg(transitSun.degree)}`} />
              )}
            </>
          ) : (
            <DetailRow label="Status" value="Calculating…" />
          )}
        </div>
      </div>

      {/* Planet comparison */}
      <div className={styles.compareSection}>
        <h3 className={styles.compareTitle}>Natal vs transit — planets, lagnas &amp; upagrahas</h3>
        <div className={styles.compareScroll}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th>Planet</th>
                <th>Natal</th>
                <th>Transit</th>
                <th>Transit H</th>
                <th>Position</th>
                <th>Shift</th>
              </tr>
            </thead>
            <tbody>
              {pointGroups.map(group => (
                <React.Fragment key={group.title}>
                  <tr>
                    <th colSpan={6} scope="colgroup" className={styles.compareGroupRow}>{group.title}</th>
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
                        <td>{transitH != null ? `H${transitH}` : '—'}</td>
                        <td>
                          {pa ? (
                            <span className={`${styles.verdictBadge} ${VERDICT_CLASS[pa.transitVerdict]}`}>
                              {VERDICT_LABEL[pa.transitVerdict]}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {transitH != null ? (
                            <span className={`${styles.houseShift} ${shifted ? styles.houseShiftMoved : styles.houseShiftSame}`}>
                              {shifted ? `H${natalH} → H${transitH}` : 'Same house'}
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
          Houses are counted from your <strong>natal lagna</strong>. Transit house shows where each transiting planet, lagna and upagraha falls in your birth chart at the selected moment. Time-sensitive points (lagnas, Gulika/Maandi) are cast for the birthplace.
        </p>
      </div>
    </section>
  )
}
