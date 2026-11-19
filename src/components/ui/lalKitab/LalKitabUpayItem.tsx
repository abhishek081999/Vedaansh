'use client'
// One remedy line: text, tags (how, how long, which day, cost) and a
// blocked note when the conflict check stops it.

import React from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { LK_PLANET_DAY, lkGrahaName, type LkRemedyChoice } from '@/lib/engine/lalKitab'
import styles from './LalKitab.module.css'

export function LalKitabUpayItem({ choice, showPlanet = true }: { choice: LkRemedyChoice; showPlanet?: boolean }) {
  const t = useTranslations('lalKitab.upay')
  const { lang } = useLang()
  const { upay, blocked } = choice
  return (
    <div className={blocked ? `${styles.upay} ${styles.upayBlocked}` : styles.upay}>
      <p className={styles.miniText}>
        {showPlanet && <strong>{lkGrahaName(choice.planet, lang)}: </strong>}
        {upay.text}
      </p>
      <span className={styles.badges}>
        <span className={styles.badge}>{t(`kind.${upay.kind}`)}</span>
        <span className={styles.badge}>{upay.days === 1 ? t('once') : t('days', { n: upay.days })}</span>
        {upay.days > 1 && <span className={styles.badge}>{t(`weekday.${LK_PLANET_DAY[upay.planet]}`)}</span>}
        <span className={styles.badge}>{t(`cost.${upay.cost}`)}</span>
      </span>
      {blocked && (
        <p className={styles.note}>
          {t(`blocked.${blocked.reason}`, { planet: lkGrahaName(choice.planet, lang), victim: blocked.victim ? lkGrahaName(blocked.victim, lang) : '' })}
        </p>
      )}
    </div>
  )
}
