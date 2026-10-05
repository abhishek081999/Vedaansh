// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dinmanMuhurta.ts
//  Dinman / Ratriman — 15 muhurtas from sunrise→sunset and
//  sunset→next sunrise, each ruled by a classical nakshatra.
//  Use when a full panchang muhurta is unavailable for a fixed date.
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_NAMES } from '@/types/astrology'
import { getNakshatraMuhurtaMeta, type MuhurtaNakGroupId } from '@/lib/engine/nakshatraMuhurta'

export type DinmanPeriod = 'day' | 'night'

/** Nak index 0–26, or -1 for Abhijit (special 28th) */
export type DinmanNakId = number

export interface DinmanSlot {
  period:        DinmanPeriod
  /** 1–15 within the period */
  slot:          number
  start:         Date
  end:           Date
  nakIndex:      DinmanNakId
  nakName:       string
  groupId:       MuhurtaNakGroupId | 'Laghu'
  groupLabel:    string
  favorability:  'favourable' | 'neutral' | 'caution'
  goodFor:       string
  isCurrent:     boolean
}

export interface DinmanRatrimanResult {
  sunrise:     Date
  sunset:      Date
  nextSunrise: Date
  daySlots:    DinmanSlot[]
  nightSlots:  DinmanSlot[]
  current:     DinmanSlot | null
  /** Next favourable slot at or after now (may be tonight / after current) */
  nextFavourable: DinmanSlot | null
}

/**
 * Day (Dinman) ruling nakshatras from sunrise — classical sequence.
 * Slot 8 = Abhijit (special).
 */
const DAY_NAK: DinmanNakId[] = [
  5,  // 1 Ardra
  8,  // 2 Ashlesha
  16, // 3 Anuradha
  9,  // 4 Magha
  22, // 5 Dhanishtha
  19, // 6 Purva Ashadha
  20, // 7 Uttara Ashadha
  -1, // 8 Abhijit
  3,  // 9 Rohini
  17, // 10 Jyeshtha
  15, // 11 Vishakha
  18, // 12 Mula
  23, // 13 Shatabhisha
  11, // 14 Uttara Phalguni
  10, // 15 Purva Phalguni
]

/**
 * Night (Ratriman) ruling nakshatras from sunset.
 * Slot 15 was unspecified in source notes; Pushya is used as the
 * conventional Laghu completion (lists vary by tradition).
 */
const NIGHT_NAK: DinmanNakId[] = [
  5,  // 1 Ardra
  24, // 2 Purva Bhadra
  25, // 3 Uttara Bhadra
  26, // 4 Revati
  0,  // 5 Ashwini
  1,  // 6 Bharani
  2,  // 7 Krittika
  3,  // 8 Rohini
  4,  // 9 Mrigashira
  6,  // 10 Punarvasu
  21, // 11 Shravana
  12, // 12 Hasta
  13, // 13 Chitra
  14, // 14 Swati
  7,  // 15 Pushya (implied completion — regional lists may differ)
]

function nakLabel(id: DinmanNakId): string {
  return id === -1 ? 'Abhijit' : (NAKSHATRA_NAMES[id] ?? `Nak ${id}`)
}

function groupFor(id: DinmanNakId): { id: MuhurtaNakGroupId; label: string; goodFor: string } {
  if (id === -1) {
    return {
      id: 'Laghu',
      label: 'Laghu (Kshipra) · Abhijit',
      goodFor: 'Light auspicious starts, shop opening, education, partnerships',
    }
  }
  const m = getNakshatraMuhurtaMeta(id)
  return { id: m.group.id, label: m.group.label, goodFor: m.group.goodFor }
}

function favorabilityFor(groupId: MuhurtaNakGroupId): DinmanSlot['favorability'] {
  if (groupId === 'Ugra' || groupId === 'Tikshna') return 'caution'
  if (groupId === 'Mishra') return 'neutral'
  return 'favourable' // Dhruva, Chara, Laghu, Mridu
}

function buildPeriodSlots(
  period: DinmanPeriod,
  start: Date,
  end: Date,
  nakIds: DinmanNakId[],
  nowMs: number,
): DinmanSlot[] {
  const total = end.getTime() - start.getTime()
  if (!(total > 0) || nakIds.length !== 15) return []
  const unit = total / 15
  return nakIds.map((nakIndex, i) => {
    const s = new Date(start.getTime() + i * unit)
    const e = new Date(start.getTime() + (i + 1) * unit)
    const g = groupFor(nakIndex)
    return {
      period,
      slot: i + 1,
      start: s,
      end: e,
      nakIndex,
      nakName: nakLabel(nakIndex),
      groupId: g.id,
      groupLabel: g.label,
      favorability: favorabilityFor(g.id),
      goodFor: g.goodFor,
      isCurrent: nowMs >= s.getTime() && nowMs < e.getTime(),
    }
  })
}

/**
 * Split local day into 15 Dinman + 15 Ratriman muhurtas.
 * `nextSunrise` defaults to sunrise + 24h (good enough for UI windows).
 */
export function getDinmanRatriman(
  sunrise: Date,
  sunset: Date,
  opts?: { now?: Date; nextSunrise?: Date },
): DinmanRatrimanResult {
  const sr = new Date(sunrise)
  const ss = new Date(sunset)
  const nextSr = opts?.nextSunrise
    ? new Date(opts.nextSunrise)
    : new Date(sr.getTime() + 24 * 60 * 60 * 1000)
  const nowMs = (opts?.now ?? new Date()).getTime()

  const daySlots = buildPeriodSlots('day', sr, ss, DAY_NAK, nowMs)
  const nightSlots = buildPeriodSlots('night', ss, nextSr, NIGHT_NAK, nowMs)
  const all = [...daySlots, ...nightSlots]
  const current = all.find((s) => s.isCurrent) ?? null
  const nextFavourable =
    all.find((s) => s.favorability === 'favourable' && s.end.getTime() > nowMs) ?? null

  return {
    sunrise: sr,
    sunset: ss,
    nextSunrise: nextSr,
    daySlots,
    nightSlots,
    current,
    nextFavourable,
  }
}

export function formatDinmanSlotLabel(slot: DinmanSlot): string {
  const period = slot.period === 'day' ? 'Dinman' : 'Ratriman'
  return `${period} #${slot.slot} · ${slot.nakName}`
}
