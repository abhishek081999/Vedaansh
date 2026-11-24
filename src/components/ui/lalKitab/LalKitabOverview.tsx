'use client'
// Lal Kitab overview: a one-screen summary of the chart. The planet
// balance and chart facts first, then the nine planets, what works for
// the native and what needs care, and three next steps (this year,
// debts and doshas, the first remedy). The full findings list is Gold.

import React from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import type { UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { lkCycleAt, lkGrahaName, type LalKitabReading, type LkGraha, type LkPhalSide } from '@/lib/engine/lalKitab'
import { LalKitabFindings } from './LalKitabFindings'
import { LalKitabGate } from './LalKitabGate'
import { LalKitabUpayItem } from './LalKitabUpayItem'
import styles from './LalKitab.module.css'

/** Views the overview links to. */
export type LkOverviewTarget = 'planets' | 'varshphal' | 'rin' | 'doshas' | 'upay'

const SHORT_LIST = 3
const SIDES: readonly LkPhalSide[] = ['good', 'mixed', 'hard']

function GoButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.goBtn} onClick={onClick}>
      {label} <ArrowRight size={14} aria-hidden />
    </button>
  )
}

export function LalKitabOverview({
  reading, userPlan, currentYear, onOpen,
}: {
  reading: LalKitabReading
  userPlan: UserPlan
  currentYear: number
  onOpen: (view: LkOverviewTarget) => void
}) {
  const t = useTranslations('lalKitab.overview')
  const { lang } = useLang()
  const { states } = reading
  const name = (id: LkGraha) => lkGrahaName(id, lang)
  const list = (ids: readonly LkGraha[]) => (ids.length ? ids.map(name).join(', ') : t('none'))

  const count = { good: 0, mixed: 0, hard: 0 } as Record<LkPhalSide, number>
  for (const r of reading.phal) count[r.side] += 1
  const total = reading.phal.length || 1
  const tone: LkPhalSide = count.good >= count.hard + 2 ? 'good' : count.hard >= count.good + 2 ? 'hard' : 'mixed'

  const sideOf = new Map(reading.phal.map((r) => [r.planet, r.side]))
  const typeFindings = reading.findings.filter((f) => f.id.startsWith('teva.'))
  const isDebtOrDosha = (id: string) => id.startsWith('rin.') || id.startsWith('dosha.')
  const strengths = reading.findings.filter((f) => f.effect === 'good' && !f.id.startsWith('teva.')).slice(0, SHORT_LIST)
  const challenges = reading.findings.filter((f) => f.effect === 'bad' && !isDebtOrDosha(f.id) && !f.id.startsWith('teva.')).slice(0, SHORT_LIST)
  const debts = reading.findings.filter((f) => f.id.startsWith('rin.'))
  const doshas = reading.findings.filter((f) => f.id.startsWith('dosha.') && f.effect === 'bad')
  const cycle = lkCycleAt(currentYear)
  const firstRemedy = reading.remedies.top[0]

  return (
    <div className={styles.stack}>
      {/* Summary */}
      <section className={`${styles.card} ${styles.ovHero}`} aria-labelledby="lk-ov-title">
        <span className={styles.chartLabel}>{t('eyebrow')}</span>
        <h2 id="lk-ov-title" className={styles.ovHeadline}>{t(`headline.${tone}`)}</h2>
        <p className={styles.note}>{t('headlineLede', { good: count.good, mixed: count.mixed, hard: count.hard })}</p>

        <div className={styles.balance} role="img" aria-label={t('balanceAria', { good: count.good, mixed: count.mixed, hard: count.hard })}>
          {SIDES.filter((s) => count[s] > 0).map((s) => (
            <span key={s} className={`${styles.balanceSeg} ${styles[`seg_${s}`]}`} style={{ flexGrow: count[s] / total }} />
          ))}
        </div>
        <ul className={styles.balanceLegend}>
          {SIDES.map((s) => (
            <li key={s}>
              <span className={`${styles.dot} ${styles[`seg_${s}`]}`} aria-hidden />
              {t(`balance.${s}`)} <strong className={styles.num}>{count[s]}</strong>
            </li>
          ))}
        </ul>

        <dl className={styles.ovFacts}>
          <div>
            <dt>{t('chartType')}</dt>
            <dd>{states.chartTypes.length ? states.chartTypes.map((c) => t(`types.${c}`)).join(', ') : t('types.ordinary')}</dd>
          </div>
          <div>
            <dt>{t('kismat')}</dt>
            <dd>
              {states.kismat ? name(states.kismat.planet) : t('none')}
              {states.kismat && <span className={styles.statHint}>{t(`kismatMethod.${states.kismat.method}`)}</span>}
            </dd>
          </div>
          <div>
            <dt>{t('sleepingHouses')}</dt>
            <dd>{states.sleepingHouses.length ? states.sleepingHouses.map((s) => s.house).join(', ') : t('none')}</dd>
          </div>
          <div>
            <dt>{t('sleepingPlanets')}</dt>
            <dd>{list(states.sleepingPlanets)}</dd>
          </div>
          <div>
            <dt>{t('kayam')}</dt>
            <dd>{list(states.kayam)}</dd>
          </div>
          <div>
            <dt>{t('dharmi')}</dt>
            <dd>{list(states.dharmi)}</dd>
          </div>
        </dl>
      </section>

      {/* Nine planets */}
      <section className={styles.card} aria-labelledby="lk-ov-planets">
        <div className={styles.cardHead}>
          <h2 id="lk-ov-planets" className={styles.cardTitle}>{t('planetsTitle')}</h2>
          <GoButton label={t('openPlanets')} onClick={() => onOpen('planets')} />
        </div>
        <ul className={styles.planetGrid}>
          {reading.planets.map((p) => {
            const side = sideOf.get(p.id) ?? 'mixed'
            return (
              <li key={p.id} className={`${styles.planetTile} ${styles[`tile_${side}`]}`}>
                <span className={styles.tileName}>{p.name}</span>
                <span className={styles.tileHouse}>{t('houseN', { house: p.house })}</span>
                <span className={styles.tileSide}>{t(`balance.${side}`)}</span>
                {(p.sleeping || p.kayam) && (
                  <span className={styles.tileMeta}>{[p.kayam && t('kayamShort'), p.sleeping && t('asleep')].filter(Boolean).join(' · ')}</span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {typeFindings.length > 0 && (
        <section className={styles.card} aria-labelledby="lk-type-title">
          <h2 id="lk-type-title" className={styles.cardTitle}>{t('chartTypeTitle')}</h2>
          <LalKitabFindings findings={typeFindings} />
        </section>
      )}

      {/* Strengths and challenges */}
      <div className={styles.grid2}>
        <section className={`${styles.card} ${styles.accentGood}`} aria-labelledby="lk-ov-good">
          <h2 id="lk-ov-good" className={styles.cardTitle}>{t('strengthsTitle')}</h2>
          <LalKitabFindings findings={strengths} empty={t('strengthsEmpty')} />
        </section>
        <section className={`${styles.card} ${styles.accentHard}`} aria-labelledby="lk-ov-hard">
          <h2 id="lk-ov-hard" className={styles.cardTitle}>{t('challengesTitle')}</h2>
          <LalKitabFindings findings={challenges} empty={t('challengesEmpty')} />
        </section>
      </div>

      {/* Next steps */}
      <div className={styles.ovSteps}>
        <section className={`${styles.card} ${styles.ovYear}`} aria-labelledby="lk-ov-year">
          <span className={styles.chartLabel}>{t('yearOfLife', { year: currentYear })}</span>
          <h2 id="lk-ov-year" className={styles.cardTitle}>{t('nowTitle', { planet: name(cycle.planet) })}</h2>
          <p className={styles.miniText}>
            {t('nowText', { left: cycle.yearsLeft, span: cycle.spanYears, next: name(cycle.next) })}
          </p>
          <GoButton label={t('openVarshphal')} onClick={() => onOpen('varshphal')} />
        </section>

        <section className={`${styles.card} ${styles.ovDebts}`} aria-labelledby="lk-ov-debts">
          <span className={styles.chartLabel}>{t('debtsCount', { count: debts.length + doshas.length })}</span>
          <h2 id="lk-ov-debts" className={styles.cardTitle}>{t('debtsTitle')}</h2>
          {debts.length + doshas.length === 0 ? <p className={styles.miniText}>{t('debtsEmpty')}</p> : (
            <span className={styles.badges}>
              {[...doshas, ...debts].map((f) => (
                <span key={f.id} className={`${styles.badge} ${styles.badge_neech}`}>{f.label}</span>
              ))}
            </span>
          )}
          <p className={styles.note}>{t('debtsNote')}</p>
          <span className={styles.goRow}>
            {debts.length > 0 && <GoButton label={t('openRin')} onClick={() => onOpen('rin')} />}
            {doshas.length > 0 && <GoButton label={t('openDoshas')} onClick={() => onOpen('doshas')} />}
          </span>
        </section>

        <section className={`${styles.card} ${styles.ovStart}`} aria-labelledby="lk-ov-start">
          <span className={styles.chartLabel}>{t('startEyebrow')}</span>
          <h2 id="lk-ov-start" className={styles.cardTitle}>{t('startTitle')}</h2>
          {firstRemedy ? <LalKitabUpayItem choice={firstRemedy} /> : <p className={styles.miniText}>{t('startNone')}</p>}
          <GoButton label={t('openUpay')} onClick={() => onOpen('upay')} />
        </section>
      </div>

      <section className={styles.card} aria-labelledby="lk-all-title">
        <h2 id="lk-all-title" className={styles.cardTitle}>{t('allTitle', { count: reading.findings.length })}</h2>
        <p className={styles.note}>{t('allLede')}</p>
        <LalKitabGate
          userPlan={userPlan}
          full={<LalKitabFindings findings={reading.findings} />}
          teaser={<LalKitabFindings findings={reading.findings.slice(0, 2)} />}
        />
      </section>
    </div>
  )
}
