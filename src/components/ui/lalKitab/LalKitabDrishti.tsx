'use client'
// Lal Kitab drishti: who looks at whom (matrix and list) and takkar. Gold.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkGrahaName, type LalKitabReading, type LkGraha } from '@/lib/engine/lalKitab'
import { LalKitabGate } from './LalKitabGate'
import styles from './LalKitab.module.css'

function Matrix({ reading }: { reading: LalKitabReading }) {
  const t = useTranslations('lalKitab.drishti')
  const tp = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const ids = reading.planets.map((p) => p.id)
  const short = (id: LkGraha) => lkGrahaName(id, lang)
  const cell = (from: LkGraha, to: LkGraha) => reading.aspects.find((a) => a.from === from && a.to === to)
  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.matrix}`}>
        <caption className={styles.note}>{t('matrixCaption')}</caption>
        <thead>
          <tr>
            <th scope="col"><span className={styles.srOnly}>{t('fromTo')}</span></th>
            {ids.map((id) => <th key={id} scope="col">{short(id)}</th>)}
          </tr>
        </thead>
        <tbody>
          {ids.map((from) => (
            <tr key={from}>
              <th scope="row">{short(from)}</th>
              {ids.map((to) => {
                const a = cell(from, to)
                return (
                  <td key={to} className={a ? styles[`rel_${a.relation}`] : undefined}>
                    {a ? <span title={`${tp(`kind.${a.kind}`)} · ${tp(`relation.${a.relation}`)}`}>{a.percent}%</span> : <span aria-hidden>·</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Lists({ reading }: { reading: LalKitabReading }) {
  const t = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const name = (id: LkGraha) => lkGrahaName(id, lang)
  return (
    <div className={styles.grid2}>
      <div>
        <h3 className={styles.subTitle}>{t('aspectsTitle')}</h3>
        {reading.aspects.length === 0 ? <p className={styles.empty}>{t('aspectsEmpty')}</p> : (
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
      </div>
      <div>
        <h3 className={styles.subTitle}>{t('takkarTitle')}</h3>
        {reading.takkars.length === 0 ? <p className={styles.empty}>{t('takkarEmpty')}</p> : (
          <ul className={styles.list}>
            {reading.takkars.map((k) => (
              <li key={`${k.from}-${k.to}`} className={styles.listRow}>
                <span>{t('aspectRow', { from: name(k.from), to: name(k.to), fromHouse: k.fromHouse, toHouse: k.toHouse })}</span>
                <span className={`${styles.badge} ${styles[`rel_${k.relation}`] ?? ''}`}>{t(`relation.${k.relation}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function LalKitabDrishti({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.drishti')
  return (
    <section className={styles.card} aria-labelledby="lk-drishti-title">
      <h2 id="lk-drishti-title" className={styles.cardTitle}>{t('title')}</h2>
      <p className={styles.note}>{t('lede')}</p>
      <LalKitabGate
        userPlan={userPlan}
        full={<><Matrix reading={reading} /><Lists reading={reading} /></>}
        teaser={<Matrix reading={{ ...reading, aspects: [] }} />}
      />
    </section>
  )
}
