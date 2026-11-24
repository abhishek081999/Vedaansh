'use client'
// Teva correction: tick life signs (shared with Nishaniyan storage), score
// a ±2h Lagna window, and show placement hints. Gold+.

import React, { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, Rashi, UserPlan } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { RASHI_HI } from '@/i18n/jyotish'
import {
  LK_GRAHAS, lkGrahaName, lkNishaniyan, lkTevaCorrection,
  type LalKitabReading,
} from '@/lib/engine/lalKitab'
import { LalKitabGate } from './LalKitabGate'
import { useStoredIds } from './useStoredIds'
import styles from './LalKitab.module.css'

function rashiName(r: Rashi, lang: 'en' | 'hi'): string {
  return lang === 'hi' ? RASHI_HI[r] : RASHI_NAMES[r]
}

export function LalKitabCorrection({
  chart, reading, userPlan, chartKey,
}: {
  chart: ChartOutput
  reading: LalKitabReading
  userPlan: UserPlan
  chartKey: string
}) {
  const t = useTranslations('lalKitab.correction')
  const { lang } = useLang()
  const { ids: ticks, toggle, clear } = useStoredIds('signs', chartKey)
  const signs = useMemo(() => lkNishaniyan(lang), [lang])
  const result = useMemo(() => lkTevaCorrection(chart, ticks), [chart, ticks])

  const full = (
    <div className={styles.stack}>
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>{t('signsTitle')}</h3>
          {ticks.length > 0 && (
            <button type="button" className={styles.segBtn} onClick={clear}>{t('clear')}</button>
          )}
        </div>
        <p className={styles.note}>{t('signsLede')}</p>
        <div className={styles.cards}>
          {LK_GRAHAS.map((planet) => {
            const list = signs.filter((s) => s.planet === planet)
            return (
              <article key={planet} className={styles.mini}>
                <h4 className={styles.miniTitle}>{lkGrahaName(planet, lang)}</h4>
                <ul className={styles.list}>
                  {list.map((s) => (
                    <li key={s.id}>
                      <label className={styles.check}>
                        <input
                          type="checkbox"
                          checked={ticks.includes(s.id)}
                          onChange={() => toggle(s.id)}
                        />
                        <span>{s.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </section>

      {result.needsMoreSigns ? (
        <p className={styles.note}>{t('needMore')}</p>
      ) : (
        <>
          <section className={styles.card} aria-labelledby="lk-corr-result">
            <h3 id="lk-corr-result" className={styles.cardTitle}>{t('resultTitle')}</h3>
            <p className={styles.note}>{t('resultLede')}</p>
            {result.best && result.current && result.best.ascRashi !== result.current.ascRashi && (
              <p className={styles.note}>
                {t('suggest', {
                  best: rashiName(result.best.ascRashi, lang),
                  hours: result.best.offsetHours > 0
                    ? t('hoursLater', { h: Math.abs(result.best.offsetHours) })
                    : result.best.offsetHours < 0
                      ? t('hoursEarlier', { h: Math.abs(result.best.offsetHours) })
                      : t('hoursSame'),
                  current: rashiName(result.current.ascRashi, lang),
                })}
              </p>
            )}
            {result.best && result.current && result.best.ascRashi === result.current.ascRashi && (
              <p className={styles.note}>{t('currentBest')}</p>
            )}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">{t('colOffset')}</th>
                    <th scope="col">{t('colLagna')}</th>
                    <th scope="col">{t('colScore')}</th>
                    <th scope="col">{t('colMatched')}</th>
                    <th scope="col">{t('colMissed')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.candidates.map((c) => (
                    <tr key={`${c.ascRashi}-${c.offsetHours}`} className={c.isCurrent ? styles.rowCurrent : undefined}>
                      <td className={styles.num}>
                        {c.offsetHours === 0 ? t('hoursSame') : c.offsetHours > 0
                          ? t('hoursLater', { h: c.offsetHours })
                          : t('hoursEarlier', { h: Math.abs(c.offsetHours) })}
                        {c.isCurrent ? ` · ${t('current')}` : ''}
                        {result.best === c ? ` · ${t('best')}` : ''}
                      </td>
                      <td>{rashiName(c.ascRashi, lang)}</td>
                      <td className={styles.num}>{c.score.toFixed(1)}</td>
                      <td>{c.matched.length ? c.matched.map((p) => lkGrahaName(p, lang)).join(', ') : '—'}</td>
                      <td>{c.missed.length ? c.missed.map((p) => lkGrahaName(p, lang)).join(', ') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {result.placementHints.length > 0 && (
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>{t('hintsTitle')}</h3>
              <p className={styles.note}>{t('hintsLede')}</p>
              <ul className={styles.list}>
                {result.placementHints.map((h) => (
                  <li key={h.planet} className={styles.listRow}>
                    <span>
                      <strong>{lkGrahaName(h.planet, lang)}</strong>
                      {' · '}
                      {t('hintHouses', { houses: h.suspectHouses.join(', ') })}
                      {h.currentHouse != null && h.bestHouse != null && h.currentHouse !== h.bestHouse && (
                        <> · {t('hintMove', { from: h.currentHouse, to: h.bestHouse })}</>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className={styles.note}>{t('disclaimer')}</p>
      <p className={styles.note}>{t('natalNote', { lagna: rashiName(reading.teva.startRashi, lang) })}</p>
    </div>
  )

  return (
    <div className={styles.stack}>
      <header>
        <h2 className={styles.cardTitle}>{t('title')}</h2>
        <p className={styles.note}>{t('lede')}</p>
      </header>
      <LalKitabGate
        userPlan={userPlan}
        full={full}
        teaser={<p className={styles.note}>{t('teaser')}</p>}
      />
    </div>
  )
}
