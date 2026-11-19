'use client'
// Lal Kitab overview: chart type, planet of destiny, sleeping houses and
// planets, and the strongest findings. The full list is Gold.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkGrahaName, type LalKitabReading } from '@/lib/engine/lalKitab'
import { LalKitabFindings } from './LalKitabFindings'
import { LalKitabGate } from './LalKitabGate'
import styles from './LalKitab.module.css'

const TOP = 5

export function LalKitabOverview({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.overview')
  const { lang } = useLang()
  const { states } = reading
  const name = (id: Parameters<typeof lkGrahaName>[0]) => lkGrahaName(id, lang)
  const list = (ids: readonly Parameters<typeof lkGrahaName>[0][]) => (ids.length ? ids.map(name).join(', ') : t('none'))
  const typeFindings = reading.findings.filter((f) => f.id.startsWith('teva.'))

  return (
    <div className={styles.stack}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('chartType')}</span>
          <span className={styles.statValue}>
            {states.chartTypes.length ? states.chartTypes.map((c) => t(`types.${c}`)).join(', ') : t('types.ordinary')}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('kismat')}</span>
          <span className={styles.statValue}>{states.kismat ? name(states.kismat.planet) : t('none')}</span>
          {states.kismat && <span className={styles.statHint}>{t(`kismatMethod.${states.kismat.method}`)}</span>}
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('sleepingPlanets')}</span>
          <span className={styles.statValue}>{list(states.sleepingPlanets)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('sleepingHouses')}</span>
          <span className={styles.statValue}>{states.sleepingHouses.length ? states.sleepingHouses.map((s) => s.house).join(', ') : t('none')}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('kayam')}</span>
          <span className={styles.statValue}>{list(states.kayam)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('dharmi')}</span>
          <span className={styles.statValue}>{list(states.dharmi)}</span>
        </div>
      </div>

      {typeFindings.length > 0 && (
        <section className={styles.card} aria-labelledby="lk-type-title">
          <h2 id="lk-type-title" className={styles.cardTitle}>{t('chartTypeTitle')}</h2>
          <LalKitabFindings findings={typeFindings} />
        </section>
      )}

      <section className={styles.card} aria-labelledby="lk-top-title">
        <h2 id="lk-top-title" className={styles.cardTitle}>{t('topTitle')}</h2>
        <p className={styles.note}>{t('topLede')}</p>
        <LalKitabFindings findings={reading.findings.slice(0, TOP)} />
      </section>

      <section className={styles.card} aria-labelledby="lk-all-title">
        <h2 id="lk-all-title" className={styles.cardTitle}>{t('allTitle', { count: reading.findings.length })}</h2>
        <LalKitabGate
          userPlan={userPlan}
          full={<LalKitabFindings findings={reading.findings.slice(TOP)} />}
          teaser={<LalKitabFindings findings={reading.findings.slice(TOP, TOP + 2)} />}
        />
      </section>
    </div>
  )
}
