import type { GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'
import { PLANET_REMEDY_TEACHINGS, type RemedyGrahaId } from '@/lib/engine/planetaryRemedies'
import { getVaarMeta } from '@/lib/engine/vaarMeta'
import { fmtDeg } from '@/lib/social/render/kit'
import type { SlideSpec } from '@/lib/social/render/slides/types'
import type { TemplateDef } from '@/lib/social/templates/types'
import { dateLabels, grahaId } from '@/lib/social/templates/shared'

export const skyToday: TemplateDef = {
  id: 'sky-today',
  code: 'A8',
  category: 'daily',
  name: 'Sky Today',
  deva: 'आज का आकाश',
  blurb: 'All nine grahas placed on the zodiac wheel, then their signs and degrees.',
  formats: ['4x5', '9x16'],
  params: ['date'],
  build(d) {
    const p = d.panchang
    const dl = dateLabels(d.date)
    const planets = (p.planets ?? []).slice(0, 9)
    const retro = planets.filter((g) => g.retro && g.id !== 'Ra' && g.id !== 'Ke')
    const slides: SlideSpec[] = [
      {
        type: 'cover',
        head: { kicker: dl.long, deva: 'आज का आकाश', title: 'Sky Today', sub: 'Where the nine grahas stand' },
        hero: { kind: 'wheel', planets: planets.map((g) => ({ id: g.id as GrahaId, lon: g.longitude })) },
        meta: retro.length ? `Retrograde: ${retro.map((g) => g.sa).join(', ')}` : 'All grahas direct (except the nodes)',
      },
      {
        type: 'list',
        head: { kicker: dl.short, deva: 'नवग्रह स्थिति', title: 'Graha Positions' },
        sections: [
          {
            rows: planets.map((g) => ({
              title: g.sa,
              note: GRAHA_NAMES[g.id as GrahaId],
              right: `${g.rashiSa} ${fmtDeg(g.degInSign)}${g.retro ? ' ℞' : ''}`,
              tone: g.retro && g.id !== 'Ra' && g.id !== 'Ke' ? 'mixed' : 'neutral',
              lead: { kind: 'planet', id: g.id as GrahaId },
            })),
          },
        ],
        note: 'Sidereal (Lahiri) · ℞ = retrograde',
      },
    ]
    return {
      slides,
      caption: {
        hook: `🪐 Sky Today — ${dl.long}`,
        lines: [...planets.map((g) => `${g.sa}: ${g.rashiSa} ${fmtDeg(g.degInSign)}${g.retro ? ' (R)' : ''}`), 'Sidereal positions, Lahiri ayanamsha.'],
        tags: ['#gochar', '#planetarytransits', '#navagraha', '#skytoday', '#transits'],
      },
    }
  },
}

export const upayToday: TemplateDef = {
  id: 'upay',
  code: 'A9',
  category: 'daily',
  name: 'Aaj ka Upay',
  deva: 'आज का उपाय',
  blurb: 'Remedy of the day from the weekday’s ruling graha: what to do, chant and donate.',
  formats: ['4x5', '9x16'],
  params: ['date'],
  build(d) {
    const dl = dateLabels(d.date)
    const vara = d.panchang.vara
    const meta = getVaarMeta(vara?.number ?? new Date(`${d.date}T12:00:00Z`).getUTCDay())
    const lord = grahaId(meta.lord) as RemedyGrahaId
    const teach = PLANET_REMEDY_TEACHINGS[lord]
    const slides: SlideSpec[] = [
      {
        type: 'text',
        head: { kicker: `${dl.weekday} · ${meta.lordName}'s day`, deva: 'आज का उपाय', title: `Remedy for ${teach.sanskrit}` },
        hero: { kind: 'lotus', planet: lord },
        paragraphs: [meta.dayGuidance],
        bullets: [
          { title: 'Do', tone: 'good', items: teach.behavioral.slice(0, 2) },
          {
            title: 'Worship & donate',
            items: [
              teach.spiritual.find((s) => /chant|mantra/i.test(s)) ?? teach.spiritual[0] ?? (teach.deities.length ? `Worship ${teach.deities.join(' / ')}` : ''),
              teach.donation.length ? `Donate: ${teach.donation.slice(0, 3).join(', ')}` : '',
            ].filter(Boolean),
          },
        ],
      },
    ]
    return {
      slides,
      caption: {
        hook: `🙏 Aaj ka Upay — ${dl.weekday} is ruled by ${meta.lordName} (${teach.sanskrit})`,
        lines: [meta.dayGuidance, ...teach.behavioral.slice(0, 3).map((s) => `• ${s}`), `Donate: ${teach.donation.join(', ')}`],
        tags: ['#upay', '#remedies', `#${teach.sanskrit}`, '#vedicremedies', '#grahashanti'],
      },
    }
  },
}
