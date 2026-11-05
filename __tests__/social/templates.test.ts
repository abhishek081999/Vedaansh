import { describe, expect, it } from 'vitest'
import fixture from '../fixtures/social-day-2026-11-05.json'
import { TEMPLATES, getTemplate } from '@/lib/social/templates/registry'
import { CITY_PRESETS } from '@/lib/social/templates/shared'
import type { DayData } from '@/lib/social/templates/types'
import { CAPTION_MAX_CHARS, CAPTION_MAX_TAGS, composeCaption, normaliseTags } from '@/lib/social/caption/caption'
import { FRAMES } from '@/lib/social/render/frame'
import { getTheme, THEME_IDS } from '@/lib/social/render/theme'
import { layoutStack, renderSlide, type Block } from '@/lib/social/render/slides/render'

const day = { ...fixture, city: CITY_PRESETS[0] } as unknown as DayData
const params = { date: day.date, city: 'delhi', rashi: 5 }
const brand = { name: 'Vedaansh', handle: '@vedaanshlife', ctaLine: 'Free kundali & panchang at vedaansh.com' }

/** Minimal 2D context stand-in that records where text is drawn. */
function mockCtx() {
  const texts: { s: string; x: number; y: number }[] = []
  let font = '16px sans'
  const grad = { addColorStop: () => undefined }
  const target: Record<string, unknown> = {
    texts,
    get font() {
      return font
    },
    set font(v: string) {
      font = v
    },
    measureText: (s: string) => {
      const px = Number(/(\d+)px/.exec(font)?.[1] ?? 16)
      return { width: s.length * px * 0.52 }
    },
    fillText: (s: string, x: number, y: number) => texts.push({ s, x, y }),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
  }
  return new Proxy(target, {
    get: (t, k) => (k in t ? t[k as string] : () => undefined),
    set: (t, k, v) => {
      t[k as string] = v
      return true
    },
  }) as unknown as CanvasRenderingContext2D & { texts: typeof texts }
}

describe('social templates', () => {
  it('registers unique ids and codes', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length)
    expect(new Set(TEMPLATES.map((t) => t.code)).size).toBe(TEMPLATES.length)
    expect(getTemplate('panchang')?.code).toBe('A1')
  })

  for (const t of TEMPLATES) {
    describe(t.id, () => {
      const build = t.build(day, params)

      it('builds slides and an Instagram-safe caption', () => {
        expect(build.slides.length).toBeGreaterThan(0)
        expect(build.slides.length).toBeLessThanOrEqual(20)
        const caption = composeCaption(build.caption, { ctaLine: brand.ctaLine, handle: brand.handle, preset: 'growth' })
        expect(caption.length).toBeLessThanOrEqual(CAPTION_MAX_CHARS)
        expect((caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).length).toBeLessThanOrEqual(CAPTION_MAX_TAGS)
        expect(caption).not.toMatch(/undefined|NaN|\[object/)
      })

      for (const fid of t.formats) {
        it(`keeps every text line on the ${fid} frame`, () => {
          const f = FRAMES[fid]
          build.slides.forEach((s, i) => {
            const ctx = mockCtx()
            renderSlide(ctx, s, { frame: f, theme: getTheme('cosmic'), brand, seed: 'test', index: i, total: build.slides.length })
            expect(ctx.texts.length).toBeGreaterThan(3)
            for (const tx of ctx.texts) {
              expect(Number.isFinite(tx.y), `${t.id}#${i} "${tx.s}"`).toBe(true)
              expect(tx.y, `${t.id}#${i} "${tx.s}" y=${tx.y}`).toBeGreaterThan(40)
              expect(tx.y, `${t.id}#${i} "${tx.s}" y=${tx.y}`).toBeLessThan(f.h - 40)
              expect(tx.s).not.toMatch(/undefined|NaN/)
            }
          })
        })
      }
    })
  }

  it('batches one story per rashi', () => {
    const t = getTemplate('rashi-story')!
    const batch = t.batch!(params)
    expect(batch.map((p) => p.rashi)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it('has three themes', () => {
    expect(THEME_IDS.map((id) => getTheme(id).id)).toEqual(['cosmic', 'temple', 'parchment'])
  })
})

describe('caption helpers', () => {
  it('normalises and caps hashtags', () => {
    expect(normaliseTags(['panchang', '#Panchang', '#hindu calendar', '##x'])).toEqual(['#panchang', '#hinducalendar', '#x'])
    expect(normaliseTags(Array.from({ length: 50 }, (_, i) => `t${i}`))).toHaveLength(CAPTION_MAX_TAGS)
  })

  it('truncates long bodies but keeps hashtags', () => {
    const c = composeCaption({ hook: 'Hook', lines: ['x'.repeat(3000)], tags: ['#a'] }, { ctaLine: '', handle: '', preset: 'balanced' })
    expect(c.length).toBeLessThanOrEqual(CAPTION_MAX_CHARS)
    expect(c).toMatch(/#a/)
  })
})

describe('layoutStack', () => {
  const noop = () => undefined
  it('centres content and grows flexible blocks up to max', () => {
    const out = layoutStack(0, 1000, [
      { min: 100, draw: noop },
      { min: 200, max: 400, grow: 1, draw: noop },
    ])
    expect(out[1].h).toBe(400)
    const end = out[1].y + out[1].h
    expect(out[0].y).toBeGreaterThan(0)
    expect(end).toBeLessThanOrEqual(1000)
  })

  it('drops optional blocks, then shrinks, when space is short', () => {
    const blocks: Block[] = [
      { min: 300, draw: noop },
      { min: 500, shrink: true, draw: noop },
      { min: 200, optional: true, draw: noop },
    ]
    const out = layoutStack(0, 700, blocks)
    expect(out).toHaveLength(2)
    const end = out[1].y + out[1].h
    expect(end).toBeLessThanOrEqual(700.5)
  })
})

describe('slideshow frame plan', async () => {
  const { slideshowFrame } = await import('@/lib/social/export/video')
  it('holds, then crossfades into the next slide, with no fade after the last one', () => {
    // 3 slides × 90 frames, 15-frame fade
    expect(slideshowFrame(0, 3, 90, 15, 1.04)).toMatchObject({ slide: 0, nextAlpha: 0, zoom: 1.04 })
    expect(slideshowFrame(80, 3, 90, 15, 1.04).nextAlpha).toBeGreaterThan(0)
    expect(slideshowFrame(89, 3, 90, 15, 1.04).zoom).toBeCloseTo(1)
    expect(slideshowFrame(90, 3, 90, 15, 1.04).slide).toBe(1)
    expect(slideshowFrame(269, 3, 90, 15, 1.04)).toMatchObject({ slide: 2, nextAlpha: 0 })
  })
})
