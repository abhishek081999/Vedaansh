'use client'
// Sticky Teva wheel shown on every Lal Kitab view.

import React, { useMemo } from 'react'
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
  basis,
  onBasisChange,
  tevaOverride,
  compact = false,
}: {
  chart: ChartOutput
  reading: LalKitabReading
  basis: LkChartBasis
  onBasisChange: (basis: LkChartBasis) => void
  /** Optional Teva (e.g. a correction candidate) instead of the natal Lagna Teva. */
  tevaOverride?: LkTeva
  compact?: boolean
}) {
  const t = useTranslations('lalKitab.panel')
  const teva = tevaOverride ?? (basis === 'lagna' ? reading.teva : reading.chandra)
  const grahas = useMemo(() => tevaGrahas(chart, teva), [chart, teva])
  const locked = Boolean(tevaOverride)
  // compact = phone: the rail spans the screen, so the wheel can be larger.
  const size = compact ? 280 : 248

  return (
    <aside className={styles.chartRail} aria-label={t('chartTitle')}>
      <section className={styles.chartCard}>
        <div className={styles.chartHead}>
          <span className={styles.chartLabel}>{t('chartTitle')}</span>
          {!locked && (
            <div className={styles.segment} role="radiogroup" aria-label={t('basisLabel')}>
              {(['lagna', 'chandra'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={basis === b}
                  className={basis === b ? `${styles.segBtn} ${styles.segActive}` : styles.segBtn}
                  onClick={() => onBasisChange(b)}
                >
                  {t(`basisShort.${b}`)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.chartBox}>
          <NorthIndianChakra ascRashi={1} grahas={grahas} size={size} showDegrees={false} />
        </div>
        <p className={styles.chartNote}>{t('chartNote')}</p>
      </section>
    </aside>
  )
}
