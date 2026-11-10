/**
 * Slide renderer: lays out a SlideSpec for any frame using a simple vertical stack.
 * Blocks have a minimum height, optional growth (up to max) and can be optional
 * (dropped first when a tight frame like 1:1 runs out of room).
 */
import type { Frame } from '@/lib/social/render/frame'
import { type Theme, type Tone, toneColors } from '@/lib/social/render/theme'
import {
  COL_W,
  COL_X,
  CX,
  RASHI_DEVA,
  RASHI_GLYPH,
  drawBackground,
  drawBar,
  drawBrandHeader,
  drawDial,
  drawLotus,
  drawMedallion,
  drawNakshatraRing,
  drawOrnament,
  drawPanel,
  drawSectionHeading,
  drawSwatch,
  drawZodiacWheel,
  measure,
  rrect,
  sparkle,
  splitLines,
  text,
  wrap,
} from '@/lib/social/render/kit'
import { drawPlanetDisk } from '@/lib/social/render/planet-disk'
import type { BrandSettings, Heading, Hero, Lead, RashiCard, Row, SignCell, SlideSpec, Tile, WeekRow } from '@/lib/social/render/slides/types'
import { RASHI_SANSKRIT, type Rashi } from '@/types/astrology'

export interface RenderCtx {
  frame: Frame
  theme: Theme
  brand: BrandSettings
  icon?: HTMLImageElement | null
  seed: string
  index: number
  total: number
}

// ── Stack layout ──────────────────────────────────────────────

export interface Block {
  min: number
  max?: number
  grow?: number
  optional?: boolean
  /** May be squeezed down to 70% of `min` when the frame is too short. */
  shrink?: boolean
  draw: (y: number, h: number) => void
}

const GAP_MIN = 26
const GAP_MAX = 64

/** Lays blocks out between top and bottom. Exported for tests. */
export function layoutStack(top: number, bottom: number, blocks: Block[]): { y: number; h: number; block: Block }[] {
  let list = [...blocks]
  const avail = bottom - top
  const need = (l: Block[]) => l.reduce((n, b) => n + b.min, 0) + GAP_MIN * Math.max(0, l.length - 1)
  while (need(list) > avail) {
    const idx = list.map((b) => !!b.optional).lastIndexOf(true)
    if (idx < 0) break
    list = list.filter((_, i) => i !== idx)
  }
  const heights = list.map((b) => b.min)
  let deficit = need(list) - avail
  if (deficit > 0) {
    const room = list.reduce((n, b) => n + (b.shrink ? b.min * 0.3 : 0), 0)
    if (room > 0) {
      const k = Math.min(1, deficit / room)
      list.forEach((b, i) => {
        if (b.shrink) heights[i] = b.min - b.min * 0.3 * k
      })
      deficit -= room * k
    }
  }
  let extra = avail - (heights.reduce((a, b) => a + b, 0) + GAP_MIN * Math.max(0, list.length - 1))
  for (let pass = 0; pass < 3 && extra > 0.5; pass++) {
    const growers = list.map((b, i) => ({ b, i })).filter(({ b, i }) => b.grow && heights[i] < (b.max ?? Infinity))
    const total = growers.reduce((n, g) => n + (g.b.grow ?? 0), 0)
    if (!total) break
    let used = 0
    for (const g of growers) {
      const add = Math.min((extra * (g.b.grow ?? 0)) / total, (g.b.max ?? Infinity) - heights[g.i])
      heights[g.i] += add
      used += add
    }
    extra -= used
  }
  const gaps = Math.max(0, list.length - 1)
  const gap = gaps ? Math.min(GAP_MAX, GAP_MIN + Math.max(0, extra) / gaps) : 0
  const used = heights.reduce((a, b) => a + b, 0) + gap * gaps
  let y = top + Math.max(0, (avail - used) / 2)
  return list.map((block, i) => {
    const out = { y, h: heights[i], block }
    y += heights[i] + gap
    return out
  })
}

function runStack(top: number, bottom: number, blocks: Block[]) {
  for (const p of layoutStack(top, bottom, blocks)) p.block.draw(p.y, p.h)
}

// ── Pieces ────────────────────────────────────────────────────

function titleSize(f: Frame): number {
  return f.id === '1x1' ? 68 : f.id === '9x16' ? 90 : 80
}

function headingBlock(ctx: CanvasRenderingContext2D, rc: RenderCtx, head: Heading, big = false): Block {
  const t = rc.theme
  const ts = titleSize(rc.frame) * (big ? 1.18 : 1)
  const titleLines = splitLines(ctx, head.title, COL_W, { kind: 'serif', size: ts, weight: 600 }, 2)
  const lh = ts * 1.04
  const h =
    (head.kicker ? 52 : 0) +
    (head.deva ? 52 : 0) +
    ts * 0.82 +
    (titleLines.length - 1) * lh +
    (head.sub ? 50 : 0) +
    58
  return {
    min: h,
    draw: (y) => {
      let yy = y
      if (head.kicker) {
        yy += 26
        text(ctx, head.kicker.toUpperCase(), CX, yy, { size: 24, weight: 700, spacing: 6, color: t.gold, maxWidth: COL_W })
        yy += 26
      }
      if (head.deva) {
        yy += 40
        text(ctx, head.deva, CX, yy, { kind: 'deva', size: 36, weight: 600, color: t.goldSoft, maxWidth: COL_W })
        yy += 12
      }
      yy += ts * 0.82
      titleLines.forEach((ln, i) => text(ctx, ln, CX, yy + i * lh, { kind: 'serif', size: ts, weight: 600, color: t.ink, maxWidth: COL_W }))
      yy += (titleLines.length - 1) * lh
      if (head.sub) {
        yy += 44
        text(ctx, head.sub, CX, yy, { size: 30, weight: 500, color: t.inkSoft, maxWidth: COL_W })
        yy += 6
      }
      drawOrnament(ctx, t, yy + 38)
    },
  }
}

function drawLead(ctx: CanvasRenderingContext2D, t: Theme, lead: Lead, cx: number, cy: number, r: number) {
  if (lead.kind === 'planet') drawPlanetDisk(ctx, cx, cy, r, lead.id)
  else if (lead.kind === 'swatch') drawSwatch(ctx, t, cx, cy, r * 0.85, lead.color)
  else drawMedallion(ctx, t, cx, cy, r, lead.text, lead.font ?? 'deva')
}

function drawRow(ctx: CanvasRenderingContext2D, t: Theme, x: number, y: number, w: number, h: number, r: Row) {
  const tone = r.tone ?? 'neutral'
  const c = toneColors(t, tone)
  drawPanel(ctx, t, x, y, w, h, tone, 20)
  ctx.save()
  rrect(ctx, x + 14, y + 16, 6, h - 32, 3)
  ctx.fillStyle = tone === 'neutral' ? t.gold : c.bar
  ctx.fill()
  ctx.restore()
  let tx = x + 42
  if (r.lead) {
    const lr = Math.min(32, h * 0.3)
    drawLead(ctx, t, r.lead, tx + lr, y + h / 2, lr)
    tx += lr * 2 + 20
  }
  const right = r.right ?? ''
  const rightW = right ? measure(ctx, right, { size: 32, weight: 600 }) : 0
  const maxT = w - (tx - x) - rightW - (right ? 48 : 28)
  const titleSz = h >= 110 ? 40 : h >= 84 ? 36 : 32
  const noteSz = h >= 84 ? 24 : 21
  const noteLines = r.note && h >= 128 ? splitLines(ctx, r.note, maxT, { size: 23, weight: 500 }, 2) : null
  if (r.note && noteLines && noteLines.length > 1) {
    const block = titleSz * 0.72 + 14 + 2 * 31
    const top = y + (h - block) / 2 + titleSz * 0.72
    text(ctx, r.title, tx, top, { kind: 'serif', size: titleSz, weight: 600, color: t.ink, align: 'left', maxWidth: maxT })
    noteLines.forEach((ln, i) =>
      text(ctx, ln, tx, top + 40 + i * 31, { size: 23, weight: 500, color: tone === 'neutral' ? t.inkSoft : c.ink, align: 'left', maxWidth: maxT }),
    )
  } else if (r.note) {
    const gapTN = Math.min(36, h * 0.34)
    const top = y + (h - (titleSz * 0.72 + gapTN)) / 2 + titleSz * 0.72
    text(ctx, r.title, tx, top, { kind: 'serif', size: titleSz, weight: 600, color: t.ink, align: 'left', maxWidth: maxT })
    text(ctx, r.note, tx, top + gapTN, { size: noteSz, weight: 500, color: tone === 'neutral' ? t.inkSoft : c.ink, align: 'left', maxWidth: maxT })
  } else {
    text(ctx, r.title, tx, y + h / 2 + titleSz * 0.34, { kind: 'serif', size: titleSz, weight: 600, color: t.ink, align: 'left', maxWidth: maxT })
  }
  if (right) text(ctx, right, x + w - 28, y + h / 2 + 11, { size: h >= 84 ? 32 : 29, weight: 600, color: tone === 'neutral' ? t.ink : c.ink, align: 'right' })
}

function rowsBlock(ctx: CanvasRenderingContext2D, t: Theme, rows: Row[], heading?: string): Block {
  const hasNote = rows.some((r) => r.note)
  const minH = hasNote ? 98 : 84
  const maxH = hasNote ? 150 : 124
  const gap = 14
  const head = heading ? 54 : 0
  return {
    min: head + rows.length * minH + (rows.length - 1) * gap,
    max: head + rows.length * maxH + (rows.length - 1) * gap,
    grow: rows.length,
    shrink: true,
    draw: (y, h) => {
      let yy = y
      if (heading) {
        drawSectionHeading(ctx, t, yy + 26, heading)
        yy += head
      }
      const rh = (h - head - (rows.length - 1) * gap) / rows.length
      for (const r of rows) {
        drawRow(ctx, t, COL_X, yy, COL_W, rh, r)
        yy += rh + gap
      }
    },
  }
}

function drawTile(ctx: CanvasRenderingContext2D, t: Theme, x: number, y: number, w: number, h: number, tile: Tile) {
  const tone = tile.tone ?? 'neutral'
  const c = toneColors(t, tone)
  drawPanel(ctx, t, x, y, w, h, tone)
  const mid = x + w / 2
  const vs = Math.min(60, Math.max(38, h * 0.26))
  const block = 24 + 14 + vs + (tile.detail ? 40 : 0)
  let yy = y + (h - block) / 2 + 22
  const inline = tile.lead && h < 210
  if (tile.lead && !inline) drawLead(ctx, t, tile.lead, x + 46, y + 46, 22)
  text(ctx, tile.label.toUpperCase(), mid, yy, { size: 22, weight: 700, spacing: 4, color: tone === 'neutral' ? t.gold : c.ink, maxWidth: w - 36 })
  yy += 14 + vs * 0.92
  if (inline && tile.lead) {
    const vw = Math.min(w - 90, measure(ctx, tile.value, { kind: 'serif', size: vs, weight: 600 }))
    drawLead(ctx, t, tile.lead, mid - vw / 2 - 8, yy - vs * 0.32, 16)
    text(ctx, tile.value, mid + 18, yy, { kind: 'serif', size: vs, weight: 600, color: t.ink, maxWidth: w - 90 })
  } else {
    text(ctx, tile.value, mid, yy, { kind: 'serif', size: vs, weight: 600, color: t.ink, maxWidth: w - 36 })
  }
  if (tile.detail) text(ctx, tile.detail, mid, yy + 40, { size: 24, weight: 500, color: t.inkSoft, maxWidth: w - 36 })
}

function tilesBlock(ctx: CanvasRenderingContext2D, t: Theme, tiles: Tile[], cols: number, minH = 170, maxH = 270): Block {
  const rows = Math.ceil(tiles.length / cols)
  const gap = 20
  return {
    min: rows * minH + (rows - 1) * gap,
    max: rows * maxH + (rows - 1) * gap,
    grow: rows,
    shrink: true,
    draw: (y, h) => {
      const tw = (COL_W - gap * (cols - 1)) / cols
      const th = (h - gap * (rows - 1)) / rows
      tiles.forEach((tile, i) => {
        const r = Math.floor(i / cols)
        const inRow = Math.min(cols, tiles.length - r * cols)
        const rowW = inRow * tw + (inRow - 1) * gap
        const x0 = COL_X + (COL_W - rowW) / 2
        drawTile(ctx, t, x0 + (i % cols) * (tw + gap), y + r * (th + gap), tw, th, tile)
      })
    },
  }
}

function noteBlock(ctx: CanvasRenderingContext2D, t: Theme, note: string): Block {
  const lines = splitLines(ctx, note, COL_W, { size: 26, weight: 500 }, 2)
  return { min: lines.length * 36, optional: true, draw: (y) => wrap(ctx, note, CX, y + 28, COL_W, 36, { size: 26, weight: 500, color: t.inkMute }, 2) }
}

function heroBlock(ctx: CanvasRenderingContext2D, t: Theme, hero: Hero, optional = false): Block {
  const spec: Record<Hero['kind'], [number, number]> = {
    wheel: [440, 800],
    nakRing: [440, 760],
    dayRing: [420, 660],
    glyph: [220, 380],
    lotus: [280, 460],
  }
  const [min, max] = spec[hero.kind]
  return {
    min,
    max,
    grow: 3,
    optional,
    draw: (y, h) => drawHero(ctx, t, hero, CX, y + h / 2, h),
  }
}

function drawHero(ctx: CanvasRenderingContext2D, t: Theme, hero: Hero, cx: number, cy: number, h: number) {
  if (hero.kind === 'wheel') {
    const r = Math.min(h / 2 - 16, 400)
    drawZodiacWheel(ctx, t, cx, cy, r, {
      glyphs: true,
      mandala: true,
      planets: hero.planets,
      highlightNak: hero.highlightNak,
      highlightRashi: hero.highlightRashi,
      lineWidth: 2.5,
    })
  } else if (hero.kind === 'nakRing') {
    const r = Math.min(h / 2 - 50, 340)
    drawNakshatraRing(ctx, t, cx, cy, r, hero.idx, hero.moonLon)
    text(ctx, hero.big, cx, cy + r * 0.12, { kind: 'serif', size: r * 0.62, weight: 600, color: t.gold })
    text(ctx, hero.small.toUpperCase(), cx, cy + r * 0.34, { size: 26, weight: 700, spacing: 6, color: t.inkSoft })
  } else if (hero.kind === 'dayRing') {
    const r = Math.min(h / 2 - 70, 250)
    const paint = (slots: typeof hero.day, from: number, alpha: number) => {
      const mins = slots.map((s) => {
        const a = new Date(s.start).getTime()
        let b = new Date(s.end).getTime()
        if (b < a) b += 86_400_000
        return Number.isFinite(a) && Number.isFinite(b) ? Math.max(1, (b - a) / 60_000) : 90
      })
      const total = mins.reduce((n, m) => n + m, 0) || 1
      let a = from
      ctx.save()
      ctx.globalAlpha = alpha
      slots.forEach((s, i) => {
        const span = (mins[i] / total) * Math.PI
        ctx.beginPath()
        ctx.arc(cx, cy, r, a + 0.012, a + span - 0.012)
        ctx.strokeStyle = toneColors(t, s.tone).bar
        ctx.lineWidth = r * 0.18
        ctx.stroke()
        a += span
      })
      ctx.restore()
    }
    paint(hero.day, Math.PI, 1)
    paint(hero.night, 0, 0.7)
    ctx.save()
    ctx.strokeStyle = t.goldLine
    ctx.lineWidth = 1.5
    for (const rr of [r * 1.14, r * 0.86]) {
      ctx.beginPath()
      ctx.arc(cx, cy, rr, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
    drawPlanetDisk(ctx, cx, cy - r * 1.14 - 32, 24, 'Su')
    drawPlanetDisk(ctx, cx, cy + r * 1.14 + 32, 24, 'Mo')
    text(ctx, hero.big, cx, cy + r * 0.16, { kind: 'serif', size: r * 0.56, weight: 600, color: t.gold })
    text(ctx, hero.small.toUpperCase(), cx, cy + r * 0.4, { size: 22, weight: 700, spacing: 4, color: t.inkSoft })
  } else if (hero.kind === 'glyph') {
    const r = Math.min(h / 2 - 14, 170)
    drawLotus(ctx, t, cx, cy, r, 12)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2)
    ctx.fillStyle = t.panel
    ctx.fill()
    ctx.strokeStyle = t.gold
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.restore()
    const font = hero.font ?? 'sym'
    text(ctx, hero.glyph, cx, cy + (font === 'serif' ? r * 0.2 : 4), {
      kind: font,
      size: r * (font === 'sym' ? 0.72 : font === 'deva' ? 0.5 : 0.6),
      weight: 600,
      color: t.gold,
      baseline: font === 'serif' ? 'alphabetic' : 'middle',
    })
  } else {
    const r = Math.min(h / 2 - 20, 220)
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.3)
    glow.addColorStop(0, t.dark ? 'rgba(255,200,90,0.28)' : 'rgba(214,160,60,0.22)')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6)
    drawLotus(ctx, t, cx, cy, r, 16)
    drawLotus(ctx, t, cx, cy, r * 0.62, 8)
    if (hero.planet) drawPlanetDisk(ctx, cx, cy, r * 0.3, hero.planet)
    else if (hero.glyph) text(ctx, hero.glyph, cx, cy + 4, { kind: 'deva', size: r * 0.42, weight: 600, color: t.gold, baseline: 'middle' })
    else sparkle(ctx, cx, cy, r * 0.24, t.gold)
  }
}

// ── Slide types ───────────────────────────────────────────────

function signCellDraw(ctx: CanvasRenderingContext2D, t: Theme, x: number, y: number, w: number, h: number, c: SignCell) {
  drawPanel(ctx, t, x, y, w, h, c.tone ?? 'neutral', 20)
  const r = (c.rashi - 1) as number
  const top = y + h * 0.26
  text(ctx, RASHI_GLYPH[r], x + 40, top, { kind: 'sym', size: 36, color: t.gold, baseline: 'middle' })
  text(ctx, RASHI_SANSKRIT[c.rashi as Rashi] ?? '', x + 72, top - 2, { kind: 'serif', size: 30, weight: 600, color: t.ink, align: 'left', baseline: 'middle', maxWidth: w - 84 })
  text(ctx, RASHI_DEVA[r], x + 72, top + 32, { kind: 'deva', size: 20, weight: 600, color: t.inkMute, align: 'left', baseline: 'middle' })
  const vy = y + h * 0.7
  if (c.swatch) {
    drawSwatch(ctx, t, x + 40, vy, 18, c.swatch)
    text(ctx, c.value, x + 72, vy + 10, { size: 28, weight: 700, color: t.ink, align: 'left', maxWidth: w - 84 })
  } else {
    text(ctx, c.value, x + w / 2, vy + 10, { size: 30, weight: 700, color: c.tone && c.tone !== 'neutral' ? toneColors(t, c.tone).ink : t.ink, maxWidth: w - 28 })
  }
  if (c.sub) text(ctx, c.sub, x + w / 2, y + h - 18, { size: 21, weight: 500, color: t.inkMute, maxWidth: w - 24 })
}

function signGridBlock(ctx: CanvasRenderingContext2D, t: Theme, cells: SignCell[]): Block {
  const cols = 3
  const rows = Math.ceil(cells.length / cols)
  const gap = 16
  return {
    min: rows * 150 + (rows - 1) * gap,
    max: rows * 230 + (rows - 1) * gap,
    grow: 4,
    shrink: true,
    draw: (y, h) => {
      const cw = (COL_W - gap * (cols - 1)) / cols
      const ch = (h - gap * (rows - 1)) / rows
      cells.forEach((c, i) => signCellDraw(ctx, t, COL_X + (i % cols) * (cw + gap), y + Math.floor(i / cols) * (ch + gap), cw, ch, c))
    },
  }
}

function weekGridBlock(ctx: CanvasRenderingContext2D, t: Theme, days: string[], rows: WeekRow[]): Block {
  const gap = 14
  const head = 40
  return {
    min: head + rows.length * 116 + (rows.length - 1) * gap,
    max: head + rows.length * 200 + (rows.length - 1) * gap,
    grow: rows.length,
    shrink: true,
    draw: (y, h) => {
      const rh = (h - head - (rows.length - 1) * gap) / rows.length
      const nameW = 250
      const noteW = 170
      const colsX0 = COL_X + nameW
      const colsW = COL_W - nameW - noteW
      const cw = colsW / days.length
      days.forEach((d, i) => text(ctx, d, colsX0 + cw * i + cw / 2, y + 26, { size: 22, weight: 700, spacing: 2, color: t.gold }))
      rows.forEach((r, ri) => {
        const ry = y + head + ri * (rh + gap)
        drawPanel(ctx, t, COL_X, ry, COL_W, rh, 'neutral', 20)
        const ri0 = r.rashi - 1
        text(ctx, RASHI_GLYPH[ri0], COL_X + 46, ry + rh / 2, { kind: 'sym', size: 40, color: t.gold, baseline: 'middle' })
        text(ctx, RASHI_SANSKRIT[r.rashi as Rashi] ?? '', COL_X + 84, ry + rh / 2 - 2, { kind: 'serif', size: 34, weight: 600, color: t.ink, align: 'left', maxWidth: nameW - 92 })
        text(ctx, RASHI_DEVA[ri0], COL_X + 84, ry + rh / 2 + 32, { kind: 'deva', size: 21, weight: 600, color: t.inkMute, align: 'left' })
        const barTop = ry + 22
        const barBottom = ry + rh - 22
        const bw = Math.min(30, cw * 0.55)
        r.scores.forEach((sc, i) => {
          const bh = Math.max(8, ((barBottom - barTop) * Math.max(0, Math.min(100, sc))) / 100)
          const bx = colsX0 + cw * i + (cw - bw) / 2
          ctx.save()
          rrect(ctx, bx, barTop, bw, barBottom - barTop, bw / 2)
          ctx.fillStyle = t.goldFill
          ctx.fill()
          rrect(ctx, bx, barBottom - bh, bw, bh, bw / 2)
          ctx.fillStyle = toneColors(t, r.tones[i] ?? 'neutral').bar
          ctx.fill()
          ctx.restore()
        })
        if (r.note) {
          const lines = splitLines(ctx, r.note, noteW - 24, { size: 22, weight: 600 }, 2)
          lines.forEach((ln, i) =>
            text(ctx, ln, COL_X + COL_W - noteW / 2 - 6, ry + rh / 2 + 8 - (lines.length - 1) * 14 + i * 28, { size: 22, weight: 600, color: t.inkSoft, maxWidth: noteW - 20 }),
          )
        }
      })
    },
  }
}

function rashiBlocks(ctx: CanvasRenderingContext2D, rc: RenderCtx, card: RashiCard): Block[] {
  const t = rc.theme
  const r = card.rashi - 1
  const header: Block = {
    min: 210,
    max: 260,
    grow: 1,
    draw: (y, h) => {
      const cy = y + h / 2
      const mr = Math.min(76, h * 0.34)
      drawLotus(ctx, t, COL_X + mr + 6, cy, mr * 1.25, 10)
      ctx.save()
      ctx.beginPath()
      ctx.arc(COL_X + mr + 6, cy, mr * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = t.panel
      ctx.fill()
      ctx.strokeStyle = t.gold
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.restore()
      text(ctx, RASHI_GLYPH[r], COL_X + mr + 6, cy + 3, { kind: 'sym', size: mr * 0.95, color: t.gold, baseline: 'middle' })
      const tx = COL_X + mr * 2 + 50
      text(ctx, card.dateLabel.toUpperCase(), tx, cy - 58, { size: 22, weight: 700, spacing: 4, color: t.gold, align: 'left' })
      text(ctx, card.sanskrit, tx, cy + 6, { kind: 'serif', size: 70, weight: 600, color: t.ink, align: 'left', maxWidth: 400 })
      text(ctx, `${card.deva} · ${card.english}`, tx, cy + 50, { kind: 'deva', size: 28, weight: 600, color: t.inkSoft, align: 'left', maxWidth: 400 })
      drawDial(ctx, t, COL_X + COL_W - 104, cy + 8, Math.min(96, h * 0.4), card.score, card.tone, card.toneLabel)
    },
  }
  const hl = splitLines(ctx, card.headline, COL_W - 40, { kind: 'serif', size: 50, weight: 600, italic: true }, 2)
  const headline: Block = {
    min: hl.length * 60 + 10,
    draw: (y) => {
      drawOrnament(ctx, t, y, 360)
      hl.forEach((ln, i) => text(ctx, ln, CX, y + 62 + i * 60, { kind: 'serif', size: 50, weight: 600, italic: true, color: t.ink }))
    },
  }
  const summary: Block | null = card.summary
    ? {
        min: 3 * 40,
        optional: true,
        draw: (y) => wrap(ctx, card.summary!, CX, y + 30, COL_W - 40, 40, { size: 28, weight: 500, color: t.inkSoft }, 3),
      }
    : null
  const areas: Block = {
    min: card.areas.length * 50,
    max: card.areas.length * 70,
    grow: 1,
    draw: (y, h) => {
      drawPanel(ctx, t, COL_X, y - 10, COL_W, h + 20, 'neutral', 24)
      const rh = h / card.areas.length
      card.areas.forEach((a, i) => {
        const cy = y + rh * i + rh / 2
        text(ctx, a.label, COL_X + 36, cy + 10, { size: 28, weight: 600, color: t.ink, align: 'left' })
        drawBar(ctx, t, COL_X + 230, cy - 8, COL_W - 360, 16, a.score, a.tone)
        text(ctx, String(Math.round(a.score)), COL_X + COL_W - 36, cy + 10, { size: 28, weight: 700, color: toneColors(t, a.tone).ink, align: 'right' })
      })
    },
  }
  const lucky = tilesBlock(
    ctx,
    t,
    [
      { label: 'Lucky colour', value: card.lucky.color, lead: { kind: 'swatch', color: card.lucky.swatch } },
      { label: 'Number', value: String(card.lucky.number) },
      { label: 'Direction', value: card.lucky.direction },
    ],
    3,
    140,
    190,
  )
  const doAvoid: Block = {
    min: 190,
    max: 260,
    grow: 1,
    optional: true,
    draw: (y, h) => {
      const gap = 20
      const w = (COL_W - gap) / 2
      const col = (x: number, title: string, items: string[], tone: Tone) => {
        drawPanel(ctx, t, x, y, w, h, tone, 22)
        text(ctx, title.toUpperCase(), x + w / 2, y + 44, { size: 22, weight: 700, spacing: 4, color: toneColors(t, tone).ink })
        let yy = y + 92
        for (const it of items.slice(0, 3)) {
          if (yy > y + h - 16) break
          text(ctx, it, x + w / 2, yy, { size: 26, weight: 500, color: t.ink, maxWidth: w - 36 })
          yy += 40
        }
      }
      col(COL_X, 'Do today', card.karya.length ? card.karya : ['Steady routine'], 'good')
      col(COL_X + w + gap, 'Avoid', card.varjya.length ? card.varjya : ['Rushed decisions'], 'warn')
    },
  }
  return [header, headline, ...(summary ? [summary] : []), areas, lucky, doAvoid]
}

function textBlocks(ctx: CanvasRenderingContext2D, rc: RenderCtx, spec: Extract<SlideSpec, { type: 'text' }>): Block[] {
  const t = rc.theme
  const blocks: Block[] = [headingBlock(ctx, rc, spec.head)]
  if (spec.hero) blocks.push({ ...heroBlock(ctx, t, spec.hero, true), min: 220, max: 380 })
  for (const p of spec.paragraphs) {
    const short = p.length <= 70
    const o = short ? ({ kind: 'serif', size: 52, weight: 600, italic: true } as const) : ({ size: 32, weight: 500 } as const)
    const lh = short ? 64 : 46
    const lines = splitLines(ctx, p, COL_W - 40, o, 6)
    blocks.push({ min: lines.length * lh, draw: (y) => lines.forEach((ln, i) => text(ctx, ln, CX, y + lh * 0.74 + i * lh, { ...o, color: t.ink })) })
  }
  const bulletSpecs = spec.bullets ?? []
  bulletSpecs.forEach((b, bi) => {
    const items = b.items.slice(0, 6)
    const tone = b.tone ?? 'neutral'
    const head = b.title ? 56 : 0
    const lineSets = items.map((it) => splitLines(ctx, it, COL_W - 120, { size: 29, weight: 500 }, 2))
    const h = head + lineSets.reduce((n, l) => n + l.length * 40 + 16, 0) + 30
    blocks.push({
      min: h,
      // Keep the first bullet group; later ones can drop when the frame is short.
      optional: bi > 0,
      draw: (y) => {
        drawPanel(ctx, t, COL_X, y, COL_W, h, tone, 24)
        let yy = y + 24
        if (b.title) {
          text(ctx, b.title.toUpperCase(), CX, yy + 26, { size: 23, weight: 700, spacing: 4, color: toneColors(t, tone).ink })
          yy += head
        }
        for (const ls of lineSets) {
          sparkle(ctx, COL_X + 46, yy + 20, 9, t.gold)
          ls.forEach((ln, i) => text(ctx, ln, COL_X + 76, yy + 30 + i * 40, { size: 29, weight: 500, color: t.ink, align: 'left' }))
          yy += ls.length * 40 + 16
        }
      },
    })
  })
  return blocks
}

// ── Chrome ────────────────────────────────────────────────────

function drawFooter(ctx: CanvasRenderingContext2D, rc: RenderCtx, final: boolean) {
  const t = rc.theme
  const f = rc.frame
  const handle = rc.brand.handle.trim()
  if (!final) {
    text(ctx, 'Swipe for more  →', CX, f.footerY, { size: 28, weight: 600, spacing: 2, color: t.goldSoft })
    if (handle && f.id === '9x16') text(ctx, handle, CX, f.footerY + 48, { size: 26, weight: 500, color: t.inkMute })
    return
  }
  if (handle) {
    const w = measure(ctx, handle, { size: 30, weight: 700 }) + 72
    const y = f.footerY - 40
    ctx.save()
    rrect(ctx, CX - w / 2, y, w, 58, 29)
    ctx.fillStyle = t.gold
    ctx.fill()
    ctx.restore()
    text(ctx, handle, CX, y + 40, { size: 30, weight: 700, color: t.onGold })
  }
  if (rc.brand.ctaLine && f.id === '9x16') text(ctx, rc.brand.ctaLine, CX, f.footerY + 66, { size: 26, weight: 500, color: t.inkMute, maxWidth: 900 })
}

/** Draws one slide into a canvas sized to rc.frame. */
export function renderSlide(ctx: CanvasRenderingContext2D, spec: SlideSpec, rc: RenderCtx) {
  const t = rc.theme
  const f = rc.frame
  const heroFirst = spec.type === 'cover' || spec.type === 'cta' || spec.type === 'rashi'
  ctx.clearRect(0, 0, f.w, f.h)
  drawBackground(ctx, f, t, `${rc.seed}-${rc.index}`, !heroFirst)
  drawBrandHeader(ctx, t, rc.brand.name, rc.icon, { index: rc.index + 1, total: rc.total })
  const final = rc.index >= rc.total - 1
  const top = f.contentTop
  const bottom = f.contentBottom

  switch (spec.type) {
    case 'cover': {
      const blocks: Block[] = [headingBlock(ctx, rc, spec.head, true)]
      if (spec.meta) blocks.push({ min: 36, optional: true, draw: (y) => text(ctx, spec.meta!, CX, y + 28, { size: 27, weight: 500, color: t.inkMute, maxWidth: COL_W }) })
      blocks.push(heroBlock(ctx, t, spec.hero))
      if (spec.tiles?.length) blocks.push({ ...tilesBlock(ctx, t, spec.tiles, Math.min(3, spec.tiles.length), 170, 230), optional: true })
      runStack(top, bottom, blocks)
      break
    }
    case 'list': {
      const blocks: Block[] = [headingBlock(ctx, rc, spec.head)]
      for (const s of spec.sections) blocks.push(rowsBlock(ctx, t, s.rows, s.heading))
      if (spec.note) blocks.push(noteBlock(ctx, t, spec.note))
      runStack(top, bottom, blocks)
      break
    }
    case 'tiles': {
      const blocks: Block[] = [headingBlock(ctx, rc, spec.head), tilesBlock(ctx, t, spec.tiles, spec.cols)]
      if (spec.note) blocks.push(noteBlock(ctx, t, spec.note))
      runStack(top, bottom, blocks)
      break
    }
    case 'signGrid': {
      const blocks: Block[] = [headingBlock(ctx, rc, spec.head), signGridBlock(ctx, t, spec.cells)]
      if (spec.note) blocks.push(noteBlock(ctx, t, spec.note))
      runStack(top, bottom, blocks)
      break
    }
    case 'rashi':
      runStack(top, bottom, rashiBlocks(ctx, rc, spec.card))
      break
    case 'weekGrid': {
      const blocks: Block[] = [headingBlock(ctx, rc, spec.head), weekGridBlock(ctx, t, spec.days, spec.rows)]
      if (spec.note) blocks.push(noteBlock(ctx, t, spec.note))
      runStack(top, bottom, blocks)
      break
    }
    case 'text':
      runStack(top, bottom, textBlocks(ctx, rc, spec))
      break
    case 'quote': {
      const blocks: Block[] = []
      if (spec.head) blocks.push(headingBlock(ctx, rc, spec.head))
      const qo = spec.deva
        ? ({ kind: 'deva', size: 42, weight: 600 } as const)
        : ({ kind: 'serif', size: 52, italic: true, weight: 500 } as const)
      const lh = spec.deva ? 66 : 66
      const lines = splitLines(ctx, spec.quote, COL_W - 80, qo, spec.deva ? 6 : 7)
      blocks.push({
        min: lines.length * lh + 120,
        draw: (y) => {
          text(ctx, '“', CX, y + 90, { kind: 'serif', size: 150, weight: 600, color: t.gold })
          lines.forEach((ln, i) => text(ctx, ln, CX, y + 150 + i * lh, { ...qo, color: spec.deva ? t.gold : t.ink }))
        },
      })
      if (spec.translation) {
        const tl = splitLines(ctx, spec.translation, COL_W - 60, { kind: 'serif', size: 34, italic: true, weight: 500 }, 6)
        blocks.push({
          min: tl.length * 46 + 30,
          shrink: true,
          draw: (y) => {
            drawOrnament(ctx, t, y + 6, 300)
            tl.forEach((ln, i) => text(ctx, ln, CX, y + 56 + i * 46, { kind: 'serif', size: 34, italic: true, weight: 500, color: t.ink }))
          },
        })
      }
      if (spec.attribution) blocks.push({ min: 40, draw: (y) => text(ctx, `— ${spec.attribution}`, CX, y + 30, { size: 28, weight: 600, color: t.gold, maxWidth: COL_W }) })
      runStack(top, bottom, blocks)
      break
    }
    case 'cta': {
      const blocks: Block[] = [
        heroBlock(ctx, t, { kind: 'lotus' }),
        headingBlock(ctx, rc, { deva: spec.deva, title: spec.title }),
        {
          min: spec.lines.length * 52,
          draw: (y) => spec.lines.forEach((ln, i) => text(ctx, ln, CX, y + 38 + i * 52, { size: 32, weight: 500, color: t.inkSoft, maxWidth: COL_W })),
        },
      ]
      runStack(top, bottom, blocks)
      break
    }
  }
  drawFooter(ctx, rc, final)
}

