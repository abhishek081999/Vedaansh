import type { TemplateCategory, TemplateDef } from '@/lib/social/templates/types'
import { panchangDaily, shubhAshubh } from '@/lib/social/templates/daily/panchang'
import { luckyGrid, rashiStory, rashiphalDaily } from '@/lib/social/templates/daily/rashiphal'
import { nakshatraDaily } from '@/lib/social/templates/daily/nakshatra'
import { choghadiyaDaily } from '@/lib/social/templates/daily/choghadiya'
import { skyToday, upayToday } from '@/lib/social/templates/daily/sky'

/** Every template in the studio, in catalogue order. Phase 2/3 categories add here. */
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
]

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function templatesByCategory(): { category: TemplateCategory; items: TemplateDef[] }[] {
  const order: TemplateCategory[] = ['daily', 'weekly', 'event', 'evergreen', 'brand']
  return order.map((category) => ({ category, items: TEMPLATES.filter((t) => t.category === category) })).filter((g) => g.items.length > 0)
}
