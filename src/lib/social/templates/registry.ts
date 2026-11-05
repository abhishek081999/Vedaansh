import type { TemplateCategory, TemplateDef } from '@/lib/social/templates/types'
import { panchangDaily, shubhAshubh } from '@/lib/social/templates/daily/panchang'
import { luckyGrid, rashiStory, rashiphalDaily } from '@/lib/social/templates/daily/rashiphal'
import { nakshatraDaily } from '@/lib/social/templates/daily/nakshatra'
import { choghadiyaDaily } from '@/lib/social/templates/daily/choghadiya'
import { skyToday, upayToday } from '@/lib/social/templates/daily/sky'
import { chandrashtamaWeek, weekPanchang, weekTransits, weeklyRashiphal } from '@/lib/social/templates/weekly/weekly'
import { festivalEvent, gocharEvent, grahanEvent, retrogradeEvent, sankrantiEvent, vratEvent } from '@/lib/social/templates/events/events'
import {
  doshaSeries,
  grahaRemedySeries,
  guideSeries,
  nakshatraSeries,
  numerologySeries,
  rashiSeries,
  sadeSatiSeries,
  tithiSeries,
  yogaSeries,
} from '@/lib/social/templates/evergreen/series'
import { featurePromo, shlokaCard } from '@/lib/social/templates/brand/brand'

/** Every template in the studio, in catalogue order. */
export const TEMPLATES: TemplateDef[] = [
  panchangDaily,
  shubhAshubh,
  rashiphalDaily,
  rashiStory,
  luckyGrid,
  nakshatraDaily,
  choghadiyaDaily,
  skyToday,
  upayToday,
  weeklyRashiphal,
  chandrashtamaWeek,
  weekTransits,
  weekPanchang,
  gocharEvent,
  retrogradeEvent,
  vratEvent,
  festivalEvent,
  sankrantiEvent,
  grahanEvent,
  nakshatraSeries,
  rashiSeries,
  grahaRemedySeries,
  tithiSeries,
  yogaSeries,
  doshaSeries,
  guideSeries,
  sadeSatiSeries,
  numerologySeries,
  featurePromo,
  shlokaCard,
]

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function templatesByCategory(): { category: TemplateCategory; items: TemplateDef[] }[] {
  const order: TemplateCategory[] = ['daily', 'weekly', 'event', 'evergreen', 'brand']
  return order.map((category) => ({ category, items: TEMPLATES.filter((t) => t.category === category) })).filter((g) => g.items.length > 0)
}
