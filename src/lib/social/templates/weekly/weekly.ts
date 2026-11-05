import type { GrahaId, Rashi } from '@/types/astrology'
import { RASHI_SANSKRIT } from '@/types/astrology'
import type { HoroscopeTone } from '@/lib/engine/dailyRashiHoroscope'
import { cap, fmtT } from '@/lib/social/render/kit'
import type { Row, SignCell, SlideSpec, WeekRow } from '@/lib/social/render/slides/types'
import type { TemplateDef } from '@/lib/social/templates/types'
import { DAILY_CTA, horoscopeTone, istDate, shortDay } from '@/lib/social/templates/shared'

function weekLabel(days: { date: string }[]): string {
  if (!days.length) return ''
  return `${shortDay(days[0].date)} – ${shortDay(days[days.length - 1].date)}`
}

const weekdayShort = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' })
const dayLetter = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }).slice(0, 2)

export const weeklyRashiphal: TemplateDef = {
  id: 'weekly-rashiphal',
  code: 'B1',
  category: 'weekly',
  name: 'Weekly Rashiphal',
  deva: 'साप्ताहिक राशिफल',
  blurb: 'Carousel: each sign’s 7-day score strip with its best day — 4 signs per slide, plus overview and follow slide.',
  formats: ['4x5', '9x16'],
  params: ['date'],
  build(d) {
    const days = d.week.days
    const label = weekLabel(days)
    const letters = days.map((x) => dayLetter(x.date))
    const rows: WeekRow[] = Array.from({ length: 12 }, (_, i) => {
      const per = days.map((x) => x.signs[i])
      const best = per.reduce((bi, s, k) => (s.score > per[bi].score ? k : bi), 0)
      return {
        rashi: i + 1,
        scores: per.map((s) => s.score),
        tones: per.map((s) => horoscopeTone(s.tone as HoroscopeTone)),
        note: `Best: ${weekdayShort(days[best].date)}`,
      }
    })
    const avg = rows.map((r) => ({ rashi: r.rashi, avg: Math.round(r.scores.reduce((a, b) => a + b, 0) / r.scores.length) }))
    const slides: SlideSpec[] = [
      {
        type: 'signGrid',
        head: { kicker: label, deva: 'साप्ताहिक राशिफल', title: 'Your Week Ahead' },
        cells: avg.map((a, i) => ({
          rashi: a.rashi,
          value: `${a.avg}/100`,
          sub: rows[i].note,
          tone: a.avg >= 60 ? 'good' : a.avg >= 45 ? 'mixed' : 'warn',
        })),
        note: 'Average score for the week · swipe for day-by-day',
      },
      ...[0, 4, 8].map<SlideSpec>((s) => ({
        type: 'weekGrid',
        head: { kicker: label, deva: 'दिन-प्रतिदिन', title: `${RASHI_SANSKRIT[rows[s].rashi as Rashi]} to ${RASHI_SANSKRIT[rows[s + 3].rashi as Rashi]}` },
        days: letters,
        rows: rows.slice(s, s + 4),
        note: 'Taller bar = better day · green good · amber mixed · red careful',
      })),
      { type: 'cta', ...DAILY_CTA },
    ]
    const ranked = [...avg].sort((a, b) => b.avg - a.avg)
    return {
      slides,
      caption: {
        hook: `📅 Weekly Rashiphal — ${label}`,
        lines: [
          `Strongest week: ${ranked.slice(0, 3).map((a) => RASHI_SANSKRIT[a.rashi as Rashi]).join(', ')}`,
          ...rows.map((r, i) => `${RASHI_SANSKRIT[r.rashi as Rashi]}: ${avg[i].avg}/100 · ${r.note}`),
          'Based on your Moon sign (Janma Rashi).',
        ],
        tags: ['#weeklyhoroscope', '#weeklyrashifal', '#rashiphal', '#horoscope', '#moonsign'],
      },
    }
  },
}

export const chandrashtamaWeek: TemplateDef = {
  id: 'chandrashtama',
  code: 'B2',
  category: 'weekly',
  name: 'Chandrashtama alert',
  deva: 'चंद्राष्टम',
  blurb: 'One post: when the Moon transits the 8th sign from each rashi — the days to keep low-key.',
  formats: ['4x5', '9x16'],
  params: ['date'],
  build(d) {
    const label = weekLabel(d.week.days)
    const end = d.week.days[d.week.days.length - 1]?.date ?? d.date
    const cells: SignCell[] = d.week.chandrashtama.map((c) => {
      const startDay = istDate(c.start)
      const inWeek = startDay <= end
      return {
        rashi: c.rashi,
        value: `${weekdayShort(startDay)} ${fmtT(c.start)}`,
        sub: `until ${shortDay(istDate(c.end))} ${fmtT(c.end)}`,
        tone: inWeek ? 'warn' : 'neutral',
      }
    })
    return {
      slides: [
        {
          type: 'signGrid',
          head: { kicker: label, deva: 'चंद्राष्टम — सावधान रहें', title: 'Chandrashtama' },
          cells,
          note: 'Moon in the 8th from your sign: avoid big decisions, travel and arguments. Red = falls this week.',
        },
      ],
      caption: {
        hook: `🌘 Chandrashtama this week — ${label}`,
        lines: [
          'When the Moon passes the 8th sign from your Moon sign, energy dips and the mind is restless. Keep these ~2.5 days quiet.',
          ...d.week.chandrashtama.map((c) => `${RASHI_SANSKRIT[c.rashi as Rashi]}: ${shortDay(istDate(c.start))} ${fmtT(c.start)} → ${shortDay(istDate(c.end))} ${fmtT(c.end)}`),
        ],
        tags: ['#chandrashtama', '#moontransit', '#rashiphal', '#vedicastrology'],
      },
    }
  },
}

export const weekTransits: TemplateDef = {
  id: 'week-transits',
  code: 'B3',
  category: 'weekly',
  name: 'This week in the sky',
  deva: 'साप्ताहिक गोचर',
  blurb: 'One post: graha ingresses, retrograde stations and sankranti in the next 7 days — or the Moon’s journey if the week is quiet.',
  formats: ['4x5', '9x16'],
  params: ['date'],
  build(d) {
    const days = d.week.days
    const end = days[days.length - 1]?.date ?? d.date
    const label = weekLabel(days)
    const ev = d.events.filter((e) => e.date <= end && ['ingress', 'retro_start', 'retro_end', 'sankranti'].includes(e.kind))
    const graha: Row[] = ev.map((e) => ({
      title: e.title,
      note: `${shortDay(e.date)}${e.at ? ` · ${fmtT(e.at)}` : ''}`,
      tone: e.kind === 'retro_start' ? 'mixed' : e.kind === 'retro_end' ? 'good' : 'neutral',
      lead: { kind: 'planet', id: (e.planet ?? 'Su') as GrahaId },
    }))
    const moon: Row[] = days
      .filter((x, i) => i === 0 || x.moonRashi !== days[i - 1].moonRashi)
      .map((x) => ({ title: `Moon in ${RASHI_SANSKRIT[x.moonRashi as Rashi]}`, note: `from ${shortDay(x.date)} · ${x.nakshatra}`, lead: { kind: 'planet', id: 'Mo' as GrahaId } }))
    const sections = [
      ...(graha.length ? [{ heading: 'Graha changes', rows: graha }] : []),
      ...(graha.length < 5 ? [{ heading: 'Moon’s journey', rows: moon.slice(0, Math.max(2, 6 - graha.length)) }] : []),
    ]
    return {
      slides: [
        {
          type: 'list',
          head: { kicker: label, deva: 'इस सप्ताह ग्रह गोचर', title: 'This Week in the Sky' },
          sections,
          note: ev.length ? 'Sidereal (Lahiri) · times IST' : 'No graha changes sign this week',
        },
      ],
      caption: {
        hook: `🪐 This week in the sky — ${label}`,
        lines: ev.length ? ev.map((e) => `${shortDay(e.date)}: ${e.title}`) : days.map((x) => `${shortDay(x.date)}: Moon in ${RASHI_SANSKRIT[x.moonRashi as Rashi]}`),
        tags: ['#gochar', '#planetarytransits', '#weeklyastrology', '#vedicastrology'],
      },
    }
  },
}

export const weekPanchang: TemplateDef = {
  id: 'week-panchang',
  code: 'B4',
  category: 'weekly',
  name: 'Week-ahead panchang',
  deva: 'साप्ताहिक पंचांग',
  blurb: 'One post: tithi and nakshatra for each of the next 7 days, with vrats and festivals marked.',
  formats: ['4x5', '9x16'],
  params: ['date'],
  build(d) {
    const days = d.week.days
    const label = weekLabel(days)
    const rows: Row[] = days.map((x) => {
      const special = d.events.filter((e) => e.date === x.date && (e.kind === 'festival' || e.kind === 'vrat'))
      return {
        title: shortDay(x.date),
        note: `${x.tithi.name} (${cap(x.tithi.paksha)}) · ${x.nakshatra}`,
        right: special[0]?.title ?? '',
        tone: special.some((e) => e.kind === 'festival') ? 'good' : special.length ? 'mixed' : 'neutral',
      }
    })
    const specials = d.events.filter((e) => e.date <= (days[days.length - 1]?.date ?? d.date) && (e.kind === 'festival' || e.kind === 'vrat'))
    return {
      slides: [
        {
          type: 'list',
          head: { kicker: label, deva: 'साप्ताहिक पंचांग', title: 'Week Ahead' },
          sections: [{ rows }],
          note: 'Tithi & nakshatra at 6 AM IST',
        },
      ],
      caption: {
        hook: `🗓 Panchang for the week — ${label}`,
        lines: [
          ...days.map((x) => `${shortDay(x.date)}: ${x.tithi.name} · ${x.nakshatra}`),
          specials.length ? `\nVrats & festivals: ${specials.map((e) => `${e.title} (${shortDay(e.date)})`).join(', ')}` : '',
        ],
        tags: ['#panchang', '#weeklypanchang', '#vrat', '#hinducalendar', '#tithi'],
      },
    }
  },
}
