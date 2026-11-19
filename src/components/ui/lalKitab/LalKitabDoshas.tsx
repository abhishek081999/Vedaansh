'use client'
// Lal Kitab doshas. Free: which doshas are present. Gold: the reading
// and the reasons for each.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import type { LalKitabReading } from '@/lib/engine/lalKitab'
import { LalKitabFindings } from './LalKitabFindings'
import { LalKitabGate } from './LalKitabGate'
import styles from './LalKitab.module.css'

const SIDE_CLASS = { bad: 'side_hard', good: 'side_good', mixed: 'side_mixed', info: 'side_mixed' } as const

export function LalKitabDoshas({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.doshas')
  const tp = useTranslations('lalKitab.panel')
  const doshas = reading.findings.filter((f) => f.id.startsWith('dosha.'))
  return (
    <section className={styles.card} aria-labelledby="lk-doshas-title">
      <h2 id="lk-doshas-title" className={styles.cardTitle}>{t('title')}</h2>
      <p className={styles.note}>{t('lede')}</p>
      {doshas.length === 0 ? <p className={styles.empty}>{t('none')}</p> : (
        <>
          <ul className={styles.list}>
            {doshas.map((d) => (
              <li key={d.id} className={styles.listRow}>
                <span className={styles.findingLabel}>{d.label}</span>
                <span className={`${styles.badge} ${styles[SIDE_CLASS[d.effect]] ?? ''}`}>{tp(`effect.${d.effect}`)}</span>
              </li>
            ))}
          </ul>
          <LalKitabGate
            userPlan={userPlan}
            full={<LalKitabFindings findings={doshas} />}
            teaser={<LalKitabFindings findings={doshas.slice(0, 1)} />}
          />
        </>
      )}
      <p className={styles.note}>{t('remedyNext')}</p>
    </section>
  )
}
