'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NadiHousesSection.tsx
//  Nadi readings, one tab at a time. Active lines lead.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SHORT } from '@/types/astrology'
import { GRAHA_HI, RASHI_HI } from '@/i18n/jyotish'
import { useLang } from '@/i18n/useLang'
import { nadiOrdinal } from '@/components/ui/nadiFindings'
import { getChartHouseClassical } from '@/lib/engine/classicalChartAnalysis'
import { ClassicalNotesList } from '@/components/ui/ClassicalNotesList'
import { isClassicalGraha } from '@/lib/engine/houseInterpretations'
import { readNadiLiveFromChart, type NadiLiveBody, type NadiLiveHit, type NadiLiveReading } from '@/lib/engine/nadi/live'
import { NADI_KHAARAB_CHANNEL } from '@/lib/engine/nadi/yogas'
import { NADI_RASHI_AGE_NOTE, NADI_RASHI_AGE_NOTE_HI } from '@/lib/engine/nadi/rashiAge'
import { NADI_YOGA_CHANNEL_HI } from '@/lib/engine/locale/nadiYogas.hi'
import type { NadiChartReading } from '@/lib/engine/nadi'
import type { HouseNumber } from '@/lib/engine/houseInterpretations'
import {
  FindingGrid,
  Reference,
  Verdict,
  bhriguFindings,
  careerFindings,
  careerVerdict,
  combinationFindings,
  houseSignalFindings,
  placementFindings,
  lifeFindings,
  lifeVerdict,
  patelFindings,
  patelVerdict,
  housesVerdict,
  marriageFindings,
  marriagePressureFindings,
  marriageVerdict,
  relativeFindings,
  remedyFindings,
  remedyVerdict,
  futureVerdict,
  linesTone,
  timingFindings,
  timingVerdict,
  transitFindings,
  transitVerdict,
  wealthFindings,
  wealthVerdict,
  withoutVerdict,
  yogaFindings,
  yogasVerdict,
} from '@/components/ui/nadiFindings'
import styles from './NadiHousesSection.module.css'

export type NadiReadingView = 'houses' | 'life' | 'yogas' | 'marriage' | 'career' | 'wealth' | 'future' | 'timing' | 'patel' | 'transits' | 'remedies'

const SKY_IDS = ['Ju', 'Sa', 'Ra', 'Ke', 'Ma', 'Ve'] as const

function whenLabel(
  start: string,
  end: string,
  timeZone: string | undefined,
  now: boolean,
  hi: boolean,
  openUntil: (end: string) => string,
  range: (start: string, end: string) => string,
): string {
  const locale = hi ? 'hi-IN' : 'en-IN'
  const fmt = (iso: string) => {
    const date = new Date(iso)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
    try {
      return new Intl.DateTimeFormat(locale, { ...options, timeZone: timeZone || undefined }).format(date)
    } catch {
      return new Intl.DateTimeFormat(locale, options).format(date)
    }
  }
  return now ? openUntil(fmt(end)) : range(fmt(start), fmt(end))
}

function shownDegree(degree?: number): string | null {
  if (degree == null || !Number.isFinite(degree)) return null
  const rounded = Math.round(degree * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}°` : `${rounded.toFixed(1)}°`
}

function windowState(reading: string): 'Peak' | 'Sign edge' | 'Window' {
  if (/peak/i.test(reading)) return 'Peak'
  if (/edge|neighbouring/i.test(reading)) return 'Sign edge'
  return 'Window'
}

function moversOf(hit: NadiLiveHit): string[] {
  const over = /^(.+) over\b/.exec(hit.title)
  if (over?.[1]) return [over[1]]
  const names = SKY_IDS.map((id) => GRAHA_NAMES[id])
  if (names.includes(hit.title)) return [hit.title]
  return names.filter((name) => new RegExp(`\\b${name}\\b`).test(hit.answer) && !new RegExp(`over (?:natal )?${name}\\b`).test(hit.answer))
}

function skyMark(name: string, hits: readonly NadiLiveHit[]): 'peak' | 'edge' | 'open' | 'quiet' {
  const related = hits.filter((hit) => moversOf(hit).includes(name))
  if (related.length === 0) return 'quiet'
  const text = related.map((hit) => `${hit.answer} ${hit.reading}`).join(' ')
  if (/peak/i.test(text)) return 'peak'
  if (/edge|neighbouring/i.test(text)) return 'edge'
  return 'open'
}

function skyClock(timeZone: string | undefined, hi: boolean): string {
  const locale = hi ? 'hi-IN' : 'en-IN'
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timeZone || undefined,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date())
  }
}

function NadiNow({ chart }: { chart: ChartOutput }) {
  const t = useTranslations('nadi.houses')
  const { hi } = useLang()
  const [live, setLive] = useState<NadiLiveReading | null>(null)
  const [sky, setSky] = useState<NadiLiveBody[]>([])
  const [error, setError] = useState(false)
  const [clock, setClock] = useState('')

  useEffect(() => {
    let cancel = false
    setLive(null)
    setSky([])
    setError(false)
    const settings = chart.meta?.settings
    const params = new URLSearchParams({
      at: new Date().toISOString(),
      ayanamsha: settings?.ayanamsha ?? 'lahiri',
      node: settings?.nodeMode === 'mean' ? 'mean' : 'true',
    })
    fetch(`/api/transits/planets?${params}`)
      .then((res) => res.json())
      .then((body: { success?: boolean; grahas?: NadiLiveBody[] }) => {
        if (cancel) return
        const sky = (body.grahas ?? []).flatMap((planet) => {
          if (!isClassicalGraha(planet.id) || !planet.rashi) return []
          return [{ id: planet.id, rashi: planet.rashi, degree: planet.degree, isRetro: planet.isRetro }]
        })
        if (!body.success || sky.length === 0) {
          setError(true)
          return
        }
        setClock(skyClock(chart.meta?.timezone, hi))
        setSky(sky)
        setLive(readNadiLiveFromChart(chart, sky, hi ? 'hi' : 'en'))
      })
      .catch(() => {
        if (!cancel) setError(true)
      })
    return () => { cancel = true }
  }, [chart, hi])

  const stateLabel = (reading: string) => {
    const state = windowState(reading)
    if (state === 'Peak') return t('statePeak')
    if (state === 'Sign edge') return t('stateEdge')
    return t('stateWindow')
  }
  const markLabel = { peak: t('markPeak'), edge: t('markEdge'), open: t('markOpen'), quiet: t('markQuiet') }

  if (error) {
    return <Verdict kicker={t('rightNow')} title={t('skyErrorTitle')} note={t('skyErrorNote')} />
  }
  if (!live) {
    return <Verdict kicker={t('rightNow')} title={t('skyLoading')} />
  }
  const open = live.hits.length
  return (
    <section className={styles.skyBoard} aria-label={t('liveSky')}>
      <Verdict kicker={t('rightNow')} title={live.headline} note={clock || null} />
      <ol className={styles.sky}>
        {SKY_IDS.map((id) => {
          const planet = sky.find((body) => body.id === id)
          if (!planet) return null
          const mark = skyMark(GRAHA_NAMES[id], live.hits)
          const markClass = mark === 'peak' ? styles.skyPeak : mark === 'edge' ? styles.skyEdge : mark === 'open' ? styles.skyOpen : styles.skyQuiet
          const degree = shownDegree(planet.degree)
          const through = planet.degree == null ? null : Math.max(6, Math.min(100, (planet.degree / 30) * 100))
          return (
            <li key={id} className={`${styles.skyTile} ${markClass}`}>
              <span className={styles.skyGlyph}>{id}</span>
              <span className={styles.skyName}>{hi ? GRAHA_HI[id] : GRAHA_NAMES[id]}</span>
              <span className={styles.skySign}>{hi ? RASHI_HI[planet.rashi] : RASHI_NAMES[planet.rashi]}</span>
              {through != null ? (
                <span className={styles.meter} aria-hidden>
                  <span style={{ width: `${through}%` }} />
                </span>
              ) : null}
              <span className={styles.skyMeta}>
                {degree ?? '—'}
                {planet.isRetro ? ' · Rx' : ''}
                {` · ${markLabel[mark]}`}
              </span>
            </li>
          )
        })}
      </ol>
      <h3 className={styles.subhead}>{open === 0 ? t('windows0') : open === 1 ? t('windows1') : t('windowsN', { n: open })}</h3>
      {open > 0 && (
        <ol className={styles.timeline}>
          {live.hits.map((hit) => (
            <li key={hit.id} className={`${styles.pass} ${hit.tone === 'caution' ? styles.toneCaution : hit.tone === 'support' ? styles.toneSupport : styles.tonePlain}`}>
              <div className={styles.passHead}>
                <span className={styles.passTitle}>{hit.title}</span>
                <span className={styles.tech}>{stateLabel(hit.reading)}</span>
              </div>
              <p className={styles.passAnswer}>{hit.answer}</p>
              {hit.reading ? <p className={styles.yearLine}>{hit.reading}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function NadiHousesSection({ chart, view, reading }: { chart: ChartOutput; view: NadiReadingView; reading: NadiChartReading }) {
  const t = useTranslations('nadi.houses')
  const tt = useTranslations('nadi.houses.tech')
  const tf = useTranslations('nadi.findings.titles')
  const { hi } = useLang()
  const ordinal = (n: number) => nadiOrdinal(n, hi)
  const [selected, setSelected] = useState<HouseNumber>(reading.bhriguHouse)
  useEffect(() => { setSelected(reading.bhriguHouse) }, [reading.bhriguHouse])
  const house = reading.houses[selected - 1] ?? reading.houses[0]
  if (!house) return null

  if (view === 'houses') {
    const signals = houseSignalFindings(reading)
    const combinations = combinationFindings(reading, hi)
    const relatives = relativeFindings(reading)
    const classical = getChartHouseClassical(chart, house.house)
    const specialAspects = classical.aspectHits.filter((hit) => hit.aspectSpan !== 7)
    const seventh = classical.aspectHits.filter((hit) => hit.aspectSpan === 7)
    const notesFor = (id: string) => classical.occupantNotes.find((row) => row.grahaId === id)?.notes ?? []
    return (
      <div className={styles.stack}>
        <Verdict title={housesVerdict(reading, hi)} />
        <div className={styles.houseGrid} role="tablist" aria-label={t('housesAria')}>
          {reading.houses.map((row) => {
            const active = row.house === house.house
            const bhrigu = row.house === reading.bhriguHouse
            return (
              <button
                key={row.house}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.houseCell} ${active ? styles.houseCellActive : ''} ${bhrigu ? styles.houseCellBhrigu : ''}`}
                onClick={() => setSelected(row.house)}
              >
                <span className={styles.houseIndex}>{row.house}</span>
                <span className={styles.houseName}>{row.name}</span>
                <span className={styles.houseSign}>{hi ? RASHI_HI[row.sign] : RASHI_SHORT[row.sign]}</span>
                <span className={styles.housePlanets}>
                  {row.occupants.length > 0 ? row.occupants.map((g) => g.id).join(' ') : '—'}
                </span>
                {bhrigu ? <span className={styles.bhriguMark}>{t('bhrigu')}</span> : null}
              </button>
            )
          })}
        </div>
        <div className={styles.detailCard} role="tabpanel">
          <h3>{t('houseHead', { ord: ordinal(house.house), name: house.name })}</h3>
          <p className={styles.metaLine}>
            {t('meta', {
              sign: hi ? RASHI_HI[house.sign] : house.signName,
              lord: hi ? (GRAHA_HI[house.lord as keyof typeof GRAHA_HI] ?? house.lordName) : house.lordName,
              placed: house.lordHouse ? t('lordIn', { ord: ordinal(house.lordHouse) }) : '',
              carries: t('signCarries', { ord: ordinal(house.naturalHouse), label: house.naturalHouseLabel }),
            })}
          </p>
          <p className={styles.prediction}>{house.prediction}</p>
          {(house.roles.length > 0 || house.papaPresent || house.house === reading.bhriguHouse) && (
            <div className={styles.chips}>
              {house.house === reading.bhriguHouse ? <span className={styles.chip}>{t('bhriguBhava')}</span> : null}
              {house.papaPresent ? <span className={styles.chip}>{t('papaHere')}</span> : null}
              {house.roles.map((role) => <span key={role} className={styles.chip}>{role}</span>)}
            </div>
          )}
          <p className={styles.blockTitle}>{t('onChart')}</p>
          <ul className={styles.list}>
            {house.activeRules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
          {house.occupants.length > 0 && (
            <>
              <p className={styles.blockTitle}>{t('planetsHere')}</p>
              <div className={styles.occupants}>
                {house.occupants.map((g) => (
                  <div key={g.id} className={styles.occupant}>
                    <strong>
                      {g.name}
                      {g.retro ? t('retro') : ''}
                      {g.dignity ? ` · ${g.dignity.replaceAll('_', ' ')}` : ''}
                    </strong>
                    <p>{g.prediction || g.nadiNote}</p>
                    {g.signNote && <p>{g.signNote}</p>}
                    {g.classicalHouseNote && <p>{g.classicalHouseNote}</p>}
                    <ClassicalNotesList title={t('classical')} notes={notesFor(g.id)} quiet />
                    <p>
                      {g.bodyParts.join(', ')}
                      {g.professions.length > 0 ? ` · ${g.professions.join('; ')}` : ''}
                      {g.afflictedBy.length > 0 ? t('afflictedBy', { names: g.afflictedBy.map((id) => (hi ? GRAHA_HI[id as keyof typeof GRAHA_HI] : GRAHA_NAMES[id as keyof typeof GRAHA_NAMES]) ?? id).join(', ') }) : ''}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
          {(classical.lordship?.notes.length || specialAspects.length > 0) && (
            <>
              <p className={styles.blockTitle}>{t('classicalLord')}</p>
              {classical.lordship && classical.lordship.notes.length > 0 && (
                <ClassicalNotesList
                  title={t('lordPlaced', {
                    title: classical.lordship.isLagnaLord ? t('lagnaLord') : t('lordOfHouse', { ord: ordinal(house.house) }),
                    graha: hi ? GRAHA_HI[classical.lordship.lordId] : GRAHA_NAMES[classical.lordship.lordId],
                    ord: ordinal(classical.lordship.placedIn),
                  })}
                  notes={classical.lordship.notes}
                  quiet
                />
              )}
              {specialAspects.length > 0 && (
                <ClassicalNotesList
                  title={t('specialAspects')}
                  notes={specialAspects.map((hit) => hit.note)}
                  quiet
                />
              )}
              {seventh.length > 0 && (
                <p className={styles.metaLine}>
                  {t('seventhAspect', { names: seventh.map((hit) => hi ? GRAHA_HI[hit.fromGraha] : GRAHA_NAMES[hit.fromGraha]).join(', ') })}
                </p>
              )}
            </>
          )}
          <Reference label={t('refClassical')}>
            <ClassicalNotesList title={t('house')} notes={classical.houseNotes} quiet />
            <ClassicalNotesList title={house.signName} notes={classical.rashiNotes} />
          </Reference>
          <Reference label={t('refWork')}>
            <div className={styles.chips}>
              {house.profile.significances.map((item) => <span key={item} className={styles.chip}>{item}</span>)}
            </div>
            <p className={styles.metaLine}>
              {t('body', { parts: house.profile.bodyParts.join(', ') })}
              {house.naturalKarakas.length > 0
                ? t('karakas', { names: house.naturalKarakas.map((id) => hi ? GRAHA_HI[id] : GRAHA_NAMES[id]).join(', ') })
                : ''}
            </p>
            {house.signNature && <p className={styles.metaLine}>{house.signNature}</p>}
            {house.signInHouse && <p className={styles.metaLine}>{house.signInHouse}</p>}
            {house.profile.professions.length > 0 && (
              <div className={styles.chips}>
                {house.profile.professions.map((item) => <span key={item} className={styles.chip}>{item}</span>)}
              </div>
            )}
          </Reference>
        </div>

        <p className={styles.blockTitle}>{t('everyPlanet')}</p>
        <FindingGrid items={placementFindings(reading, hi)} />
        <Reference label={t('howPlanet')}>
          <p className={styles.note}>{reading.placementNote}</p>
        </Reference>
        <FindingGrid items={withoutVerdict([...bhriguFindings(reading), ...signals], housesVerdict(reading, hi))} />
        <Reference label={t('howBhrigu')}>
          <p className={styles.note}>{reading.bhriguNote}</p>
        </Reference>

        {combinations.length > 0 && (
          <>
            <p className={styles.blockTitle}>{t('combinations')}</p>
            <FindingGrid items={combinations} />
          </>
        )}
        {relatives.length > 0 && (
          <>
            <p className={styles.blockTitle}>{t('relativeOccupied')}</p>
            <FindingGrid items={relatives} />
          </>
        )}

        <Reference label={t('howHouses')}>
          <div className={styles.pillars}>
            {reading.pillars.map((pillar) => (
              <div key={pillar.id} className={styles.pillar}>
                <b>{pillar.rank}. {pillar.label}</b>
                <span>{pillar.note}</span>
              </div>
            ))}
          </div>
          <p className={styles.rule}>{reading.maleficRule}</p>
          <p className={styles.rule}>{reading.rotationNote}</p>
        </Reference>
        <Reference label={t('rotation')}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('thRelative')}</th>
                  <th>{t('thHouse')}</th>
                  <th>{t('thCareer')}</th>
                  <th>{t('thMarriage')}</th>
                  <th>{t('thEducation')}</th>
                  <th>{t('thDeath')}</th>
                  <th>{t('thInCareer')}</th>
                </tr>
              </thead>
              <tbody>
                {reading.relatives.map((rel) => (
                  <tr key={rel.id}>
                    <td>{rel.label}</td>
                    <td>{ordinal(rel.house)}</td>
                    <td>{ordinal(rel.careerHouse)}</td>
                    <td>{ordinal(rel.marriageHouse)}</td>
                    <td>{ordinal(rel.educationHouse)}</td>
                    <td>{ordinal(rel.deathHouse)}</td>
                    <td>{rel.careerOccupants.length > 0 ? rel.careerOccupants.join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reference>
      </div>
    )
  }

  if (view === 'life') {
    const verdict = lifeVerdict(reading, hi)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={reading.life.note} />
        <FindingGrid items={withoutVerdict(lifeFindings(reading), verdict)} />
      </div>
    )
  }

  if (view === 'yogas') {
    const verdict = yogasVerdict(reading, hi)
    const items = yogaFindings(reading)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={items.some((item) => item.tone === 'caution') ? reading.khaarabTheme : null} />
        <FindingGrid items={items} />
        <FindingGrid items={withoutVerdict(reading.dusthanaNotes.map((line, index) => ({
          id: `dust-${index}`,
          title: 'Dusthana',
          titleKey: 'dusthana',
          answer: line,
          tone: 'plain' as const,
        })), verdict)} />
        {reading.yogas.some((yoga) => yoga.career) && <p className={styles.rule}>{hi ? NADI_YOGA_CHANNEL_HI : NADI_KHAARAB_CHANNEL}</p>}
      </div>
    )
  }

  if (view === 'marriage') {
    const verdict = marriageVerdict(reading, hi)
    return (
      <div className={styles.stack}>
        <Verdict
          title={verdict}
          note={reading.marriageYogas.length > 1 ? t('marriageStronger') : null}
        />
        <FindingGrid items={reading.marriageYogas.length > 0 ? marriageFindings(reading).slice(1) : []} />
        <FindingGrid items={withoutVerdict(marriagePressureFindings(reading), verdict)} />
        <FindingGrid items={withoutVerdict(reading.navamshaNotes.map((line, index) => ({
          id: `d9-${index}`,
          title: 'Navamsha',
          titleKey: 'navamsha',
          answer: line,
          tone: 'plain' as const,
        })), verdict)} />
        <Reference label={t('howMarriage')}>
          {reading.marriageNote ? <p className={styles.note}>{reading.marriageNote}</p> : null}
          <p className={styles.note}>{reading.navamshaNote}</p>
          <p className={styles.note}>{reading.marriageRuleNote}</p>
        </Reference>
      </div>
    )
  }

  if (view === 'career') {
    const verdict = careerVerdict(reading, hi)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={reading.careerContext} />
        <FindingGrid items={withoutVerdict(careerFindings(reading), verdict)} />
        <Reference label={t('howCareer')}>
          <p className={styles.note}>{reading.dashamshaNote}</p>
          <p className={styles.note}>{reading.shashtiamsaNote}</p>
          <p className={styles.note}>{reading.neighborhoodNote}</p>
        </Reference>
      </div>
    )
  }

  if (view === 'wealth') {
    const verdict = wealthVerdict(reading, hi)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={reading.wealthTimingNote} />
        <FindingGrid items={withoutVerdict(wealthFindings(reading), verdict)} />
        {(reading.propertyNotes.length > 0 || reading.vehicleNotes.length > 0) && (
          <Reference label={t('howProperty')}>
            <p className={styles.note}>{reading.propertyNote}</p>
            <p className={styles.note}>{reading.vehicleNote}</p>
          </Reference>
        )}
      </div>
    )
  }

  if (view === 'future') {
    const verdict = futureVerdict(reading, hi)
    const future = reading.future
    const zone = chart.meta?.timezone
    return (
      <div className={styles.stack}>
        <Verdict kicker={t('comingYears')} title={verdict} note={future.note} />
        {future.years.length > 0 && (
          <ol className={styles.timeline}>
            {future.years.map((year) => {
              const tone = linesTone(year.lines)
              const stacked = year.techniques.some((tag) => tag !== 'year')
              return (
                <li
                  key={year.year}
                  className={`${styles.yearCard} ${year.now && tone !== 'caution' ? styles.yearNow : ''} ${tone === 'caution' ? styles.toneCaution : ''} ${tone === 'support' && !year.now ? styles.toneSupport : ''} ${stacked ? styles.yearStack : ''}`}
                >
                  <div className={styles.yearHead}>
                    <span className={styles.yearTitle}>{year.now ? t('yearNow', { ord: ordinal(year.year) }) : t('yearTitle', { ord: ordinal(year.year) })}</span>
                    <span className={styles.yearWhen}>
                      {year.calendar != null ? t('aroundHouse', { year: year.calendar, house: year.houseName }) : year.houseName}
                    </span>
                  </div>
                  <div className={styles.techs}>
                    {year.techniques.map((tag) => (
                      <span key={tag} className={styles.tech}>{tt(tag)}</span>
                    ))}
                  </div>
                  {year.lines.map((line) => (
                    <p key={line} className={styles.yearLine}>{line}</p>
                  ))}
                </li>
              )
            })}
          </ol>
        )}

        <h3 className={styles.subhead}>{t('comingPeriods')}</h3>
        {future.periods.length === 0 ? (
          <p className={styles.metaLine}>{t('noPeriods')}</p>
        ) : (
          <ol className={styles.timeline}>
            {future.periods.map((period) => {
              const tone = linesTone(period.lines)
              return (
                <li
                  key={period.id}
                  className={`${styles.yearCard} ${period.now && tone !== 'caution' ? styles.yearNow : ''} ${tone === 'caution' ? styles.toneCaution : ''} ${tone === 'support' && !period.now ? styles.toneSupport : ''}`}
                >
                  <div className={styles.yearHead}>
                    <span className={styles.yearTitle}>{period.title}</span>
                    <span className={styles.yearWhen}>{whenLabel(period.start, period.end, zone, period.now, hi, (end) => t('openUntil', { end }), (start, end) => t('range', { start, end }))}</span>
                  </div>
                  {period.lines.length === 0 ? (
                    <p className={styles.yearLine}>{t('noExtra')}</p>
                  ) : period.lines.map((line) => (
                    <p key={line} className={styles.yearLine}>{line}</p>
                  ))}
                </li>
              )
            })}
          </ol>
        )}

        {future.windows.length > 0 && (
          <>
            <h3 className={styles.subhead}>{t('whenJupiter')}</h3>
            <ul className={styles.list}>
              {future.windows.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    )
  }

  if (view === 'timing') {
    const verdict = timingVerdict(reading, hi)
    const running = reading.timings.filter((row) => row.running)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={reading.degreeNote} />
        <FindingGrid items={withoutVerdict(timingFindings(reading), verdict)} />
        {reading.specialNotes.length > 0 && <p className={styles.note}>{reading.specialNote}</p>}
        <p className={styles.note}>{hi ? NADI_RASHI_AGE_NOTE_HI : NADI_RASHI_AGE_NOTE}</p>
        {running.length === 0 && (
          <p className={styles.metaLine}>{t('noRotated')}</p>
        )}
      </div>
    )
  }

  if (view === 'transits') {
    const verdict = transitVerdict(reading, hi)
    const natal = withoutVerdict(transitFindings(reading), verdict)
    const groups = natal.filter((item) => item.titleKey === 'jupiter' || item.titleKey === 'saturn')
    const rest = natal.filter((item) => item.titleKey !== 'jupiter' && item.titleKey !== 'saturn')
    return (
      <div className={styles.stack}>
        <NadiNow chart={chart} />
        <Verdict kicker={t('onBirth')} title={verdict} note={reading.slowTransitNote} />
        {groups.length > 0 && (
          <ol className={styles.groupBoard}>
            {groups.map((item) => {
              const sign = /share ([^.]+)\./.exec(item.answer)?.[1]
              return (
                <li key={item.id} className={`${styles.pass} ${item.tone === 'caution' ? styles.toneCaution : item.tone === 'support' ? styles.toneSupport : styles.tonePlain}`}>
                  <div className={styles.passHead}>
                    <span className={styles.passTitle}>{sign ?? (item.titleKey ? tf(item.titleKey) : item.title)}</span>
                    <span className={styles.tech}>{t('returns', { planet: item.titleKey ? tf(item.titleKey) : item.title })}</span>
                  </div>
                  <p className={styles.yearLine}>{item.answer}</p>
                </li>
              )
            })}
          </ol>
        )}
        <FindingGrid items={rest} />
        <Reference label={t('refJupiter')}>
          <div className={styles.catalog}>
            {reading.jupiterTransit.map((row) => (
              <article key={row.planet} className={styles.catalogRow}>
                <p className={styles.catalogPlanet}>{row.planet}</p>
                <p className={styles.catalogResult}>{row.result}</p>
              </article>
            ))}
          </div>
        </Reference>
        <Reference label={t('refSaturn')}>
          <div className={styles.catalog}>
            {reading.saturnTransit.map((row) => (
              <article key={`sa-${row.planet}`} className={styles.catalogRow}>
                <p className={styles.catalogPlanet}>{t('saturnOver', { planet: row.planet })}</p>
                <p className={styles.catalogResult}>{row.result}</p>
              </article>
            ))}
            {reading.nodeTransit.map((row) => (
              <article key={row.planet} className={styles.catalogRow}>
                <p className={styles.catalogPlanet}>{row.planet}</p>
                <p className={styles.catalogResult}>{row.result}</p>
              </article>
            ))}
          </div>
        </Reference>
        <Reference label={t('eighthTitle')}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('thRelative')}</th>
                  <th>{t('thEighth')}</th>
                  <th>{t('thLord')}</th>
                  <th>{t('thNavamsha')}</th>
                </tr>
              </thead>
              <tbody>
                {reading.deathIndicators.map((row) => (
                  <tr key={row.id}>
                    <td>{row.label}</td>
                    <td>{ordinal(row.house)}</td>
                    <td>{row.lordName}</td>
                    <td>{row.navamshaName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reference>
      </div>
    )
  }

  if (view === 'patel') {
    const verdict = patelVerdict(reading, hi)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={reading.patel.note} />
        <FindingGrid items={withoutVerdict(patelFindings(reading, hi), verdict)} />
      </div>
    )
  }

  const verdict = remedyVerdict(reading, hi)
  return (
    <div className={styles.stack}>
      <Verdict title={verdict} note={reading.gemNote} />
      <FindingGrid items={withoutVerdict(remedyFindings(reading), verdict)} />
      <Reference label={t('stoneRef')}>
        <ul className={styles.list}>
          {reading.gemReference.map((row) => (
            <li key={row.planet}>{row.planet}: {row.line}</li>
          ))}
        </ul>
      </Reference>
    </div>
  )
}
