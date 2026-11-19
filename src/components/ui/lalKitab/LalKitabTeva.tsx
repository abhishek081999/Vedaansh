'use client'
// Lal Kitab Teva view: planet table and state badges.
// The wheel lives in LalKitabChartRail on every tab.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { type LalKitabReading, type LkChartBasis } from '@/lib/engine/lalKitab'
import { LalKitabStateBadges } from './LalKitabStateBadges'
import styles from './LalKitab.module.css'

export function LalKitabTeva({
  reading,
  basis,
}: {
  chart: ChartOutput
  reading: LalKitabReading
  basis: LkChartBasis
}) {
  const t = useTranslations('lalKitab.panel')
  const teva = basis === 'lagna' ? reading.teva : reading.chandra

  return (
    <section className={styles.card} aria-labelledby="lk-planets-title">
      <div className={styles.cardHead}>
        <h2 id="lk-planets-title" className={styles.cardTitle}>{t('planetsTitle')}</h2>
      </div>
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
  )
}
