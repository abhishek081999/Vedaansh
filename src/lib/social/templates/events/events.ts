import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { GOCHAR_FAVOURABLE, type GocharPlanet } from '@/lib/engine/gocharRules'
import { HOUSE_MATTERS } from '@/lib/engine/dailyRashiHoroscope'
import { fmtT } from '@/lib/social/render/kit'
import type { Row, SlideSpec } from '@/lib/social/render/slides/types'
import type { CalendarEvent, DayData, TemplateBuild, TemplateDef } from '@/lib/social/templates/types'
import { DAILY_CTA, GRAHA_DEVA, dateLabels, istDate, pickEvent, shortDay } from '@/lib/social/templates/shared'

// ── Content tables ────────────────────────────────────────────

/** Short, transit-focused guidance for retrograde (vakri) and direct (margi) stations. */
const RETRO_GUIDE: Record<string, { theme: string; retroDo: string[]; retroAvoid: string[]; direct: string }> = {
  Me: {
    theme: 'speech, trade, contracts, travel and devices',
    retroDo: ['Revise, re-read and repair', 'Reconnect with old contacts', 'Back up phones & files'],
    retroAvoid: ['Signing new contracts in a hurry', 'Buying gadgets or vehicles', 'Careless words'],
    direct: 'Pending talks, paperwork and deals start moving again — sign after a final check.',
  },
  Ve: {
    theme: 'love, marriage, comfort, money and beauty',
    retroDo: ['Heal old relationships', 'Review spending and savings', 'Restore what you already own'],
    retroAvoid: ['Engagements & weddings', 'Luxury purchases', 'Big beauty makeovers'],
    direct: 'Relationships and finances find their footing — good for commitments again.',
  },
  Ma: {
    theme: 'energy, courage, property, siblings and conflict',
    retroDo: ['Finish half-done tasks', 'Gentle, regular exercise', 'Plan before you act'],
    retroAvoid: ['Surgery by choice & risky sport', 'Starting property deals', 'Picking fights'],
    direct: 'Drive and confidence return — start the projects you were planning.',
  },
  Ju: {
    theme: 'wisdom, teachers, children, wealth and dharma',
    retroDo: ['Study and inner reflection', 'Revisit long-term plans', 'Serve teachers and elders'],
    retroAvoid: ['Blind faith in advice', 'Over-expansion and big loans', 'Starting a new course without review'],
    direct: 'Growth and guidance flow outward again — favourable for new learning and investments.',
  },
  Sa: {
    theme: 'work, discipline, delays, karma and the elderly',
    retroDo: ['Clear pending duties and debts', 'Serve workers and elders', 'Rebuild routines patiently'],
    retroAvoid: ['Cutting corners', 'Starting long-term commitments in haste', 'Ignoring old responsibilities'],
    direct: 'Delayed results begin to arrive — steady effort now pays off.',
  },
}

const VRAT_GUIDE: Record<string, { deva: string; observe: string[] }> = {
  ekadashi: {
    deva: 'एकादशी व्रत',
    observe: ['Fast from grains & beans (fruit/milk if needed)', 'Chant “Om Namo Bhagavate Vasudevaya”', 'Vishnu puja with tulsi leaves', 'Break the fast (parana) on Dwadashi after sunrise'],
  },
  purnima: {
    deva: 'पूर्णिमा',
    observe: ['Satyanarayan katha or Vishnu puja', 'Offer water (arghya) to the Moon', 'Snan and daan — food, clothes, milk'],
  },
  amavasya: {
    deva: 'अमावस्या',
    observe: ['Tarpan and prayers for the ancestors', 'Feed cows, crows and the needy', 'Light a lamp under a peepal tree'],
  },
  sankashti: {
    deva: 'संकष्टी चतुर्थी',
    observe: ['Fast through the day for Ganesha', 'Offer durva grass & modak', 'Break the fast after seeing the Moon'],
  },
  pradosh: {
    deva: 'प्रदोष व्रत',
    observe: ['Shiva puja in the evening twilight', 'Abhishek with water, milk & bel leaves', 'Chant “Om Namah Shivaya”'],
  },
}

function vratKey(ev: CalendarEvent): keyof typeof VRAT_GUIDE {
  const slug = ev.id.split(':')[1] ?? ''
  if (slug.startsWith('ekadashi')) return 'ekadashi'
  if (slug.startsWith('pradosh')) return 'pradosh'
  if (slug === 'sankashti') return 'sankashti'
  if (slug === 'amavasya') return 'amavasya'
  return 'purnima'
}

function eventDateLabel(ev: CalendarEvent): string {
  const dl = dateLabels(ev.date)
  return `${dl.weekday}, ${dl.day} ${dl.month} ${dl.year}${ev.at ? ` · ${fmtT(ev.at)} IST` : ''}`
}

function noEvent(kind: string, d: DayData): TemplateBuild {
  return {
    slides: [
      {
        type: 'text',
        head: { kicker: dateLabels(d.date).short, title: `No ${kind} soon` },
        paragraphs: [`No ${kind} in the next 45 days from this date. Pick another date or template.`],
      },
    ],
    caption: { hook: '', lines: [], tags: [] },
  }
}

const houseFrom = (moonSign: number, sign: number) => ((sign - moonSign + 12) % 12) + 1
const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

// ── C1 Gochar: graha enters a sign ────────────────────────────

export const gocharEvent: TemplateDef = {
  id: 'gochar',
  code: 'C1',
  category: 'event',
  name: 'Graha gochar',
  deva: 'ग्रह गोचर',
  blurb: 'Carousel for a planet changing sign: date & time, then what it brings for each of the 12 Moon signs.',
  formats: ['4x5', '9x16'],
  params: ['event'],
  eventKinds: ['ingress'],
  build(d, p) {
    const ev = pickEvent(d.events, ['ingress'], p.eventId)
    if (!ev || !ev.planet || !ev.sign) return noEvent('graha ingress', d)
    const pid = ev.planet as GrahaId
    const sign = ev.sign as Rashi
    const texts = d.gochar[pid] ?? {}
    const moorthy = d.moorthy.find((m) => m.planetId === pid && m.rashi === sign)
    const rows: Row[] = Array.from({ length: 12 }, (_, i) => {
      const r = (i + 1) as Rashi
      const h = houseFrom(r, sign)
      const good = GOCHAR_FAVOURABLE[pid as GocharPlanet]?.includes(h) ?? false
      const note = texts[h] ?? (good ? `Supports ${HOUSE_MATTERS[h]}.` : `Go gently with ${HOUSE_MATTERS[h]}.`)
      return { title: `${RASHI_SANSKRIT[r]} · ${ord(h)} house`, note, tone: good ? 'good' : 'mixed', lead: { kind: 'medallion', text: String(h), font: 'serif' } }
    })
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: `${GRAHA_DEVA[pid]} गोचर`, title: ev.title, sub: `${GRAHA_NAMES[pid]} enters ${RASHI_NAMES[sign]}` },
        hero: { kind: 'wheel', planets: [{ id: pid, lon: (sign - 1) * 30 + 1 }], highlightRashi: sign - 1 },
        meta: moorthy ? `Moorthy: ${moorthy.metalLabel}` : 'Effects by your Moon sign — swipe →',
      },
      ...[0, 4, 8].map<SlideSpec>((s) => ({
        type: 'list',
        head: { kicker: `${GRAHA_NAMES[pid]} in ${RASHI_SANSKRIT[sign]}`, title: 'For your Moon sign' },
        sections: [{ rows: rows.slice(s, s + 4) }],
      })),
      { type: 'cta', ...DAILY_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `🪐 ${ev.title} — ${eventDateLabel(ev)}`,
        lines: [
          moorthy ? moorthy.summary : '',
          'What it means for your Moon sign:',
          ...rows.map((r) => `${r.title}: ${r.note}`),
        ],
        tags: ['#gochar', `#${GRAHA_NAMES[pid].toLowerCase()}transit`, '#planetarytransit', `#${RASHI_SANSKRIT[sign].toLowerCase()}`, '#vedicastrology'],
      },
    }
  },
}

// ── C2 Retrograde / direct station ────────────────────────────

export const retrogradeEvent: TemplateDef = {
  id: 'retrograde',
  code: 'C2',
  category: 'event',
  name: 'Retrograde / direct',
  deva: 'वक्री / मार्गी',
  blurb: 'Carousel for a planet turning retrograde (vakri) or direct (margi): when, what it affects, what to do and avoid.',
  formats: ['4x5', '9x16'],
  params: ['event'],
  eventKinds: ['retro_start', 'retro_end'],
  build(d, p) {
    const ev = pickEvent(d.events, ['retro_start', 'retro_end'], p.eventId)
    if (!ev || !ev.planet) return noEvent('retrograde station', d)
    const pid = ev.planet as GrahaId
    const g = RETRO_GUIDE[pid] ?? RETRO_GUIDE.Me
    const retro = ev.kind === 'retro_start'
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: `${GRAHA_DEVA[pid]} ${retro ? 'वक्री' : 'मार्गी'}`, title: ev.title.replace(/ in .*/, ''), sub: `in ${RASHI_SANSKRIT[(ev.sign ?? 1) as Rashi]}` },
        hero: { kind: 'wheel', planets: ev.sign ? [{ id: pid, lon: (ev.sign - 1) * 30 + 15 }] : [], highlightRashi: ev.sign ? ev.sign - 1 : null },
        meta: `${retro ? 'Review' : 'Restart'}: ${g.theme}`,
      },
      retro
        ? {
            type: 'text',
            head: { kicker: `${GRAHA_NAMES[pid]} retrograde`, deva: 'क्या करें, क्या न करें', title: 'Do & Avoid' },
            paragraphs: [`While ${GRAHA_NAMES[pid]} moves backwards, its themes — ${g.theme} — ask for review, not new starts.`],
            bullets: [
              { title: 'Do', tone: 'good', items: g.retroDo },
              { title: 'Avoid', tone: 'warn', items: g.retroAvoid },
            ],
          }
        : {
            type: 'text',
            head: { kicker: `${GRAHA_NAMES[pid]} direct`, deva: 'मार्गी ग्रह', title: 'Moving Forward' },
            paragraphs: [g.direct],
            bullets: [{ title: 'Good time to', tone: 'good', items: ['Restart what you paused', 'Act on plans made during the retrograde', 'Commit after a final check'] }],
          },
      { type: 'cta', ...DAILY_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `${retro ? '🔄' : '▶️'} ${ev.title} — ${eventDateLabel(ev)}`,
        lines: retro ? [`Themes under review: ${g.theme}.`, `Do: ${g.retroDo.join(', ')}`, `Avoid: ${g.retroAvoid.join(', ')}`] : [g.direct],
        tags: [retro ? `#${GRAHA_NAMES[pid].toLowerCase()}retrograde` : `#${GRAHA_NAMES[pid].toLowerCase()}direct`, '#vakri', '#gochar', '#vedicastrology'],
      },
    }
  },
}

// ── C3 Vrat ───────────────────────────────────────────────────

export const vratEvent: TemplateDef = {
  id: 'vrat',
  code: 'C3',
  category: 'event',
  name: 'Vrat card',
  deva: 'व्रत',
  blurb: 'Ekadashi, Purnima, Amavasya, Sankashti or Pradosh: date, tithi timing and how to observe it.',
  formats: ['4x5', '9x16'],
  params: ['event', 'city'],
  eventKinds: ['vrat'],
  build(d, p) {
    const ev = pickEvent(d.events, ['vrat'], p.eventId)
    if (!ev) return noEvent('vrat', d)
    const g = VRAT_GUIDE[vratKey(ev)]
    const sameDay = ev.date === d.date
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: g.deva, title: ev.title, sub: `${ev.deva}${ev.masa ? ` · ${ev.masa}` : ''}` },
        hero: { kind: 'lotus', glyph: 'ॐ' },
        meta: ev.detail,
        tiles: [
          { label: 'Date', value: shortDay(ev.date) },
          sameDay ? { label: 'Sunrise', value: fmtT(d.panchang.sunrise), detail: d.city.name } : { label: 'Month', value: ev.masa ?? '—' },
        ],
      },
      {
        type: 'text',
        head: { kicker: ev.title, deva: 'व्रत विधि', title: 'How to Observe' },
        paragraphs: [],
        bullets: [{ items: g.observe }],
      },
    ]
    return {
      slides,
      caption: {
        hook: `🙏 ${ev.title} — ${eventDateLabel(ev)}`,
        lines: [ev.detail ?? '', ev.masa ? `Month: ${ev.masa}` : '', 'How to observe:', ...g.observe.map((x) => `• ${x}`)],
        tags: ['#vrat', `#${ev.title.split(' ')[0].toLowerCase()}`, '#ekadashi', '#hindufestival', '#sanatandharma'],
      },
    }
  },
}

// ── C4 Festival ───────────────────────────────────────────────

export const festivalEvent: TemplateDef = {
  id: 'festival',
  code: 'C4',
  category: 'event',
  name: 'Festival card',
  deva: 'त्योहार',
  blurb: 'Greeting post for a festival, auto-filled from the festival calendar (date, deity, month, significance).',
  formats: ['4x5', '9x16'],
  params: ['event', 'city'],
  eventKinds: ['festival'],
  build(d, p) {
    const ev = pickEvent(d.events, ['festival'], p.eventId)
    if (!ev) return noEvent('festival', d)
    const sameDay = ev.date === d.date
    return {
      slides: [
        {
          type: 'cover',
          head: { kicker: eventDateLabel(ev), deva: `शुभ ${ev.title.split(' (')[0]}`, title: ev.title, sub: [ev.deva, ev.masa].filter(Boolean).join(' · ') },
          hero: { kind: 'lotus', glyph: 'ॐ' },
          meta: ev.detail,
          tiles: [
            { label: 'Date', value: shortDay(ev.date) },
            sameDay ? { label: 'Sunrise', value: fmtT(d.panchang.sunrise), detail: d.city.name } : { label: 'Month', value: ev.masa ?? '—' },
          ],
        },
      ],
      caption: {
        hook: `🪔 Wishing you a blessed ${ev.title}!`,
        lines: [eventDateLabel(ev), ev.detail ?? '', ev.deva ? `Deity: ${ev.deva}` : ''],
        tags: [`#${ev.title.split(' ')[0].toLowerCase()}`, '#festival', '#hindufestival', '#sanatandharma', '#festivevibes'],
      },
    }
  },
}

// ── C5 Sankranti ──────────────────────────────────────────────

export const sankrantiEvent: TemplateDef = {
  id: 'sankranti',
  code: 'C5',
  category: 'event',
  name: 'Sankranti',
  deva: 'संक्रांति',
  blurb: 'The Sun entering a new sign: exact time, the new solar month and what to do (snan, daan).',
  formats: ['4x5', '9x16'],
  params: ['event'],
  eventKinds: ['sankranti'],
  build(d, p) {
    const ev = pickEvent(d.events, ['sankranti'], p.eventId)
    if (!ev || !ev.sign) return noEvent('sankranti', d)
    const sign = ev.sign as Rashi
    return {
      slides: [
        {
          type: 'cover',
          head: { kicker: eventDateLabel(ev), deva: `${RASHI_SANSKRIT[sign]} संक्रांति`, title: ev.title, sub: `Surya enters ${RASHI_NAMES[sign]}` },
          hero: { kind: 'wheel', planets: [{ id: 'Su', lon: (sign - 1) * 30 + 1 }], highlightRashi: sign - 1 },
          meta: ev.detail,
        },
        {
          type: 'text',
          head: { kicker: ev.title, deva: 'संक्रांति पुण्य काल', title: 'Punya Kaal' },
          paragraphs: ['The hours around the Sun’s ingress are sacred for bathing, charity and prayer.'],
          bullets: [
            { title: 'Do', tone: 'good', items: ['Holy bath (snan) at sunrise', 'Offer water to the Sun — “Om Suryaya Namah”', 'Donate sesame, jaggery, grain or warm clothes'] },
          ],
        },
      ],
      caption: {
        hook: `☀️ ${ev.title} — ${eventDateLabel(ev)}`,
        lines: [`The Sun enters ${RASHI_SANSKRIT[sign]} (${RASHI_NAMES[sign]}), beginning a new solar month.`, 'Snan, Surya arghya and daan bring merit today.'],
        tags: ['#sankranti', `#${RASHI_SANSKRIT[sign].toLowerCase()}sankranti`, '#suryadev', '#sanatandharma'],
      },
    }
  },
}


// ── C6 Grahan (eclipse) ───────────────────────────────────────

export const grahanEvent: TemplateDef = {
  id: 'grahan',
  code: 'C6',
  category: 'event',
  name: 'Grahan (eclipse)',
  deva: 'ग्रहण',
  blurb: 'Solar or lunar eclipse: type, India visibility and timings, sutak, and what to do and avoid.',
  formats: ['4x5', '9x16'],
  params: ['event'],
  eventKinds: ['eclipse'],
  build(d, p) {
    const ev = pickEvent(d.events, ['eclipse'], p.eventId)
    const e = ev?.eclipse
    if (!ev || !e) return noEvent('eclipse', d)
    const solar = e.kind === 'solar'
    const loc = e.local
    const timeRows: Row[] = loc.visible
      ? [
          ...(loc.sutakStart ? [{ title: 'Sutak begins', right: `${fmtT(loc.sutakStart)}, ${shortDay(istDate(loc.sutakStart))}`, tone: 'warn' as const }] : []),
          { title: loc.inProgressAtRise ? `Visible from ${solar ? 'sunrise' : 'moonrise'}` : 'Grahan begins', right: fmtT(loc.start), tone: 'mixed' },
          { title: 'Maximum', right: fmtT(loc.max), tone: 'mixed' },
          { title: loc.inProgressAtSet ? `Ends at ${solar ? 'sunset' : 'moonset'}` : 'Grahan ends (moksha)', right: fmtT(loc.end), tone: 'good' },
        ]
      : [
          { title: 'Greatest eclipse', note: 'Global time', right: `${fmtT(e.max)}, ${shortDay(istDate(e.max))}` },
          { title: 'Not visible from India', note: 'No sutak — observe if you wish', tone: 'good' },
        ]
    const typeLabel = ev.title.match(/\(([^)]+)\)/)?.[1] ?? e.type
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: eventDateLabel(ev), deva: ev.deva, title: solar ? 'Surya Grahan' : 'Chandra Grahan', sub: `${typeLabel} ${solar ? 'solar' : 'lunar'} eclipse` },
        hero: { kind: 'wheel', planets: [{ id: solar ? 'Su' : 'Mo', lon: (e.sign - 1) * 30 + 15 }], highlightRashi: e.sign - 1 },
        meta: `${loc.visible ? 'Visible from India' : 'Not visible from India'} · Moon in ${RASHI_SANSKRIT[e.sign]} (${e.nakshatra})`,
      },
      {
        type: 'list',
        head: { kicker: 'New Delhi · IST', deva: 'ग्रहण का समय', title: 'Timings' },
        sections: [{ rows: timeRows }],
        note: e.type === 'penumbral' ? 'Penumbral eclipses are faint; sutak is not observed.' : 'Times for New Delhi; other cities differ by a few minutes.',
      },
      {
        type: 'text',
        head: { kicker: ev.title, deva: 'क्या करें, क्या न करें', title: 'Do & Avoid' },
        paragraphs: [],
        bullets: [
          { title: 'Do', tone: 'good', items: ['Chant mantras or sit in meditation', 'Bathe after the eclipse ends; donate food', solar ? 'Never look at the Sun without eclipse glasses' : 'Watch the Moon safely — no eye protection needed'] },
          { title: 'Avoid', tone: 'warn', items: ['Starting new work or ceremonies', 'Cooking and eating during the grahan (traditional)', 'Pregnant women: rest indoors, avoid sharp tools (traditional)'] },
        ],
      },
      { type: 'cta', ...DAILY_CTA },
    ]
    return {
      slides,
      caption: {
        hook: `${solar ? '🌑' : '🌕'} ${ev.title} — ${eventDateLabel(ev)}`,
        lines: [
          loc.visible ? `Visible from India.${loc.sutakStart ? ` Sutak from ${fmtT(loc.sutakStart)}.` : ''} Begins ${fmtT(loc.start)} · Max ${fmtT(loc.max)} · Ends ${fmtT(loc.end)} (New Delhi, IST)` : 'Not visible from India — no sutak.',
          `Moon in ${RASHI_SANSKRIT[e.sign]} (${RASHI_NAMES[e.sign]}), ${e.nakshatra} nakshatra.`,
        ],
        tags: ['#grahan', solar ? '#suryagrahan' : '#chandragrahan', solar ? '#solareclipse' : '#lunareclipse', '#eclipse', '#vedicastrology'],
      },
    }
  },
}
