'use client'
// Lal Kitab combinations: planet pairs in one house and masnui planets. Gold.

import React from 'react'
import { useTranslations } from 'next-intl'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkGrahaName, type LalKitabReading } from '@/lib/engine/lalKitab'
import { LalKitabGate } from './LalKitabGate'
import styles from './LalKitab.module.css'

type Row = { key: string; house: number; label: string; text: string; effect: string; extra?: string }

function Rows({ rows, empty }: { rows: Row[]; empty: string }) {
  const tp = useTranslations('lalKitab.panel')
  if (rows.length === 0) return <p className={styles.empty}>{empty}</p>
  return (
    <ul className={styles.findings}>
      {rows.map((r) => (
        <li key={r.key} className={`${styles.finding} ${styles[`effect_${r.effect}`] ?? ''}`}>
          <div className={styles.findingHead}>
            <span className={styles.effectTag}>{tp(`effect.${r.effect}`)}</span>
            <span className={styles.findingLabel}>{r.label}</span>
            <span className={styles.badge}>{tp('houseValue', { house: r.house })}</span>
          </div>
          <p className={`${styles.findingText} ${styles.rowText}`}>{r.text}</p>
          {r.extra && <p className={`${styles.note} ${styles.rowText}`}>{r.extra}</p>}
        </li>
      ))}
    </ul>
  )
}

export function LalKitabCombos({ reading, userPlan }: { reading: LalKitabReading; userPlan: UserPlan }) {
  const t = useTranslations('lalKitab.combos')
  const { lang } = useLang()
  const masnuiIds = new Set(reading.masnui.map((m) => m.def.id))
  const pairs: Row[] = reading.conjunctions.filter((c) => !masnuiIds.has(c.id)).map((c) => ({ key: c.id, house: c.house, label: c.label, text: c.text, effect: c.effect }))
  const masnui: Row[] = reading.masnui.map((m) => ({
    key: m.def.id, house: m.house, label: m.label, text: m.text, effect: m.def.effect,
    extra: t('becomes', { planet: lkGrahaName(m.def.becomes, lang) }) + (m.def.edition === 'commentary' ? ` · ${t('commentary')}` : ''),
  }))
  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="lk-masnui-title">
        <h2 id="lk-masnui-title" className={styles.cardTitle}>{t('masnuiTitle')}</h2>
        <p className={styles.note}>{t('masnuiLede')}</p>
        {masnui.length === 0 ? <Rows rows={masnui} empty={t('masnuiEmpty')} /> : (
          <LalKitabGate userPlan={userPlan} full={<Rows rows={masnui} empty={t('masnuiEmpty')} />} teaser={<Rows rows={masnui.slice(0, 1)} empty={t('masnuiEmpty')} />} />
        )}
      </section>
      <section className={styles.card} aria-labelledby="lk-pairs-title">
        <h2 id="lk-pairs-title" className={styles.cardTitle}>{t('pairsTitle')}</h2>
        <p className={styles.note}>{t('pairsLede')}</p>
        {pairs.length === 0 ? <Rows rows={pairs} empty={t('pairsEmpty')} /> : (
          <LalKitabGate userPlan={userPlan} full={<Rows rows={pairs} empty={t('pairsEmpty')} />} teaser={<Rows rows={pairs.slice(0, 1)} empty={t('pairsEmpty')} />} />
        )}
      </section>
    </div>
  )
}
