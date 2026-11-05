import type { GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { cap, fmtDeg, fmtRange, fmtT } from '@/lib/social/render/kit'
import type { Row, SlideSpec } from '@/lib/social/render/slides/types'
import type { DayData, TemplateDef } from '@/lib/social/templates/types'
import { DAILY_CTA, dateLabels, fmtUntil, grahaId } from '@/lib/social/templates/shared'

function goodBadRows(d: DayData): { good: Row[]; bad: Row[] } {
  const p = d.panchang
  const good: Row[] = []
  if (p.brahmaMuhurta?.start) good.push({ title: 'Brahma Muhurta', note: 'Meditation, mantra, study', right: fmtRange(p.brahmaMuhurta.start, p.brahmaMuhurta.end), tone: 'good' })
  if (p.abhijitMuhurta?.start) good.push({ title: 'Abhijit Muhurta', note: 'Best midday window for new work', right: fmtRange(p.abhijitMuhurta.start, p.abhijitMuhurta.end), tone: 'good' })
  if (p.godhuliMuhurat?.start) good.push({ title: 'Godhuli', note: 'Twilight — puja & sankalpa', right: fmtRange(p.godhuliMuhurat.start, p.godhuliMuhurat.end), tone: 'good' })
  const bad: Row[] = [
    { title: 'Rahu Kaal', note: 'Avoid new beginnings', right: fmtRange(p.rahuKalam?.start, p.rahuKalam?.end), tone: 'warn' },
    { title: 'Yamaganda', note: 'Avoid journeys & deals', right: fmtRange(p.yamaganda?.start, p.yamaganda?.end), tone: 'warn' },
    { title: 'Gulika Kaal', note: 'What starts now tends to repeat', right: fmtRange(p.gulikaKalam?.start, p.gulikaKalam?.end), tone: 'warn' },
  ]
  return { good, bad }
}

export const panchangDaily: TemplateDef = {
  id: 'panchang',
  code: 'A1',
  category: 'daily',
  name: 'Aaj ka Panchang',
  deva: 'आज का पंचांग',
  blurb: 'Six-slide daily carousel: zodiac-wheel cover, five limbs, Sun & Moon, good vs bad times, navagraha and a follow slide.',
  formats: ['4x5', '9x16'],
  params: ['date', 'city'],
  build(d) {
    const p = d.panchang
    const dl = dateLabels(d.date)
    const cc = p.calendarContext
    const paksha = p.tithi?.paksha ? `${cap(p.tithi.paksha)} paksha` : ''
    const planets: { id: GrahaId; lon: number }[] = []
    if (p.sunRashi?.longitude != null) planets.push({ id: 'Su', lon: p.sunRashi.longitude })
    if (p.moonRashi?.longitude != null) planets.push({ id: 'Mo', lon: p.moonRashi.longitude })
    const { good, bad } = goodBadRows(d)

    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: `Daily Panchang · ${d.city.name}`, deva: 'आज का पंचांग', title: dl.weekday, sub: `${dl.day} ${dl.month} ${dl.year}` },
        meta: [cc?.sauraMasa, paksha, cc?.vikramSamvat ? `V.S. ${cc.vikramSamvat}` : ''].filter(Boolean).join('  ·  '),
        hero: { kind: 'wheel', planets, highlightNak: p.nakshatra?.index ?? null },
        tiles: [
          { label: 'Tithi', value: p.tithi?.name ?? '—', detail: `till ${fmtUntil(p.limbEnds?.tithi, d.date, fmtT)}` },
          { label: 'Nakshatra', value: p.nakshatra?.name ?? '—', detail: `till ${fmtUntil(p.limbEnds?.nakshatra, d.date, fmtT)}` },
        ],
      },
      {
        type: 'list',
        head: { kicker: dl.short, deva: 'पंचांग के पाँच अंग', title: 'Pancha Anga' },
        sections: [
          {
            rows: [
              { title: p.tithi?.name ?? '—', note: `Tithi · ${paksha}`, right: `till ${fmtUntil(p.limbEnds?.tithi, d.date, fmtT)}`, lead: { kind: 'medallion', text: 'ति' } },
              {
                title: p.nakshatra?.name ?? '—',
                note: `Nakshatra · pada ${p.nakshatra?.pada ?? '—'} · ${GRAHA_NAMES[grahaId(p.nakshatra?.lord)]}`,
                right: `till ${fmtUntil(p.limbEnds?.nakshatra, d.date, fmtT)}`,
                lead: { kind: 'medallion', text: 'न' },
              },
              {
                title: p.yoga?.name ?? '—',
                note: `Yoga${p.yoga?.quality ? ` · ${p.yoga.quality}` : ''}`,
                right: `till ${fmtUntil(p.limbEnds?.yoga, d.date, fmtT)}`,
                tone: /inausp/i.test(p.yoga?.quality ?? '') ? 'mixed' : 'neutral',
                lead: { kind: 'medallion', text: 'यो' },
              },
              {
                title: p.karana?.name ?? '—',
                note: `Karana${p.karana?.type ? ` · ${p.karana.type}` : ''}${p.karana?.isBhadra ? ' · Bhadra' : ''}`,
                tone: p.karana?.isBhadra ? 'warn' : 'neutral',
                lead: { kind: 'medallion', text: 'क' },
              },
              {
                title: p.vara?.name ?? '—',
                note: `Vara · ${p.vara?.sanskrit ?? ''}`,
                right: `lord ${GRAHA_NAMES[grahaId(p.vara?.lord)]}`,
                lead: { kind: 'medallion', text: 'वा' },
              },
            ],
          },
        ],
        note: [cc?.samvatsara ? `${cc.samvatsara} samvatsara` : '', cc?.shakaYear ? `Shaka ${cc.shakaYear}` : '', cc?.rituEn ? `${cc.rituEn} ritu` : '']
          .filter(Boolean)
          .join('  ·  '),
      },
      {
        type: 'tiles',
        head: { kicker: dl.short, deva: 'सूर्य और चंद्र', title: 'Sun & Moon' },
        cols: 2,
        tiles: [
          { label: 'Sunrise', value: fmtT(p.sunrise), lead: { kind: 'planet', id: 'Su' } },
          { label: 'Sunset', value: fmtT(p.sunset), lead: { kind: 'planet', id: 'Su' } },
          { label: 'Moonrise', value: fmtT(p.moonrise), lead: { kind: 'planet', id: 'Mo' } },
          { label: 'Moonset', value: fmtT(p.moonset), lead: { kind: 'planet', id: 'Mo' } },
          { label: 'Surya in', value: p.sunRashi?.sa ?? '—', detail: p.sunRashi ? `${p.sunRashi.en} · ${fmtDeg(p.sunRashi.degInSign)}` : '' },
          { label: 'Chandra in', value: p.moonRashi?.sa ?? '—', detail: p.moonRashi ? `${p.moonRashi.en} · ${fmtDeg(p.moonRashi.degInSign)}` : '' },
        ],
        note: `Times for ${d.city.name} (IST)`,
      },
      {
        type: 'list',
        head: { kicker: dl.short, deva: 'शुभ और अशुभ समय', title: 'Good & Bad Times' },
        sections: [
          { heading: 'Auspicious', rows: good },
          { heading: 'Avoid', rows: bad.map((r) => ({ ...r, note: undefined })) },
        ],
      },
      {
        type: 'list',
        head: { kicker: dl.short, deva: 'नवग्रह स्थिति', title: 'Navagraha Today' },
        sections: [
          {
            rows: (p.planets ?? []).slice(0, 9).map((g) => ({
              title: g.sa,
              right: `${g.rashiSa} ${fmtDeg(g.degInSign)}${g.retro ? ' ℞' : ''}`,
              tone: g.retro ? 'mixed' : 'neutral',
              lead: { kind: 'planet', id: g.id as GrahaId },
            })),
          },
        ],
      },
      { type: 'cta', ...DAILY_CTA },
    ]

    return {
      slides,
      caption: {
        hook: `🕉 Aaj ka Panchang — ${dl.long}`,
        lines: [
          `Tithi: ${p.tithi?.name} (${paksha}) till ${fmtUntil(p.limbEnds?.tithi, d.date, fmtT)}`,
          `Nakshatra: ${p.nakshatra?.name} till ${fmtUntil(p.limbEnds?.nakshatra, d.date, fmtT)}`,
          `Yoga: ${p.yoga?.name} · Karana: ${p.karana?.name}`,
          `Sunrise ${fmtT(p.sunrise)} · Sunset ${fmtT(p.sunset)}`,
          `Rahu Kaal: ${fmtRange(p.rahuKalam?.start, p.rahuKalam?.end)}`,
          p.abhijitMuhurta ? `Abhijit Muhurta: ${fmtRange(p.abhijitMuhurta.start, p.abhijitMuhurta.end)}` : '',
          `(Times for ${d.city.name})`,
        ],
        tags: ['#panchang', '#aajkapanchang', '#todaypanchang', '#tithi', '#nakshatra', '#rahukaal', '#hindu calendar'],
      },
    }
  },
}

export const shubhAshubh: TemplateDef = {
  id: 'shubh-ashubh',
  code: 'A2',
  category: 'daily',
  name: 'Shubh / Ashubh Samay',
  deva: 'शुभ-अशुभ समय',
  blurb: 'One post with today’s good windows (Brahma, Abhijit, Godhuli) and times to avoid (Rahu Kaal, Yamaganda, Gulika).',
  formats: ['4x5', '9x16'],
  params: ['date', 'city'],
  build(d) {
    const dl = dateLabels(d.date)
    const { good, bad } = goodBadRows(d)
    return {
      slides: [
        {
          type: 'list',
          head: { kicker: `${dl.weekday} · ${dl.short}`, deva: 'आज का शुभ-अशुभ समय', title: 'Today’s Timings' },
          sections: [
            { heading: 'Shubh — auspicious', rows: good.map((r) => ({ ...r, note: undefined })) },
            { heading: 'Ashubh — avoid', rows: bad.map((r) => ({ ...r, note: undefined })) },
          ],
          note: `${d.city.name} · IST`,
        },
      ],
      caption: {
        hook: `⏰ Shubh & Ashubh Samay — ${dl.long}`,
        lines: [...good.map((r) => `✅ ${r.title}: ${r.right}`), ...bad.map((r) => `⛔ ${r.title}: ${r.right}`), `(Times for ${d.city.name})`],
        tags: ['#rahukaal', '#shubhmuhurat', '#abhijitmuhurat', '#brahmamuhurta', '#panchang'],
      },
    }
  },
}
