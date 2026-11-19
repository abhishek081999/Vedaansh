'use client'
// Badges for a planet's Lal Kitab states.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { LkPlanetView } from '@/lib/engine/lalKitab'
import styles from './LalKitab.module.css'

export function LalKitabStateBadges({ planet: p }: { planet: LkPlanetView }) {
  const t = useTranslations('lalKitab.panel')
  const nodes = p.id === 'Ra' || p.id === 'Ke'
  return (
    <span className={styles.badges}>
      {p.dignities.map((d) => (
        <span key={d} className={`${styles.badge} ${styles[`badge_${d}`] ?? ''}`}>{t(`badges.${d}`)}</span>
      ))}
      {p.kayam && <span className={`${styles.badge} ${styles.badge_uchcha}`}>{t('badges.kayam')}</span>}
      {p.dharmi && <span className={`${styles.badge} ${styles.badge_pakka}`}>{t('badges.dharmi')}</span>}
      {p.sleeping && <span className={styles.badge}>{t('badges.sleeping')}</span>}
      {p.retro && !nodes && <span className={styles.badge}>{t('badges.retro')}</span>}
    </span>
  )
}
