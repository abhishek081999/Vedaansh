import { fmtRange, fmtT } from '@/lib/social/render/kit'
import type { Tone } from '@/lib/social/render/theme'
import type { Row, SlideSpec } from '@/lib/social/render/slides/types'
import type { TemplateDef } from '@/lib/social/templates/types'
import { dateLabels } from '@/lib/social/templates/shared'

export const CHOGHADIYA_MEANING: Record<string, string> = {
  Amrit: 'Nectar — best for all work',
  Shubh: 'Auspicious — good beginnings',
  Labh: 'Profit — business & trade',
  Char: 'Movement — travel, change',
  Udveg: 'Anxiety — avoid new work',
  Rog: 'Low energy — not for health matters',
  Kaal: 'Difficult time — best avoided',
  Chal: 'Unstable — caution needed',
}

type Slot = { name: string; quality: string; start: string; end: string }

function slotTone(q: string): Tone {
  if (q === 'good') return 'good'
  if (q === 'mixed' || q === 'neutral') return 'mixed'
  return 'warn'
}

function rows(slots: Slot[], prefix = ''): Row[] {
  return slots.map((s) => ({ title: s.name, note: `${prefix}${CHOGHADIYA_MEANING[s.name] ?? s.quality}`, right: fmtRange(s.start, s.end), tone: slotTone(s.quality) }))
}

export const choghadiyaDaily: TemplateDef = {
  id: 'choghadiya',
  code: 'A7',
  category: 'daily',
  name: 'Choghadiya',
  deva: 'आज का चौघड़िया',
  blurb: 'Carousel: 24-hour quality ring, full day and night Choghadiya, and the best windows.',
  formats: ['4x5', '9x16'],
  params: ['date', 'city'],
  build(d) {
    const p = d.panchang
    const dl = dateLabels(d.date)
    const day = (p.choghadiya?.day ?? []) as Slot[]
    const night = (p.choghadiya?.night ?? []) as Slot[]
    const good = [...day.map((s) => ({ ...s, n: false })), ...night.map((s) => ({ ...s, n: true }))].filter((s) => s.quality === 'good')
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: `${dl.weekday} · ${dl.short}`, deva: 'आज का चौघड़िया', title: 'Choghadiya', sub: 'Day & night in 8 parts each' },
        hero: {
          kind: 'dayRing',
          day: day.map((s) => ({ tone: slotTone(s.quality), start: s.start, end: s.end })),
          night: night.map((s) => ({ tone: slotTone(s.quality), start: s.start, end: s.end })),
          big: String(good.length),
          small: 'good windows',
        },
        tiles: [
          { label: 'Sunrise', value: fmtT(p.sunrise), lead: { kind: 'planet', id: 'Su' } },
          { label: 'Sunset', value: fmtT(p.sunset), lead: { kind: 'planet', id: 'Su' } },
        ],
        meta: 'Good: Amrit · Shubh · Labh   ·   Avoid: Udveg · Rog · Kaal',
      },
      {
        type: 'list',
        head: { kicker: `Sunrise ${fmtT(p.sunrise)}`, deva: 'दिन का चौघड़िया', title: 'Day Choghadiya' },
        sections: [{ rows: rows(day.slice(0, 8)) }],
      },
      {
        type: 'list',
        head: { kicker: `Sunset ${fmtT(p.sunset)}`, deva: 'रात का चौघड़िया', title: 'Night Choghadiya' },
        sections: [{ rows: rows(night.slice(0, 8)) }],
      },
      {
        type: 'list',
        head: { kicker: dl.short, deva: 'आज के शुभ समय', title: 'Best Windows' },
        sections: [{ rows: good.slice(0, 7).map((s) => rows([s], s.n ? 'Night · ' : 'Day · ')[0]) }],
        note: `${d.city.name} · IST`,
      },
    ]
    return {
      slides,
      caption: {
        hook: `🪔 Aaj ka Choghadiya — ${dl.long}`,
        lines: [`Best windows (${d.city.name}):`, ...good.slice(0, 7).map((s) => `✅ ${s.name}: ${fmtRange(s.start, s.end)}${s.n ? ' (night)' : ''}`)],
        tags: ['#choghadiya', '#shubhmuhurat', '#panchang', '#auspicioustime'],
      },
    }
  },
}
