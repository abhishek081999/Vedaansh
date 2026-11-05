import type { Rashi } from '@/types/astrology'
import type { SlideSpec } from '@/lib/social/render/slides/types'
import type { TemplateDef } from '@/lib/social/templates/types'
import { DAILY_CTA, colorSwatch, dateLabels, horoscopeTone, rashiCard } from '@/lib/social/templates/shared'

const ALL_RASHIS = Array.from({ length: 12 }, (_, i) => i + 1)

export const rashiphalDaily: TemplateDef = {
  id: 'rashiphal',
  code: 'A3',
  category: 'daily',
  name: 'Daily Rashiphal (all 12)',
  deva: 'आज का राशिफल',
  blurb: 'Carousel: overview of all 12 signs, then one slide per sign with score, headline, life areas, lucky colour/number and do/avoid.',
  formats: ['4x5', '9x16'],
  params: ['date'],
  build(d) {
    const h = d.horoscope
    const dl = dateLabels(d.date)
    const label = `${dl.weekday}, ${dl.short}`
    const slides: SlideSpec[] = [
      {
        type: 'signGrid',
        head: { kicker: dl.long, deva: 'आज का राशिफल', title: 'Daily Rashiphal' },
        cells: h.signs.map((s) => ({ rashi: s.rashi, value: `${s.score}/100`, sub: s.headline, tone: horoscopeTone(s.tone) })),
        note: `Moon in ${h.moonNakshatra?.name ?? ''} · swipe for your sign`,
      },
      ...h.signs.map<SlideSpec>((s) => ({ type: 'rashi', card: rashiCard(s, label, false) })),
      { type: 'cta', ...DAILY_CTA },
    ]
    const best = [...h.signs].sort((a, b) => b.score - a.score).slice(0, 3)
    return {
      slides,
      caption: {
        hook: `🔮 Aaj ka Rashiphal — ${dl.long}`,
        lines: [
          `Top signs today: ${best.map((s) => `${s.sanskrit} (${s.score})`).join(', ')}`,
          ...h.signs.map((s) => `${s.glyph} ${s.sanskrit}: ${s.headline}`),
          'Based on your Moon sign (Janma Rashi).',
        ],
        tags: ['#rashiphal', '#dailyhoroscope', '#horoscope', '#aajkarashifal', '#moonsign', '#janmarashi'],
      },
    }
  },
}

export const rashiStory: TemplateDef = {
  id: 'rashi-story',
  code: 'A4',
  category: 'daily',
  name: 'Single-sign daily',
  deva: 'राशि विशेष',
  blurb: 'One story per sign with the full daily reading. Use “Batch” to export all 12 at once.',
  formats: ['9x16', '4x5', '1x1'],
  params: ['date', 'rashi'],
  build(d, p) {
    const r = (p.rashi ?? 1) as Rashi
    const s = d.horoscope.signs[r - 1]
    const dl = dateLabels(d.date)
    return {
      slides: [{ type: 'rashi', card: rashiCard(s, `${dl.weekday}, ${dl.short}`, true) }],
      caption: {
        hook: `${s.glyph} ${s.sanskrit} (${s.english}) — ${dl.long}`,
        lines: [
          `${s.headline} · score ${s.score}/100`,
          s.summary,
          `Lucky colour: ${s.lucky.color} · Number: ${s.lucky.number} · Direction: ${s.lucky.direction}`,
          s.karya.length ? `Do: ${s.karya.join(', ')}` : '',
          s.varjya.length ? `Avoid: ${s.varjya.join(', ')}` : '',
          `Remedy: ${s.remedy}`,
        ],
        tags: [`#${s.sanskrit}`, `#${s.english}`, `#${s.english}horoscope`, '#dailyhoroscope', '#rashiphal'],
      },
    }
  },
  batch: (p) => ALL_RASHIS.map((rashi) => ({ ...p, rashi })),
}

export const luckyGrid: TemplateDef = {
  id: 'lucky-grid',
  code: 'A5',
  category: 'daily',
  name: 'Lucky colour & number',
  deva: 'आज का शुभ रंग',
  blurb: 'One post: lucky colour and number for all 12 signs. Works well as a square 1:1 feed tile.',
  formats: ['4x5', '1x1', '9x16'],
  params: ['date'],
  build(d) {
    const dl = dateLabels(d.date)
    const signs = d.horoscope.signs
    return {
      slides: [
        {
          type: 'signGrid',
          head: { kicker: dl.long, deva: 'आज का शुभ रंग और अंक', title: 'Lucky Colour & Number' },
          cells: signs.map((s) => ({ rashi: s.rashi, value: s.lucky.color, swatch: colorSwatch(s.lucky.color), sub: `Number ${s.lucky.number} · ${s.lucky.direction}` })),
        },
      ],
      caption: {
        hook: `🎨 Lucky colour & number for every rashi — ${dl.long}`,
        lines: signs.map((s) => `${s.glyph} ${s.sanskrit}: ${s.lucky.color}, ${s.lucky.number}`),
        tags: ['#luckycolor', '#luckynumber', '#rashiphal', '#dailyhoroscope'],
      },
    }
  },
}
