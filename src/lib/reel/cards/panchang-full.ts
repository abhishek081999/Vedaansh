import type { PanchangApiData } from '@/types/reel-panchang'
import type { ReelSettings } from '@/lib/reel/reel-settings'
import {
  CHOGHADIYA_COLORS,
  CHOGHADIYA_MEANING,
  drawBrandFooter,
  drawCarouselCompactFooter,
  drawCarouselSlideBadge,
  drawDivider,
  drawGeometricBg,
  drawHashtagFooter,
  drawLogo,
  drawReelSlideUnderlay,
  getReelBodyVerticalOffset,
  drawStars,
  fmtTime,
  getBgColors,
  roundRect,
  truncate,
  type ReelStyle,
  formatDateDisplay,
} from '@/lib/reel/canvas-utils'
import { NAK_DEITY, NAK_QUALITY } from '@/lib/reel/nakshatra-metadata'

function sectionLabel(ctx: CanvasRenderingContext2D, colors: ReturnType<typeof getBgColors>, y: number, text: string) {
  ctx.save()
  const w = Math.min(880, Math.max(320, ctx.measureText(text).width + 46))
  const x = 540 - w / 2
  roundRect(ctx, x, y - 22, w, 34, 12)
  ctx.fillStyle = 'rgba(8,10,24,0.78)'
  ctx.fill()
  ctx.strokeStyle = `${colors.accent}66`
  ctx.lineWidth = 1.1
  roundRect(ctx, x, y - 22, w, 34, 12)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.font = 'bold 16px system-ui, sans-serif'
  ctx.fillStyle = '#F5F3FF'
  ctx.letterSpacing = '0.08em'
  ctx.fillText(text.toUpperCase(), 540, y)
  ctx.letterSpacing = 'normal'
  ctx.restore()
}

function degFmt(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `${n.toFixed(1)}°`
}

function truncateSafe(s: string, max: number): string {
  if (!s) return ''
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`
}

function drawLimbTile(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  lines: string[],
) {
  ctx.save()
  ctx.fillStyle = 'rgba(7, 10, 26, 0.84)'
  roundRect(ctx, x, y, w, h, 14)
  ctx.fill()
  ctx.strokeStyle = `${colors.accent}62`
  ctx.lineWidth = 1.2
  roundRect(ctx, x, y, w, h, 14)
  ctx.stroke()
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.font = '600 14px sans-serif'
  ctx.fillStyle = '#D6CCFF'
  ctx.fillText(label, x + w / 2, y + 24)
  ctx.font = 'bold 24px serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(truncate(value, 16), x + w / 2, y + 56)
  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#D1D5DB'
  let ly = y + 82
  for (const ln of lines) {
    if (!ln) continue
    ctx.fillText(truncateSafe(ln, 26), x + w / 2, ly)
    ly += 18
  }
}

function drawKeyTimeStrip(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  y: number,
  data: PanchangApiData,
): number {
  const slots: { title: string; range: string; tone: 'good' | 'neutral' | 'warn' }[] = []
  if (data.brahmaMuhurta?.start) {
    slots.push({
      title: 'Brahma Muhurta',
      range: `${fmtTime(data.brahmaMuhurta.start)} – ${fmtTime(data.brahmaMuhurta.end)}`,
      tone: 'good',
    })
  }
  if (data.abhijitMuhurta?.start) {
    slots.push({
      title: 'Abhijit',
      range: `${fmtTime(data.abhijitMuhurta.start)} – ${fmtTime(data.abhijitMuhurta.end)}`,
      tone: 'good',
    })
  }
  if (data.godhuliMuhurat?.start) {
    slots.push({
      title: 'Godhuli / Sandhya',
      range: `${fmtTime(data.godhuliMuhurat.start)} – ${fmtTime(data.godhuliMuhurat.end)}`,
      tone: 'neutral',
    })
  }
  const durs = (data.durMuhurat || []).slice(0, 2)
  durs.forEach((dm, i) => {
    slots.push({
      title: i === 0 ? 'Dur Muhurta' : 'Dur II',
      range: `${fmtTime(dm.start)} – ${fmtTime(dm.end)}`,
      tone: 'warn',
    })
  })

  const maxSlots = 6
  const show = slots.slice(0, maxSlots)
  const gap = 10
  const colCount = 3
  const w = (900 - gap * (colCount - 1)) / colCount
  const rowH = 62
  if (show.length === 0) return y

  show.forEach((s, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 90 + col * (w + gap)
    const yy = y + row * (rowH + gap)
    const fill =
      s.tone === 'good' ? 'rgba(34,197,94,0.12)' : s.tone === 'warn' ? 'rgba(220,38,38,0.1)' : `${colors.accent}10`
    const stroke =
      s.tone === 'good' ? 'rgba(34,197,94,0.38)' : s.tone === 'warn' ? 'rgba(248,113,113,0.35)' : `${colors.accent}30`
    ctx.save()
    ctx.fillStyle = fill
    roundRect(ctx, x, yy, w, rowH, 10)
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    roundRect(ctx, x, yy, w, rowH, 10)
    ctx.stroke()
    ctx.restore()
    ctx.textAlign = 'left'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillStyle = s.tone === 'good' ? '#DCFCE7' : s.tone === 'warn' ? '#FECACA' : colors.text
    ctx.fillText(s.title, x + 10, yy + 26)
    ctx.font = '600 15px sans-serif'
    ctx.fillStyle = s.tone === 'good' ? '#BBF7D0' : s.tone === 'warn' ? '#FEE2E2' : colors.sub
    ctx.fillText(s.range, x + 10, yy + 48)
  })
  const rows = Math.ceil(show.length / 3)
  return y + rows * (rowH + gap) - gap
}

function drawPanchangSlideHero(
  ctx: CanvasRenderingContext2D,
  colors: ReturnType<typeof getBgColors>,
  settings: ReelSettings,
  vedaIcon: HTMLImageElement | null | undefined,
  titleEn: string,
) {
  ctx.textAlign = 'center'
  drawLogo(ctx, colors, 96, settings.brandTitle, vedaIcon)
  ctx.font = '600 30px sans-serif'
  ctx.fillStyle = '#F8FAFC'
  ctx.fillText(titleEn, 540, 214)
  drawDivider(ctx, colors, 248, 920)
}

export function drawPanchangFullCard(
  ctx: CanvasRenderingContext2D,
  data: PanchangApiData,
  dateInfo: ReturnType<typeof formatDateDisplay>,
  style: ReelStyle,
  settings: ReelSettings,
  seedKey: string,
  vedaIcon: HTMLImageElement | null | undefined,
  pageIndex = 0,
  totalPages = 5,
) {
  const colors = getBgColors(style)
  const cc = data.calendarContext
  const tEnd = fmtTime(data.limbEnds?.tithi ?? undefined)
  const nEnd = fmtTime(data.limbEnds?.nakshatra ?? undefined)
  const yEnd = fmtTime(data.limbEnds?.yoga ?? undefined)
  const tithiPct = data.tithi?.percent != null ? `${Math.round(data.tithi.percent)}% elapsed` : ''
  const yogaPct = data.yoga?.percent != null ? `${Math.round(data.yoga.percent)}%` : ''

  const limbSpecs: { label: string; value: string; lines: string[] }[] = [
    {
      label: 'Tithi',
      value: data.tithi?.name || '—',
      lines: [
        `until ${tEnd}`,
        [data.tithi?.paksha, `lord ${data.tithi?.lord || ''}`, tithiPct].filter(Boolean).join(' · '),
      ],
    },
    {
      label: 'Nakshatra',
      value: data.nakshatra?.name || '—',
      lines: [
        `until ${nEnd}`,
        [`pada ${data.nakshatra?.pada ?? '—'}`, `lord ${data.nakshatra?.lord || ''}`, degFmt(data.nakshatra?.degree)]
          .filter((x) => x && !x.includes('—'))
          .join(' · ') || '—',
      ],
    },
    {
      label: 'Yoga',
      value: data.yoga?.name || '—',
      lines: [`until ${yEnd}`, [data.yoga?.quality, yogaPct].filter(Boolean).join(' · ')],
    },
    {
      label: 'Karana',
      value: data.karana?.name || '—',
      lines: [[data.karana?.type, data.karana?.isBhadra ? 'Bhadra' : ''].filter(Boolean).join(' · ')],
    },
    {
      label: 'Vara',
      value: data.vara?.name || '—',
      lines: [[data.vara?.sanskrit, `lord ${data.vara?.lord || ''}`].filter(Boolean).join(' · ')],
    },
  ]

  const boxW = 433
  const boxGap = 14
  const boxH = 96
  const drawRashiBox = (x: number, yy: number, title: string, en: string, sa: string, deg: string) => {
    ctx.save()
    ctx.fillStyle = `${colors.accent}0c`
    roundRect(ctx, x, yy, boxW, boxH, 12)
    ctx.strokeStyle = `${colors.accent}28`
    ctx.lineWidth = 1
    roundRect(ctx, x, yy, boxW, boxH, 12)
    ctx.stroke()
    ctx.restore()
    ctx.textAlign = 'left'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillStyle = '#E9D5FF'
    ctx.fillText(title, x + 14, yy + 22)
    ctx.font = 'bold 21px serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(truncate(`${en} (${sa})`, 24), x + 14, yy + 46)
    ctx.font = '14px sans-serif'
    ctx.fillStyle = '#CBD5E1'
    ctx.fillText(`${deg} in sign`, x + 14, yy + 76)
  }

  const drawAvoidRow = (ay: number) => {
    const aw = 280
    const ag = 15
    const ax0 = 90
    const drawAvoidMini = (x: number, label: string, start: string | undefined, end: string | undefined) => {
      ctx.save()
      ctx.fillStyle = 'rgba(220,38,38,0.1)'
      roundRect(ctx, x, ay, aw, 68, 11)
      ctx.strokeStyle = 'rgba(248,113,113,0.32)'
      ctx.lineWidth = 1
      roundRect(ctx, x, ay, aw, 68, 11)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = '15px sans-serif'
      ctx.fillStyle = '#FCA5A5'
      ctx.fillText(label, x + aw / 2, ay + 24)
      ctx.font = 'bold 17px sans-serif'
      ctx.fillStyle = '#FEE2E2'
      ctx.fillText(`${fmtTime(start)} – ${fmtTime(end)}`, x + aw / 2, ay + 48)
    }
    drawAvoidMini(ax0, 'Rahu Kala', data.rahuKalam?.start, data.rahuKalam?.end)
    drawAvoidMini(ax0 + aw + ag, 'Gulika Kala', data.gulikaKalam?.start, data.gulikaKalam?.end)
    drawAvoidMini(ax0 + 2 * (aw + ag), 'Yamaganda', data.yamaganda?.start, data.yamaganda?.end)
  }

  if (pageIndex === 0) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const blockBottom = 655
    const blockH = blockBottom - 88
    const vy = getReelBodyVerticalOffset(88, blockH)
    ctx.save()
    ctx.translate(0, vy)
    drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'Daily Panchang — limbs & calendar')
    ctx.textAlign = 'center'
    ctx.font = 'bold 42px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(dateInfo.weekday, 540, 298)
    ctx.font = '600 28px sans-serif'
    ctx.fillStyle = '#E2E8F0'
    ctx.fillText(`${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 332)

    if (cc) {
      ctx.font = '600 19px serif'
      ctx.fillStyle = '#E9D5FF'
      const vs = cc.vikramSamvat != null ? `V.S. ${cc.vikramSamvat}` : ''
      const sh = cc.shakaYear != null ? `Shaka ${cc.shakaYear}` : ''
      const cal1 = [cc.samvatsara, vs, sh].filter(Boolean).join('  ·  ')
      ctx.fillText(truncateSafe(cal1 || '—', 58), 540, 364)
      const masa = data.tithi?.paksha ? `${data.tithi.paksha}` : ''
      ctx.font = '16px serif'
      ctx.fillStyle = '#DDD6FE'
      ctx.fillText(
        truncateSafe(
          `${cc.sauraMasa || '—'} ${masa ? `(${masa})` : ''}  ·  ${cc.rituEn || cc.rituSa || ''}  ·  ${cc.ayanaEn || cc.ayanaSa || ''}`,
          58,
        ),
        540,
        388,
      )
    }

    ctx.font = '15px sans-serif'
    ctx.fillStyle = '#CBD5E1'
    ctx.fillText(truncateSafe(`Ayanamsha: ${data.ayanamsha || '—'}  ·  ${data.location?.tz || ''}`, 72), 540, 424)

    drawDivider(ctx, colors, 456, 920)

    const topY = 482
    const topGap = 12
    const topW = (900 - topGap * 2) / 3
    const topH = 130
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * (topW + topGap)
      drawLimbTile(ctx, colors, x, topY, topW, topH, limbSpecs[i].label, limbSpecs[i].value, limbSpecs[i].lines)
    }
    const bottomY = topY + topH + 14
    const bottomGap = 12
    const bottomW = (900 - bottomGap) / 2
    const bottomH = 130
    for (let i = 0; i < 2; i++) {
      const item = limbSpecs[i + 3]
      const x = 90 + i * (bottomW + bottomGap)
      drawLimbTile(ctx, colors, x, bottomY, bottomW, bottomH, item.label, item.value, item.lines)
    }

    drawDivider(ctx, colors, 758, 920)
    ctx.font = '600 18px sans-serif'
    ctx.fillStyle = '#E2E8F0'
    ctx.fillText('Swipe for Sun-Moon, Muhurtas, Dosha periods, Hora and Grahas.', 540, 798)
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 1) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 880)
    ctx.save()
    ctx.translate(0, vy)
    drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'Sun & Moon — luminaries & key muhurtas')
    ctx.textAlign = 'center'
    ctx.font = '600 24px sans-serif'
    ctx.fillStyle = '#E2E8F0'
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`, 540, 288)

    let rowY = 338
    sectionLabel(ctx, colors, rowY, 'Sun & Moon (sidereal)')
    rowY += 28
    const sunNakLine1 =
      data.sunNakshatra?.name != null
        ? `Sun Nakshatra: ${data.sunNakshatra.name} (Pada ${data.sunNakshatra.pada ?? '—'})`
        : ''
    const sunNakLine2 = data.sunNakshatra?.lord ? `Sun Nakshatra Lord: ${data.sunNakshatra.lord}` : ''
    drawRashiBox(90, rowY, 'Sun (Surya)', data.sunRashi?.en || '—', data.sunRashi?.sa || '—', degFmt(data.sunRashi?.degInSign))
    drawRashiBox(
      90 + boxW + boxGap,
      rowY,
      'Moon (Chandra)',
      data.moonRashi?.en || '—',
      data.moonRashi?.sa || '—',
      degFmt(data.moonRashi?.degInSign),
    )
    rowY += boxH + 14
    ctx.font = '15px sans-serif'
    ctx.fillStyle = '#CBD5E1'
    if (sunNakLine1) {
      ctx.fillText(truncate(sunNakLine1, 72), 540, rowY)
      rowY += 20
    }
    if (sunNakLine2) {
      ctx.fillText(truncate(sunNakLine2, 72), 540, rowY)
      rowY += 18
    } else {
      rowY += 10
    }

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22
    sectionLabel(ctx, colors, rowY, 'Sunrise · Sunset')
    rowY += 24
    const timeCardY = rowY
    const timeCardGap = 20
    const timeCardW = (900 - timeCardGap) / 2
    const timeCardH = 84
    const drawTimeCard = (x: number, label: string, value: string) => {
      ctx.save()
      ctx.fillStyle = 'rgba(7, 10, 26, 0.84)'
      roundRect(ctx, x, timeCardY, timeCardW, timeCardH, 12)
      ctx.fill()
      ctx.strokeStyle = `${colors.accent}60`
      ctx.lineWidth = 1.2
      roundRect(ctx, x, timeCardY, timeCardW, timeCardH, 12)
      ctx.stroke()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = '700 15px sans-serif'
      ctx.fillStyle = '#D6CCFF'
      ctx.fillText(label, x + timeCardW / 2, timeCardY + 28)
      ctx.font = '800 42px sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(value, x + timeCardW / 2, timeCardY + 68)
    }
    drawTimeCard(90, 'SUNRISE', fmtTime(data.sunrise))
    drawTimeCard(90 + timeCardW + timeCardGap, 'SUNSET', fmtTime(data.sunset))
    rowY += timeCardH + 24

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22
    sectionLabel(ctx, colors, rowY, 'Key muhurtas')
    rowY += 28
    rowY = drawKeyTimeStrip(ctx, colors, rowY, data) + 16
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 2) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 1100)
    ctx.save()
    ctx.translate(0, vy)
    drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'Dosha periods & Choghadiya')
    ctx.font = '600 24px sans-serif'
    ctx.fillStyle = '#E2E8F0'
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

    let rowY = 318
    sectionLabel(ctx, colors, rowY, 'Avoid today')
    rowY += 28
    drawAvoidRow(rowY)
    rowY += 92

    if (data.riktaTithi?.active) {
      drawDivider(ctx, colors, rowY, 920)
      rowY += 18
      ctx.save()
      ctx.fillStyle = 'rgba(234,179,8,0.12)'
      roundRect(ctx, 90, rowY, 900, 44, 10)
      ctx.fill()
      ctx.restore()
      ctx.textAlign = 'center'
      ctx.font = '15px sans-serif'
      ctx.fillStyle = '#FDE68A'
      ctx.fillText(truncateSafe(`Rikta tithi: ${data.riktaTithi.detail}`, 78), 540, rowY + 28)
      rowY += 58
    }

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22

    const chozDay = (data.choghadiya?.day || []).slice(0, 6)
    if (chozDay.length > 0) {
      sectionLabel(ctx, colors, rowY, 'Choghadiya — day')
      rowY += 28
      chozDay.forEach((slot, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = 90 + col * 470
        const yy = rowY + row * 126
        const colC = CHOGHADIYA_COLORS[slot.name] || colors.accent
        const meaning = CHOGHADIYA_MEANING[slot.name] || ''
        ctx.save()
        ctx.fillStyle = `${colC}18`
        roundRect(ctx, x, yy, 440, 112, 12)
        ctx.strokeStyle = `${colC}55`
        ctx.lineWidth = 1.1
        roundRect(ctx, x, yy, 440, 112, 12)
        ctx.stroke()
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.font = 'bold 26px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(slot.name, x + 16, yy + 34)
        ctx.font = '600 16px sans-serif'
        ctx.fillStyle = '#E2E8F0'
        ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)} · ${slot.quality}`, x + 16, yy + 62)
        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#CBD5E1'
        ctx.fillText(truncate(meaning, 50), x + 16, yy + 88)
      })
      rowY += Math.ceil(chozDay.length / 2) * 126 + 8
    }

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22
    const chozNight = (data.choghadiya?.night || []).slice(0, 4)
    if (chozNight.length > 0) {
      sectionLabel(ctx, colors, rowY, 'Choghadiya — night')
      rowY += 28
      chozNight.forEach((slot, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = 90 + col * 470
        const yy = rowY + row * 92
        const colC = CHOGHADIYA_COLORS[slot.name] || '#94A3B8'
        ctx.save()
        ctx.fillStyle = 'rgba(148,163,184,0.12)'
        roundRect(ctx, x, yy, 440, 78, 10)
        ctx.strokeStyle = `${colC}44`
        ctx.lineWidth = 1
        roundRect(ctx, x, yy, 440, 78, 10)
        ctx.stroke()
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.font = 'bold 22px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(slot.name, x + 14, yy + 32)
        ctx.font = '16px sans-serif'
        ctx.fillStyle = '#CBD5E1'
        ctx.fillText(`${fmtTime(slot.start)} – ${fmtTime(slot.end)}`, x + 14, yy + 60)
      })
    }
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  if (pageIndex === 3) {
    drawReelSlideUnderlay(ctx, colors, style, seedKey)
    const vy = getReelBodyVerticalOffset(88, 1050)
    ctx.save()
    ctx.translate(0, vy)
    drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'Hora table & nine grahas')
    ctx.font = '600 24px sans-serif'
    ctx.fillStyle = '#E2E8F0'
    ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

    let rowY = 318
    const horasDay = (data.horaTable || []).filter((h) => h.isDaytime).slice(0, 6)
    if (horasDay.length > 0) {
      sectionLabel(ctx, colors, rowY, 'Day Hora (planetary hours)')
      rowY += 28
      const cols = 3
      const hw = 280
      const hg = 20
      const hh = 60
      const vGap = 7
      horasDay.forEach((h, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = 90 + col * (hw + hg)
        const yy = rowY + row * (hh + vGap)
        ctx.save()
        ctx.fillStyle = 'rgba(8,10,24,0.84)'
        roundRect(ctx, x, yy, hw, hh, 9)
        ctx.strokeStyle = `${colors.accent}66`
        ctx.lineWidth = 1
        roundRect(ctx, x, yy, hw, hh, 9)
        ctx.stroke()
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.font = 'bold 20px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(h.lord, x + 10, yy + 27)
        ctx.font = '15px sans-serif'
        ctx.fillStyle = '#CBD5E1'
        ctx.fillText(`${fmtTime(h.start)} – ${fmtTime(h.end)}`, x + 10, yy + 50)
      })
      rowY += Math.ceil(horasDay.length / cols) * (hh + vGap) + 16
    }

    const horasNight = (data.horaTable || []).filter((h) => !h.isDaytime).slice(0, 4)
    if (horasNight.length > 0) {
      drawDivider(ctx, colors, rowY, 920)
      rowY += 22
      sectionLabel(ctx, colors, rowY, 'Night Hora')
      rowY += 28
      const ncols = 2
      const nw = 430
      const ng = 20
      const nh = 56
      horasNight.forEach((h, i) => {
        const col = i % ncols
        const row = Math.floor(i / ncols)
        const x = 90 + col * (nw + ng)
        const yy = rowY + row * (nh + 6)
        ctx.save()
        ctx.fillStyle = 'rgba(8,10,24,0.82)'
        roundRect(ctx, x, yy, nw, nh, 10)
        ctx.strokeStyle = 'rgba(148,163,184,0.5)'
        ctx.lineWidth = 1
        roundRect(ctx, x, yy, nw, nh, 10)
        ctx.stroke()
        ctx.restore()
        ctx.textAlign = 'left'
        ctx.font = 'bold 18px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(h.lord, x + 12, yy + 24)
        ctx.font = '15px sans-serif'
        ctx.fillStyle = '#CBD5E1'
        ctx.fillText(`${fmtTime(h.start)} – ${fmtTime(h.end)}`, x + 12, yy + 46)
      })
      rowY += Math.ceil(horasNight.length / ncols) * (nh + 6) + 12
    }

    drawDivider(ctx, colors, rowY, 920)
    rowY += 22
    sectionLabel(ctx, colors, rowY, 'Grahas (sidereal longitudes)')
    rowY += 28
    const planets = (data.planets || []).slice(0, 9)
    const colW = 300
    const planetRowPitch = 36
    planets.forEach((p, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 90 + col * colW
      const yy = rowY + row * planetRowPitch
      ctx.textAlign = 'left'
      ctx.font = '17px sans-serif'
      const retro = p.retro ? ' ℞' : ''
      const comb = p.combust ? ' ○' : ''
      ctx.fillStyle = '#F8FAFC'
      const line = `${p.sa} · ${p.rashiSa} ${degFmt(p.degInSign)}${retro}${comb}`
      ctx.fillText(truncate(line, 34), x, yy + 20)
    })
    ctx.restore()
    drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
    drawCarouselCompactFooter(ctx, colors, settings)
    return
  }

  drawReelSlideUnderlay(ctx, colors, style, seedKey)
  const vy = getReelBodyVerticalOffset(88, 780)
  ctx.save()
  ctx.translate(0, vy)
  drawPanchangSlideHero(ctx, colors, settings, vedaIcon, 'Moon nakshatra — qualities & note')
  ctx.font = '20px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(`${dateInfo.weekday}, ${dateInfo.day} ${dateInfo.month}`, 540, 278)

  const nakIdx = data.nakshatra?.index ?? 0
  let rowY = 330
  sectionLabel(ctx, colors, rowY, 'Moon nakshatra — qualities')
  rowY += 28
  ctx.textAlign = 'center'
  ctx.font = 'bold 28px serif'
  ctx.fillStyle = colors.text
  ctx.fillText(`${data.nakshatra?.name || '—'} (pada ${data.nakshatra?.pada ?? '—'})`, 540, rowY)
  rowY += 36
  ctx.font = '17px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText(
    truncate(`Devata: ${NAK_DEITY[nakIdx] || '—'}  ·  Guna: ${NAK_QUALITY[nakIdx] || '—'}  ·  Lord: ${data.nakshatra?.lord || '—'}`, 68),
    540,
    rowY,
  )
  rowY += 44
  drawDivider(ctx, colors, rowY, 920)
  rowY += 36
  ctx.font = '17px sans-serif'
  ctx.fillStyle = colors.sub
  ctx.fillText('Panchang varies by location & siddhanta — verify for muhurta decisions.', 540, rowY)
  rowY += 36
  ctx.fillText(truncate(settings.ctaLine, 72), 540, rowY)
  rowY += 48
  drawDivider(ctx, colors, rowY, 920)
  ctx.restore()
  drawCarouselSlideBadge(ctx, colors, pageIndex + 1, totalPages)
  drawBrandFooter(ctx, colors, settings, 1710)
  drawHashtagFooter(ctx, colors, settings, 1760)
}
