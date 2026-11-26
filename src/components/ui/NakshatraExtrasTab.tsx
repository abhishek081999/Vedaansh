'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NakshatraExtrasTab.tsx
//  Gandmool · Name letters (Namakshar) · Ghatak chakra · Slow-planet
//  star transits. Free except slow transits (Gold; the API enforces it).
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import type { ChartOutput, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { DEFAULT_AYANAMSHA } from '@/types/astrology'
import { useLang } from '@/i18n/useLang'
import { cn } from '@/lib/ui/cn'
import { planMeetsUiGate } from '@/lib/ui/planGate'
import { PlanGate } from '@/components/ui/patterns/PlanGate'
import { VizCard } from '@/components/ui/viz'
import { getNakshatraCharacteristics, getTarabala } from '@/lib/engine/nakshatraAdvanced'
import { getTithi } from '@/lib/engine/nakshatra'
import {
  GHATAK,
  TITHI_GROUP_NUMBERS,
  analyzeGandmool,
  birthSyllable,
  gandmoolTable,
  ghatakMatches,
  matchNameSyllable,
  namaksharTable,
  type SyllableCell,
} from '@/lib/engine/nakshatraExtras'
import type { SlowPlanet, StarStay } from '@/lib/engine/nakshatraReturns'
import { SectionHead, useNames, useTodayTransits } from '@/components/ui/NakshatraAdvancedTab'
import { SlowTransitTimeline, type TimelineStay } from '@/components/ui/NakshatraAdvancedViz'
import panel from './NakshatraPanel.module.css'
import styles from './NakshatraAdvancedTab.module.css'
import x from './NakshatraExtrasTab.module.css'

export type NakshatraExtrasSection = 'gandmool' | 'namakshar' | 'ghatak' | 'slowtransits'

export function NakshatraExtrasTab({
  chart,
  userPlan,
  section,
}: {
  chart: ChartOutput
  userPlan: UserPlan
  section: NakshatraExtrasSection
}) {
  if (section === 'gandmool') return <GandmoolSection chart={chart} />
  if (section === 'namakshar') return <NamaksharSection chart={chart} />
  if (section === 'ghatak') return <GhatakSection chart={chart} />
  return <SlowTransitsSection chart={chart} userPlan={userPlan} />
}

const moonOf = (chart: ChartOutput) => chart.grahas.find(g => g.id === 'Mo')

// ── Gandmool ─────────────────────────────────────────────────

function GandmoolSection({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('nakshatra.extras.gandmool')
  const names = useNames()
  const { lang } = useLang()
  const moon = moonOf(chart)
  const g = useMemo(() => analyzeGandmool(moon?.lonSidereal ?? 0), [moon?.lonSidereal])
  const table = useMemo(() => gandmoolTable(), [])
  const deity = getNakshatraCharacteristics(g.nakshatraIndex, g.pada, lang).deity

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('lead')}</p>

      {g.isGandmool ? (
        <div className={cn(x.statusCard, g.harmful ? x.statusHard : x.statusSoft)}>
          <div className={x.statusTop}>
            <h4 className={x.statusTitle}>{t('born', { star: names.nak(g.nakshatraIndex), pada: g.pada })}</h4>
            <span className={cn(x.chip, g.severity === 'strong' ? x.chipBad : x.chipMid)}>{t(`severity.${g.severity}`)}</span>
            {g.abhukta && <span className={cn(x.chip, x.chipBad)}>{t('abhukta')}</span>}
          </div>
          <p className={x.statusLine}>
            <strong>{t('effectLabel')}</strong> {t(`effects.${g.effect}`)}
          </p>
          <p className={x.statusNote}>{t(`side.${g.side}`, { lord: names.body(g.lord!) })}</p>
          {g.severity === 'strong' && <p className={x.statusNote}>{t('strongNote')}</p>}
          {g.abhukta && <p className={x.statusNote}>{t('abhuktaNote')}</p>}
        </div>
      ) : (
        <div className={panel.clearState}>
          <Check size={16} aria-hidden />
          {t('clear', { star: names.nak(g.nakshatraIndex) })}
        </div>
      )}

      {g.isGandmool && (
        <>
          <SectionHead title={t('remedyTitle')} />
          <ul className={x.remedyList}>
            <li>{t('remedyShanti', { star: names.nak(g.nakshatraIndex) })}</li>
            <li>{t('remedyJapa', { count: g.japa!.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN'), lord: names.body(g.lord!) })}</li>
            <li>{t('remedyDeity', { deity })}</li>
            <li>{t('remedyCharity')}</li>
          </ul>
        </>
      )}

      <VizCard
        title={t('tableTitle')}
        caption={t('tableCaption')}
        legend={[
          { label: t('legendHard'), color: 'color-mix(in srgb, var(--rose) 30%, var(--surface-2))' },
          { label: t('legendSoft'), color: 'color-mix(in srgb, var(--teal) 28%, var(--surface-2))' },
          { label: t('legendStrong'), color: 'var(--text-primary)', dashed: true },
        ]}
      >
        <div className={x.gmGrid} role="table" aria-label={t('tableTitle')}>
          <div className={x.gmHead} role="row">
            <span role="columnheader" />
            {[1, 2, 3, 4].map(p => <span key={p} role="columnheader">{t('pada', { n: p })}</span>)}
          </div>
          {table.map(row => (
            <div key={row.nakshatraIndex} className={x.gmRow} role="row">
              <span className={x.gmStar} role="rowheader">{names.nak(row.nakshatraIndex)}</span>
              {row.padas.map((p, i) => {
                const mine = g.isGandmool && row.nakshatraIndex === g.nakshatraIndex && i + 1 === g.pada
                return (
                  <span
                    key={i}
                    role="cell"
                    className={cn(x.gmCell, p.harmful ? x.gmHard : x.gmSoft, p.strong && x.gmStrong, mine && x.gmMine)}
                  >
                    {t(`effectsShort.${p.effect}`)}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </VizCard>
      <p className={styles.footnote}>{t('note')}</p>
    </div>
  )
}

// ── Name letters ─────────────────────────────────────────────

function NamaksharSection({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('nakshatra.extras.namakshar')
  const names = useNames()
  const { lang, hi } = useLang()
  const moon = moonOf(chart)
  const birthNak = moon?.nakshatraIndex ?? 0
  const mine = birthSyllable(birthNak, moon?.pada ?? 1)
  const rows = useMemo(() => namaksharTable(), [])
  const [name, setName] = useState('')
  const matches = useMemo(() => matchNameSyllable(name), [name])
  const show = (c: SyllableCell) => (hi ? c.devanagari : c.latin)
  const alt = (c: SyllableCell) => (hi ? c.latin : c.devanagari)
  const isMatch = (c: SyllableCell) => matches.some(m => m.nakshatraIndex === c.nakshatraIndex && m.pada === c.pada)

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('lead')}</p>

      <div className={x.syllableHero}>
        <div className={x.syllableBig} lang={hi ? 'hi' : 'sa'}>{mine.devanagari}</div>
        <div>
          <div className={x.syllableLatin}>{mine.latin}</div>
          <p className={x.statusNote}>{t('yours', { star: names.nak(birthNak), pada: mine.pada })}</p>
          <p className={x.statusNote}>
            {t('starSet')}{' '}
            {rows[birthNak].map(c => (
              <span key={c.pada} className={cn(x.chip, c.pada === mine.pada && x.chipGold)}>{show(c)}</span>
            ))}
          </p>
        </div>
      </div>

      <label className={x.checker}>
        <span className={styles.controlLabel}>{t('checkLabel')}</span>
        <input
          className={x.input}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('placeholder')}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {name.trim() && (
        matches.length === 0 ? (
          <p className={panel.lead}>{t('noMatch')}</p>
        ) : (
          <ul className={x.remedyList} aria-live="polite">
            {matches.map(m => {
              const tara = getTarabala(birthNak, m.nakshatraIndex, lang)
              const verdict = m.nakshatraIndex === birthNak
                ? (m.pada === mine.pada ? 'exact' : 'sameStar')
                : tara.quality === 'auspicious' ? 'good' : tara.quality === 'inauspicious' ? 'avoid' : 'neutral'
              return (
                <li key={`${m.nakshatraIndex}-${m.pada}`} className={cn(x.matchRow, x[`verdict_${verdict}`])}>
                  <strong>{t('matchLine', { syllable: show(m), star: names.nak(m.nakshatraIndex), pada: m.pada })}</strong>
                  <span>{t(`verdict.${verdict}`, { tara: names.tara(tara.name) })}</span>
                </li>
              )
            })}
          </ul>
        )
      )}

      <VizCard title={t('gridTitle')} caption={t('gridCaption')}>
        <div className={x.akGrid}>
          {rows.map(row => (
            <div key={row[0].nakshatraIndex} className={cn(x.akRow, row[0].nakshatraIndex === birthNak && x.akRowMine)}>
              <span className={x.akStar}>{names.nak(row[0].nakshatraIndex)}</span>
              {row.map(c => (
                <span
                  key={c.pada}
                  className={cn(x.akCell, c.nakshatraIndex === birthNak && c.pada === mine.pada && x.akCellMine, isMatch(c) && x.akCellMatch)}
                  title={`${names.nak(c.nakshatraIndex)} · ${t('pada', { n: c.pada })}`}
                >
                  {show(c)}
                  <small>{alt(c)}</small>
                </span>
              ))}
            </div>
          ))}
        </div>
      </VizCard>
    </div>
  )
}

// ── Ghatak chakra ────────────────────────────────────────────

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function GhatakSection({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('nakshatra.extras.ghatak')
  const names = useNames()
  const moon = moonOf(chart)
  const sign = (moon?.rashi ?? 1) as Rashi
  const row = GHATAK[sign]
  const transits = useTodayTransits(chart, true)

  const today = useMemo(() => {
    const mo = transits.rows?.find(r => r.id === 'Mo')
    const su = transits.rows?.find(r => r.id === 'Su')
    if (!mo || !su) return null
    const tithi = getTithi(mo.lonSidereal, su.lonSidereal).number
    const weekday = new Date().getDay()
    return { moonSign: mo.rashi, tithi, weekday, nakshatraIndex: mo.nakshatraIndex, hit: ghatakMatches(sign, { moonSign: mo.rashi, tithi, weekday, nakshatraIndex: mo.nakshatraIndex }) }
  }, [transits.rows, sign])

  const items: Array<{ key: 'transitMoonSign' | 'month' | 'tithi' | 'weekday' | 'nakshatra'; value: string; hit?: boolean; todayValue?: string }> = [
    { key: 'transitMoonSign', value: names.sign(row.transitMoonSign), hit: today?.hit.transitMoonSign, todayValue: today ? names.sign(today.moonSign) : undefined },
    { key: 'tithi', value: t('tithiGroup', { group: t(`groups.${row.tithi}`), nums: TITHI_GROUP_NUMBERS[row.tithi].join(', ') }), hit: today?.hit.tithi, todayValue: today ? String(((today.tithi - 1) % 15) + 1) : undefined },
    { key: 'weekday', value: t(`weekdays.${WEEKDAY_KEYS[row.weekday]}`), hit: today?.hit.weekday, todayValue: today ? t(`weekdays.${WEEKDAY_KEYS[today.weekday]}`) : undefined },
    { key: 'nakshatra', value: names.nak(row.nakshatraIndex), hit: today?.hit.nakshatra, todayValue: today ? names.nak(today.nakshatraIndex) : undefined },
    { key: 'month', value: t(`months.${row.month}`) },
  ]

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('lead', { sign: names.sign(sign) })}</p>

      {today && (
        <div className={cn(x.statusCard, today.hit.count >= 2 ? x.statusHard : today.hit.count === 1 ? x.statusMid : x.statusSoft)}>
          <h4 className={x.statusTitle}>{t('todayTitle', { count: today.hit.count })}</h4>
          <p className={x.statusNote}>{t(today.hit.count === 0 ? 'todayClear' : 'todayAdvice')}</p>
        </div>
      )}
      {transits.loading && <p className={panel.lead}>{t('todayLoading')}</p>}
      {transits.error && <p className={panel.lead}>{t('todayFailed')}</p>}

      <div className={x.ghatakGrid}>
        {items.map(it => (
          <div key={it.key} className={cn(x.ghatakCard, it.hit && x.ghatakHit)}>
            <span className={styles.controlLabel}>{t(`items.${it.key}`)}</span>
            <span className={x.ghatakValue}>{it.value}</span>
            {it.todayValue != null && (
              <span className={x.ghatakToday}>
                {it.hit ? t('todaySame') : t('todayIs', { value: it.todayValue })}
              </span>
            )}
          </div>
        ))}
      </div>

      <SectionHead title={t('tableTitle')} />
      <div className={panel.tableWrap}>
        <table className={panel.table}>
          <thead>
            <tr>
              {(['sign', 'transitMoonSign', 'month', 'tithi', 'weekday', 'nakshatra'] as const).map(k => <th key={k}>{t(`items.${k}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {(Object.values(GHATAK)).map(r => (
              <tr key={r.moonSign} className={r.moonSign === sign ? x.rowMine : undefined}>
                <td><strong>{names.sign(r.moonSign)}</strong></td>
                <td>{names.sign(r.transitMoonSign)}</td>
                <td>{t(`months.${r.month}`)}</td>
                <td>{t(`groups.${r.tithi}`)}</td>
                <td>{t(`weekdays.${WEEKDAY_KEYS[r.weekday]}`)}</td>
                <td>{names.nak(r.nakshatraIndex)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>{t('note')}</p>
    </div>
  )
}

// ── Slow-planet star transits ────────────────────────────────

type SlowData = { from: string; to: string; planets: Record<SlowPlanet, StarStay[]> }
const SLOW: SlowPlanet[] = ['Sa', 'Ju', 'Ra', 'Ke']

function SlowTransitsSection({ chart, userPlan }: { chart: ChartOutput; userPlan: UserPlan }) {
  const t = useTranslations('nakshatra.extras.slow')
  const names = useNames()
  const { lang } = useLang()
  const gold = planMeetsUiGate(userPlan, 'gold')
  const birthNak = moonOf(chart)?.nakshatraIndex ?? 0
  const ayanamsha = chart.meta?.settings?.ayanamsha ?? DEFAULT_AYANAMSHA
  const node = chart.meta?.settings?.nodeMode ?? 'true'
  const [data, setData] = useState<SlowData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!gold) return
    let cancelled = false
    setError(false)
    fetch(`/api/nakshatra/slow-transits?${new URLSearchParams({ ayanamsha: String(ayanamsha), node: String(node) })}`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return
        if (!ok || !j.success) throw new Error('FETCH_FAILED')
        setData(j.data)
      })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [gold, ayanamsha, node])

  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }), [locale])
  const now = Date.now()

  const rows = useMemo(() => {
    if (!data) return []
    return SLOW.map(id => ({
      id: id as GrahaId,
      stays: data.planets[id].map((s): TimelineStay & { taraName: string } => {
        const tara = getTarabala(birthNak, s.nakshatraIndex, lang)
        return {
          ...s,
          tone: tara.quality,
          taraName: tara.name,
          title: `${names.body(id)} · ${names.nak(s.nakshatraIndex)} · ${names.tara(tara.name)} · ${fmt.format(new Date(s.start))} – ${fmt.format(new Date(s.end))}`,
        }
      }),
    }))
  }, [data, birthNak, lang, names, fmt])

  return (
    <div className={panel.stack}>
      <SectionHead title={t('title')} />
      <p className={panel.lead}>{t('lead')}</p>
      <PlanGate userPlan={userPlan} required="gold" featureName={t('goldFeature')}>
        <div className={panel.stack}>
          {gold && !data && !error && <p className={panel.lead}>{t('loading')}</p>}
          {error && <p className={panel.lead}>{t('failed')}</p>}
          {data && (
            <>
              <div className={x.ghatakGrid}>
                {rows.map(r => {
                  const cur = r.stays.find(s => Date.parse(s.start) <= now && now < Date.parse(s.end))
                  const next = cur ? r.stays[r.stays.indexOf(cur) + 1] : undefined
                  if (!cur) return null
                  return (
                    <div key={r.id} className={cn(x.ghatakCard, x[`tone_${cur.tone}`])}>
                      <span className={styles.controlLabel}>{names.body(r.id)}</span>
                      <span className={x.ghatakValue}>{names.nak(cur.nakshatraIndex)}</span>
                      <span className={x.ghatakToday}>{t('tara', { tara: names.tara(cur.taraName) })}</span>
                      {next && (
                        <span className={x.ghatakToday}>
                          {t('next', { star: names.nak(next.nakshatraIndex), date: fmt.format(new Date(next.start)) })}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <VizCard
                title={t('timelineTitle')}
                caption={t('timelineCaption')}
                legend={[
                  { label: t('legendGood'), color: 'color-mix(in srgb, var(--teal) 34%, var(--surface-2))' },
                  { label: t('legendNeutral'), color: 'color-mix(in srgb, var(--amber) 30%, var(--surface-2))' },
                  { label: t('legendHard'), color: 'color-mix(in srgb, var(--rose) 34%, var(--surface-2))' },
                ]}
              >
                <div className={styles.vizScroll}>
                  <SlowTransitTimeline rows={rows} from={data.from} to={data.to} labels={names.labels} />
                </div>
              </VizCard>

              <SectionHead title={t('upcomingTitle')} />
              <div className={panel.tableWrap}>
                <table className={panel.table}>
                  <thead>
                    <tr>{(['planet', 'star', 'tara', 'from', 'to'] as const).map(k => <th key={k}>{t(`headers.${k}`)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.flatMap(r => r.stays
                      .filter(s => Date.parse(s.end) > now)
                      .slice(0, 4)
                      .map(s => (
                        <tr key={`${r.id}-${s.start}`}>
                          <td><strong>{r.id}</strong> {names.body(r.id)}</td>
                          <td>{names.nak(s.nakshatraIndex)}{s.enteredRetro ? ` (${t('retro')})` : ''}</td>
                          <td className={s.tone === 'auspicious' ? panel.inkGood : s.tone === 'inauspicious' ? panel.inkBad : panel.inkMid}>{names.tara(s.taraName)}</td>
                          <td>{fmt.format(new Date(s.start))}</td>
                          <td>{fmt.format(new Date(s.end))}</td>
                        </tr>
                      )))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </PlanGate>
    </div>
  )
}
