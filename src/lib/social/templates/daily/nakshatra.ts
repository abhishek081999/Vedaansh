import type { GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS } from '@/types/astrology'
import { NAKSHATRA_REMEDIES } from '@/lib/engine/nakshatraRemedies'
import { fmtT } from '@/lib/social/render/kit'
import type { SlideSpec } from '@/lib/social/render/slides/types'
import type { TemplateDef } from '@/lib/social/templates/types'
import { DAILY_CTA, dateLabels, fmtUntil, grahaSa } from '@/lib/social/templates/shared'
import { NAK_BEST_FOR, NAK_DEITY, NAK_QUALITY, NAK_SYMBOL } from '@/lib/social/templates/daily/nakshatra-meta'

const QUALITY_EN: Record<string, string> = { Chara: 'Movable', Sthira: 'Fixed', Misra: 'Mixed', Tikshna: 'Sharp', Mridu: 'Soft', Ugra: 'Fierce' }
const PADA_AIM = ['Dharma', 'Artha', 'Kama', 'Moksha'] as const

export const nakshatraDaily: TemplateDef = {
  id: 'nakshatra',
  code: 'A6',
  category: 'daily',
  name: 'Nakshatra of the day',
  deva: 'आज का नक्षत्र',
  blurb: 'Carousel: the Moon’s nakshatra on the 27-ring, its nature & rulers, what it favours and its remedy.',
  formats: ['4x5', '9x16'],
  params: ['date', 'city'],
  build(d) {
    const p = d.panchang
    const dl = dateLabels(d.date)
    const idx = p.nakshatra?.index ?? 0
    const name = p.nakshatra?.name ?? 'Nakshatra'
    const pada = Math.min(4, Math.max(1, p.nakshatra?.pada ?? 1))
    const lord = ((p.nakshatra?.lord as GrahaId | undefined) || NAKSHATRA_LORDS[idx]) as GrahaId
    const q = NAK_QUALITY[idx] ?? ''
    const rem = NAKSHATRA_REMEDIES[idx]
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: `Nakshatra of the day · ${dl.short}`, deva: 'आज का नक्षत्र', title: name, sub: `Moon in ${p.moonRashi?.sa ?? '—'} · pada ${pada}` },
        hero: { kind: 'nakRing', idx, moonLon: p.moonRashi?.longitude, big: String(idx + 1), small: 'of 27' },
        meta: `Symbol · ${NAK_SYMBOL[idx] ?? '—'}  ·  until ${fmtUntil(p.limbEnds?.nakshatra, d.date, fmtT)}`,
      },
      {
        type: 'tiles',
        head: { kicker: dl.short, deva: 'नक्षत्र स्वभाव', title: name, sub: 'Nature & rulers' },
        cols: 2,
        tiles: [
          { label: 'Devata', value: NAK_DEITY[idx] ?? '—', detail: 'presiding deity' },
          { label: 'Graha lord', value: grahaSa(lord), detail: GRAHA_NAMES[lord], lead: { kind: 'planet', id: lord } },
          { label: 'Nature', value: q || '—', detail: QUALITY_EN[q] ? `${QUALITY_EN[q]} nakshatra` : '' },
          { label: 'Pada', value: `${pada} of 4`, detail: `${PADA_AIM[pada - 1]} pada` },
          { label: 'Symbol', value: NAK_SYMBOL[idx] ?? '—' },
          { label: 'Until', value: fmtUntil(p.limbEnds?.nakshatra, d.date, fmtT), detail: 'Moon moves on' },
        ],
      },
      {
        type: 'text',
        head: { kicker: dl.short, deva: 'किसके लिए शुभ', title: 'Favourable For' },
        paragraphs: [NAK_BEST_FOR[idx] ?? ''],
        bullets: rem
          ? [
              {
                title: 'Nakshatra remedy',
                items: [`Mantra: ${rem.mantra}`, `Worship: ${rem.upasana}`, `Charity: ${rem.charity}`, `Colour: ${rem.color} · Flower: ${rem.flower}`],
              },
            ]
          : [],
      },
      { type: 'cta', ...DAILY_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `🌙 Today’s nakshatra: ${name} — ${dl.long}`,
        lines: [
          `Moon in ${name} pada ${pada} until ${fmtUntil(p.limbEnds?.nakshatra, d.date, fmtT)}.`,
          `Deity: ${NAK_DEITY[idx]} · Lord: ${GRAHA_NAMES[lord]} · Symbol: ${NAK_SYMBOL[idx]}`,
          `Favourable for: ${NAK_BEST_FOR[idx]}`,
          rem ? `Mantra: ${rem.mantra}` : '',
        ],
        tags: ['#nakshatra', `#${name.replace(/\s+/g, '')}`, '#moonnakshatra', '#nakshatras', '#vedicastrology'],
      },
    }
  },
}
