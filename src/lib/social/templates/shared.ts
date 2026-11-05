import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, GRAHA_SANSKRIT } from '@/types/astrology'
import type { HoroscopeTone, RashiHoroscope } from '@/lib/engine/dailyRashiHoroscope'
import type { Tone } from '@/lib/social/render/theme'
import type { RashiCard } from '@/lib/social/render/slides/types'
import type { CalendarEvent, CalendarEventKind, CityPreset } from '@/lib/social/templates/types'

export const CITY_PRESETS: CityPreset[] = [
  { id: 'delhi', name: 'New Delhi', lat: 28.6139, lng: 77.209, tz: 'Asia/Kolkata' },
  { id: 'mumbai', name: 'Mumbai', lat: 19.076, lng: 72.8777, tz: 'Asia/Kolkata' },
  { id: 'ujjain', name: 'Ujjain', lat: 23.1765, lng: 75.7885, tz: 'Asia/Kolkata' },
  { id: 'varanasi', name: 'Varanasi', lat: 25.3176, lng: 82.9739, tz: 'Asia/Kolkata' },
  { id: 'kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639, tz: 'Asia/Kolkata' },
  { id: 'bengaluru', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, tz: 'Asia/Kolkata' },
  { id: 'chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707, tz: 'Asia/Kolkata' },
]

export function cityById(id: string | undefined): CityPreset {
  return CITY_PRESETS.find((c) => c.id === id) ?? CITY_PRESETS[0]
}

export interface DateLabels {
  weekday: string
  day: string
  month: string
  year: string
  short: string
  long: string
}

export function dateLabels(date: string): DateLabels {
  const d = new Date(`${date}T12:00:00Z`)
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'UTC' })
  const month = d.toLocaleDateString('en-IN', { month: 'long', timeZone: 'UTC' })
  const day = String(d.getUTCDate())
  const year = String(d.getUTCFullYear())
  return { weekday, day, month, year, short: `${day} ${month.slice(0, 3)} ${year}`, long: `${weekday}, ${day} ${month} ${year}` }
}

export function grahaId(lord: string | undefined): GrahaId {
  if (!lord) return 'Su'
  if (lord in GRAHA_NAMES) return lord as GrahaId
  const hit = (Object.entries(GRAHA_NAMES) as [GrahaId, string][]).find(([, n]) => n.toLowerCase() === lord.toLowerCase())
  return hit?.[0] ?? 'Su'
}

export function grahaSa(id: string | undefined): string {
  const g = grahaId(id)
  return GRAHA_SANSKRIT[g] ?? g
}

export function horoscopeTone(t: HoroscopeTone): Tone {
  return t === 'excellent' || t === 'good' ? 'good' : t === 'mixed' ? 'mixed' : 'warn'
}

export const TONE_LABEL: Record<HoroscopeTone, string> = {
  excellent: 'Excellent',
  good: 'Good',
  mixed: 'Mixed',
  challenging: 'Careful',
}

const COLOR_HEX: [RegExp, string][] = [
  [/saffron|orange/i, '#F4A236'],
  [/coral|red/i, '#E5533D'],
  [/emerald|green/i, '#2BB673'],
  [/turmeric|yellow|gold/i, '#F2C230'],
  [/indigo|blue/i, '#3F51B5'],
  [/smok|grey|gray/i, '#8A8D93'],
  [/brown|ash/i, '#8B6F5A'],
  [/pink/i, '#F48FB1'],
  [/black/i, '#1E1E1E'],
  [/pearl|diamond|white|cream|silver/i, '#F4F1E8'],
]

export function colorSwatch(name: string): string {
  return COLOR_HEX.find(([re]) => re.test(name))?.[1] ?? '#E2C97E'
}

export function rashiCard(s: RashiHoroscope, dateLabel: string, withSummary: boolean): RashiCard {
  return {
    rashi: s.rashi as Rashi,
    english: s.english,
    sanskrit: s.sanskrit,
    deva: s.devanagari,
    dateLabel,
    score: s.score,
    tone: horoscopeTone(s.tone),
    toneLabel: TONE_LABEL[s.tone],
    headline: s.headline,
    summary: withSummary ? s.summary : undefined,
    areas: s.areas.map((a) => ({ label: a.label, score: a.score, tone: horoscopeTone(a.tone) })),
    lucky: { color: s.lucky.color, swatch: colorSwatch(s.lucky.color), number: s.lucky.number, direction: s.lucky.direction },
    karya: s.karya,
    varjya: s.varjya,
  }
}

export const DAILY_CTA = { title: 'Your sky, every day', deva: 'शुभ दिन', lines: ['Save this post & share it with family', 'Free kundali, panchang & daily rashiphal'] }

export const GRAHA_DEVA: Record<string, string> = {
  Su: 'सूर्य', Mo: 'चंद्र', Ma: 'मंगल', Me: 'बुध', Ju: 'गुरु', Ve: 'शुक्र', Sa: 'शनि', Ra: 'राहु', Ke: 'केतु',
}

/** IST calendar date (YYYY-MM-DD) of an instant. */
export function istDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10)
}

/** "Thu 6 Nov" for a YYYY-MM-DD date. */
export function shortDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/** End time, with the day added when it falls after `onDate` ("10:31 AM, Fri 6 Nov"). */
export function fmtUntil(iso: string | null | undefined, onDate: string, fmt: (s: string) => string): string {
  if (!iso) return '—'
  const d = istDate(iso)
  return d === onDate ? fmt(iso) : `${fmt(iso)}, ${shortDay(d)}`
}

/** The chosen event if it matches, else the first upcoming event of the given kinds. */
export function pickEvent(events: CalendarEvent[] | undefined, kinds: CalendarEventKind[], eventId?: string): CalendarEvent | null {
  const list = (events ?? []).filter((e) => kinds.includes(e.kind))
  return list.find((e) => e.id === eventId) ?? list[0] ?? null
}
