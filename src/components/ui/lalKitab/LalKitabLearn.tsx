'use client'
// Lal Kitab Learn view: house meanings, planet karakas, the friendship
// table and how aspects, takkar and bunyad work.

import React from 'react'
import { useTranslations } from 'next-intl'
import { useLang } from '@/i18n/useLang'
import {
  LK_ENEMIES, LK_FRIENDS, LK_GRAHAS, LK_HOUSE_ASPECTS, LK_HOUSE_KARAKA, LK_HOUSES, LK_NEECH,
  LK_NODE_DIGNITY_PENDING, LK_PAKKA_GHAR, LK_UCHCHA,
  lkAspectsFromHouse, lkBunyadHouse, lkGrahaKaraka, lkGrahaName, lkHouseMeaning, lkTakkarHouse,
  type LkGraha, type LkHouse,
} from '@/lib/engine/lalKitab'
import styles from './LalKitab.module.css'

export function LalKitabLearn() {
  const t = useTranslations('lalKitab.learn')
  const tp = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const name = (id: LkGraha) => lkGrahaName(id, lang)
  const names = (ids: readonly LkGraha[]) => (ids.length ? ids.map(name).join(', ') : t('none'))
  const houses = (hs: readonly LkHouse[]) => (hs.length ? hs.join(', ') : t('none'))

  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="lk-houses-title">
        <h2 id="lk-houses-title" className={styles.cardTitle}>{t('housesTitle')}</h2>
        <p className={styles.note}>{t('housesLede')}</p>
        <div className={styles.cards}>
          {LK_HOUSES.map((h) => {
            const m = lkHouseMeaning(h, lang)
            const to = lkAspectsFromHouse(h)
            const from = LK_HOUSE_ASPECTS.filter((a) => a.to === h)
            return (
              <article key={h} className={styles.mini}>
                <h3 className={styles.miniTitle}>
                  <span className={styles.houseNum}>{h}</span> {m.title}
                </h3>
                <p className={styles.miniText}>{m.meaning}</p>
                <dl className={styles.facts}>
                  <dt>{t('karakas')}</dt><dd>{names(LK_HOUSE_KARAKA[h])}</dd>
                  <dt>{t('aspectsTo')}</dt><dd>{to.length ? to.map((a) => `${t('houseShort', { house: a.to })} (${tp(`kind.${a.kind}`)})`).join(', ') : t('none')}</dd>
                  <dt>{t('aspectedFrom')}</dt><dd>{from.length ? from.map((a) => `${t('houseShort', { house: a.from })} (${tp(`kind.${a.kind}`)})`).join(', ') : t('none')}</dd>
                  <dt>{t('takkarTo')}</dt><dd>{t('houseShort', { house: lkTakkarHouse(h) })}</dd>
                  <dt>{t('bunyad')}</dt><dd>{t('houseShort', { house: lkBunyadHouse(h) })}</dd>
                </dl>
              </article>
            )
          })}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="lk-grahas-title">
        <h2 id="lk-grahas-title" className={styles.cardTitle}>{t('planetsTitle')}</h2>
        <div className={styles.cards}>
          {LK_GRAHAS.map((id) => {
            const k = lkGrahaKaraka(id, lang)
            const pending = LK_NODE_DIGNITY_PENDING.includes(id)
            return (
              <article key={id} className={styles.mini}>
                <h3 className={styles.miniTitle}>{name(id)}</h3>
                <p className={styles.miniText}>{k.nature}</p>
                <dl className={styles.facts}>
                  <dt>{t('pakkaGhar')}</dt><dd>{houses(LK_PAKKA_GHAR[id])}</dd>
                  <dt>{t('uchcha')}</dt><dd>{pending ? t('pending') : houses(LK_UCHCHA[id])}</dd>
                  <dt>{t('neech')}</dt><dd>{pending ? t('pending') : houses(LK_NEECH[id])}</dd>
                  <dt>{t('relatives')}</dt><dd>{k.relatives}</dd>
                  <dt>{t('body')}</dt><dd>{k.body}</dd>
                  <dt>{t('colour')}</dt><dd>{k.colour}</dd>
                  <dt>{t('items')}</dt><dd>{k.items}</dd>
                  <dt>{t('metal')}</dt><dd>{k.metal}</dd>
                  <dt>{t('day')}</dt><dd>{k.day}</dd>
                </dl>
              </article>
            )
          })}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="lk-friends-title">
        <h2 id="lk-friends-title" className={styles.cardTitle}>{t('friendshipTitle')}</h2>
        <p className={styles.note}>{t('friendshipLede')}</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{tp('cols.planet')}</th>
                <th scope="col">{t('friends')}</th>
                <th scope="col">{t('enemies')}</th>
              </tr>
            </thead>
            <tbody>
              {LK_GRAHAS.map((id) => (
                <tr key={id}>
                  <th scope="row">{name(id)}</th>
                  <td>{names(LK_FRIENDS[id])}</td>
                  <td>{names(LK_ENEMIES[id])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="lk-rules-title">
        <h2 id="lk-rules-title" className={styles.cardTitle}>{t('rulesTitle')}</h2>
        <p className={styles.note}>{t('rulesLede')}</p>
        <ul className={styles.list}>
          {LK_HOUSE_ASPECTS.map((a) => (
            <li key={`${a.from}-${a.to}`} className={styles.listRow}>
              <span>{t('houseShort', { house: a.from })} → {t('houseShort', { house: a.to })}</span>
              <span className={styles.badge}>{tp(`kind.${a.kind}`)}</span>
            </li>
          ))}
        </ul>
        <p className={styles.miniText}>{t('takkarRule')}</p>
        <p className={styles.miniText}>{t('bunyadRule')}</p>
      </section>

      <p className={styles.note}>{t('remedyNote')}</p>
    </div>
  )
}
