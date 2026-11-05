import type { PanchangApiData } from '@/types/reel-panchang'
import type { DailyHoroscopeReport } from '@/lib/engine/dailyRashiHoroscope'
import type { FrameId } from '@/lib/social/render/frame'
import type { SlideSpec } from '@/lib/social/render/slides/types'
import type { CaptionParts } from '@/lib/social/caption/caption'
import type { CalendarEvent, CalendarEventKind } from '@/lib/social/events/finder'

export type { CalendarEvent, CalendarEventKind }

export type TemplateCategory = 'daily' | 'weekly' | 'event' | 'evergreen' | 'brand'

export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  event: 'Events',
  evergreen: 'Evergreen series',
  brand: 'Brand',
}

export interface CityPreset {
  id: string
  name: string
  lat: number
  lng: number
  tz: string
}

export interface WeekDayData {
  date: string
  moonRashi: number
  tithi: { name: string; paksha: string }
  nakshatra: string
  signs: { rashi: number; score: number; tone: string; headline: string }[]
}

export interface WeekData {
  start: string
  days: WeekDayData[]
  /** Next Chandrashtama window (Moon in the 8th from each sign) starting from the week start. */
  chandrashtama: { rashi: number; eighth: number; start: string; end: string }[]
}

export interface MoorthyRow {
  planetId: string
  metalLabel: string
  tone: string
  rashi: number
  ingressIso: string
  summary: string
}

/** Everything templates need — one fetch from /api/admin/social/data. */
export interface DayData {
  date: string
  city: CityPreset
  panchang: PanchangApiData
  horoscope: DailyHoroscopeReport
  week: WeekData
  /** Calendar events from `date` for ~45 days (vrats, festivals, ingress, retrograde). */
  events: CalendarEvent[]
  /** Transit interpretation by planet → house from the Moon sign. */
  gochar: Record<string, Record<number, string>>
  moorthy: MoorthyRow[]
  /** Saturn's sign segments around `date` (for Sade Sati posts). */
  saturn: { rashi: number; start: string; end: string }[]
}

export type ParamKey = 'date' | 'rashi' | 'city' | 'event' | 'item'

export interface TemplateParams {
  date: string
  city: string
  rashi?: number
  /** CalendarEvent id for event templates. */
  eventId?: string
  /** 1-based item of an evergreen series (nakshatra 1–27, number 1–9 …). */
  item?: number
}

export interface TemplateBuild {
  slides: SlideSpec[]
  caption: CaptionParts
}

export interface TemplateDef {
  id: string
  /** Catalogue code from the plan (A1, A2 …). */
  code: string
  category: TemplateCategory
  name: string
  deva: string
  blurb: string
  formats: FrameId[]
  params: ParamKey[]
  /** Event templates: which calendar events they accept. */
  eventKinds?: CalendarEventKind[]
  /** Evergreen series: the items to choose from (value is 1-based). */
  items?: () => { value: number; label: string }[]
  build: (d: DayData, p: TemplateParams) => TemplateBuild
  /** Expand into several posts (e.g. one story per rashi). */
  batch?: (p: TemplateParams) => TemplateParams[]
}
