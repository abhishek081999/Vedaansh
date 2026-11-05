import { describe, expect, it } from 'vitest'
import fixture from '../fixtures/social-day-2026-11-05.json'
import { DAILY_PACK_LABEL, DAILY_PACK_TEMPLATE_IDS } from '@/lib/social/packs/daily'
import { getTemplate } from '@/lib/social/templates/registry'
import { CITY_PRESETS } from '@/lib/social/templates/shared'
import type { DayData } from '@/lib/social/templates/types'
import { CAPTION_MAX_CHARS, CAPTION_MAX_TAGS, composeCaption } from '@/lib/social/caption/caption'

const day = { ...fixture, city: CITY_PRESETS[0] } as unknown as DayData
const brand = { name: 'Vedaansh', handle: '@vedaanshlife', ctaLine: 'Free kundali & panchang at vedaansh.com' }

describe('daily content pack', () => {
  it('lists A1 panchang, A2 shubh-ashubh and A3 rashiphal', () => {
    expect([...DAILY_PACK_TEMPLATE_IDS]).toEqual(['panchang', 'shubh-ashubh', 'rashiphal'])
    expect(DAILY_PACK_LABEL).toMatch(/Daily pack/)
    for (const id of DAILY_PACK_TEMPLATE_IDS) {
      const t = getTemplate(id)
      expect(t, id).toBeTruthy()
      expect(t!.formats).toContain('4x5')
      expect(t!.formats).toContain('9x16')
    }
  })

  it('offers square 1:1 on compact single-post templates', () => {
    for (const id of ['shubh-ashubh', 'lucky-grid', 'rashi-story'] as const) {
      expect(getTemplate(id)!.formats, id).toContain('1x1')
    }
  })

  it('builds Instagram-safe assets for the pack date', () => {
    const params = { date: day.date, city: 'delhi' }
    for (const id of DAILY_PACK_TEMPLATE_IDS) {
      const b = getTemplate(id)!.build(day, params)
      expect(b.slides.length, id).toBeGreaterThan(0)
      const caption = composeCaption(b.caption, { ...brand, preset: 'balanced' })
      expect(caption.length, id).toBeLessThanOrEqual(CAPTION_MAX_CHARS)
      expect((caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).length, id).toBeLessThanOrEqual(CAPTION_MAX_TAGS)
      expect(caption, id).not.toMatch(/undefined|NaN/)
    }
  })
})
