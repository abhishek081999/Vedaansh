'use client'
// Lal Kitab rin (karmic debts). Free: which debts are active and the
// planets behind them. Gold: what the debt comes from, its signs, who
// takes part and the shared family remedy.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { LK_RIN, lkGrahaName, lkRinDetail, type LalKitabReading, type LkRinDef } from '@/lib/engine/lalKitab'
import { LalKitabGate, useGold } from './LalKitabGate'
import styles from './LalKitab.module.css'

function triggers(def: LkRinDef, reading: LalKitabReading) {
  return def.planets.filter((p) => def.houses.includes(reading.teva.house[p])).map((p) => ({ planet: p, house: reading.teva.house[p] }))
}

function RinDetail({ def, reading }: { def: LkRinDef; reading: LalKitabReading }) {
  const t = useTranslations('lalKitab.rin')
  const { lang } = useLang()
  const d = lkRinDetail(def.id, lang)
  const finding = reading.findings.find((f) => f.id === `rin.${def.id}`)
  return (
    <div className={styles.rinBody}>
      {finding && <p className={styles.miniText}>{finding.text}</p>}
      <dl className={styles.facts}>
        <dt>{t('origin')}</dt><dd>{d.origin}</dd>
        <dt>{t('who')}</dt><dd>{d.who}</dd>
        <dt>{t('remedy')}</dt><dd>{d.remedy}</dd>
      </dl>
      <p className={styles.whyTitle}>{t('signs')}</p>
      <ul className={styles.why}>{d.signs.map((s) => <li key={s}>{s}</li>)}</ul>
    </div>
  )
}

export function LalKitabRin({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.rin')
  const { lang } = useLang()
  const gold = useGold(userPlan)
  const label = (id: string) => reading.findings.find((f) => f.id === `rin.${id}`)?.label ?? ''
  const active = LK_RIN.filter((def) => reading.findings.some((f) => f.id === `rin.${def.id}`))
  const inactive = LK_RIN.filter((def) => !active.includes(def))

  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="lk-rin-title">
        <h2 id="lk-rin-title" className={styles.cardTitle}>{t('title')}</h2>
        <p className={styles.note}>{t('lede')}</p>
        {active.length === 0 ? <p className={styles.empty}>{t('none')}</p> : (
          <div className={styles.cards}>
            {active.map((def) => (
              <article key={def.id} className={styles.mini} aria-labelledby={`lk-rin-${def.id}`}>
                <h3 id={`lk-rin-${def.id}`} className={styles.miniTitle}>{label(def.id)}</h3>
                <p className={styles.voiceHead}>
                  {t('because', { list: triggers(def, reading).map((x) => t('planetInHouse', { planet: lkGrahaName(x.planet, lang), house: x.house })).join(', ') })}
                </p>
                {gold && <RinDetail def={def} reading={reading} />}
              </article>
            ))}
          </div>
        )}
        {!gold && active.length > 0 && (
          <LalKitabGate userPlan={userPlan} full={null} teaser={<div className={styles.mini}><p className={styles.miniText}>{t('teaser')}</p><RinDetail def={active[0]} reading={reading} /></div>} />
        )}
        <p className={styles.note}>{t('howTitle')}: {t('how')}</p>
      </section>
      {inactive.length > 0 && (
        <section className={styles.card} aria-labelledby="lk-rin-clear-title">
          <h2 id="lk-rin-clear-title" className={styles.cardTitle}>{t('clearTitle')}</h2>
          <ul className={styles.list}>
            {inactive.map((def) => (
              <li key={def.id} className={styles.listRow}>
                <span>{t(`names.${def.id}`)}</span>
                <span className={styles.note}>{t('trigger', { planets: def.planets.map((p) => lkGrahaName(p, lang)).join(', '), houses: def.houses.join(', ') })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
