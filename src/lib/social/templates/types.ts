import type { PanchangApiData } from '@/types/reel-panchang'
import type { DailyHoroscopeReport } from '@/lib/engine/dailyRashiHoroscope'
import type { FrameId } from '@/lib/social/render/frame'
import type { SlideSpec } from '@/lib/social/render/slides/types'
import type { CaptionParts } from '@/lib/social/caption/caption'

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

/** Everything a daily template needs — one fetch from /api/admin/social/data. */
export interface DayData {
  date: string
  city: CityPreset
  panchang: PanchangApiData
  horoscope: DailyHoroscopeReport
}

export type ParamKey = 'date' | 'rashi' | 'city'

export interface TemplateParams {
  date: string
  city: string
  rashi?: number
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
  build: (d: DayData, p: TemplateParams) => TemplateBuild
  /** Expand into several posts (e.g. one story per rashi). */
  batch?: (p: TemplateParams) => TemplateParams[]
}
