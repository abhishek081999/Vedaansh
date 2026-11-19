'use client'
// Lal Kitab Teva view: chart, planet table, ranked findings with their
// reasons, aspects and takkar.

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { NorthIndianChakra } from '@/components/chakra/NorthIndianChakra'
import { useLang } from '@/i18n/useLang'
import { isLkGraha, lkGrahaName, type LalKitabReading, type LkChartBasis, type LkTeva } from '@/lib/engine/lalKitab'
import styles from './LalKitab.module.css'

/** Grahas placed by Lal Kitab house, with house 1 drawn as Aries. */
function tevaGrahas(chart: ChartOutput, teva: LkTeva): GrahaData[] {
  return chart.grahas
    .filter((g) => isLkGraha(g.id))
    .map((g) => ({ ...g, rashi: teva.house[g.id as keyof LkTeva['house']] as Rashi }))
}

export function LalKitabTeva({ chart, reading }: { chart: ChartOutput; reading: LalKitabReading }) {
  const t = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const [basis, setBasis] = useState<LkChartBasis>('lagna')
  const teva = basis === 'lagna' ? reading.teva : reading.chandra
  const grahas = useMemo(() => tevaGrahas(chart, teva), [chart, teva])
  const name = (id: Parameters<typeof lkGrahaName>[0]) => lkGrahaName(id, lang)

  return (
    <div className={styles.stack}>
      <div className={styles.grid2}>
        <section className={styles.card} aria-labelledby="lk-chart-title">
          <div className={styles.cardHead}>
            <h2 id="lk-chart-title" className={styles.cardTitle}>{t('chartTitle')}</h2>
            <div className={styles.segment} role="radiogroup" aria-label={t('basisLabel')}>
              {(['lagna', 'chandra'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={basis === b}
                  className={basis === b ? `${styles.segBtn} ${styles.segActive}` : styles.segBtn}
                  onClick={() => setBasis(b)}
                >
                  {t(`basis.${b}`)}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.chartBox}>
            <NorthIndianChakra ascRashi={1} grahas={grahas} size={340} showDegrees={false} />
          </div>
          <p className={styles.note}>{t('chartNote')}</p>
        </section>

        <section className={styles.card} aria-labelledby="lk-planets-title">
          <h2 id="lk-planets-title" className={styles.cardTitle}>{t('planetsTitle')}</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('cols.planet')}</th>
                <th scope="col">{t('cols.house')}</th>
                <th scope="col">{t('cols.status')}</th>
              </tr>
            </thead>
            <tbody>
              {reading.planets.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td className={styles.num}>{basis === 'lagna' ? p.house : teva.house[p.id]}</td>
                  <td>
                    <span className={styles.badges}>
                      {basis === 'lagna' && p.dignities.map((d) => (
                        <span key={d} className={`${styles.badge} ${styles[`badge_${d}`] ?? ''}`}>{t(`badges.${d}`)}</span>
                      ))}
                      {p.retro && p.id !== 'Ra' && p.id !== 'Ke' && <span className={styles.badge}>{t('badges.retro')}</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className={styles.card} aria-labelledby="lk-findings-title">
        <h2 id="lk-findings-title" className={styles.cardTitle}>{t('findingsTitle')}</h2>
        <p className={styles.note}>{t('findingsLede')}</p>
        {reading.findings.length === 0 ? (
          <p className={styles.empty}>{t('findingsEmpty')}</p>
        ) : (
          <ul className={styles.findings}>
            {reading.findings.map((f) => (
              <li key={f.id} className={`${styles.finding} ${styles[`effect_${f.effect}`] ?? ''}`}>
                <details>
                  <summary className={styles.findingHead}>
                    <span className={styles.effectTag}>{t(`effect.${f.effect}`)}</span>
                    <span className={styles.findingLabel}>{f.label}</span>
                  </summary>
                  <p className={styles.findingText}>{f.text}</p>
                  <p className={styles.whyTitle}>{t('why')}</p>
                  <ul className={styles.why}>
                    {f.why.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.grid2}>
        <section className={styles.card} aria-labelledby="lk-aspects-title">
          <h2 id="lk-aspects-title" className={styles.cardTitle}>{t('aspectsTitle')}</h2>
          {reading.aspects.length === 0 ? (
            <p className={styles.empty}>{t('aspectsEmpty')}</p>
          ) : (
            <ul className={styles.list}>
              {reading.aspects.map((a) => (
                <li key={`${a.from}-${a.to}`} className={styles.listRow}>
                  <span>{t('aspectRow', { from: name(a.from), to: name(a.to), fromHouse: a.fromHouse, toHouse: a.toHouse })}</span>
                  <span className={styles.badges}>
                    <span className={styles.badge}>{t(`kind.${a.kind}`)}</span>
                    <span className={`${styles.badge} ${styles[`rel_${a.relation}`] ?? ''}`}>{t(`relation.${a.relation}`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.card} aria-labelledby="lk-takkar-title">
          <h2 id="lk-takkar-title" className={styles.cardTitle}>{t('takkarTitle')}</h2>
          {reading.takkars.length === 0 ? (
            <p className={styles.empty}>{t('takkarEmpty')}</p>
          ) : (
            <ul className={styles.list}>
              {reading.takkars.map((k) => (
                <li key={`${k.from}-${k.to}`} className={styles.listRow}>
                  <span>{t('aspectRow', { from: name(k.from), to: name(k.to), fromHouse: k.fromHouse, toHouse: k.toHouse })}</span>
                  <span className={`${styles.badge} ${styles[`rel_${k.relation}`] ?? ''}`}>{t(`relation.${k.relation}`)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className={styles.note}>{t('comingNext')}</p>
    </div>
  )
}
