'use client'
// Lal Kitab remedies: the few that matter most (printable checklist),
// remedies and prohibitions planet by planet, waking remedies for
// sleeping houses, and the rules every remedy follows. Free: the first
// remedy and the rules. Gold: everything.

import React from 'react'
import { useTranslations } from 'next-intl'
import { Printer } from 'lucide-react'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { LK_UPAY_RULES, lkGrahaName, type LalKitabReading, type LkPlanetRemedies } from '@/lib/engine/lalKitab'
import { LalKitabGate, useGold } from './LalKitabGate'
import { LalKitabUpayItem } from './LalKitabUpayItem'
import { useStoredIds } from './useStoredIds'
import styles from './LalKitab.module.css'

function PlanetBlock({ p }: { p: LkPlanetRemedies }) {
  const t = useTranslations('lalKitab.upay')
  const tp = useTranslations('lalKitab.predictions')
  const { lang } = useLang()
  const allowed = p.remedies.filter((c) => !c.blocked)
  const blocked = p.remedies.filter((c) => c.blocked)
  return (
    <article className={styles.mini} aria-labelledby={`lk-up-${p.planet}`}>
      <h3 id={`lk-up-${p.planet}`} className={styles.miniTitle}>
        <span className={styles.houseNum}>{p.house}</span> {lkGrahaName(p.planet, lang)}
        <span className={`${styles.toneTag} ${styles[`side_${p.side}`] ?? ''}`}>{tp(`side.${p.side}`)}</span>
      </h3>
      {p.doshas.length > 0 && <p className={styles.voiceHead}>{t('forDosha')}</p>}
      <p className={styles.whyTitle}>{t('doThis')}</p>
      {allowed.map((c, i) => (
        <div key={c.upay.id}>
          {i === 1 && <p className={styles.whyTitle}>{t('alternatives')}</p>}
          <LalKitabUpayItem choice={c} showPlanet={false} />
        </div>
      ))}
      {blocked.length > 0 && <p className={styles.whyTitle}>{t('blockedTitle')}</p>}
      {blocked.map((c) => <LalKitabUpayItem key={c.upay.id} choice={c} showPlanet={false} />)}
      {p.parhez.length > 0 && (
        <>
          <p className={styles.whyTitle}>{t('parhez')}</p>
          <ul className={styles.why}>{p.parhez.map((x) => <li key={x.id}>{x.text}</li>)}</ul>
        </>
      )}
    </article>
  )
}

export function LalKitabRemedies({ reading, userPlan, chartKey }: { reading: LalKitabReading; userPlan: UserPlan; chartKey: string }) {
  const t = useTranslations('lalKitab.upay')
  const done = useStoredIds('upayDone', chartKey)
  const { lang } = useLang()
  const gold = useGold(userPlan)
  const plan = reading.remedies
  const top = gold ? plan.top : plan.top.slice(0, 1)

  return (
    <div className={styles.stack}>
      <section className={`${styles.card} ${styles.printArea}`} aria-labelledby="lk-top-upay-title">
        <div className={styles.cardHead}>
          <h2 id="lk-top-upay-title" className={styles.cardTitle}>{t('topTitle')}</h2>
          {gold && plan.top.length > 0 && (
            <button type="button" className={`${styles.segBtn} ${styles.noPrint}`} onClick={() => window.print()}>
              <Printer size={14} aria-hidden /> {t('print')}
            </button>
          )}
        </div>
        <p className={styles.note}>{t('topLede')}</p>
        {plan.top.length === 0 ? <p className={styles.empty}>{t('noneNeeded')}</p> : (
          <ol className={styles.checklist}>
            {top.map((c) => (
              <li key={c.upay.id}>
                <label className={styles.check}>
                  <input type="checkbox" aria-label={t('markDone')} checked={done.ids.includes(c.upay.id)} onChange={() => done.toggle(c.upay.id)} />
                  <LalKitabUpayItem choice={c} />
                </label>
              </li>
            ))}
          </ol>
        )}
        {!gold && plan.top.length > 1 && (
          <LalKitabGate userPlan={userPlan} full={null} teaser={<LalKitabUpayItem choice={plan.top[1]} />} />
        )}
        {plan.notNeeded.length > 0 && (
          <p className={styles.note}>{t('notNeeded', { list: plan.notNeeded.map((p) => lkGrahaName(p, lang)).join(', ') })}</p>
        )}
      </section>

      <section className={styles.card} aria-labelledby="lk-upay-rules-title">
        <h2 id="lk-upay-rules-title" className={styles.cardTitle}>{t('rulesTitle')}</h2>
        <ul className={styles.why}>{LK_UPAY_RULES.map((r) => <li key={r}>{t(`rules.${r}`)}</li>)}</ul>
        <p className={styles.note}>{t('safety')}</p>
      </section>

      {plan.planets.length > 0 && (
        <section className={styles.card} aria-labelledby="lk-upay-planets-title">
          <h2 id="lk-upay-planets-title" className={styles.cardTitle}>{t('byPlanetTitle')}</h2>
          <p className={styles.note}>{t('byPlanetLede')}</p>
          <LalKitabGate
            userPlan={userPlan}
            full={<div className={styles.cards}>{plan.planets.map((p) => <PlanetBlock key={p.planet} p={p} />)}</div>}
            teaser={<div className={styles.cards}><PlanetBlock p={{ ...plan.planets[0], remedies: plan.planets[0].remedies.slice(0, 1), parhez: [] }} /></div>}
          />
        </section>
      )}

      {plan.waking.length > 0 && (
        <section className={styles.card} aria-labelledby="lk-upay-wake-title">
          <h2 id="lk-upay-wake-title" className={styles.cardTitle}>{t('wakeTitle')}</h2>
          <p className={styles.note}>{t('wakeLede')}</p>
          <LalKitabGate
            userPlan={userPlan}
            full={(
              <ul className={styles.list}>
                {plan.waking.map((w) => (
                  <li key={w.house} className={styles.listRow}>
                    <span>{t('wakeRow', { house: w.house, planet: lkGrahaName(w.waker, lang) })}</span>
                    {w.remedy ? <LalKitabUpayItem choice={w.remedy} showPlanet={false} /> : <span className={styles.note}>{t('wakeSkip')}</span>}
                  </li>
                ))}
              </ul>
            )}
            teaser={<p className={styles.miniText}>{t('wakeRow', { house: plan.waking[0].house, planet: lkGrahaName(plan.waking[0].waker, lang) })}</p>}
          />
        </section>
      )}

      <p className={styles.note}>{t('rinNote')}</p>
    </div>
  )
}
