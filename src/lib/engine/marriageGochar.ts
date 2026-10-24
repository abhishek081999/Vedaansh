// src/lib/engine/marriageGochar.ts
// Jupiter–Saturn double transit is a bright chance for marriage only when
// the running dasha already touches a marriage house, and only inside the
// years a marriage is possible. Dated windows are scanned from the sky.
// Pure engine — no React/DB.

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { analyzeSeventhLord, type MarriageAgeBand } from '@/lib/engine/seventhLord'
import type { LifeTone, MarriedLifeNote } from '@/lib/engine/marriedLifeAnalysis'
// Sky scan uses Swiss Ephemeris — keep it out of this module so client UI can import safely.
// Use marriageGocharScan.ts /api/marriage/gochar-windows + injectWindows for dated windows.

export type MarriageTransitKind = 'double-1' | 'double-7' | 'jupiter-lagna'

export interface MarriageTransitWindow {
  start: string
  end: string
  kind: MarriageTransitKind
  inDasha: boolean
  inAgeBand: boolean | null
}

export interface MarriageGocharFlags {
  dashaSupports: boolean | null
  houses: number[]
  childrenVehicle: boolean
}

export interface MarriageGocharReading {
  headline: string
  summary: string
  principles: string
  window: MarriedLifeNote[]
  windows: MarriageTransitWindow[]
  muhurtaFrom?: string
  muhurtaTo?: string
  flags: MarriageGocharFlags
}

export interface MarriageGocharOptions {
  now?: Date
  /** Years label when a completed scan found no windows (default 8). */
  scanYears?: number
  /**
   * @deprecated No in-process ephemeris scan — use injectWindows from the API.
   * Kept so existing callers/tests keep compiling.
   */
  skipScan?: boolean
  /**
   * Precomputed sky windows (from marriageGocharScan / API / tests).
   * Pass `[]` after a completed scan with no hits to emit the “no sky window” note.
   * Omit (undefined) when windows are not available yet.
   */
  injectWindows?: Array<Pick<MarriageTransitWindow, 'start' | 'end' | 'kind'> | MarriageTransitWindow>
}

const SUPPORT = [7, 2, 5, 11, 3, 1, 4, 8]

const LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const AGE_YEARS: Record<MarriageAgeBand, [number, number] | null> = {
  timely: [21, 28],
  delayed: [28, 32],
  late: [35, 55],
  open: null,
}

export const MARRIAGE_GOCHAR_PRINCIPLES =
  'A double transit of Saturn and Jupiter on the 1st or the 7th is one bright chance for marriage, once the soul’s stretch of being alone is over. On that house means the planet sits there or glances it: Jupiter by the 5th, 7th, and 9th, Saturn by the 3rd, 7th, and 10th. Jupiter also confirms by reaching Venus or the Moon. It is not the marriage. Outside the years a marriage is possible, the transit passes with no wedding. Jupiter’s transit on the lagna alone has coincided with marriage when the dasha was already open. Transit without that dasha passes. The dasha may be any planet tied to houses 1, 2, 3, 4, 5, 7, 8, or 11. Saturn is looked for in the periods of marriages that stay. When the sky, the period, and the marriageable years agree, that is the strong case — and only if the birth chart already promises a marriage. The promise is read separately. A transit does not create it. Dated windows are search ranges, not a guaranteed wedding day. The same sky returns every few years, so the transit alone is never the wedding.'

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOfAsc(asc: number, house: number): Rashi {
  return ((((asc - 1 + house - 1) % 12) + 1) as Rashi)
}

function gn(id: GrahaId | string): string {
  return GRAHA_NAMES[id as GrahaId] ?? id
}

function find(list: GrahaData[], id: GrahaId): GrahaData | undefined {
  return list.find(g => g.id === id)
}

function note(id: string, title: string, detail: string, tone: LifeTone): MarriedLifeNote {
  return { id, title, detail, tone }
}

function ordinalHouse(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function influences(fromHouse: number, targetHouse: number, planet: 'Ju' | 'Sa'): boolean {
  if (fromHouse === targetHouse) return true
  const diff = ((targetHouse - fromHouse + 12) % 12) + 1
  if (diff === 7) return true
  if (planet === 'Ju' && (diff === 5 || diff === 9)) return true
  if (planet === 'Sa' && (diff === 3 || diff === 10)) return true
  return false
}

/** Pure classifier for one month’s Ju/Sa houses from natal asc. Occupation or full glance. */
export function classifyTransitMonth(juHouse: number, saHouse: number): MarriageTransitKind | null {
  if (juHouse === 1 && saHouse === 1) return 'double-1'
  if (juHouse === 7 && saHouse === 7) return 'double-7'
  if (influences(juHouse, 7, 'Ju') && influences(saHouse, 7, 'Sa')) return 'double-7'
  if (influences(juHouse, 1, 'Ju') && influences(saHouse, 1, 'Sa')) return 'double-1'
  if (influences(juHouse, 1, 'Ju')) return 'jupiter-lagna'
  return null
}

export function mergeTransitMonths(
  months: { ym: string; kind: MarriageTransitKind }[],
): { start: string; end: string; kind: MarriageTransitKind }[] {
  if (!months.length) return []
  const sorted = [...months].sort((a, b) => a.ym.localeCompare(b.ym))
  const out: { start: string; end: string; kind: MarriageTransitKind }[] = []
  let cur = { start: `${sorted[0].ym}-01`, end: `${sorted[0].ym}-28`, kind: sorted[0].kind }
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].ym
    const [py, pm] = prev.split('-').map(Number)
    const nextYm = sorted[i].ym
    const [ny, nm] = nextYm.split('-').map(Number)
    const contiguous = (ny === py && nm === pm + 1) || (ny === py + 1 && pm === 12 && nm === 1)
    if (contiguous && sorted[i].kind === cur.kind) {
      cur.end = `${nextYm}-28`
    } else {
      out.push(cur)
      cur = { start: `${nextYm}-01`, end: `${nextYm}-28`, kind: sorted[i].kind }
    }
  }
  out.push(cur)
  return out
}

function overlaps(a0: string, a1: string, b0: string, b1: string): boolean {
  return a0 <= b1 && b0 <= a1
}

function birthYear(chart: ChartOutput): number | null {
  const raw = chart.meta?.birthDate
  if (!raw) return null
  const y = Number(String(raw).slice(0, 4))
  return Number.isFinite(y) && y > 1900 ? y : null
}

function ageAt(iso: string, by: number): number {
  return Number(iso.slice(0, 4)) - by
}

export function analyzeMarriageGochar(
  chart: ChartOutput | null | undefined,
  opts: MarriageGocharOptions = {},
): MarriageGocharReading | null {
  const asc = chart?.lagnas?.ascRashi
  if (!chart || !asc) return null

  const now = opts.now ?? new Date()
  const grahas = chart.grahas ?? []
  const ties = (planet: GrahaData | undefined, house: number): boolean => {
    if (!planet) return false
    const sign = signOfAsc(asc, house)
    if (LORDS[sign] === planet.id) return true
    if (planet.rashi === sign) return true
    const lord = find(grahas, LORDS[sign])
    return !!lord && lord.id !== planet.id && lord.rashi === planet.rashi
  }

  const path = chart.dashas?.vimshottari ? getDashaPathAt(chart.dashas.vimshottari, now.getTime()) : []
  const periodGraha = (index: number) => {
    const id = path[index]?.lord
    return id ? find(grahas, id as GrahaId) : undefined
  }
  const md = periodGraha(0)
  const ad = periodGraha(1)
  const houses = SUPPORT.filter(h => ties(md, h) || ties(ad, h))
  const dashaSupports = path.length ? houses.length > 0 : null

  const jupiter = find(grahas, 'Ju')
  const fifthLord = find(grahas, LORDS[signOfAsc(asc, 5)])
  const fifthTied = houses.includes(5)
  const jupiterOnFifth = !!jupiter && (
    houseOf(jupiter.rashi, asc) === 5
    || jupiter.id === LORDS[signOfAsc(asc, 5)]
    || (!!fifthLord && fifthLord.id !== 'Ju' && fifthLord.rashi === jupiter.rashi)
  )
  const childrenVehicle = fifthTied && jupiterOnFifth

  const window: MarriedLifeNote[] = []
  const periodNames = path.slice(0, 2).map(p => gn(p.lord))
  const names = periodNames.filter((name, i) => i === 0 || name !== periodNames[i - 1]).join(' → ')

  const mdStart = path[0] ? isoDay(new Date(path[0].start)) : null
  const mdEnd = path[0] ? isoDay(new Date(path[0].end)) : null
  const adStart = path[1] ? isoDay(new Date(path[1].start)) : null
  const adEnd = path[1] ? isoDay(new Date(path[1].end)) : null
  const dashaStart = adStart && mdStart ? (adStart > mdStart ? adStart : mdStart) : mdStart
  const dashaEnd = adEnd && mdEnd ? (adEnd < mdEnd ? adEnd : mdEnd) : mdEnd

  const seventh = analyzeSeventhLord(chart)
  const band = seventh?.flags.band ?? 'open'
  const by = birthYear(chart)
  const ageRange = AGE_YEARS[band]

  // Browser-safe: no ephemeris here. Dated windows come only via injectWindows.
  const scanned = opts.injectWindows !== undefined
  const raw = opts.injectWindows?.map(w => ({ start: w.start, end: w.end, kind: w.kind })) ?? []

  const windows: MarriageTransitWindow[] = raw.map(w => {
    const inDasha = !!(dashaStart && dashaEnd && overlaps(w.start, w.end, dashaStart, dashaEnd))
    let inAgeBand: boolean | null = null
    if (by && ageRange) {
      const midY = ageAt(w.start, by)
      inAgeBand = midY >= ageRange[0] && midY <= ageRange[1]
    }
    return { ...w, inDasha, inAgeBand }
  })

  if (dashaSupports && md) {
    window.push(note(
      'gochar-open',
      'This period can receive a marriage transit',
      `Period lords ${names} are tied to ${houses.map(ordinalHouse).join(', ')}. A dasha of any planet tied to houses 1, 2, 3, 4, 5, 7, 8, or 11 can carry a wedding. A double transit of Saturn and Jupiter on the rising sign or marriage house (7th) — by occupation or by their full glance — is a bright chance while this period is open. Jupiter alone on the rising sign, or Jupiter reaching Venus or the Moon, has also coincided with marriage when the period was already open. Saturn is looked for in the periods of marriages that stay. Dated sky windows below are search ranges, not a guaranteed wedding day.`,
      'mixed',
    ))
  } else if (dashaSupports === false && md) {
    window.push(note(
      'gochar-pass',
      'A favorable transit would pass',
      `Period lords ${names} are not tied to houses used to time marriage (1, 2, 3, 4, 5, 7, 8, 11). A Saturn–Jupiter double transit — or Jupiter alone on the rising sign — does not marry anyone by itself. While this period runs, that sky often passes without the event.`,
      'caution',
    ))
  } else {
    window.push(note(
      'gochar-no-period',
      'The period is not on this chart',
      'A double transit of Saturn and Jupiter on the rising sign or marriage house is a bright chance only beside a dasha period that already touches marriage. This chart has no running period to test.',
      'mixed',
    ))
  }

  if (dashaSupports && windows.length) {
    const preferred = windows.filter(w => w.inDasha && w.inAgeBand !== false)
    const list = (preferred.length ? preferred : windows.filter(w => w.inDasha)).slice(0, 4)
    const show = list.length ? list : windows.slice(0, 3)
    for (const w of show) {
      const kindLabel = w.kind === 'double-1'
        ? 'Jupiter + Saturn on the rising sign'
        : w.kind === 'double-7'
          ? 'Jupiter + Saturn on the marriage house (7th)'
          : 'Jupiter on the rising sign'
      window.push(note(
        `gochar-win-${w.start}`,
        `${kindLabel}: ${w.start} → ${w.end}`,
        [
          w.inDasha ? 'Overlaps the open marriage dasha.' : 'Falls outside the current main and sub dasha periods. The sky passes without the event.',
          w.inAgeBand === true ? `Fits the ${band} age band. Period and marriageable years both agree. That is the strong case, and only if the birth chart already promises a marriage.` : '',
          w.inAgeBand === false ? `Outside the ${band} marriageable years. This transit passes. It does not trigger a wedding.` : '',
          'This is a muhurta (auspicious timing) search range, not a fixed wedding date.',
        ].filter(Boolean).join(' '),
        w.inDasha && w.inAgeBand !== false ? 'supportive' : 'mixed',
      ))
    }
  } else if (dashaSupports && !windows.length && scanned) {
    window.push(note(
      'gochar-no-sky',
      'No Jupiter–Saturn marriage sky window in the scan',
      `No double transit of Jupiter and Saturn on the rising sign or marriage house (or Jupiter alone on the rising sign) was found in the next ${opts.scanYears ?? 8} years. The period can still receive other transits; this filter only names those sky patterns.`,
      'mixed',
    ))
  }

  const ageNow = by ? ageAt(isoDay(now), by) : null
  const beforeMarriageable = ageNow != null && !!ageRange && ageNow < ageRange[0]
  if (childrenVehicle && jupiter) {
    window.push(note(
      'gochar-children',
      'A child can be the reason the marriage is due',
      `Jupiter is the significator of progeny. It is on the 5th, and the 5th is in ${names}. Some marriages exist only so a child can be born through that union. This is not a finding that a child is assured.`,
      'caution',
    ))
    if (beforeMarriageable) {
      window.push(note(
        'gochar-care',
        'Care, if a relationship already exists',
        `This child-period is open at age ${ageNow}, before the ${band} marriageable years. If a relationship already exists, classical texts advise care: a pregnancy can arrive before a wedding is possible, and they associate that with health strain. It is a caution, not a forecast.`,
        'caution',
      ))
    }
  }

  const preferredWin = windows.find(w => w.inDasha && w.inAgeBand !== false) ?? windows.find(w => w.inDasha) ?? windows[0]
  const headline = dashaSupports
    ? preferredWin
      ? `Period open — next sky window ${preferredWin.start}`
      : 'The period is open. A double transit can brighten it'
    : dashaSupports === false
      ? 'The period is not open. A double transit would pass'
      : 'Marriage transit cannot be read without the period'

  const summary = dashaSupports
    ? `Period lords ${names} touch ${houses.map(ordinalHouse).join(', ')}. ${windows.length ? `${windows.length} Jupiter–Saturn sky window(s) scanned.` : 'No Jupiter–Saturn window in this scan.'}`
    : dashaSupports === false
      ? `Period lords ${names} do not touch a house used to time marriage.`
      : 'No dasha period is available to set beside the transit.'

  return {
    headline,
    summary,
    principles: MARRIAGE_GOCHAR_PRINCIPLES,
    window,
    windows,
    muhurtaFrom: preferredWin?.start,
    muhurtaTo: preferredWin?.end,
    flags: { dashaSupports, houses, childrenVehicle },
  }
}

export function compareMarriageGochar(
  a: MarriageGocharReading,
  b: MarriageGocharReading,
  nameA: string,
  nameB: string,
): MarriedLifeNote[] {
  if (a.flags.dashaSupports && b.flags.dashaSupports) {
    const shared = a.windows.find(w => b.windows.some(x => overlaps(w.start, w.end, x.start, x.end) && w.inDasha && x.inDasha))
    return [note(
      'gochar-pair-both',
      'Both periods can receive a marriage transit',
      `${nameA} and ${nameB} are both in a dasha tied to a marriage house.${shared ? ` Shared sky overlap around ${shared.start} → ${shared.end}.` : ''} Still opportunity ranges, not a fixed wedding day.`,
      'mixed',
    )]
  }
  if (a.flags.dashaSupports || b.flags.dashaSupports) {
    const open = a.flags.dashaSupports ? nameA : nameB
    const closed = a.flags.dashaSupports ? nameB : nameA
    return [note(
      'gochar-pair-one',
      `Only ${open} is in a period a transit can use`,
      `${open} has a dasha tied to a marriage house. ${closed} does not. A Saturn–Jupiter double transit would have somewhere to land for ${open} and would pass for ${closed}.`,
      'mixed',
    )]
  }
  if (a.flags.dashaSupports === false && b.flags.dashaSupports === false) {
    return [note(
      'gochar-pair-pass',
      'Neither period can carry a marriage transit',
      `${nameA} and ${nameB} are both in dashas that do not touch the houses used for marriage timing.`,
      'caution',
    )]
  }
  return []
}
