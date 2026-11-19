'use client'
// Sticky Teva wheel shown on every Lal Kitab view.

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { NorthIndianChakra } from '@/components/chakra/NorthIndianChakra'
import { isLkGraha, type LalKitabReading, type LkChartBasis, type LkTeva } from '@/lib/engine/lalKitab'
import styles from './LalKitab.module.css'

function tevaGrahas(chart: ChartOutput, teva: LkTeva): GrahaData[] {
  return chart.grahas
    .filter((g) => isLkGraha(g.id))
    .map((g) => ({ ...g, rashi: teva.house[g.id as keyof LkTeva['house']] as Rashi }))
}

export function LalKitabChartRail({
  chart,
  reading,
  tevaOverride,
  size = 280,
}: {
  chart: ChartOutput
  reading: LalKitabReading
  /** Optional Teva (e.g. a correction candidate) instead of the natal Lagna Teva. */
  tevaOverride?: LkTeva
  size?: number
}) {
  const t = useTranslations('lalKitab.panel')
  const [basis, setBasis] = useState<LkChartBasis>('lagna')
  const teva = tevaOverride ?? (basis === 'lagna' ? reading.teva : reading.chandra)
  const grahas = useMemo(() => tevaGrahas(chart, teva), [chart, teva])
  const locked = Boolean(tevaOverride)

  return (
    <aside className={styles.chartRail} aria-label={t('chartTitle')}>
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>{t('chartTitle')}</h2>
          {!locked && (
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
          )}
        </div>
        <div className={styles.chartBox}>
          <NorthIndianChakra ascRashi={1} grahas={grahas} size={size} showDegrees={false} />
        </div>
        <p className={styles.note}>{t('chartNote')}</p>
      </section>
    </aside>
  )
}
