'use client'
// Varshphal view: year slider, year chart, cycle planet, dhokha, masphal/dinphal.
// Free: current year summary. Gold: full 1–120 + month/day charts.

import React, { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput, GrahaData, Rashi, UserPlan } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { NorthIndianChakra } from '@/components/chakra/NorthIndianChakra'
import {
  isLkGraha, lkDinphal, lkGrahaName, lkMasphal, lkVarshphal,
  type LalKitabReading, type LkHouse, type LkTeva,
} from '@/lib/engine/lalKitab'
import { LalKitabGate, useGold } from './LalKitabGate'
import styles from './LalKitab.module.css'

function tevaGrahas(chart: ChartOutput, teva: LkTeva): GrahaData[] {
  return chart.grahas
    .filter((g) => isLkGraha(g.id))
    .map((g) => ({ ...g, rashi: teva.house[g.id as keyof LkTeva['house']] as Rashi }))
}

function YearBlock({
  chart, natal, year, month, day, onMonth, onDay, showSub,
}: {
  chart: ChartOutput
  natal: LkTeva
  year: number
  month: number
  day: number
  onMonth: (m: number) => void
  onDay: (d: number) => void
  showSub: boolean
}) {
  const t = useTranslations('lalKitab.varshphal')
  const tp = useTranslations('lalKitab.panel')
  const { lang } = useLang()
  const v = useMemo(() => lkVarshphal(natal, year), [natal, year])
  const monthTeva = useMemo(() => lkMasphal(v.teva, month), [v.teva, month])
  const dayTeva = useMemo(() => lkDinphal(monthTeva, day), [monthTeva, day])
  const name = (id: Parameters<typeof lkGrahaName>[0]) => lkGrahaName(id, lang)

  return (
    <div className={styles.stack}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('cycle')}</span>
          <span className={styles.statValue}>{name(v.cycle.planet)}</span>
          <span className={styles.statHint}>
            {t('cycleDetail', {
              planet: name(v.cycle.planet),
              yearInSpan: v.cycle.yearInSpan,
              spanYears: v.cycle.spanYears,
              next: name(v.cycle.next),
            })}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{t('dhokha')}</span>
          <span className={styles.statValue}>
            {v.dhokha.length ? v.dhokha.map(name).join(', ') : t('dhokhaNone')}
          </span>
          <span className={styles.statHint}>{t('dhokhaNote')}</span>
        </div>
      </div>

      <div className={styles.grid2}>
        <section className={styles.card} aria-labelledby="lk-varsh-chart">
          <h2 id="lk-varsh-chart" className={styles.cardTitle}>{t('chartTitle')}</h2>
          <div className={styles.chartBox}>
            <NorthIndianChakra ascRashi={1} grahas={tevaGrahas(chart, v.teva)} size={320} showDegrees={false} />
          </div>
        </section>
        <section className={styles.card} aria-labelledby="lk-varsh-planets">
          <h2 id="lk-varsh-planets" className={styles.cardTitle}>{t('planetsTitle')}</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{tp('cols.planet')}</th>
                  <th scope="col">{tp('cols.house')}</th>
                  <th scope="col">{t('natalCol')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(v.teva.house).map(([id, house]) => {
                  const natalH = natal.house[id as keyof LkTeva['house']] as LkHouse
                  return (
                    <tr key={id}>
                      <td>{name(id as Parameters<typeof lkGrahaName>[0])}</td>
                      <td className={styles.num}>{house}</td>
                      <td className={styles.num}>{t('natalHouse', { house: natalH })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showSub && (
        <div className={styles.grid2}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('monthTitle')}</h2>
            <label className={styles.sliderLabel}>
              <span>{t('monthLabel')}</span>
              <span className={styles.num}>{t('monthValue', { month })}</span>
            </label>
            <input
              type="range"
              min={1}
              max={12}
              value={month}
              className={styles.slider}
              onChange={(e) => onMonth(Number(e.target.value))}
              aria-label={t('monthLabel')}
            />
            <div className={styles.chartBox}>
              <NorthIndianChakra ascRashi={1} grahas={tevaGrahas(chart, monthTeva)} size={280} showDegrees={false} />
            </div>
          </section>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{t('dayTitle')}</h2>
            <label className={styles.sliderLabel}>
              <span>{t('dayLabel')}</span>
              <span className={styles.num}>{t('dayValue', { day })}</span>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={day}
              className={styles.slider}
              onChange={(e) => onDay(Number(e.target.value))}
              aria-label={t('dayLabel')}
            />
            <div className={styles.chartBox}>
              <NorthIndianChakra ascRashi={1} grahas={tevaGrahas(chart, dayTeva)} size={280} showDegrees={false} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export function LalKitabVarshphal({
  chart, reading, userPlan, currentYear,
}: {
  chart: ChartOutput
  reading: LalKitabReading
  userPlan: UserPlan
  currentYear: number
}) {
  const t = useTranslations('lalKitab.varshphal')
  const gold = useGold(userPlan)
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)
  const activeYear = gold ? year : currentYear

  return (
    <div className={styles.stack}>
      <header>
        <h2 className={styles.cardTitle}>{t('title')}</h2>
        <p className={styles.note}>{t('lede')}</p>
      </header>

      {!gold && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>{t('summaryTitle')}</h3>
          <p className={styles.note}>{t('summaryLede')}</p>
          <p className={styles.note}>{t('yearValue', { year: currentYear })} · {t('ageHint', { age: Math.max(0, currentYear - 1) })}</p>
        </section>
      )}

      {gold && (
        <section className={styles.card}>
          <label className={styles.sliderLabel}>
            <span>{t('yearLabel')}</span>
            <span className={styles.num}>{t('yearValue', { year })}</span>
          </label>
          <input
            type="range"
            min={1}
            max={120}
            value={year}
            className={styles.slider}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label={t('yearLabel')}
          />
          <p className={styles.note}>{t('ageHint', { age: Math.max(0, year - 1) })}</p>
        </section>
      )}

      <LalKitabGate
        userPlan={userPlan}
        full={
          <YearBlock
            chart={chart}
            natal={reading.teva}
            year={activeYear}
            month={month}
            day={day}
            onMonth={setMonth}
            onDay={setDay}
            showSub
          />
        }
        teaser={
          <>
            <YearBlock
              chart={chart}
              natal={reading.teva}
              year={currentYear}
              month={1}
              day={1}
              onMonth={() => {}}
              onDay={() => {}}
              showSub={false}
            />
            <p className={styles.note}>{t('teaser')}</p>
          </>
        }
      />
    </div>
  )
}
