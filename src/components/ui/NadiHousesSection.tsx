'use client'
// ─────────────────────────────────────────────────────────────
//  src/components/ui/NadiHousesSection.tsx
//  Nadi readings, one tab at a time. Active lines lead.
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import type { ChartOutput } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { isClassicalGraha } from '@/lib/engine/houseInterpretations'
import { readNadiLiveFromChart, type NadiLiveBody, type NadiLiveHit, type NadiLiveReading } from '@/lib/engine/nadi/live'
import { NADI_KHAARAB_CHANNEL } from '@/lib/engine/nadi/yogas'
import { NADI_RASHI_AGE_NOTE } from '@/lib/engine/nadi/rashiAge'
import type { NadiChartReading } from '@/lib/engine/nadi'
import type { NadiFutureTechnique } from '@/lib/engine/nadi/future'
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

export type NadiReadingView = 'houses' | 'yogas' | 'marriage' | 'career' | 'wealth' | 'future' | 'timing' | 'transits' | 'remedies'

const SKY_IDS = ['Ju', 'Sa', 'Ra', 'Ke', 'Ma', 'Ve'] as const

const TECHNIQUE_LABEL: Record<NadiFutureTechnique, string> = {
  year: 'Year-count',
  sign: 'Sign age',
  planet: 'Planet age',
  degree: 'Degree',
  score: 'Score jump',
  afflicted: 'Afflicted house',
  wealth: 'Wealth age',
}

function ordinal(n: number): string {
  const mod = n % 10
  if (mod === 1 && n !== 11) return `${n}st`
  if (mod === 2 && n !== 12) return `${n}nd`
  if (mod === 3 && n !== 13) return `${n}rd`
  return `${n}th`
}

function whenLabel(start: string, end: string, timeZone: string | undefined, now: boolean): string {
  const fmt = (iso: string) => {
    const date = new Date(iso)
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
    try {
      return new Intl.DateTimeFormat('en-IN', { ...options, timeZone: timeZone || undefined }).format(date)
    } catch {
      return new Intl.DateTimeFormat('en-IN', options).format(date)
    }
  }
  return now ? `Open now, until ${fmt(end)}` : `${fmt(start)} – ${fmt(end)}`
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

const SKY_MARK: Record<'peak' | 'edge' | 'open' | 'quiet', string> = {
  peak: 'Peak',
  edge: 'Edge',
  open: 'Open',
  quiet: 'Quiet',
}

function skyClock(timeZone: string | undefined): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: timeZone || undefined,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date())
  }
}

function NadiNow({ chart }: { chart: ChartOutput }) {
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
        setClock(skyClock(chart.meta?.timezone))
        setSky(sky)
        setLive(readNadiLiveFromChart(chart, sky))
      })
      .catch(() => {
        if (!cancel) setError(true)
      })
    return () => { cancel = true }
  }, [chart])

  if (error) {
    return <Verdict kicker="Right now" title="The live sky could not be read." note="The chart windows below stay available." />
  }
  if (!live) {
    return <Verdict kicker="Right now" title="Reading the sky…" />
  }
  const open = live.hits.length
  return (
    <section className={styles.skyBoard} aria-label="Live sky">
      <Verdict kicker="Right now" title={live.headline} note={clock || null} />
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
              <span className={styles.skyName}>{GRAHA_NAMES[id]}</span>
              <span className={styles.skySign}>{RASHI_NAMES[planet.rashi]}</span>
              {through != null ? (
                <span className={styles.meter} aria-hidden>
                  <span style={{ width: `${through}%` }} />
                </span>
              ) : null}
              <span className={styles.skyMeta}>
                {degree ?? '—'}
                {planet.isRetro ? ' · Rx' : ''}
                {` · ${SKY_MARK[mark]}`}
              </span>
            </li>
          )
        })}
      </ol>
      <h3 className={styles.subhead}>{open === 0 ? 'No window is open' : open === 1 ? '1 window open' : `${open} windows open`}</h3>
      {open > 0 && (
        <ol className={styles.timeline}>
          {live.hits.map((hit) => (
            <li key={hit.id} className={`${styles.pass} ${hit.tone === 'caution' ? styles.toneCaution : hit.tone === 'support' ? styles.toneSupport : styles.tonePlain}`}>
              <div className={styles.passHead}>
                <span className={styles.passTitle}>{hit.title}</span>
                <span className={styles.tech}>{windowState(hit.reading)}</span>
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
  const [selected, setSelected] = useState<HouseNumber>(reading.bhriguHouse)
  useEffect(() => { setSelected(reading.bhriguHouse) }, [reading.bhriguHouse])
  const house = reading.houses[selected - 1] ?? reading.houses[0]
  if (!house) return null

  if (view === 'houses') {
    const signals = houseSignalFindings(reading)
    const combinations = combinationFindings(reading)
    const relatives = relativeFindings(reading)
    return (
      <div className={styles.stack}>
        <Verdict title={housesVerdict(reading)} />
        <FindingGrid items={withoutVerdict([...bhriguFindings(reading), ...signals], housesVerdict(reading))} />
        <Reference label="How the Bhrigu Bhava is read">
          <p className={styles.note}>{reading.bhriguNote}</p>
        </Reference>

        <div className={styles.layout}>
          <div className={styles.picker} role="tablist" aria-label="Houses">
            {reading.houses.map((row) => (
              <button
                key={row.house}
                type="button"
                role="tab"
                aria-selected={row.house === house.house}
                className={`${styles.houseBtn} ${row.house === house.house ? styles.houseBtnActive : ''}`}
                onClick={() => setSelected(row.house)}
              >
                <span className={styles.houseNo}>{row.house} {row.name}</span>
                <span className={styles.houseMeta}>
                  {row.signName}
                  {row.occupants.length > 0 ? ` · ${row.occupants.map((g) => g.name).join(', ')}` : ''}
                </span>
              </button>
            ))}
          </div>
          <div className={styles.detail} role="tabpanel">
            <h3>{ordinal(house.house)} house · {house.name}</h3>
            <p className={styles.metaLine}>
              {house.signName} · lord {house.lordName}
              {house.lordHouse ? ` in the ${ordinal(house.lordHouse)}` : ''}
              {` · this sign carries the nature of the ${ordinal(house.naturalHouse)} house (${house.naturalHouseLabel})`}
            </p>
            {house.roles.length > 0 && (
              <div className={styles.chips}>
                {house.roles.map((role) => <span key={role} className={styles.chip}>{role}</span>)}
              </div>
            )}
            <p className={styles.blockTitle}>On this chart</p>
            <ul className={styles.list}>
              {house.activeRules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
            {house.occupants.length > 0 && (
              <>
                <p className={styles.blockTitle}>Planets here</p>
                {house.occupants.map((g) => (
                  <div key={g.id} className={styles.occupant}>
                    <strong>
                      {g.name}
                      {g.retro ? ' retrograde' : ''}
                      {g.dignity ? ` · ${g.dignity.replaceAll('_', ' ')}` : ''}
                    </strong>
                    {g.nadiNote && <p>{g.nadiNote}</p>}
                    {g.signNote && <p>{g.signNote}</p>}
                    {g.classicalHouseNote && <p>{g.classicalHouseNote}</p>}
                    <p>
                      {g.bodyParts.join(', ')}
                      {g.professions.length > 0 ? ` · ${g.professions.join('; ')}` : ''}
                      {g.afflictedBy.length > 0 ? ` · Afflicted by ${g.afflictedBy.map((id) => GRAHA_NAMES[id as keyof typeof GRAHA_NAMES] ?? id).join(', ')}` : ''}
                    </p>
                  </div>
                ))}
              </>
            )}
            <Reference label="Significances and work">
              <div className={styles.chips}>
                {house.profile.significances.map((item) => <span key={item} className={styles.chip}>{item}</span>)}
              </div>
              <p className={styles.metaLine}>
                Body: {house.profile.bodyParts.join(', ')}
                {house.naturalKarakas.length > 0
                  ? ` · Natural karakas: ${house.naturalKarakas.map((id) => GRAHA_NAMES[id]).join(', ')}`
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
        </div>

        {combinations.length > 0 && (
          <>
            <p className={styles.blockTitle}>Combinations</p>
            <FindingGrid items={combinations} />
          </>
        )}
        {relatives.length > 0 && (
          <>
            <p className={styles.blockTitle}>A relative’s career is occupied</p>
            <FindingGrid items={relatives} />
          </>
        )}

        <Reference label="How the houses are read">
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
        <Reference label="House rotation">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Relative</th>
                  <th>House</th>
                  <th>Career</th>
                  <th>Marriage</th>
                  <th>Education</th>
                  <th>Death</th>
                  <th>In the career house</th>
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

  if (view === 'yogas') {
    const verdict = yogasVerdict(reading)
    const items = yogaFindings(reading)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={items.some((item) => item.tone === 'caution') ? reading.khaarabTheme : null} />
        <FindingGrid items={items} />
        <FindingGrid items={withoutVerdict(reading.dusthanaNotes.map((line, index) => ({
          id: `dust-${index}`,
          title: 'Dusthana',
          answer: line,
          tone: 'plain' as const,
        })), verdict)} />
        {reading.yogas.some((yoga) => yoga.career) && <p className={styles.rule}>{NADI_KHAARAB_CHANNEL}</p>}
      </div>
    )
  }

  if (view === 'marriage') {
    const verdict = marriageVerdict(reading)
    return (
      <div className={styles.stack}>
        <Verdict
          title={verdict}
          note={reading.marriageYogas.length > 1 ? 'More than one of these is present, so the marriage reading is stronger.' : null}
        />
        <FindingGrid items={reading.marriageYogas.length > 0 ? marriageFindings(reading).slice(1) : []} />
        <FindingGrid items={withoutVerdict(marriagePressureFindings(reading), verdict)} />
        <FindingGrid items={withoutVerdict(reading.navamshaNotes.map((line, index) => ({
          id: `d9-${index}`,
          title: 'Navamsha',
          answer: line,
          tone: 'plain' as const,
        })), verdict)} />
        <Reference label="How the marriage combinations are read">
          {reading.marriageNote ? <p className={styles.note}>{reading.marriageNote}</p> : null}
          <p className={styles.note}>{reading.navamshaNote}</p>
          <p className={styles.note}>{reading.marriageRuleNote}</p>
        </Reference>
      </div>
    )
  }

  if (view === 'career') {
    const verdict = careerVerdict(reading)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={reading.careerContext} />
        <FindingGrid items={withoutVerdict(careerFindings(reading), verdict)} />
        <Reference label="How Dashamsha, Shashtiamsa, and the neighborhood are read">
          <p className={styles.note}>{reading.dashamshaNote}</p>
          <p className={styles.note}>{reading.shashtiamsaNote}</p>
          <p className={styles.note}>{reading.neighborhoodNote}</p>
        </Reference>
      </div>
    )
  }

  if (view === 'wealth') {
    const verdict = wealthVerdict(reading)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={reading.wealthTimingNote} />
        <FindingGrid items={withoutVerdict(wealthFindings(reading), verdict)} />
        {(reading.propertyNotes.length > 0 || reading.vehicleNotes.length > 0) && (
          <Reference label="How property and vehicles are read">
            <p className={styles.note}>{reading.propertyNote}</p>
            <p className={styles.note}>{reading.vehicleNote}</p>
          </Reference>
        )}
      </div>
    )
  }

  if (view === 'future') {
    const verdict = futureVerdict(reading)
    const future = reading.future
    const zone = chart.meta?.timezone
    return (
      <div className={styles.stack}>
        <Verdict kicker="Coming years" title={verdict} note={future.note} />
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
                    <span className={styles.yearTitle}>{ordinal(year.year)} year{year.now ? ' · Now' : ''}</span>
                    <span className={styles.yearWhen}>
                      {year.calendar != null ? `around ${year.calendar}` : year.houseName}
                      {year.calendar != null ? ` · ${year.houseName}` : ''}
                    </span>
                  </div>
                  <div className={styles.techs}>
                    {year.techniques.map((tag) => (
                      <span key={tag} className={styles.tech}>{TECHNIQUE_LABEL[tag]}</span>
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

        <h3 className={styles.subhead}>Coming periods</h3>
        {future.periods.length === 0 ? (
          <p className={styles.metaLine}>The Vimshottari periods still ahead are not on this chart.</p>
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
                    <span className={styles.yearWhen}>{whenLabel(period.start, period.end, zone, period.now)}</span>
                  </div>
                  {period.lines.length === 0 ? (
                    <p className={styles.yearLine}>No extra reading from these techniques.</p>
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
            <h3 className={styles.subhead}>When Jupiter moves</h3>
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
    const verdict = timingVerdict(reading)
    const running = reading.timings.filter((row) => row.running)
    return (
      <div className={styles.stack}>
        <Verdict title={verdict} note={reading.degreeNote} />
        <FindingGrid items={withoutVerdict(timingFindings(reading), verdict)} />
        {reading.specialNotes.length > 0 && <p className={styles.note}>{reading.specialNote}</p>}
        <p className={styles.note}>{NADI_RASHI_AGE_NOTE}</p>
        {running.length === 0 && (
          <p className={styles.metaLine}>No lord of these rotated houses is in the current Vimshottari path.</p>
        )}
      </div>
    )
  }

  if (view === 'transits') {
    const verdict = transitVerdict(reading)
    const natal = withoutVerdict(transitFindings(reading), verdict)
    const groups = natal.filter((item) => item.title === 'Jupiter' || item.title === 'Saturn')
    const rest = natal.filter((item) => item.title !== 'Jupiter' && item.title !== 'Saturn')
    return (
      <div className={styles.stack}>
        <NadiNow chart={chart} />
        <Verdict kicker="On the birth chart" title={verdict} note={reading.slowTransitNote} />
        {groups.length > 0 && (
          <ol className={styles.groupBoard}>
            {groups.map((item) => {
              const sign = /share ([^.]+)\./.exec(item.answer)?.[1]
              return (
                <li key={item.id} className={`${styles.pass} ${item.tone === 'caution' ? styles.toneCaution : item.tone === 'support' ? styles.toneSupport : styles.tonePlain}`}>
                  <div className={styles.passHead}>
                    <span className={styles.passTitle}>{sign ?? item.title}</span>
                    <span className={styles.tech}>{item.title} returns</span>
                  </div>
                  <p className={styles.yearLine}>{item.answer}</p>
                </li>
              )
            })}
          </ol>
        )}
        <FindingGrid items={rest} />
        <Reference label="Jupiter over each natal planet">
          <div className={styles.catalog}>
            {reading.jupiterTransit.map((row) => (
              <article key={row.planet} className={styles.catalogRow}>
                <p className={styles.catalogPlanet}>{row.planet}</p>
                <p className={styles.catalogResult}>{row.result}</p>
              </article>
            ))}
          </div>
        </Reference>
        <Reference label="Saturn, Rahu, and Ketu over each natal planet">
          <div className={styles.catalog}>
            {reading.saturnTransit.map((row) => (
              <article key={`sa-${row.planet}`} className={styles.catalogRow}>
                <p className={styles.catalogPlanet}>Saturn over {row.planet}</p>
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
        <Reference label="8th from each relative">
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Relative</th>
                  <th>8th from them</th>
                  <th>Lord</th>
                  <th>Navamsha</th>
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

  const verdict = remedyVerdict(reading)
  return (
    <div className={styles.stack}>
      <Verdict title={verdict} note={reading.gemNote} />
      <FindingGrid items={withoutVerdict(remedyFindings(reading), verdict)} />
      <Reference label="Stone, metal, finger, and day">
        <ul className={styles.list}>
          {reading.gemReference.map((row) => (
            <li key={row.planet}>{row.planet}: {row.line}</li>
          ))}
        </ul>
      </Reference>
    </div>
  )
}
