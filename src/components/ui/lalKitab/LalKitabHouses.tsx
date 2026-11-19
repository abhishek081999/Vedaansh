'use client'
// Lal Kitab houses: occupants, sleeping or awake, the waking planet,
// aspects in and out, takkar and foundation. Gold.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkGrahaName, type LalKitabReading, type LkHouseView } from '@/lib/engine/lalKitab'
import { LalKitabGate } from './LalKitabGate'
import styles from './LalKitab.module.css'

function HouseCard({ h }: { h: LkHouseView }) {
  const t = useTranslations('lalKitab.houses')
  const tp = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const name = (id: LkHouseView['occupants'][number]) => lkGrahaName(id, lang)
  return (
    <article className={styles.mini} aria-labelledby={`lk-h-${h.house}`}>
      <h3 id={`lk-h-${h.house}`} className={styles.miniTitle}>
        <span className={styles.houseNum}>{h.house}</span> {h.meaning.title}
      </h3>
      <span className={styles.badges}>
        {h.sleeping
          ? <span className={styles.badge}>{t('sleeping')}</span>
          : <span className={`${styles.badge} ${styles.badge_uchcha}`}>{t('awake')}</span>}
        {h.empty && <span className={styles.badge}>{t('empty')}</span>}
      </span>
      <dl className={styles.facts}>
        <dt>{t('occupants')}</dt><dd>{h.occupants.length ? h.occupants.map(name).join(', ') : t('none')}</dd>
        <dt>{t('aspectedFrom')}</dt>
        <dd>{h.aspectedFrom.length ? h.aspectedFrom.map((a) => `${t('houseShort', { house: a.house })} (${tp(`kind.${a.kind}`)})`).join(', ') : t('none')}</dd>
        <dt>{t('takkarTo')}</dt><dd>{t('houseShort', { house: h.takkarTo })}</dd>
        <dt>{t('bunyad')}</dt><dd>{t('houseShort', { house: h.bunyad })}</dd>
        {h.sleeping && <><dt>{t('waker')}</dt><dd>{name(h.waker)}</dd></>}
      </dl>
      <p className={styles.miniText}>{h.meaning.meaning}</p>
    </article>
  )
}

export function LalKitabHouses({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.houses')
  return (
    <section className={styles.card} aria-labelledby="lk-houses-view-title">
      <h2 id="lk-houses-view-title" className={styles.cardTitle}>{t('title')}</h2>
      <p className={styles.note}>{t('lede')}</p>
      <LalKitabGate
        userPlan={userPlan}
        full={<div className={styles.cards}>{reading.houses.map((h) => <HouseCard key={h.house} h={h} />)}</div>}
        teaser={<div className={styles.cards}>{reading.houses.slice(0, 2).map((h) => <HouseCard key={h.house} h={h} />)}</div>}
      />
    </section>
  )
}
