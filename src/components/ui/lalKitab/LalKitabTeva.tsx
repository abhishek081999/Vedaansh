'use client'
// Lal Kitab Teva view: the chart (Lagna or Chandra) and the planet table.

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { NorthIndianChakra } from '@/components/chakra/NorthIndianChakra'
import { isLkGraha, type LalKitabReading, type LkChartBasis, type LkTeva } from '@/lib/engine/lalKitab'
import { LalKitabStateBadges } from './LalKitabStateBadges'
import styles from './LalKitab.module.css'

/** Grahas placed by Lal Kitab house, with house 1 drawn as Aries. */
function tevaGrahas(chart: ChartOutput, teva: LkTeva): GrahaData[] {
  return chart.grahas
    .filter((g) => isLkGraha(g.id))
    .map((g) => ({ ...g, rashi: teva.house[g.id as keyof LkTeva['house']] as Rashi }))
}

export function LalKitabTeva({ chart, reading }: { chart: ChartOutput; reading: LalKitabReading }) {
  const t = useTranslations('lalKitab.panel')
  const [basis, setBasis] = useState<LkChartBasis>('lagna')
  const teva = basis === 'lagna' ? reading.teva : reading.chandra
  const grahas = useMemo(() => tevaGrahas(chart, teva), [chart, teva])

  return (
    <div className={styles.grid2}>
      <section className={styles.card} aria-labelledby="lk-chart-title">
        <div className={styles.cardHead}>
          <h2 id="lk-chart-title" className={styles.cardTitle}>{t('chartTitle')}</h2>
          <div className={styles.segment} role="radiogroup" aria-label={t('basisLabel')}>
            {(['lagna', 'chandra'] as const).map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={basis === b}
                className={basis === b ? `${styles.segBtn} ${styles.segActive}` : styles.segBtn}
                onClick={() => setBasis(b)}
              >
                {t(`basis.${b}`)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.chartBox}>
          <NorthIndianChakra ascRashi={1} grahas={grahas} size={340} showDegrees={false} />
        </div>
        <p className={styles.note}>{t('chartNote')}</p>
      </section>

      <section className={styles.card} aria-labelledby="lk-planets-title">
        <h2 id="lk-planets-title" className={styles.cardTitle}>{t('planetsTitle')}</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('cols.planet')}</th>
                <th scope="col">{t('cols.house')}</th>
                <th scope="col">{t('cols.status')}</th>
              </tr>
            </thead>
            <tbody>
              {reading.planets.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className={styles.num}>{teva.house[p.id]}</td>
                  <td>{basis === 'lagna' ? <LalKitabStateBadges planet={p} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {basis === 'chandra' && <p className={styles.note}>{t('chandraNote')}</p>}
      </section>
    </div>
  )
}
