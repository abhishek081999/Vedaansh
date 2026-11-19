'use client'
// Remedy finder: pick an everyday problem and get the remedies for the
// planets behind it in this chart. Gold; Free sees the problem list.

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { LK_PROBLEMS, lkFindRemedies, lkGrahaName, type LalKitabReading, type LkProblemId } from '@/lib/engine/lalKitab'
import { LalKitabGate } from './LalKitabGate'
import { LalKitabUpayItem } from './LalKitabUpayItem'
import styles from './LalKitab.module.css'

const PROBLEMS = Object.keys(LK_PROBLEMS) as LkProblemId[]

export function LalKitabFinder({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.finder')
  const { lang } = useLang()
  const [problem, setProblem] = useState<LkProblemId>('marriageDelay')
  const result = useMemo(() => lkFindRemedies(problem, reading.remedies, reading.areas), [problem, reading])

  const body = result.supported ? <p className={styles.miniText}>{t('supported')}</p> : (
    <>
      <p className={styles.voiceHead}>{t('behind', { list: result.planets.map((p) => lkGrahaName(p, lang)).join(', ') })}</p>
      <ol className={styles.checklist}>
        {result.remedies.map((c) => <li key={c.upay.id}><LalKitabUpayItem choice={c} /></li>)}
      </ol>
    </>
  )

  return (
    <section className={styles.card} aria-labelledby="lk-finder-title">
      <h2 id="lk-finder-title" className={styles.cardTitle}>{t('title')}</h2>
      <p className={styles.note}>{t('lede')}</p>
      <div className={styles.chips} role="radiogroup" aria-label={t('pick')}>
        {PROBLEMS.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={problem === p}
            className={problem === p ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setProblem(p)}
          >
            {t(`problems.${p}`)}
          </button>
        ))}
      </div>
      <div className={styles.mini} aria-live="polite">
        <h3 className={styles.miniTitle}>{t(`problems.${problem}`)}</h3>
        <LalKitabGate userPlan={userPlan} full={body} teaser={<p className={styles.miniText}>{t('teaser')}</p>} />
      </div>
      <p className={styles.note}>{t('safety')}</p>
    </section>
  )
}
