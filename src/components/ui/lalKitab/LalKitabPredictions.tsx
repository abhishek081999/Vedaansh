'use client'
// Lal Kitab predictions: by life area, then planet by planet with the
// side of the reading that applies and why. One area is free.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkGrahaName, type LalKitabReading, type LkAreaReading, type LkPhalReading } from '@/lib/engine/lalKitab'
import { LalKitabGate } from './LalKitabGate'
import styles from './LalKitab.module.css'

const SIDE_EFFECT = { good: 'good', hard: 'bad', mixed: 'mixed' } as const

function AreaCard({ a }: { a: LkAreaReading }) {
  const t = useTranslations('lalKitab.predictions')
  const { lang } = useLang()
  return (
    <article className={`${styles.mini} ${styles[`tone_${a.tone}`] ?? ''}`} aria-labelledby={`lk-area-${a.area}`}>
      <h3 id={`lk-area-${a.area}`} className={styles.miniTitle}>
        {t(`areas.${a.area}`)}
        <span className={styles.toneTag}>{t(`tone.${a.voices.length ? a.tone : 'quiet'}`)}</span>
      </h3>
      {a.voices.length === 0 ? <p className={styles.miniText}>{t('quietText')}</p> : (
        <ul className={styles.voices}>
          {a.voices.map((v) => (
            <li key={v.planet}>
              <span className={styles.voiceHead}>
                {lkGrahaName(v.planet, lang)} · {t(`role.${v.role}`)} · <span className={styles[`side_${v.side}`]}>{t(`side.${v.side}`)}</span>
              </span>
              <span className={styles.miniText}>{v.text}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

function PlanetReading({ r }: { r: LkPhalReading }) {
  const t = useTranslations('lalKitab.predictions')
  const tp = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const main = r.side === 'hard' ? r.hard : r.good
  const other = r.side === 'hard' ? r.good : r.hard
  return (
    <li className={`${styles.finding} ${styles[`effect_${SIDE_EFFECT[r.side]}`] ?? ''}`}>
      <details>
        <summary className={styles.findingHead}>
          <span className={styles.effectTag}>{t(`side.${r.side}`)}</span>
          <span className={styles.findingLabel}>{t('planetInHouse', { planet: lkGrahaName(r.planet, lang), house: r.house })}</span>
        </summary>
        <p className={styles.findingText}>{main}</p>
        {r.side === 'mixed' && <p className={styles.findingText}>{r.hard}</p>}
        <p className={styles.whyTitle}>{tp('why')}</p>
        <ul className={styles.why}>
          {r.reasons.map((x) => <li key={x}>{t(`reason.${x}`)}</li>)}
          {r.asleep && <li>{t('asleep')}</li>}
          <li>{t('maturity', { age: r.maturityAge })}</li>
        </ul>
        {r.side !== 'mixed' && (
          <>
            <p className={styles.whyTitle}>{t(r.side === 'hard' ? 'otherGood' : 'otherHard')}</p>
            <p className={`${styles.findingText} ${styles.rowText}`}>{other}</p>
          </>
        )}
      </details>
    </li>
  )
}

export function LalKitabPredictions({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.predictions')
  const [first, ...rest] = reading.areas
  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="lk-areas-title">
        <h2 id="lk-areas-title" className={styles.cardTitle}>{t('areasTitle')}</h2>
        <p className={styles.note}>{t('areasLede')}</p>
        <div className={styles.cards}>
          <AreaCard a={first} />
        </div>
        <LalKitabGate
          userPlan={userPlan}
          full={<div className={styles.cards}>{rest.map((a) => <AreaCard key={a.area} a={a} />)}</div>}
          teaser={<div className={styles.cards}>{rest.slice(0, 2).map((a) => <AreaCard key={a.area} a={{ ...a, voices: a.voices.slice(0, 1) }} />)}</div>}
        />
      </section>

      <section className={styles.card} aria-labelledby="lk-phal-title">
        <h2 id="lk-phal-title" className={styles.cardTitle}>{t('phalTitle')}</h2>
        <p className={styles.note}>{t('phalLede')}</p>
        <LalKitabGate
          userPlan={userPlan}
          full={<ul className={styles.findings}>{reading.phal.map((r) => <PlanetReading key={r.planet} r={r} />)}</ul>}
          teaser={<ul className={styles.findings}>{reading.phal.slice(0, 2).map((r) => <PlanetReading key={r.planet} r={r} />)}</ul>}
        />
        <p className={styles.note}>{t('source')}</p>
      </section>
    </div>
  )
}
