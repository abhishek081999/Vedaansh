'use client'
// Nishaniyan checker: tick the signs you see in life, and see which
// planets they confirm against the chart. Ticks stay in this browser.

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import { LK_GRAHAS, lkCheckNishaniyan, lkGrahaName, lkNishaniyan, type LalKitabReading } from '@/lib/engine/lalKitab'
import styles from './LalKitab.module.css'

const STORE_KEY = 'vedaansh.lalKitab.nishaniyan'

function loadTicks(): string[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveTicks(ticks: string[]) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(ticks))
  } catch {
    // Storage blocked: ticks just won't persist.
  }
}

export function LalKitabNishaniyan({ reading }: { reading: LalKitabReading }) {
  const t = useTranslations('lalKitab.nishaniyan')
  const { lang } = useLang()
  const [ticks, setTicks] = useState<string[]>([])
  useEffect(() => { setTicks(loadTicks()) }, [])
  const signs = useMemo(() => lkNishaniyan(lang), [lang])
  const checks = useMemo(() => lkCheckNishaniyan(ticks, reading.phal), [ticks, reading.phal])

  const toggle = (id: string) => {
    setTicks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      saveTicks(next)
      return next
    })
  }
  const clear = () => { setTicks([]); saveTicks([]) }

  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="lk-nish-result-title">
        <div className={styles.cardHead}>
          <h2 id="lk-nish-result-title" className={styles.cardTitle}>{t('resultTitle')}</h2>
          {ticks.length > 0 && <button type="button" className={styles.segBtn} onClick={clear}>{t('clear')}</button>}
        </div>
        <p className={styles.note}>{t('resultLede')}</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('planet')}</th>
                <th scope="col">{t('chart')}</th>
                <th scope="col">{t('signs')}</th>
                <th scope="col">{t('verdict')}</th>
              </tr>
            </thead>
            <tbody aria-live="polite">
              {checks.map((c) => (
                <tr key={c.planet}>
                  <td>{lkGrahaName(c.planet, lang)}</td>
                  <td><span className={styles[`side_${c.chartSide}`]}>{t(`side.${c.chartSide}`)}</span></td>
                  <td className={styles.num}>{c.ticked} / {c.total}</td>
                  <td><span className={`${styles.badge} ${styles[`status_${c.status}`] ?? ''}`}>{t(`status.${c.status}`)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {checks.some((c) => c.status === 'signsOnly') && <p className={styles.note}>{t('signsOnlyHint')}</p>}
      </section>

      <section className={styles.card} aria-labelledby="lk-nish-list-title">
        <h2 id="lk-nish-list-title" className={styles.cardTitle}>{t('listTitle')}</h2>
        <p className={styles.note}>{t('listLede')}</p>
        <div className={styles.cards}>
          {LK_GRAHAS.map((p) => (
            <fieldset key={p} className={styles.mini}>
              <legend className={styles.miniTitle}>{lkGrahaName(p, lang)}</legend>
              {signs.filter((s) => s.planet === p).map((s) => (
                <label key={s.id} className={styles.check}>
                  <input type="checkbox" checked={ticks.includes(s.id)} onChange={() => toggle(s.id)} />
                  <span>{s.text}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <p className={styles.note}>{t('privacy')}</p>
      </section>
    </div>
  )
}
