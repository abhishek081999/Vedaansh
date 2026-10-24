import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeCareerProfession, readCareerTransits } from '@/lib/engine/careerProfession'

function g(
  id: GrahaId,
  rashi: Rashi,
  dignity: Dignity = 'neutral',
  extra: Partial<GrahaData> = {},
): GrahaData {
  return {
    id,
    rashi,
    dignity,
    isCombust: false,
    isRetro: false,
    name: id,
    nakshatraIndex: extra.nakshatraIndex ?? 0,
    pada: extra.pada ?? 1,
    ...extra,
  } as GrahaData
}

function chart(opts: {
  asc: Rashi
  grahas: GrahaData[]
  d9?: GrahaData[]
  d9Asc?: Rashi
  d10?: GrahaData[]
  d10Asc?: Rashi
  a10?: Rashi
  amk?: GrahaId
  ak?: GrahaId
  indu?: number
  dashaLord?: GrahaId
  pratyantarLord?: GrahaId
  sookshmaLord?: GrahaId
}): ChartOutput {
  const maha: DashaNode = {
    lord: opts.dashaLord ?? 'Sa',
    start: new Date('2024-01-01T00:00:00Z'),
    end: new Date('2030-01-01T00:00:00Z'),
    durationMs: 1,
    level: 1,
    isCurrent: false,
    children: [{
      lord: 'Me',
      start: new Date('2026-01-01T00:00:00Z'),
      end: new Date('2027-06-01T00:00:00Z'),
      durationMs: 1,
      level: 2,
      isCurrent: false,
      children: opts.pratyantarLord ? [{
        lord: opts.pratyantarLord,
        start: new Date('2026-06-01T00:00:00Z'),
        end: new Date('2026-12-01T00:00:00Z'),
        durationMs: 1,
        level: 3,
        isCurrent: false,
        children: opts.sookshmaLord ? [{
          lord: opts.sookshmaLord,
          start: new Date('2026-09-01T00:00:00Z'),
          end: new Date('2026-11-15T00:00:00Z'),
          durationMs: 1,
          level: 4,
          isCurrent: false,
          children: [],
        }] : [],
      }] : [],
    }],
  }
  return {
    meta: { name: 'Test', gender: 'male' },
    grahas: opts.grahas,
    lagnas: { ascRashi: opts.asc, ...(opts.indu != null ? { induLagna: opts.indu } : {}) },
    vargas: {
      ...(opts.d9 ? { D9: opts.d9 } : {}),
      ...(opts.d10 ? { D10: opts.d10 } : {}),
    },
    vargaLagnas: {
      ...(opts.d9Asc ? { D9: opts.d9Asc } : {}),
      ...(opts.d10Asc ? { D10: opts.d10Asc } : {}),
    },
    dashas: { vimshottari: [maha] },
    arudhas: opts.a10 ? { A10: opts.a10 } : {},
    karakas: {
      ...(opts.amk ? { AmK: opts.amk } : {}),
      ...(opts.ak ? { AK: opts.ak } : {}),
    },
  } as unknown as ChartOutput
}

const AS_OF = new Date('2026-10-23T12:00:00Z')

/** Aries: Saturn (10th lord) own in Capricorn, quiet companions. */
function serviceChart() {
  return chart({
    asc: 1,
    amk: 'Sa',
    a10: 10,
    d10Asc: 10,
    d10: [g('Sa', 10, 'own')],
    d9Asc: 10,
    d9: [g('Sa', 10, 'own')],
    grahas: [
      g('Su', 5, 'own'),
      g('Mo', 4, 'own'),
      g('Ma', 8, 'own'),
      g('Me', 4, 'friend'),
      g('Ju', 9, 'own'),
      g('Ve', 2, 'own'),
      g('Sa', 10, 'own'),
      g('Ra', 11),
      g('Ke', 5),
    ],
  })
}

describe('analyzeCareerProfession', () => {
  it('returns null without an ascendant', () => {
    expect(analyzeCareerProfession({ grahas: [], lagnas: {} } as unknown as ChartOutput)).toBeNull()
  })

  it('reads a dignified 10th lord in the 10th as service, with five scores', () => {
    const reading = analyzeCareerProfession(serviceChart(), AS_OF)
    expect(reading).not.toBeNull()
    expect(reading!.scores).toHaveLength(5)
    expect(reading!.scores.every(s => s.score >= 0 && s.score <= 10)).toBe(true)
    expect(reading!.track.id).toBe('service')
    expect(reading!.headline).toContain('Capricorn')
    expect(reading!.yogas.map(y => y.id)).toContain('tenth-lord-strong')
    expect(reading!.yogas.map(y => y.id)).toContain('vargottama')
    expect(reading!.a10?.signName).toBe('Capricorn')
    expect(reading!.dashamsha?.tone).toBe('supportive')
    expect(reading!.navamsha?.tone).toBe('supportive')
    expect(reading!.timing.some(w => w.live)).toBe(true)
    expect(reading!.tracker.headline).toMatch(/Saturn mahadasha is good for career/)
    expect(reading!.tracker.mahas[0]?.fit).toBe('good')
    expect(reading!.tracker.mahas[0]?.label).toBe('Good for career')
    expect(reading!.tracker.antars.find(s => s.live)?.lord).toBe('Mercury')
    expect(reading!.tracker.nowShare).not.toBeNull()
    expect(reading!.tracker.pratyantars).toHaveLength(0)
    expect(reading!.tracker.pratyantarWindow).toMatch(/Pratyantardasha is not on this chart/)
    expect(reading!.fields.length).toBeGreaterThan(0)
    expect(reading!.brief.plain).toContain('Verdict')
    expect(reading!.significators.map(s => s.id)).toEqual(
      expect.arrayContaining(['tenth', 'tenthLord', 'sun', 'saturn', 'mercury', 'amk']),
    )
  })

  it('names business when the 10th lord is in the 7th and Amala holds the 10th', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 4,
      grahas: [
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 10, 'exalted'),
        g('Me', 3, 'own'),
        g('Ju', 12, 'own'),
        g('Ve', 1, 'neutral'),
        g('Sa', 11, 'own'),
        g('Ra', 8),
        g('Ke', 2),
      ],
    }), AS_OF)
    expect(reading!.track.id).toBe('business')
    expect(reading!.yogas.map(y => y.id)).toContain('amala')
    expect(reading!.foreign.active).toBe(false)
  })

  it('activates foreign work when the 10th lord is in the 12th', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Sa', 12, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 4, 'friend'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.foreign.active).toBe(true)
    expect(reading!.foreign.factors.some(f => f.includes('12th'))).toBe(true)
  })

  it('marks Dharma-Karmadhipati when the 9th and 10th lords conjoin', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Ju', 9, 'own'),
        g('Sa', 9, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 4, 'friend'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    expect(reading!.yogas.map(y => y.id)).toContain('dharma-karma')
  })

  it('cancels a debilitated 10th lord when the exaltation lord is in a kendra', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 4,
      grahas: [
        g('Ma', 4, 'debilitated'),
        g('Sa', 10, 'own'),
        g('Mo', 8, 'debilitated'),
        g('Su', 5, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 12, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)
    expect(reading!.yogas.map(y => y.id)).toContain('neecha-bhanga')
  })

  it('reads Sun and Saturn together in the 10th as digbala with a hybrid track', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Su', 10, 'enemy'),
        g('Sa', 10, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 4, 'friend'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)
    const ids = reading!.yogas.map(y => y.id)
    expect(ids).toContain('digbala-sun')
    expect(ids).toContain('sun-saturn')
    expect(reading!.track.id).toBe('hybrid')
  })

  it('delivers a service career when the birth chart, Navamsha, and Dashamsha agree', () => {
    const reading = analyzeCareerProfession(serviceChart(), AS_OF)!
    expect(reading.advanced.delivery.verdict).toBe('The career can be delivered.')
    expect(reading.advanced.delivery.tone).toBe('supportive')
    expect(reading.advanced.chain.steps.map(s => s.planet)).toEqual(['Saturn'])
    expect(reading.advanced.chain.steps[0].reading).toMatch(/keeps the profession/)
    expect(reading.advanced.strength.rows[0].planet).toBe('Saturn')
    expect(reading.advanced.ladder.rows.map(r => r.varga)).toEqual(['D1', 'D9', 'D10'])
    expect(reading.advanced.ladder.closing).toMatch(/repeats Capricorn/)
    expect(reading.advanced.prosperity.notes.find(n => n.id === 'gains')!.answer).toBe('One planet')
    expect(reading.brief.plain).toContain('The career can be delivered.')
  })

  it('names strength when Shadbala, bindus, and Bhava Bala support the 10th', () => {
    const reading = analyzeCareerProfession({
      ...serviceChart(),
      shadbala: {
        planets: {
          Sa: {
            id: 'Sa',
            ratio: 1.4,
            isStrong: true,
            qualityBand: 'excellent',
            componentShash: { sthana: 200, dig: 40, kala: 30, chesta: 20, naisargika: 10, drik: 15 },
          },
        },
        strongest: 'Sa',
        weakest: 'Mo',
      },
      ashtakavarga: {
        sav: [0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0],
        savTotal: 32,
        bav: { Sa: { planet: 'Sa', bindus: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0], total: 5 } },
      },
      bhavaBala: {
        houses: { 10: { house: 10, rashi: 10, totalRupa: 8.2, isStrong: true } },
        strongestHouse: 10,
        weakestHouse: 8,
      },
      vimsopaka: {
        planets: { Sa: { id: 'Sa', dashavarga: 16.5, strength: 'strong' } },
        strongest: 'Sa',
        weakest: 'Mo',
      },
    } as unknown as ChartOutput, AS_OF)!
    expect(reading.advanced.delivery.votes.map(v => v.id)).toEqual(
      expect.arrayContaining(['shadbala', 'bhava', 'sav']),
    )
    expect(reading.advanced.strength.rows.find(r => r.id === 'tenthLord')!.shadbala).toMatch(/1\.40/)
    expect(reading.advanced.strength.rows.find(r => r.id === 'tenthLord')!.shadbala).toMatch(/position/)
    expect(reading.advanced.strength.rows.find(r => r.id === 'tenthLord')!.vimsopaka).toMatch(/16\.5/)
    const tenth = reading.advanced.strength.houses.find(h => h.house === 10)!
    expect(tenth.bindus).toBe(32)
    expect(tenth.reading).toMatch(/5 bindus/)
  })

  it('walks the dispositor chain from a debilitated 10th lord', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Sa', 1, 'debilitated'),
        g('Ma', 5, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)!
    expect(reading.advanced.chain.steps.map(s => s.planet)).toEqual(['Saturn', 'Mars', 'Sun'])
    expect(reading.advanced.chain.steps[2].reading).toMatch(/keeps the profession/)
    expect(reading.advanced.delivery.verdict).toBe('The title is harder to cash.')
  })

  it('closes the dispositor chain when it returns to an earlier planet', () => {
    const reading = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Sa', 2, 'neutral'),
        g('Ve', 10, 'friend'),
        g('Ma', 1, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)!
    expect(reading.advanced.chain.steps.map(s => s.planet)).toEqual(['Saturn', 'Venus'])
    expect(reading.advanced.chain.steps[1].reading).toMatch(/Saturn is already in this chain/)
  })

  it('reads a Yogi on the 10th and a KP sub-lord that can fructify the career', () => {
    const reading = analyzeCareerProfession({
      ...serviceChart(),
      yogiPoint: {
        yogiRashi: 10,
        yogiGraha: 'Ju',
        avayogiRashi: 6,
        avayogiGraha: 'Me',
      },
      kp: {
        cusps: [{
          house: 10,
          signLord: 'Sa',
          starLord: 'Ma',
          subLord: 'Me',
          subSubLord: 'Ve',
          degree: 12,
          rashi: 10,
        }],
        significators: { houseSignificators: {}, planetSignificators: {} },
        rulingPlanets: {
          dayLord: 'Su',
          moonStarLord: 'Mo',
          moonSignLord: 'Mo',
          lagnaStarLord: 'Ke',
          lagnaSignLord: 'Ma',
        },
      },
    } as unknown as ChartOutput, AS_OF)!
    expect(reading.advanced.prosperity.notes.find(n => n.id === 'yogi')!.tone).toBe('supportive')
    expect(reading.advanced.prosperity.notes.find(n => n.id === 'avayogi')!.answer).toMatch(/Mercury/)
    expect(reading.advanced.prosperity.notes.find(n => n.id === 'kp-sub')!.tone).toBe('supportive')
    expect(reading.advanced.prosperity.notes.find(n => n.id === 'kp-sub')!.reading).toMatch(/sub-lord/)
  })

  it('names a start in the 10th, and refuses a designed career break, on the service chart', () => {
    const turns = analyzeCareerProfession(serviceChart(), AS_OF)!.advanced.turns
    expect(turns.notes.map(n => n.id)).toEqual([
      'start', 'break', 'transformation', 'opportunity', 'rise', 'ending', 'return',
    ])
    expect(turns.notes.find(n => n.id === 'start')!.answer).toBe('The career starts in the 10th itself.')
    expect(turns.notes.find(n => n.id === 'start')!.reading).toMatch(/Saturn mahadasha/)
    expect(turns.notes.find(n => n.id === 'break')!.answer).toBe('A career break is not built into this chart.')
    expect(turns.notes.find(n => n.id === 'transformation')!.answer).toBe('The profession keeps its nature.')
    expect(turns.notes.find(n => n.id === 'opportunity')!.reading).toMatch(/same profession/)
    expect(turns.notes.find(n => n.id === 'rise')!.answer).toMatch(/same field/)
    expect(turns.notes.find(n => n.id === 'return')!.answer).toBe('No fall here needs a comeback.')
  })

  it('reads a career break when the 10th lord is in the 12th and Ketu holds the 10th', () => {
    const turns = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Sa', 12, 'neutral'),
        g('Ke', 10),
        g('Ra', 4),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 8, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
      ],
    }), AS_OF)!.advanced.turns
    expect(turns.notes.find(n => n.id === 'break')!.answer).toBe('A career break belongs in this life.')
    expect(turns.notes.find(n => n.id === 'break')!.tone).toBe('caution')
    expect(turns.notes.find(n => n.id === 'start')!.answer).toBe('The career starts away from the first plan.')
    expect(turns.headline).toMatch(/break/i)
  })

  it('reads a transformation and an ending when the 10th lord is in the 8th', () => {
    const turns = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Sa', 8, 'neutral'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 11),
        g('Ke', 5),
      ],
    }), AS_OF)!.advanced.turns
    expect(turns.notes.find(n => n.id === 'transformation')!.answer).toBe('The profession transforms.')
    expect(turns.notes.find(n => n.id === 'start')!.answer).toBe('The career starts by breaking the first plan.')
    expect(turns.notes.find(n => n.id === 'ending')!.answer).toBe('A chapter of the career can close.')
    expect(turns.notes.find(n => n.id === 'return')!.reading).toMatch(/Jupiter/)
  })

  it('reads a new opportunity when the 10th lord sits in the 11th', () => {
    const turns = analyzeCareerProfession(chart({
      asc: 1,
      grahas: [
        g('Sa', 11, 'own'),
        g('Ju', 9, 'own'),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 3, 'own'),
        g('Ve', 2, 'own'),
        g('Ra', 6),
        g('Ke', 12),
      ],
    }), AS_OF)!.advanced.turns
    expect(turns.notes.find(n => n.id === 'start')!.answer).toBe('The career starts through a gain.')
    expect(turns.notes.find(n => n.id === 'opportunity')!.answer).toBe('A new opportunity is a real door.')
    expect(turns.notes.find(n => n.id === 'opportunity')!.tone).toBe('supportive')
  })

  it('marks a Ketu mahadasha off the career as poor for career', () => {
    const tracker = analyzeCareerProfession(chart({
      asc: 1,
      dashaLord: 'Ke',
      grahas: [
        g('Sa', 10, 'own'),
        g('Ke', 12),
        g('Ra', 6),
        g('Su', 5, 'own'),
        g('Mo', 4, 'own'),
        g('Ma', 1, 'own'),
        g('Me', 6, 'own'),
        g('Ju', 9, 'own'),
        g('Ve', 2, 'own'),
      ],
    }), AS_OF)!.tracker
    expect(tracker.mahas[0]?.fit).toBe('poor')
    expect(tracker.mahas[0]?.label).toBe('Poor for career')
    expect(tracker.headline).toMatch(/Ketu mahadasha is poor for career/)
  })

  it('zooms the live antardasha into pratyantardasha and sookshma', () => {
    const tracker = analyzeCareerProfession(chart({
      asc: 1,
      pratyantarLord: 'Sa',
      sookshmaLord: 'Ve',
      grahas: serviceChart().grahas,
    }), AS_OF)!.tracker
    const livePd = tracker.pratyantars.find(s => s.live)
    const liveSk = tracker.sookshmas.find(s => s.live)
    expect(livePd?.lord).toBe('Saturn')
    expect(livePd?.level).toBe('pratyantardasha')
    expect(livePd?.fit).toBe('good')
    expect(livePd?.label).toBe('Good for career')
    expect(tracker.pratyantarNowShare).not.toBeNull()
    expect(tracker.pratyantarWindow).toMatch(/Mercury antardasha/)
    expect(liveSk?.lord).toBe('Venus')
    expect(liveSk?.level).toBe('sookshma')
    expect(liveSk?.fit).toBe('good')
    expect(tracker.headline).toMatch(/Pratyantardasha Saturn is good for career/)
    expect(tracker.headline).toMatch(/Sookshma Venus is good for career/)
    expect(tracker.nowLabel).toMatch(/pratyantardasha/)
  })

  it('reads slow transits on the career houses without an ephemeris', () => {
    const sky = readCareerTransits(serviceChart(), [
      { id: 'Ju', rashi: 10 },
      { id: 'Su', rashi: 10 },
      { id: 'Sa', rashi: 12, isRetro: true },
      { id: 'Ma', rashi: 6 },
      { id: 'Ra', rashi: 11 },
      { id: 'Ke', rashi: 8 },
    ])
    expect(sky.available).toBe(true)
    expect(sky.hits.find(h => h.planet === 'Jupiter')?.fit).toBe('good')
    expect(sky.hits.find(h => h.planet === 'Sun')?.fit).toBe('good')
    expect(sky.hits.find(h => h.planet === 'Saturn')?.fit).toBe('poor')
    expect(sky.hits.find(h => h.planet === 'Saturn')?.retro).toBe(true)
    expect(sky.hits.find(h => h.planet === 'Saturn')?.reading).toMatch(/retrograde/)
    expect(sky.hits.find(h => h.planet === 'Ketu')?.fit).toBe('poor')
    expect(sky.hits.find(h => h.planet === 'Mars')?.fit).toBe('mixed')
    expect(sky.headline).toMatch(/Jupiter in house 10/)
    expect(sky.headline).toMatch(/poor for career/)
    expect(readCareerTransits(serviceChart(), []).available).toBe(false)
  })

  it('reads argala on the 10th and the room around the post', () => {
    const support = analyzeCareerProfession(serviceChart(), AS_OF)!.advanced.support
    expect(support.headline).toBe('The career has support from outside the 10th.')
    expect(support.tone).toBe('supportive')
    expect(support.argala.find(n => n.id === 'resources')).toMatchObject({ answer: 'Stands', tone: 'supportive' })
    expect(support.argala.find(n => n.id === 'resources')!.reading).toMatch(/Rahu/)
    expect(support.argala.find(n => n.id === 'foundation')!.answer).toBe('Empty')
    expect(support.argala.find(n => n.id === 'fruit')!.reading).toMatch(/Mars/)
    expect(support.argala.find(n => n.id === 'promotion')!.answer).toBe('Stands')
    expect(support.room.find(n => n.id === 'cost')!.answer).toBe('The cost of the work stays off the 10th.')
    expect(support.room.find(n => n.id === 'rival')!.answer).toBe('The rival sees the profession.')
  })

  it('names a blocked argala, a rival inside the post, and the wealth point', () => {
    const support = analyzeCareerProfession(chart({
      asc: 1,
      ak: 'Su',
      amk: 'Sa',
      indu: 270,
      grahas: [
        g('Ra', 11),
        g('Ke', 9),
        g('Sa', 2, 'neutral'),
        g('Mo', 6, 'neutral'),
        g('Me', 10, 'neutral'),
        g('Su', 7, 'debilitated'),
        g('Ve', 4, 'own'),
        g('Ma', 5, 'friend'),
        g('Ju', 3, 'own'),
      ],
    }), AS_OF)!.advanced.support
    expect(support.headline).toBe('Outside help to the career is blocked.')
    expect(support.argala.find(n => n.id === 'resources')!.answer).toBe('Ketu blocks it')
    expect(support.argala.find(n => n.id === 'promotion')!.answer).toBe('Blocked')
    expect(support.room.find(n => n.id === 'rival')!.answer).toBe('Rivals sit inside the profession.')
    expect(support.room.find(n => n.id === 'signature')!.answer).toBe('The signature is hard to hold.')
    expect(support.room.find(n => n.id === 'indu')!.answer).toBe('Wealth from work falls in house 10.')
    expect(support.room.find(n => n.id === 'minister')!.answer).toMatch(/agree/)
  })
})
