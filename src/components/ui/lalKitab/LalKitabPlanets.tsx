'use client'
// Lal Kitab planets: one card per planet with its states, karakas, the
// findings about it and its aspects. Two cards are free; the rest Gold.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkGrahaName, type LalKitabReading, type LkPlanetView } from '@/lib/engine/lalKitab'
import { LalKitabFindings } from './LalKitabFindings'
import { LalKitabGate, useGold } from './LalKitabGate'
import { LalKitabStateBadges } from './LalKitabStateBadges'
import styles from './LalKitab.module.css'

const FREE_CARDS = 2

function PlanetCard({ p, reading }: { p: LkPlanetView; reading: LalKitabReading }) {
  const t = useTranslations('lalKitab.planets')
  const tp = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const name = (id: LkPlanetView['id']) => lkGrahaName(id, lang)
  const phal = reading.phal.find((r) => r.planet === p.id)
  const findings = reading.findings.filter((f) => f.planet === p.id && !f.id.startsWith('pair.') && !f.id.startsWith('masnui.'))
  return (
    <article className={styles.mini} aria-labelledby={`lk-p-${p.id}`}>
      <h3 id={`lk-p-${p.id}`} className={styles.miniTitle}>
        <span className={styles.houseNum}>{p.house}</span> {p.name}
      </h3>
      <LalKitabStateBadges planet={p} />
      <p className={styles.miniText}>{p.karaka.nature}</p>
      {phal && (
        <p className={styles.miniText}>
          <span className={styles[`side_${phal.side}`]}>{t(`side.${phal.side}`)}:</span>{' '}
          {phal.side === 'hard' ? phal.hard : phal.good}
        </p>
      )}
      <dl className={styles.facts}>
        <dt>{t('relatives')}</dt><dd>{p.karaka.relatives}</dd>
        <dt>{t('body')}</dt><dd>{p.karaka.body}</dd>
        <dt>{t('looksAt')}</dt>
        <dd>{p.aspectsGiven.length ? p.aspectsGiven.map((a) => `${name(a.to)} (${tp(`kind.${a.kind}`)})`).join(', ') : t('none')}</dd>
        <dt>{t('lookedBy')}</dt>
        <dd>{p.aspectsReceived.length ? p.aspectsReceived.map((a) => `${name(a.from)} (${tp(`relation.${a.relation}`)})`).join(', ') : t('none')}</dd>
        <dt>{t('takkarBy')}</dt>
        <dd>{p.takkarReceived.length ? p.takkarReceived.map((k) => name(k.from)).join(', ') : t('none')}</dd>
      </dl>
      <LalKitabFindings findings={findings} empty={t('noFindings')} />
    </article>
  )
}

export function LalKitabPlanets({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.planets')
  const gold = useGold(userPlan)
  const shown = gold ? reading.planets : reading.planets.slice(0, FREE_CARDS)
  return (
    <section className={styles.card} aria-labelledby="lk-planets-view-title">
      <h2 id="lk-planets-view-title" className={styles.cardTitle}>{t('title')}</h2>
      <p className={styles.note}>{t('lede')}</p>
      <div className={styles.cards}>
        {shown.map((p) => <PlanetCard key={p.id} p={p} reading={reading} />)}
      </div>
      {!gold && (
        <LalKitabGate
          userPlan={userPlan}
          full={null}
          teaser={<div className={styles.cards}><PlanetCard p={reading.planets[FREE_CARDS]} reading={reading} /></div>}
        />
      )}
    </section>
  )
}
