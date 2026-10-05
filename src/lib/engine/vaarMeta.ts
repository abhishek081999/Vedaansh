// ─────────────────────────────────────────────────────────────
//  src/lib/engine/vaarMeta.ts
//  Vaar (weekday) lords, nature, hora purpose hints, and
//  nakshatras that classically strengthen / weaken the Vaar Pati.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES } from '@/types/astrology'

export interface VaarMeta {
  number:     number // 0=Sun … 6=Sat
  name:       string
  sanskrit:   string
  lord:       GrahaId
  lordName:   string
  nature:     string
  bestFor:    string
  challenge:  string
  dayGuidance: string
  /** Nakshatras that strengthen Vaar Pati when the planet occupies them */
  strengthenNaks: string[]
  /** Nakshatras that weaken Vaar Pati when the planet occupies them */
  weakenNaks: string[]
}

const VAAR: VaarMeta[] = [
  {
    number: 0, name: 'Sunday', sanskrit: 'Ravivara', lord: 'Su', lordName: 'Sun',
    nature: 'Authority, vitality, and self-expression',
    bestFor: 'Leadership, government, health starts, father-related matters, gold',
    challenge: 'Ego friction; avoid confrontations with authority if Sun is weak',
    dayGuidance: 'Lead, organise, and favour solar / visibility work.',
    strengthenNaks: ['Punarvasu', 'Hasta', 'Mula'],
    weakenNaks: ['Bharani', 'Magha', 'Vishakha'],
  },
  {
    number: 1, name: 'Monday', sanskrit: 'Somavara', lord: 'Mo', lordName: 'Moon',
    nature: 'Mind, emotion, and nourishment',
    bestFor: 'Home, care, liquids, travel planning, mother-related matters, public contact',
    challenge: 'Mood swings; delay volatile emotional decisions',
    dayGuidance: 'Nurture, connect, and favour soft / domestic work.',
    strengthenNaks: ['Rohini', 'Mrigashira', 'Shravana'],
    weakenNaks: ['Purva Ashadha', 'Uttara Ashadha'],
  },
  {
    number: 2, name: 'Tuesday', sanskrit: 'Mangalavara', lord: 'Ma', lordName: 'Mars',
    nature: 'Energy, courage, and conflict',
    bestFor: 'Sports, engineering, surgery timing (with care), property disputes, bold action',
    challenge: 'Anger and accidents; avoid rash starts',
    dayGuidance: 'Channel force into decisive tasks; skip shop openings.',
    strengthenNaks: ['Uttara Phalguni', 'Uttara Ashadha', 'Uttara Bhadra'],
    weakenNaks: ['Vishakha'],
  },
  {
    number: 3, name: 'Wednesday', sanskrit: 'Budhavara', lord: 'Me', lordName: 'Mercury',
    nature: 'Commerce, speech, and intellect',
    bestFor: 'Trade, writing, study, accounts, short travel, negotiations',
    challenge: 'Scattered focus; double-check communications',
    dayGuidance: 'Trade, write, teach, and handle paperwork.',
    strengthenNaks: [], // source notes incomplete for Budha strengtheners
    weakenNaks: ['Mula', 'Shravana', 'Dhanishtha', 'Shatabhisha'],
  },
  {
    number: 4, name: 'Thursday', sanskrit: 'Guruvara', lord: 'Ju', lordName: 'Jupiter',
    nature: 'Wisdom, dharma, and expansion',
    bestFor: 'Education, counsel, charity, spiritual rites, long-term investments',
    challenge: 'Over-optimism or excess; keep promises realistic',
    dayGuidance: 'Learn, advise, donate, and expand wisely.',
    strengthenNaks: ['Punarvasu'],
    weakenNaks: ['Purva Phalguni', 'Swati'],
  },
  {
    number: 5, name: 'Friday', sanskrit: 'Shukravara', lord: 'Ve', lordName: 'Venus',
    nature: 'Harmony, arts, and relationships',
    bestFor: 'Marriage talks, arts, beauty, luxury purchases, partnerships',
    challenge: 'Indulgence; balance pleasure with duty',
    dayGuidance: 'Create beauty, romance, and agreeable alliances.',
    strengthenNaks: ['Purva Phalguni'],
    weakenNaks: ['Rohini', 'Vishakha'],
  },
  {
    number: 6, name: 'Saturday', sanskrit: 'Shanivara', lord: 'Sa', lordName: 'Saturn',
    nature: 'Discipline, labour, and endurance',
    bestFor: 'Long projects, service, iron/land work, austerity, structure',
    challenge: 'Delays and heaviness; expect effort before fruit',
    dayGuidance: 'Build slowly; favour duty, repair, and lasting foundations.',
    strengthenNaks: ['Magha', 'Swati'],
    weakenNaks: ['Pushya', 'Purva Ashadha', 'Uttara Ashadha', 'Revati'],
  },
]

/** Purpose → recommended hora lords (classical teaching notes) */
export const HORA_PURPOSE_HINTS: Array<{ purpose: string; lords: GrahaId[]; note: string }> = [
  { purpose: 'Money / finance', lords: ['Ju', 'Ve', 'Me'], note: 'Prefer hora of 11th lord when known; else Ju/Ve/Me' },
  { purpose: 'Legal / competition', lords: ['Ma', 'Sa'], note: 'Hora of 6th lord if strong; Mars/Saturn for contests' },
  { purpose: 'Solutions / closure', lords: ['Sa', 'Ke'], note: '12th-lord hora when known; Saturn for endings' },
  { purpose: 'New beginnings', lords: ['Su', 'Mo', 'Ju'], note: 'Lagna-lord hora when known; else Su/Ju' },
  { purpose: 'Education / learning', lords: ['Ju', 'Me'], note: 'Jupiter or Mercury hora' },
  { purpose: 'Love / relationships', lords: ['Ve'], note: 'Venus hora' },
  { purpose: 'Property', lords: ['Sa', 'Ma'], note: 'Saturn or Mars hora' },
]

export function getVaarMeta(varaNumber: number): VaarMeta {
  const n = ((Math.floor(varaNumber) % 7) + 7) % 7
  return VAAR[n]
}

export function formatVaarWeatherLine(meta: VaarMeta): string {
  return `Vaar Pati ${meta.lordName} — ${meta.dayGuidance}`
}

export interface CurrentHoraInfo {
  lord:      GrahaId
  lordName:  string
  start:     Date
  end:       Date
  purposeHint: string
}

function purposeHintForLord(lord: GrahaId): string {
  const hits = HORA_PURPOSE_HINTS.filter((h) => h.lords.includes(lord)).map((h) => h.purpose)
  if (hits.length === 0) return `${GRAHA_NAMES[lord]} hora — match to chart house lord for purpose`
  return `${GRAHA_NAMES[lord]} hora — suited to: ${hits.slice(0, 3).join(', ')}`
}

/**
 * Pick the hora row covering `now` from a precomputed hora table.
 */
export function getCurrentHora(
  horaTable: Array<{ lord: GrahaId; start: Date | string; end: Date | string }>,
  now: Date = new Date(),
): CurrentHoraInfo | null {
  const t = now.getTime()
  for (const h of horaTable) {
    const start = new Date(h.start)
    const end = new Date(h.end)
    if (t >= start.getTime() && t < end.getTime()) {
      return {
        lord: h.lord,
        lordName: GRAHA_NAMES[h.lord] ?? h.lord,
        start,
        end,
        purposeHint: purposeHintForLord(h.lord),
      }
    }
  }
  return null
}

/**
 * Optional natal check: does Vaar Pati sit in a classical strength/weakness nakshatra?
 * Pass the natal nakshatra index of the Vaar Pati planet (not Moon, unless Moon is Vaar Pati).
 */
export function vaarPatiNakNote(varaNumber: number, vaarPatiNakIndex: number | null | undefined): string | null {
  if (vaarPatiNakIndex == null || vaarPatiNakIndex < 0 || vaarPatiNakIndex > 26) return null
  const meta = getVaarMeta(varaNumber)
  const name = NAKSHATRA_NAMES[vaarPatiNakIndex]
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
  const nNorm = norm(name)
  const matches = (list: string[]) =>
    list.some((s) => {
      const sn = norm(s)
      return nNorm === sn || nNorm.includes(sn) || sn.includes(nNorm)
    })
  if (matches(meta.strengthenNaks)) {
    return `${meta.lordName} in ${name} — classical strength for Vaar Pati`
  }
  if (matches(meta.weakenNaks)) {
    return `${meta.lordName} in ${name} — classical caution for Vaar Pati (may need more effort)`
  }
  return null
}

export function listVaarMeta(): VaarMeta[] {
  return [...VAAR]
}
