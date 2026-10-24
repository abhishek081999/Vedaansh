import { describe, it, expect } from 'vitest'
import type { ChartOutput, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeIntimateLife, dusthanaLinks } from '@/lib/engine/intimateLife'
import { overlayCharts } from '@/lib/engine/matchMaking'
import { moonEmotionalPair } from '@/lib/engine/milanMarriedLife'
import { lagnaMatch } from '@/lib/engine/lagnaMatch'

function g(id: GrahaId, rashi: Rashi, speed = 1, extra?: Partial<GrahaData>): GrahaData {
  return { id, rashi, dignity: 'neutral', isCombust: false, speed, name: id, ...extra } as GrahaData
}

function chart(
  asc: Rashi,
  grahas: GrahaData[],
  extra?: {
    vargas?: Record<string, GrahaData[]>
    vargaLagnas?: Partial<Record<string, Rashi>>
    dashas?: { vimshottari: DashaNode[] }
    meta?: { name: string; gender: 'male' | 'female' | 'other' }
    upagrahas?: ChartOutput['upagrahas']
  },
): ChartOutput {
  return {
    meta: { name: 'Test', gender: 'other', ...extra?.meta },
    grahas,
    lagnas: { ascRashi: asc },
    vargas: extra?.vargas ?? {},
    vargaLagnas: extra?.vargaLagnas ?? {},
    dashas: extra?.dashas ?? {},
    upagrahas: extra?.upagrahas,
  } as ChartOutput
}

describe('intimate life', () => {
  it('reads Mars and Saturn on the 7th as an unconventional intimate style', () => {
    const result = analyzeIntimateLife(chart(1, [g('Ma', 1), g('Sa', 10), g('Ju', 1), g('Ve', 2), g('Mo', 4)]))
    const hit = result!.notes.find(n => n.id === 'seventh-pressure')
    expect(hit?.detail).toMatch(/oral/i)
    expect(hit?.detail).toMatch(/both sexes/i)
    expect(result!.notes.some(n => /empty|read the|do not expect/i.test(n.detail))).toBe(false)
  })

  it('flags Ketu in the 12th and Saturn with the Moon', () => {
    const result = analyzeIntimateLife(chart(1, [g('Ke', 12), g('Mo', 10), g('Sa', 10), g('Ve', 2)]))
    expect(result!.notes.some(n => n.id === 'ketu-twelfth')).toBe(true)
    expect(result!.notes.some(n => n.id === 'moon-saturn')).toBe(true)
  })

  it('treats Saturn and Ketu in Libra Navamsha as an unsettled preference', () => {
    const result = analyzeIntimateLife(chart(1, [g('Ve', 12), g('Mo', 2)], {
      vargas: { D9: [g('Sa', 7), g('Ke', 7), g('Ve', 12), g('Ju', 4), g('Me', 6)] },
      vargaLagnas: { D9: 4 },
    }))
    expect(result!.notes.some(n => n.id === 'libra-d9')).toBe(true)
    expect(result!.notes.find(n => n.id === 'd9-outcome')?.tone).toBe('supportive')
  })

  it('names narcissism only when the Moon sits in a Venus sign', () => {
    const hit = analyzeIntimateLife(chart(1, [g('Mo', 2), g('Ve', 5), g('Ma', 3)]))
    expect(hit!.notes.some(n => n.id === 'moon-venus-sign')).toBe(true)
    const quiet = analyzeIntimateLife(chart(1, [g('Mo', 5), g('Ve', 5), g('Ma', 3)]))
    expect(quiet!.notes.some(n => n.id === 'moon-venus-sign' || n.id === 'venus-moon-sign')).toBe(false)
    expect(quiet!.notes.some(n => /empty|how to|read the/i.test(n.detail))).toBe(false)
  })

  it('adds the home-drain result only on a D4 Moon–Saturn overlap', () => {
    const hits = overlayCharts([g('Mo', 4)], 4, [g('Sa', 1)], 1, 'A', 'B', 'D4')
    expect(hits[0].detail).toMatch(/change of residence/i)
    const d1 = overlayCharts([g('Mo', 4)], 4, [g('Sa', 1)], 1, 'A', 'B', 'D1')
    expect(d1[0].detail).not.toMatch(/change of residence/i)
  })

  it('reads Moon, Gemini, and Libra pursuit only when those planets sit there', () => {
    const hit = analyzeIntimateLife(chart(1, [g('Mo', 3), g('Ke', 3), g('Me', 3), g('Ma', 7), g('Ve', 7)]))
    expect(hit!.notes.find(n => n.id === 'moon-ketu')?.detail).toMatch(/act/)
    expect(hit!.notes.find(n => n.id === 'same-sex-turn')?.detail).toMatch(/same sex/)
    expect(hit!.notes.find(n => n.id === 'close-circle')?.detail).toMatch(/family/)
    expect(hit!.notes.some(n => /incest|molester|premature|traffick/i.test(`${n.title} ${n.detail}`))).toBe(false)
    const quiet = analyzeIntimateLife(chart(1, [g('Mo', 5), g('Ke', 9), g('Me', 6), g('Ma', 1), g('Ve', 2)]))
    expect(quiet!.notes.some(n => n.id === 'moon-ketu' || n.id === 'same-sex-turn' || n.id === 'close-circle')).toBe(false)
  })

  it('splits a blocked 7th from a weak 7th lord', () => {
    const blocked = analyzeIntimateLife(chart(1, [g('Sa', 7), g('Ra', 7), g('Ve', 2)]))
    expect(blocked!.notes.find(n => n.id === 'seventh-afflicted')?.detail).toMatch(/does not arrive/)
    const weak = analyzeIntimateLife(chart(1, [g('Ve', 6, 1, { dignity: 'debilitated' })]))
    expect(weak!.notes.some(n => n.id === 'seventh-enjoy')).toBe(true)
    expect(weak!.notes.some(n => n.id === 'seventh-afflicted')).toBe(false)
    const open = analyzeIntimateLife(chart(4, [g('Ma', 10, 1, { dignity: 'exalted' })]))
    expect(open!.notes.some(n => n.id === 'mars-open')).toBe(true)
    expect(open!.notes.some(n => n.id === 'seventh-afflicted')).toBe(false)
  })

  it('names the approach from the lagna and a heavy Taurus line', () => {
    const taurus = analyzeIntimateLife(chart(2, [g('Su', 2), g('Mo', 2), g('Ju', 2), g('Ve', 6, 1, { nakshatraIndex: 5 })]))
    expect(taurus!.notes.find(n => n.id === 'approach')?.detail).toMatch(/rescue/)
    expect(taurus!.notes.some(n => n.id === 'progeny')).toBe(true)
    const other = analyzeIntimateLife(chart(1, [g('Su', 5), g('Mo', 5), g('Ve', 5)]))
    expect(other!.notes.some(n => n.id === 'approach' || n.id === 'progeny')).toBe(false)
  })

  it('dates an entry in Saturn–Venus and a later Sun breakup', () => {
    const period = (lord: string, start: string, end: string, children: DashaNode[] = []): DashaNode => ({
      lord,
      start: new Date(start),
      end: new Date(end),
      durationMs: 1,
      level: children.length ? 1 : 2,
      isCurrent: false,
      children,
    })
    const saturn = period('Sa', '2020-01-01T00:00:00Z', '2039-01-01T00:00:00Z', [
      period('Sa', '2020-01-01T00:00:00Z', '2023-01-01T00:00:00Z'),
      period('Me', '2023-01-01T00:00:00Z', '2025-06-01T00:00:00Z'),
      period('Ve', '2025-06-01T00:00:00Z', '2028-06-01T00:00:00Z'),
      period('Su', '2028-06-01T00:00:00Z', '2030-06-01T00:00:00Z'),
      period('Ke', '2030-06-01T00:00:00Z', '2032-06-01T00:00:00Z'),
    ])
    const hit = analyzeIntimateLife(chart(1, [g('Sa', 10), g('Ve', 2), g('Su', 5)], {
      dashas: { vimshottari: [saturn] },
    }))
    const entry = hit!.timings.find(n => n.id.startsWith('entry-'))
    const breakup = hit!.timings.find(n => n.title.startsWith('Breakup'))
    expect(entry?.title).toMatch(/Entry open · Saturn–Venus/)
    expect(entry?.detail).toMatch(/difficult for a long time/)
    expect(breakup?.title).toMatch(/Saturn–Sun/)
    expect(breakup?.detail).toMatch(/exposed/)
    expect(hit!.timings.some(n => /110%|virgin|shilajit|beaten/i.test(`${n.title} ${n.detail}`))).toBe(false)

    const blocked = analyzeIntimateLife(chart(1, [g('Ra', 1), g('Ve', 6)], {
      dashas: { vimshottari: [period('Ra', '2020-01-01T00:00:00Z', '2038-01-01T00:00:00Z', [
        period('Ve', '2024-01-01T00:00:00Z', '2027-01-01T00:00:00Z'),
      ])] },
    }))
    expect(blocked!.timings.some(n => n.id.startsWith('entry-'))).toBe(false)
    expect(blocked!.timings.find(n => n.id.includes('work-'))?.detail).toMatch(/job, earnings/)
  })

  it('names pratyantar and sukshma when the dasha tree has them', () => {
    const period = (lord: string, start: string, end: string, children: DashaNode[] = []): DashaNode => ({
      lord,
      start: new Date(start),
      end: new Date(end),
      durationMs: 1,
      level: 1,
      isCurrent: false,
      children,
    })
    const saturn = period('Sa', '2020-01-01T00:00:00Z', '2039-01-01T00:00:00Z', [
      period('Ve', '2024-01-01T00:00:00Z', '2030-01-01T00:00:00Z', [
        period('Me', '2025-01-01T00:00:00Z', '2029-01-01T00:00:00Z', [
          period('Ve', '2026-01-01T00:00:00Z', '2028-01-01T00:00:00Z'),
          period('Su', '2028-01-01T00:00:00Z', '2028-06-01T00:00:00Z'),
        ]),
      ]),
    ])
    const hit = analyzeIntimateLife(chart(1, [g('Sa', 10), g('Ve', 2)], {
      dashas: { vimshottari: [saturn] },
    }))
    expect(hit!.timings.some(n => n.title.includes('Sukshma') && n.title.includes('Saturn–Venus–Mercury–Venus'))).toBe(true)
    expect(hit!.timings.some(n => n.title.includes('Pratyantar') && n.title.includes('Saturn–Venus–Mercury'))).toBe(true)
    expect(hit!.timings.some(n => n.title.includes('Sukshma') && n.title.includes('Sun'))).toBe(true)
  })

  it('keeps entry and breakup windows from the last five years', () => {
    const period = (lord: string, start: string, end: string, children: DashaNode[] = []): DashaNode => ({
      lord,
      start: new Date(start),
      end: new Date(end),
      durationMs: 1,
      level: 1,
      isCurrent: false,
      children,
    })
    const saturn = period('Sa', '2010-01-01T00:00:00Z', '2040-01-01T00:00:00Z', [
      period('Ve', '2018-01-01T00:00:00Z', '2019-01-01T00:00:00Z'),
      period('Ve', '2023-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
      period('Su', '2024-06-01T00:00:00Z', '2025-01-01T00:00:00Z'),
      period('Ve', '2026-01-01T00:00:00Z', '2028-01-01T00:00:00Z'),
    ])
    const hit = analyzeIntimateLife(chart(1, [g('Sa', 10), g('Ve', 2)], {
      dashas: { vimshottari: [saturn] },
    }))
    const pastEntry = hit!.timings.find(n => n.id.startsWith('past-entry-'))
    expect(pastEntry?.detail).toMatch(/2023/)
    expect(pastEntry?.title.startsWith('Entry open')).toBe(false)
    expect(hit!.timings.some(n => n.id.startsWith('past-break-') && n.detail.includes('2024'))).toBe(true)
    expect(hit!.timings.some(n => n.detail.includes('2018'))).toBe(false)
    expect(hit!.timings.some(n => n.title.startsWith('Entry open'))).toBe(true)
  })

  it('opens the 5th when a planet in the 11th, or any planet aspecting the 5th, runs its dasha', () => {
    const period = (lord: string, start: string, end: string, children: DashaNode[] = []): DashaNode => ({
      lord,
      start: new Date(start),
      end: new Date(end),
      durationMs: 1,
      level: 1,
      isCurrent: false,
      children,
    })
    const fromEleventh = analyzeIntimateLife(chart(1, [g('Ju', 11), g('Sa', 10)], {
      dashas: { vimshottari: [period('Sa', '2020-01-01T00:00:00Z', '2039-01-01T00:00:00Z', [
        period('Ju', '2026-01-01T00:00:00Z', '2028-01-01T00:00:00Z'),
      ])] },
    }))
    expect(fromEleventh!.timings.find(n => n.title.includes('Jupiter'))?.detail).toMatch(/11th and aspects the 5th/)

    const byAspect = analyzeIntimateLife(chart(1, [g('Ma', 2)], {
      dashas: { vimshottari: [period('Ju', '2020-01-01T00:00:00Z', '2036-01-01T00:00:00Z', [
        period('Ma', '2026-01-01T00:00:00Z', '2027-06-01T00:00:00Z'),
        period('Mo', '2027-06-01T00:00:00Z', '2028-06-01T00:00:00Z'),
      ])] },
    }))
    expect(byAspect!.timings.find(n => n.title.includes('Mars'))?.detail).toMatch(/aspects the 5th/)
    expect(byAspect!.timings.some(n => n.title.includes('Moon'))).toBe(false)

    const throughDasha = analyzeIntimateLife(chart(1, [g('Ju', 9)], {
      dashas: { vimshottari: [period('Ju', '2020-01-01T00:00:00Z', '2036-01-01T00:00:00Z', [
        period('Mo', '2026-01-01T00:00:00Z', '2027-06-01T00:00:00Z'),
      ])] },
    }))
    expect(throughDasha!.timings.find(n => n.title.includes('Moon'))?.detail).toMatch(/Jupiter aspects the 5th, and its dasha is running/)
  })

  it('reads a D3 breakup mind and a D7 hidden bond only when those divisions show them', () => {
    const period = (lord: string, start: string, end: string): DashaNode => ({
      lord,
      start: new Date(start),
      end: new Date(end),
      durationMs: 1,
      level: 1,
      isCurrent: false,
      children: [],
    })
    const ending = analyzeIntimateLife(chart(1, [g('Su', 1)], {
      vargas: { D3: [g('Su', 7)], D7: [g('Ma', 5), g('Mo', 4)] },
      vargaLagnas: { D3: 8, D7: 4 },
      dashas: { vimshottari: [period('Su', '2024-01-01T00:00:00Z', '2030-01-01T00:00:00Z')] },
    }))
    expect(ending!.divisions.find(n => n.id === 'd3-libra-12')?.detail).toMatch(/breakup/)
    expect(ending!.divisions.some(n => n.id === 'd7-moon-lagna')).toBe(true)
    expect(ending!.divisions.some(n => /playboy|will die|miscarriage/i.test(`${n.title} ${n.detail}`))).toBe(false)

    const hidden = analyzeIntimateLife(chart(1, [g('Ma', 1)], {
      vargas: { D7: [g('Ma', 8)] },
      vargaLagnas: { D7: 1 },
      dashas: { vimshottari: [period('Ma', '2024-01-01T00:00:00Z', '2031-01-01T00:00:00Z')] },
    }))
    expect(hidden!.divisions.some(n => n.id === 'd7-hidden')).toBe(true)
    expect(hidden!.divisions.find(n => n.id === 'd7-end-now')?.detail).toMatch(/mourned/)

    const quiet = analyzeIntimateLife(chart(1, [g('Mo', 5)]))
    expect(quiet!.divisions.some(n => n.id === 'd3-libra-12' || n.id === 'd7-moon-lagna' || n.id === 'd7-hidden')).toBe(false)
  })

  it('reads D7 entry, children, and a calculative D3 only from those placements', () => {
    const period = (lord: string, start: string, end: string, children: DashaNode[] = []): DashaNode => ({
      lord,
      start: new Date(start),
      end: new Date(end),
      durationMs: 1,
      level: 1,
      isCurrent: false,
      children,
    })
    const entered = analyzeIntimateLife(chart(1, [g('Ju', 1)], {
      vargas: { D7: [g('Ju', 3)] },
      vargaLagnas: { D7: 1 },
    }))
    expect(entered!.divisions.find(n => n.id === 'd7-entry')?.detail).toMatch(/close circle/)
    expect(entered!.divisions.find(n => n.id === 'd7-entry')?.detail).toMatch(/7th/)

    const calc = analyzeIntimateLife(chart(1, [g('Sa', 3)], {
      vargas: { D3: [g('Sa', 3)] },
      vargaLagnas: { D3: 3 },
    }))
    expect(calc!.divisions.some(n => n.id === 'd3-calc')).toBe(true)
    expect(calc!.divisions.some(n => n.id === 'd3-speech')).toBe(false)

    const child = analyzeIntimateLife(chart(1, [g('Ma', 1)], {
      vargas: { D7: [g('Ma', 8), g('Ke', 8), g('Su', 7), g('Ve', 6)] },
      vargaLagnas: { D7: 1 },
    }))
    expect(child!.divisions.find(n => n.id === 'd7-mars-ketu')?.detail).toMatch(/does not stay/)
    expect(child!.divisions.find(n => n.id === 'd7-child-hard')?.detail).toMatch(/costs heavily/)
    expect(child!.divisions.some(n => /miscarriage|will die|playboy/i.test(`${n.title} ${n.detail}`))).toBe(false)

    const merit = analyzeIntimateLife(chart(1, [g('Sa', 7)], {
      vargas: { D7: [g('Sa', 7)] },
      vargaLagnas: { D7: 10 },
    }))
    expect(merit!.divisions.find(n => n.id === 'd7-merit')?.detail).toMatch(/comes out strong/)

    const boy = analyzeIntimateLife(chart(1, [g('Ve', 1)], {
      meta: { name: 'Test', gender: 'male' },
      vargas: { D7: [g('Ve', 5), g('Ra', 5)] },
      vargaLagnas: { D7: 1 },
    }))
    expect(boy!.divisions.find(n => n.id === 'd7-ve-ra')?.detail).toMatch(/man’s chart/)
    expect(boy!.divisions.some(n => n.id === 'd7-venus-leo')).toBe(true)

    const mandi = analyzeIntimateLife(chart(1, [g('Mo', 4)], {
      vargas: { D7: [g('Mo', 4)] },
      vargaLagnas: { D7: 1 },
      upagrahas: { Maandi: { id: 'Maandi', name: 'Mandi', lonSidereal: 30, rashi: 2, rashiName: 'Taurus', degree: 0, nakshatraName: '', pada: 1 } },
    }))
    expect(mandi!.divisions.find(n => n.id === 'd7-mandi')?.detail).toMatch(/painful/)

    const exposed = analyzeIntimateLife(chart(1, [g('Sa', 10), g('Mo', 3)], {
      vargas: { D3: [g('Mo', 3)] },
      vargaLagnas: { D3: 1 },
      dashas: { vimshottari: [period('Sa', '2020-01-01T00:00:00Z', '2039-01-01T00:00:00Z', [
        period('Ma', '2025-01-01T00:00:00Z', '2028-01-01T00:00:00Z', [
          period('Mo', '2026-06-01T00:00:00Z', '2026-12-01T00:00:00Z'),
        ]),
      ])] },
    }))
    const exposure = exposed!.divisions.find(n => n.id.startsWith('open-expose-') || n.id.startsWith('expose-'))
    expect(exposure?.detail).toMatch(/allegations/)
    expect(exposure?.detail).toMatch(/phone/)

    const phone = analyzeIntimateLife(chart(1, [g('Su', 6), g('Me', 6), g('Ke', 6)]))
    expect(phone!.notes.find(n => n.id === 'phone-exposure')?.detail).toMatch(/phone/)
  })

  it('reads who steers the bond from Venus, Rahu, D3, and the 8th', () => {
    const period = (lord: string, start: string, end: string): DashaNode => ({
      lord,
      start: new Date(start),
      end: new Date(end),
      durationMs: 1,
      level: 1,
      isCurrent: false,
      children: [],
    })
    const libra = analyzeIntimateLife(chart(1, [g('Mo', 7), g('Ra', 7), g('Ve', 2)]))
    expect(libra!.influence.some(n => n.id === 'libra-pressure')).toBe(true)
    expect(libra!.influence.some(n => n.id === 'mo-ra')).toBe(true)

    const held = analyzeIntimateLife(chart(4, [
      g('Mo', 4, 1, { nakshatraIndex: 8 }),
      g('Me', 4),
      g('Ke', 4),
      g('Ve', 2),
    ]))
    expect(held!.influence.find(n => n.id === 'ashlesha-hold')?.detail).toMatch(/Ashlesha/)
    expect(held!.influence.some(n => n.id === 'water-speech')).toBe(true)

    const steered = analyzeIntimateLife(chart(9, [g('Me', 3), g('Ve', 2), g('Ma', 4)], {
      vargas: { D3: [g('Ve', 6), g('Ju', 1)], D4: [g('Sa', 6)], D7: [g('Ma', 5)] },
      vargaLagnas: { D3: 6, D4: 6, D7: 1 },
      dashas: { vimshottari: [period('Ma', '2024-01-01T00:00:00Z', '2031-01-01T00:00:00Z')] },
    }))
    expect(steered!.influence.some(n => n.id === 'sagittarius-seventh')).toBe(true)
    expect(steered!.influence.some(n => n.id === 'd3-filter')).toBe(true)
    expect(steered!.influence.some(n => n.id === 'd4-insecure')).toBe(true)
    expect(steered!.influence.some(n => n.id === 'd7-karmic')).toBe(true)
    expect(steered!.influence.find(n => n.id === 'eighth-stuck')?.detail).toMatch(/does not resolve/)

    const weapon = analyzeIntimateLife(chart(1, [g('Ma', 2), g('Sa', 2), g('Ve', 7)]))
    expect(weapon!.influence.find(n => n.id === 'second-weapon')?.detail).toMatch(/same old incident/)
    expect(weapon!.influence.some(n => /set themselves on fire|cyanide/i.test(`${n.title} ${n.detail}`))).toBe(false)
  })

  it('reads in-laws by shifting the 3rd and the 8th to the lagna', () => {
    const mil = analyzeIntimateLife(chart(1, [g('Su', 10), g('Ju', 10), g('Ve', 2)]))
    expect(mil!.inlaws.find(n => n.id === 'mil-sun-jupiter')?.detail).toMatch(/good-natured/)
    expect(mil!.inlaws.some(n => n.id === 'mil-career')).toBe(false)

    const pressed = analyzeIntimateLife(chart(2, [g('Mo', 8), g('Ve', 2)]))
    expect(pressed!.inlaws.find(n => n.id === 'fil-shifted')?.detail).toMatch(/pressed/)

    const standing = analyzeIntimateLife(chart(2, [g('Mo', 4, 1, { dignity: 'own' }), g('Ve', 7)]))
    expect(standing!.inlaws.find(n => n.id === 'fil-shifted')?.detail).toMatch(/standing/)

    const confirmed = analyzeIntimateLife(chart(1, [g('Ma', 10, 1, { dignity: 'exalted' }), g('Ve', 2)]))
    expect(confirmed!.inlaws.find(n => n.id === 'inlaws-status')?.detail).toMatch(/higher social standing/)

    const unconfirmed = analyzeIntimateLife(chart(2, [g('Ju', 11), g('Ve', 7), g('Mo', 5)]))
    expect(unconfirmed!.inlaws.find(n => n.id === 'inlaws-status')?.detail).toMatch(/not confirmed/)
  })

  it('reads a Saturn–Sun exposure through the father, and a Jupiter-to-Saturn handoff', () => {
    const period = (lord: string, start: string, end: string, children: DashaNode[] = []): DashaNode => ({
      lord,
      start: new Date(start),
      end: new Date(end),
      durationMs: 1,
      level: 1,
      isCurrent: false,
      children,
    })
    const exposed = analyzeIntimateLife(chart(1, [g('Sa', 10), g('Su', 5), g('Ve', 2)], {
      meta: { name: 'Test', gender: 'female' },
      dashas: { vimshottari: [period('Sa', '2020-01-01T00:00:00Z', '2039-01-01T00:00:00Z', [
        period('Su', '2026-01-01T00:00:00Z', '2027-06-01T00:00:00Z'),
      ])] },
    }))
    expect(exposed!.timings.find(n => n.title.includes('Saturn–Sun'))?.detail).toMatch(/father/)
    expect(exposed!.timings.some(n => /beaten|virgin|shilajit/i.test(`${n.title} ${n.detail}`))).toBe(false)

    const flip = analyzeIntimateLife(chart(1, [g('Ju', 9, 1, { dignity: 'own' }), g('Sa', 10), g('Mo', 2)], {
      dashas: { vimshottari: [
        period('Ju', '2010-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
        period('Sa', '2026-01-01T00:00:00Z', '2045-01-01T00:00:00Z'),
      ] },
    }))
    expect(flip!.notes.find(n => n.id === 'ju-sa-flip')?.detail).toMatch(/repeated work/)

    const ketuHouse = analyzeIntimateLife(chart(1, [g('Ke', 8), g('Ve', 2)]))
    expect(ketuHouse!.notes.some(n => n.id === 'ketu-kama-house')).toBe(true)
  })

  it('names a 6/8/12 lagna as a crisis helper', () => {
    const links = dusthanaLinks('Aarav', 11, 'Meera', 6)
    expect(links.some(l => l.house === 8 && l.native === 'Aarav')).toBe(true)
    expect(links[0].detail).toMatch(/crisis/i)
  })
})

describe('moon and lagna additions', () => {
  it('gives Gemini–Aries and Cancer–Taurus their own readings', () => {
    expect(moonEmotionalPair(3, 1).title).toBe('Gemini and Aries')
    expect(moonEmotionalPair(4, 2).tone).toBe('supportive')
    expect(moonEmotionalPair(9, 11).detail).toMatch(/values|ethic/i)
  })

  it('rates Scorpio with Aquarius as a useful match', () => {
    expect(lagnaMatch(8, 11).level).toBe('good')
  })
})
