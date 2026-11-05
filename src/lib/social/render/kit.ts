/**
 * Canvas drawing kit for social slides (fonts, text fitting, ornaments, zodiac wheel, panels).
 * Pure canvas helpers — no React / DB imports. Width is always 1080.
 */
import type { GrahaId } from '@/types/astrology'
import type { Frame } from '@/lib/social/render/frame'
import { type Theme, type Tone, toneColors } from '@/lib/social/render/theme'
import { drawPlanetDisk } from '@/lib/social/render/planet-disk'

export const W = 1080
export const CX = 540
export const COL_X = 84
export const COL_W = 912

// ── Fonts ─────────────────────────────────────────────────────

export type FontKind = 'serif' | 'sans' | 'deva' | 'sym'

const FALLBACK: Record<FontKind, string> = {
  serif: 'Newsreader, Georgia, "Times New Roman", serif',
  sans: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  deva: '"Noto Sans Devanagari", "Kohinoor Devanagari", "Nirmala UI", Mangal, sans-serif',
  sym: '"Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Sans Symbols", "DejaVu Sans", sans-serif',
}

const CSS_VAR: Partial<Record<FontKind, string>> = {
  serif: '--font-newsreader',
  sans: '--font-inter',
  deva: '--font-noto-deva',
}

let fontStacks: Record<FontKind, string> | null = null

function readCssVar(name: string): string {
  if (typeof document === 'undefined') return ''
  for (const el of [document.body, document.documentElement]) {
    if (!el) continue
    const v = getComputedStyle(el).getPropertyValue(name).trim()
    if (v) return v
  }
  return ''
}

/** Font stacks; prefers the app's next/font families (Newsreader / Inter / Noto Devanagari). */
export function fonts(): Record<FontKind, string> {
  if (fontStacks) return fontStacks
  const out = { ...FALLBACK }
  for (const k of Object.keys(CSS_VAR) as FontKind[]) {
    const v = readCssVar(CSS_VAR[k]!)
    if (v) out[k] = `${v}, ${FALLBACK[k]}`
  }
  if (typeof document !== 'undefined') fontStacks = out
  return out
}

/** Load the fonts before drawing so the first render is not in a fallback face. */
export async function ensureFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  const f = fonts()
  const specs = [
    `600 80px ${f.serif}`,
    `italic 400 40px ${f.serif}`,
    `400 30px ${f.sans}`,
    `600 30px ${f.sans}`,
    `700 30px ${f.sans}`,
    `600 34px ${f.deva}`,
  ]
  try {
    await Promise.all(specs.map((s) => document.fonts.load(s, 'Aa अ')))
  } catch {
    /* fall back silently */
  }
}

export function setFont(ctx: CanvasRenderingContext2D, kind: FontKind, size: number, weight: number | string = 400, italic = false) {
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${Math.round(size)}px ${fonts()[kind]}`
}

// ── Text ──────────────────────────────────────────────────────

export interface TextOpts {
  kind?: FontKind
  size: number
  weight?: number | string
  italic?: boolean
  color: string
  align?: CanvasTextAlign
  /** Shrink (down to 70%) then ellipsize to fit. */
  maxWidth?: number
  spacing?: number
  baseline?: CanvasTextBaseline
}

function withSpacing(ctx: CanvasRenderingContext2D, px: number | undefined) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
  if ('letterSpacing' in c) c.letterSpacing = px ? `${px}px` : '0px'
}

export function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: TextOpts): number {
  ctx.save()
  let size = o.size
  setFont(ctx, o.kind ?? 'sans', size, o.weight, o.italic)
  withSpacing(ctx, o.spacing)
  let str = s
  if (o.maxWidth) {
    const min = o.size * 0.7
    while (ctx.measureText(str).width > o.maxWidth && size > min) {
      size -= 2
      setFont(ctx, o.kind ?? 'sans', size, o.weight, o.italic)
    }
    if (ctx.measureText(str).width > o.maxWidth) {
      while (str.length > 1 && ctx.measureText(`${str}…`).width > o.maxWidth) str = str.slice(0, -1)
      str = `${str.trimEnd()}…`
    }
  }
  ctx.fillStyle = o.color
  ctx.textAlign = o.align ?? 'center'
  ctx.textBaseline = o.baseline ?? 'alphabetic'
  ctx.fillText(str, x, y)
  const w = ctx.measureText(str).width
  ctx.restore()
  return w
}

export function measure(ctx: CanvasRenderingContext2D, s: string, o: Omit<TextOpts, 'color'>): number {
  ctx.save()
  setFont(ctx, o.kind ?? 'sans', o.size, o.weight, o.italic)
  withSpacing(ctx, o.spacing)
  const w = ctx.measureText(s).width
  ctx.restore()
  return w
}

export function splitLines(ctx: CanvasRenderingContext2D, s: string, maxWidth: number, o: Omit<TextOpts, 'color'>, maxLines = 4): string[] {
  ctx.save()
  setFont(ctx, o.kind ?? 'sans', o.size, o.weight, o.italic)
  withSpacing(ctx, o.spacing)
  const words = s.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    kept[maxLines - 1] = `${last.trimEnd()}…`
    ctx.restore()
    return kept
  }
  ctx.restore()
  return lines
}

/** Word-wrapped text. Returns the Y just below the last line. */
export function wrap(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, maxWidth: number, lineHeight: number, o: TextOpts, maxLines = 4): number {
  const lines = splitLines(ctx, s, maxWidth, o, maxLines)
  lines.forEach((ln, i) => text(ctx, ln, x, y + i * lineHeight, o))
  return y + lines.length * lineHeight
}

// ── Shapes ────────────────────────────────────────────────────

export function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? size : size * 0.28
    const a = (Math.PI / 4) * i - Math.PI / 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function seeded(seedStr: string) {
  let seed = 7
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0xffffffff
  }
}

// ── Background & frame border ─────────────────────────────────

export function drawBackground(ctx: CanvasRenderingContext2D, f: Frame, t: Theme, seedKey: string, watermark: boolean) {
  const H = f.h
  ctx.save()
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, t.bg[0])
  g.addColorStop(0.5, t.bg[1])
  g.addColorStop(1, t.bg[2])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  const n1 = ctx.createRadialGradient(240, H * 0.22, 0, 240, H * 0.22, 700)
  n1.addColorStop(0, t.nebula[0])
  n1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = n1
  ctx.fillRect(0, 0, W, H)
  const n2 = ctx.createRadialGradient(880, H * 0.8, 0, 880, H * 0.8, 720)
  n2.addColorStop(0, t.nebula[1])
  n2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = n2
  ctx.fillRect(0, 0, W, H)

  const rnd = seeded(seedKey)
  const count = Math.round((t.dark ? 240 : 110) * (H / 1920))
  for (let i = 0; i < count; i++) {
    const x = rnd() * W
    const y = rnd() * H
    const r = rnd() * (t.dark ? 1.7 : 1.3) + 0.35
    const a = (rnd() * 0.6 + 0.15) * (t.dark ? 1 : 0.55)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${t.star},${a.toFixed(3)})`
    ctx.fill()
  }
  for (let i = 0; i < 7; i++) sparkle(ctx, rnd() * W, rnd() * H, 6 + rnd() * 7, `rgba(${t.star},${t.dark ? 0.7 : 0.4})`)

  if (watermark) {
    ctx.globalAlpha = t.dark ? 0.14 : 0.11
    drawZodiacWheel(ctx, t, CX, H * 0.48, Math.min(470, H * 0.33), { glyphs: true, mandala: true })
    ctx.globalAlpha = 1
  }
  if (t.dark) {
    const v = ctx.createRadialGradient(CX, H / 2, H * 0.24, CX, H / 2, H * 0.62)
    v.addColorStop(0, 'rgba(0,0,0,0)')
    v.addColorStop(1, 'rgba(0,0,0,0.42)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, W, H)
  }
  ctx.restore()
  drawBorder(ctx, f, t)
}

export function drawBorder(ctx: CanvasRenderingContext2D, f: Frame, t: Theme) {
  const H = f.h
  ctx.save()
  ctx.strokeStyle = t.goldLine
  ctx.lineWidth = 2
  rrect(ctx, 26, 26, W - 52, H - 52, 24)
  ctx.stroke()
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.6
  rrect(ctx, 38, 38, W - 76, H - 76, 18)
  ctx.stroke()
  ctx.globalAlpha = 1
  const fill = t.dark ? t.bg[0] : t.bg[1]
  for (const [x, y] of [
    [38, 38],
    [W - 38, 38],
    [38, H - 38],
    [W - 38, H - 38],
  ] as [number, number][]) {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.arc(x, y, 13, 0, Math.PI * 2)
    ctx.fill()
    sparkle(ctx, x, y, 12, t.gold)
  }
  for (const y of [26, H - 26]) {
    ctx.save()
    ctx.translate(CX, y)
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = fill
    ctx.fillRect(-9, -9, 18, 18)
    ctx.strokeStyle = t.gold
    ctx.lineWidth = 2
    ctx.strokeRect(-6, -6, 12, 12)
    ctx.restore()
  }
  ctx.restore()
}

// ── Zodiac geometry ───────────────────────────────────────────

export const RASHI_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g) => `${g}︎`)
export const RASHI_DEVA = ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन']

function lonAngle(lon: number) {
  return Math.PI - (lon * Math.PI) / 180
}
function polar(cx: number, cy: number, r: number, lon: number): [number, number] {
  const a = lonAngle(lon)
  return [cx + Math.cos(a) * r, cy - Math.sin(a) * r]
}

export interface WheelOpts {
  glyphs?: boolean
  mandala?: boolean
  highlightNak?: number | null
  highlightRashi?: number | null
  planets?: { id: GrahaId | string; lon: number }[]
  lineWidth?: number
}

export function drawZodiacWheel(ctx: CanvasRenderingContext2D, t: Theme, cx: number, cy: number, r: number, o: WheelOpts = {}) {
  const band = r * 0.17
  const nakOuter = r - band
  const nakInner = nakOuter - r * 0.07
  const lw = o.lineWidth ?? 2
  ctx.save()
  ctx.strokeStyle = t.wheel
  ctx.lineWidth = lw
  if (o.highlightRashi != null) {
    const a0 = lonAngle(o.highlightRashi * 30)
    const a1 = lonAngle(o.highlightRashi * 30 + 30)
    ctx.beginPath()
    ctx.arc(cx, cy, r, -a0, -a1, false)
    ctx.arc(cx, cy, nakOuter, -a1, -a0, true)
    ctx.closePath()
    ctx.fillStyle = t.goldFill
    ctx.fill()
  }
  if (o.highlightNak != null) {
    const span = 360 / 27
    const a0 = lonAngle(o.highlightNak * span)
    const a1 = lonAngle(o.highlightNak * span + span)
    ctx.beginPath()
    ctx.arc(cx, cy, nakOuter, -a0, -a1, false)
    ctx.arc(cx, cy, nakInner, -a1, -a0, true)
    ctx.closePath()
    ctx.fillStyle = t.gold
    ctx.fill()
  }
  for (const rad of [r, nakOuter, nakInner]) {
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.lineWidth = lw * 0.5
  ctx.beginPath()
  ctx.arc(cx, cy, r + 10, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1
  for (let d = 0; d < 360; d += 5) {
    if (d % 30 === 0) continue
    const len = d % 10 === 0 ? 10 : 6
    const [x1, y1] = polar(cx, cy, r, d)
    const [x2, y2] = polar(cx, cy, r - len, d)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.lineWidth = lw
  for (let i = 0; i < 12; i++) {
    const [x1, y1] = polar(cx, cy, r, i * 30)
    const [x2, y2] = polar(cx, cy, nakInner, i * 30)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  ctx.lineWidth = 1
  for (let i = 0; i < 27; i++) {
    const [x1, y1] = polar(cx, cy, nakOuter, (i * 360) / 27)
    const [x2, y2] = polar(cx, cy, nakInner, (i * 360) / 27)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  if (o.glyphs !== false) {
    const gs = Math.max(16, band * 0.58)
    for (let i = 0; i < 12; i++) {
      const [x, y] = polar(cx, cy, r - band / 2, i * 30 + 15)
      text(ctx, RASHI_GLYPH[i], x, y, { kind: 'sym', size: gs, color: o.highlightRashi === i ? t.ink : t.gold, baseline: 'middle' })
    }
  }
  if (o.mandala) drawLotus(ctx, t, cx, cy, nakInner * 0.62, 12)
  if (o.planets?.length) {
    const pr = Math.max(18, r * 0.085)
    const baseR = nakInner - pr - 14
    const placed: { lon: number; rr: number }[] = []
    for (const p of [...o.planets].sort((a, b) => a.lon - b.lon)) {
      let rr = baseR
      for (const q of placed) {
        let d = Math.abs(q.lon - p.lon)
        if (d > 180) d = 360 - d
        const minDeg = ((pr * 2.2) / rr) * (180 / Math.PI)
        if (d < minDeg && Math.abs(q.rr - rr) < pr * 2) rr -= pr * 2.2
      }
      placed.push({ lon: p.lon, rr })
      const [ex, ey] = polar(cx, cy, nakInner, p.lon)
      const [px, py] = polar(cx, cy, rr, p.lon)
      ctx.save()
      ctx.strokeStyle = t.goldLine
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 5])
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(px, py)
      ctx.stroke()
      ctx.restore()
      drawPlanetDisk(ctx, px, py, pr, p.id as GrahaId)
    }
  }
  ctx.restore()
}

export function drawLotus(ctx: CanvasRenderingContext2D, t: Theme, cx: number, cy: number, r: number, petals = 8) {
  ctx.save()
  ctx.strokeStyle = t.wheel
  ctx.lineWidth = 1.5
  for (const [rad, rot] of [
    [r, 0],
    [r * 0.72, Math.PI / petals],
  ] as [number, number][]) {
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + rot
      const w = (Math.PI / petals) * 0.95
      const bx = cx + Math.cos(a) * rad * 0.18
      const by = cy + Math.sin(a) * rad * 0.18
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.quadraticCurveTo(cx + Math.cos(a - w) * rad * 0.62, cy + Math.sin(a - w) * rad * 0.62, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
      ctx.quadraticCurveTo(cx + Math.cos(a + w) * rad * 0.62, cy + Math.sin(a + w) * rad * 0.62, bx, by)
      ctx.stroke()
    }
  }
  for (const rr of [r * 0.18, r * 1.08]) {
    ctx.beginPath()
    ctx.arc(cx, cy, rr, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawNakshatraRing(ctx: CanvasRenderingContext2D, t: Theme, cx: number, cy: number, r: number, activeIdx: number, moonLon?: number) {
  ctx.save()
  const span = (Math.PI * 2) / 27
  const thick = Math.max(8, r * 0.04)
  for (let i = 0; i < 27; i++) {
    const a0 = -Math.PI / 2 + i * span + 0.02
    ctx.beginPath()
    ctx.arc(cx, cy, r, a0, a0 + span - 0.04)
    ctx.lineWidth = i === activeIdx ? thick * 2.2 : thick
    ctx.strokeStyle = i === activeIdx ? t.gold : t.goldLine
    ctx.stroke()
  }
  for (let i = 0; i < 27; i++) {
    if (i % 3 !== 0 && i !== activeIdx) continue
    const a = -Math.PI / 2 + (i + 0.5) * span
    const rr = r + thick + 26
    text(ctx, String(i + 1), cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, {
      size: i === activeIdx ? 30 : 22,
      weight: i === activeIdx ? 700 : 500,
      color: i === activeIdx ? t.gold : t.inkMute,
      baseline: 'middle',
    })
  }
  if (moonLon != null) {
    const a = -Math.PI / 2 + (moonLon / (360 / 27)) * span
    drawPlanetDisk(ctx, cx + Math.cos(a) * (r - thick - 30), cy + Math.sin(a) * (r - thick - 30), 22, 'Mo')
  }
  ctx.restore()
}

// ── Header / ornaments / panels ───────────────────────────────

export function drawBrandHeader(ctx: CanvasRenderingContext2D, t: Theme, brand: string, icon: HTMLImageElement | null | undefined, slide?: { index: number; total: number }) {
  const y = 108
  const label = brand.toUpperCase()
  const tw = measure(ctx, label, { kind: 'serif', size: 32, weight: 600, spacing: 8 })
  const iconS = 56
  const gap = 16
  let x = CX - ((icon ? iconS + gap : 0) + tw) / 2
  if (icon) {
    ctx.save()
    rrect(ctx, x, y - iconS / 2, iconS, iconS, 14)
    ctx.clip()
    ctx.drawImage(icon, x, y - iconS / 2, iconS, iconS)
    ctx.restore()
    ctx.save()
    ctx.strokeStyle = t.goldLine
    ctx.lineWidth = 2
    rrect(ctx, x, y - iconS / 2, iconS, iconS, 14)
    ctx.stroke()
    ctx.restore()
    x += iconS + gap
  }
  text(ctx, label, x, y, { kind: 'serif', size: 32, weight: 600, spacing: 8, color: t.gold, align: 'left', baseline: 'middle' })
  if (slide && slide.total > 1) {
    const s = `${slide.index}/${slide.total}`
    const w = measure(ctx, s, { size: 24, weight: 600 }) + 36
    const px = W - 74 - w
    ctx.save()
    rrect(ctx, px, y - 23, w, 46, 23)
    ctx.fillStyle = t.panel
    ctx.fill()
    ctx.strokeStyle = t.panelStroke
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()
    text(ctx, s, px + w / 2, y + 1, { size: 24, weight: 600, color: t.ink, baseline: 'middle' })
  }
}

export function drawOrnament(ctx: CanvasRenderingContext2D, t: Theme, y: number, width = 480) {
  ctx.save()
  const x0 = CX - width / 2
  const x1 = CX + width / 2
  for (const [a, b, fadeLeft] of [
    [x0, CX - 34, true],
    [CX + 34, x1, false],
  ] as [number, number, boolean][]) {
    const g = ctx.createLinearGradient(a, y, b, y)
    g.addColorStop(0, fadeLeft ? 'rgba(0,0,0,0)' : t.gold)
    g.addColorStop(1, fadeLeft ? t.gold : 'rgba(0,0,0,0)')
    ctx.strokeStyle = g
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(a, y)
    ctx.lineTo(b, y)
    ctx.stroke()
  }
  sparkle(ctx, CX, y, 15, t.gold)
  for (const dx of [-24, 24]) {
    ctx.beginPath()
    ctx.arc(CX + dx, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = t.gold
    ctx.fill()
  }
  ctx.restore()
}

export function drawSectionHeading(ctx: CanvasRenderingContext2D, t: Theme, y: number, label: string) {
  const s = label.toUpperCase()
  const w = measure(ctx, s, { size: 24, weight: 700, spacing: 5 })
  text(ctx, s, CX, y, { size: 24, weight: 700, spacing: 5, color: t.gold })
  ctx.save()
  ctx.strokeStyle = t.goldLine
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(COL_X, y - 8)
  ctx.lineTo(CX - w / 2 - 24, y - 8)
  ctx.moveTo(CX + w / 2 + 24, y - 8)
  ctx.lineTo(COL_X + COL_W, y - 8)
  ctx.stroke()
  ctx.restore()
}

export function drawPanel(ctx: CanvasRenderingContext2D, t: Theme, x: number, y: number, w: number, h: number, tone: Tone = 'neutral', radius = 24) {
  const c = toneColors(t, tone)
  ctx.save()
  rrect(ctx, x, y, w, h, radius)
  ctx.fillStyle = t.panel
  ctx.fill()
  if (tone !== 'neutral') {
    ctx.fillStyle = c.fill
    ctx.fill()
  }
  ctx.strokeStyle = tone === 'neutral' ? t.panelStroke : c.bar
  ctx.globalAlpha = tone === 'neutral' ? 1 : 0.55
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

export function drawMedallion(ctx: CanvasRenderingContext2D, t: Theme, cx: number, cy: number, r: number, glyph: string, kind: FontKind = 'deva') {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = t.goldFill
  ctx.fill()
  ctx.strokeStyle = t.gold
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
  text(ctx, glyph, cx, cy + 2, { kind, size: r * (kind === 'sym' ? 1.15 : 0.95), weight: 600, color: t.gold, baseline: 'middle' })
}

export function drawSwatch(ctx: CanvasRenderingContext2D, t: Theme, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = t.gold
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.restore()
}

/** Horizontal score bar 0–100. */
export function drawBar(ctx: CanvasRenderingContext2D, t: Theme, x: number, y: number, w: number, h: number, pct: number, tone: Tone) {
  ctx.save()
  rrect(ctx, x, y, w, h, h / 2)
  ctx.fillStyle = t.goldFill
  ctx.fill()
  const fw = Math.max(h, (w * Math.max(0, Math.min(100, pct))) / 100)
  rrect(ctx, x, y, fw, h, h / 2)
  ctx.fillStyle = tone === 'neutral' ? t.gold : toneColors(t, tone).bar
  ctx.fill()
  ctx.restore()
}

/** Semi-circular score dial with a number in the middle. */
export function drawDial(ctx: CanvasRenderingContext2D, t: Theme, cx: number, cy: number, r: number, score: number, tone: Tone, label: string) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineWidth = r * 0.16
  ctx.strokeStyle = t.goldFill
  ctx.beginPath()
  ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 2.2)
  ctx.stroke()
  const end = Math.PI * 0.8 + Math.PI * 1.4 * Math.max(0, Math.min(1, score / 100))
  ctx.strokeStyle = tone === 'neutral' ? t.gold : toneColors(t, tone).bar
  ctx.beginPath()
  ctx.arc(cx, cy, r, Math.PI * 0.8, end)
  ctx.stroke()
  ctx.restore()
  text(ctx, String(Math.round(score)), cx, cy + r * 0.22, { kind: 'serif', size: r * 0.78, weight: 600, color: t.ink })
  text(ctx, label.toUpperCase(), cx, cy + r * 0.62, { size: Math.max(18, r * 0.17), weight: 700, spacing: 3, color: toneColors(t, tone).ink })
}

// ── Formatting ────────────────────────────────────────────────

/** "6:35 AM" in IST. */
export function fmtT(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).replace(/ /g, ' ')
}

export function fmtRange(a: string | null | undefined, b: string | null | undefined): string {
  return `${fmtT(a)} – ${fmtT(b)}`
}

export function fmtDeg(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  const d = Math.floor(n)
  const m = Math.round((n - d) * 60)
  return m === 60 ? `${d + 1}°00′` : `${d}°${String(m).padStart(2, '0')}′`
}

export function cap(s: string | undefined | null): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}
