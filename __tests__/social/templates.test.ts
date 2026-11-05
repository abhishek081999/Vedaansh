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

describe('weekly & event templates', () => {
  it('weekly rashiphal shows all 12 signs across 3 day-by-day slides', () => {
    const b = getTemplate('weekly-rashiphal')!.build(day, params)
    const grids = b.slides.filter((s) => s.type === 'weekGrid')
    expect(grids).toHaveLength(3)
    expect(grids.flatMap((s) => (s.type === 'weekGrid' ? s.rows.map((r) => r.rashi) : []))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    for (const g of grids) if (g.type === 'weekGrid') for (const r of g.rows) expect(r.scores).toHaveLength(7)
  })

  it('gochar gives an effect line for every Moon sign, fast planets included', () => {
    const ingress = day.events.filter((e) => e.kind === 'ingress')
    expect(ingress.length).toBeGreaterThan(0)
    for (const ev of ingress) {
      const b = getTemplate('gochar')!.build(day, { ...params, eventId: ev.id })
      const rows = b.slides.flatMap((s) => (s.type === 'list' ? s.sections.flatMap((x) => x.rows) : []))
      expect(rows, ev.title).toHaveLength(12)
      for (const r of rows) expect(r.note && r.note.length > 10, `${ev.title}: ${r.title}`).toBe(true)
    }
  })

  it('event templates use the chosen event, else the first upcoming one', () => {
    const vrats = day.events.filter((e) => e.kind === 'vrat')
    const second = vrats[1]
    const b = getTemplate('vrat')!.build(day, { ...params, eventId: second.id })
    expect(b.slides[0].type === 'cover' && b.slides[0].head.title).toBe(second.title)
    const first = getTemplate('vrat')!.build(day, params)
    expect(first.slides[0].type === 'cover' && first.slides[0].head.title).toBe(vrats[0].title)
  })

  it('event templates degrade to a notice when there is no event', () => {
    const empty = { ...day, events: [] } as DayData
    for (const id of ['gochar', 'retrograde', 'vrat', 'festival', 'sankranti']) {
      const b = getTemplate(id)!.build(empty, params)
      expect(b.slides).toHaveLength(1)
      expect(b.slides[0].type).toBe('text')
    }
  })
})

describe('evergreen series', () => {
  const series = TEMPLATES.filter((t) => t.items)
  it('covers the planned series', () => {
    expect(series.map((t) => t.code).sort()).toEqual(['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D9', 'E1', 'E2'])
    expect(getTemplate('series-nakshatra')!.items!()).toHaveLength(27)
    expect(getTemplate('series-tithi')!.items!()).toHaveLength(30)
  })

  for (const t of series) {
    it(`${t.id}: every item renders on-frame with real content`, () => {
      for (const { value } of t.items!()) {
        const b = t.build(day, { ...params, item: value })
        expect(b.slides.length).toBeGreaterThan(0)
        for (const s of b.slides) {
          if (s.type === 'text') {
            const n = s.paragraphs.filter(Boolean).length + (s.bullets ?? []).reduce((a, x) => a + x.items.filter(Boolean).length, 0)
            expect(n, `${t.id}#${value} "${s.head.title}" is empty`).toBeGreaterThan(0)
          }
        }
        for (const fid of t.formats) {
          b.slides.forEach((s, i) => {
            const ctx = mockCtx()
            renderSlide(ctx, s, { frame: FRAMES[fid], theme: getTheme('cosmic'), brand, seed: 't', index: i, total: b.slides.length })
            for (const tx of ctx.texts) {
              expect(tx.y, `${t.id}#${value}/${i} "${tx.s}"`).toBeLessThan(FRAMES[fid].h - 40)
              expect(tx.s, `${t.id}#${value}/${i}`).not.toMatch(/undefined|NaN|^—$/)
            }
          })
        }
      }
    })
  }

  it('sade sati grid follows Saturn in Pisces (Nov 2026)', () => {
    const b = getTemplate('sade-sati')!.build(day, params)
    const grid = b.slides[0]
    if (grid.type !== 'signGrid') throw new Error('expected grid')
    const phase = Object.fromEntries(grid.cells.map((c) => [c.rashi, c.value]))
    expect(phase[11]).toMatch(/setting/)
    expect(phase[12]).toMatch(/peak/)
    expect(phase[1]).toMatch(/rising/)
    expect(phase[5]).toMatch(/Ashtama/)
  })
})

describe('aaj ka upay', () => {
  it('has real content for every weekday lord', () => {
    for (let v = 0; v < 7; v++) {
      const d = { ...day, panchang: { ...day.panchang, vara: { ...day.panchang.vara, number: v } } } as DayData
      const s = getTemplate('upay')!.build(d, params).slides[0]
      if (s.type !== 'text') throw new Error('expected text slide')
      for (const b of s.bullets ?? []) expect(b.items.filter(Boolean).length, `weekday ${v} ${b.title}`).toBeGreaterThan(0)
    }
  })
})
