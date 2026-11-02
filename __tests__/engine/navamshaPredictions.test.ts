// ─────────────────────────────────────────────────────────────
//  __tests__/engine/navamshaPredictions.test.ts
//  D9 sign knowledge base + advanced navamsha prediction rules
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { buildNavamshaPredictions } from '@/lib/engine/navamshaPredictions'
import { NAVAMSHA_DASHA_NOTE } from '@/lib/engine/navamshaSignKnowledge'
import {
  ATMAKARAKA_IN_NAVAMSHA,
  NAVAMSHA_SIGNS,
  SOURCE_SIGN_GENERIC,
} from '@/lib/engine/navamshaSignKnowledge'
import type { NavamshaAnalysis } from '@/lib/engine/navamshaAnalysis'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import type { Dignity, GrahaId, Rashi } from '@/types/astrology'

const ALL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

interface Spec { id: GrahaId; d1: Rashi; d9: Rashi; d1Dig?: Dignity; d9Dig?: Dignity; deg?: number }

function stubAnalysis(d1Asc: Rashi, d9Asc: Rashi, specs: Spec[], ak: GrahaId, dashaLords: GrahaId[] = []): NavamshaAnalysis {
  const house = (asc: Rashi, r: Rashi) => ((r - asc + 12) % 12) + 1
  const planets = specs.map((s) => ({
    id: s.id,
    name: GRAHA_NAMES[s.id],
    d1Rashi: s.d1,
    d1RashiName: RASHI_NAMES[s.d1],
    d1Degree: s.deg ?? 10,
    d1House: house(d1Asc, s.d1),
    d9Rashi: s.d9,
    d9RashiName: RASHI_NAMES[s.d9],
    d9House: house(d9Asc, s.d9),
    d1Dignity: s.d1Dig ?? 'neutral',
    d9Dignity: s.d9Dig ?? 'neutral',
    isVargottama: s.d1 === s.d9,
  }))
  const houses = Array.from({ length: 12 }, (_, i) => {
    const rashi = (((d9Asc - 1 + i) % 12) + 1) as Rashi
    return {
      house: i + 1,
      rashi,
      rashiName: RASHI_NAMES[rashi],
      occupants: planets.filter((p) => p.d9Rashi === rashi).map((p) => ({ id: p.id })),
    }
  })
  return {
    d9Lagna: d9Asc,
    d9LagnaName: RASHI_NAMES[d9Asc],
    atmakaraka: ak,
    planets,
    houses,
    dashaOverlay: dashaLords.length
      ? { lords: dashaLords.map((lord, i) => ({ lord, levelLabel: i === 0 ? 'Maha' : 'Antar' })) }
      : null,
  } as unknown as NavamshaAnalysis
}

describe('navamsha sign knowledge base', () => {
  it('holds the Aries navamsha lecture across planets, sources and houses', () => {
    const aries = NAVAMSHA_SIGNS[1]
    expect(aries.essence).toMatch(/fruit/i)
    expect(aries.planets.Su).toContain('Exalted Sun')
    expect(aries.fromSign?.[1]).toMatch(/vargottama/i)
    expect(aries.fromSign?.[6]).toMatch(/Virgo/)
    expect(aries.fromSign?.[8]).toMatch(/Scorpio/)
    expect(aries.fromSign?.[12]).toMatch(/Pisces/)
    for (let h = 1; h <= 12; h++) expect(aries.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
    expect(NAVAMSHA_DASHA_NOTE[1]).toMatch(/freeze/i)
  })

  it('holds the Taurus navamsha lecture across planets, sources and houses', () => {
    const taurus = NAVAMSHA_SIGNS[2]
    expect(taurus.essence).toMatch(/resource/i)
    expect(taurus.planets.Mo).toMatch(/storehouse/i)
    expect(taurus.planets.Ve).toMatch(/seed/i)
    expect(taurus.fromSign?.[2]).toMatch(/Vargottama/)
    expect(taurus.fromSign?.[4]).toMatch(/does not/i)
    expect(taurus.fromSign?.[8]).toMatch(/does not/i)
    expect(taurus.fromSign?.[12]).toMatch(/does not/i)
    for (let h = 1; h <= 12; h++) expect(taurus.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Gemini navamsha lecture across planets, sources and houses', () => {
    const gemini = NAVAMSHA_SIGNS[3]
    expect(gemini.essence).toMatch(/reaction/i)
    expect(gemini.planets.Ke).toMatch(/batches/i)
    expect(gemini.planets.Mo).toMatch(/tears|appreciation/i)
    expect(gemini.fromSign?.[3]).toMatch(/Vargottama/)
    expect(gemini.fromSign?.[4]).toMatch(/does not/i)
    expect(gemini.fromSign?.[8]).toMatch(/does not/i)
    expect(gemini.fromSign?.[12]).toMatch(/does not/i)
    for (let h = 1; h <= 12; h++) expect(gemini.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Cancer navamsha lecture across planets, sources and houses', () => {
    const cancer = NAVAMSHA_SIGNS[4]
    expect(cancer.essence).toMatch(/absorb/i)
    expect(cancer.planets.Ju).toMatch(/exalt/i)
    expect(cancer.planets.Ma).toMatch(/breath/i)
    expect(cancer.fromSign?.[4]).toMatch(/Vargottama/)
    expect(cancer.fromSign?.[3]).toMatch(/does not/i)
    expect(cancer.fromSign?.[7]).toMatch(/does not/i)
    expect(cancer.fromSign?.[11]).toMatch(/does not/i)
    for (let h = 1; h <= 12; h++) expect(cancer.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Leo navamsha lecture across planets, sources and houses', () => {
    const leo = NAVAMSHA_SIGNS[5]
    expect(leo.essence).toMatch(/territory|authority|chair/i)
    expect(leo.planets.Su).toMatch(/compromise|chair|ego/i)
    expect(leo.planets.Sa).toMatch(/bench|trainer|inferior/i)
    expect(leo.fromSign?.[5]).toMatch(/show|phalguna|fertile|punya/i)
    expect(leo.fromSign?.[3]).toMatch(/does not/i)
    expect(leo.fromSign?.[7]).toMatch(/does not/i)
    expect(leo.fromSign?.[11]).toMatch(/does not/i)
    for (let h = 1; h <= 12; h++) expect(leo.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Virgo navamsha lecture across planets, sources and houses', () => {
    const virgo = NAVAMSHA_SIGNS[6]
    expect(virgo.essence).toMatch(/speed limiter/i)
    expect(virgo.essence).toMatch(/Nothing is denied/)
    expect(virgo.planets.Me).toMatch(/^Exalted/)
    expect(virgo.planets.Ve).toMatch(/^Debilitated/)
    expect(virgo.fromSign?.[6]).toMatch(/vargottama service/i)
    expect(virgo.fromSign?.[3]).toMatch(/does not/i)
    expect(virgo.fromSign?.[7]).toMatch(/does not/i)
    expect(virgo.fromSign?.[11]).toMatch(/does not/i)
    for (let h = 1; h <= 12; h++) expect(virgo.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Libra navamsha lecture across planets, sources and houses', () => {
    const libra = NAVAMSHA_SIGNS[7]
    expect(libra.essence).toMatch(/heaven/i)
    expect(libra.essence).toMatch(/two people/i)
    expect(libra.planets.Sa).toMatch(/[Ee]xalted/)
    expect(libra.planets.Su).toMatch(/[Dd]ebilitated/)
    expect(libra.planets.Ke).toMatch(/[Ff]ilters/)
    expect(libra.fromSign?.[7]).toMatch(/vargottama heaven/i)
    expect(libra.fromSign?.[3]).toMatch(/skill/i)
    expect(libra.fromSign?.[2]).toMatch(/does not/i)
    expect(libra.fromSign?.[6]).toMatch(/does not/i)
    expect(libra.fromSign?.[10]).toMatch(/does not/i)
    for (let h = 1; h <= 12; h++) expect(libra.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Scorpio navamsha lecture across planets, sources and houses', () => {
    const scorpio = NAVAMSHA_SIGNS[8]
    expect(scorpio.title).toMatch(/Transformation/i)
    expect(scorpio.essence).toMatch(/damp|shmashan|sadhaka/i)
    expect(scorpio.essence).toMatch(/Forgive, forget, move on/i)
    expect(scorpio.planets.Mo).toMatch(/[Dd]ebilitated/)
    expect(scorpio.planets.Ke).toMatch(/heartbreak|escap/i)
    expect(scorpio.planets.Su).toMatch(/under anyone|independent/i)
    expect(scorpio.fromSign?.[8]).toMatch(/vargottama|research|agenda/i)
    expect(scorpio.fromSign?.[2]).toMatch(/does not/i)
    expect(scorpio.fromSign?.[6]).toMatch(/does not/i)
    expect(scorpio.fromSign?.[10]).toMatch(/does not/i)
    expect(scorpio.fromElement?.earth).toMatch(/does not/i)
    expect(ATMAKARAKA_IN_NAVAMSHA[8]).toMatch(/Mother|forgive|Moon/i)
    expect(NAVAMSHA_DASHA_NOTE[8]).toMatch(/fear|dampness|Sagittarius/i)
    for (let h = 1; h <= 12; h++) expect(scorpio.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Sagittarius navamsha lecture across planets, sources and houses', () => {
    const sag = NAVAMSHA_SIGNS[9]
    expect(sag.title).toMatch(/Summit/i)
    expect(sag.essence).toMatch(/bhagya|mute|fortune/i)
    expect(sag.essence).toMatch(/Scorpio|Capricorn/i)
    expect(sag.shadow).toMatch(/Nahusha|fall|ting-tong|moral/i)
    expect(sag.planets.Su).toMatch(/[Ff]ather|Rama|Gayatri/i)
    expect(sag.planets.Mo).toMatch(/mute|prasadam|Krishna|paragraph/i)
    expect(sag.planets.Ma).toMatch(/Narasimha|warrior|thigh/i)
    expect(sag.planets.Me).toMatch(/guru|gratitude|rajayoga|mute/i)
    expect(sag.planets.Ju).toMatch(/philosophy|potent|counsellor|monopoly/i)
    expect(sag.planets.Ve).toMatch(/[Ll]oyalty|Lakshmi|Radha/i)
    expect(sag.planets.Sa).toMatch(/mule|orthodox|Jagannath|patience/i)
    expect(sag.planets.Ra).toMatch(/pitri|guru|pirat|shortcut/i)
    expect(sag.planets.Ke).toMatch(/instinct|nimitta|Matsya|sannyasa/i)
    expect(sag.fromSign?.[1]).toMatch(/higher learning|philosophical/i)
    expect(sag.fromSign?.[2]).toMatch(/does not/i)
    expect(sag.fromSign?.[6]).toMatch(/does not/i)
    expect(sag.fromSign?.[10]).toMatch(/does not/i)
    expect(sag.fromSign?.[9]).toMatch(/Uttarashadha|emotion/i)
    expect(sag.fromElement?.earth).toMatch(/does not/i)
    expect(ATMAKARAKA_IN_NAVAMSHA[9]).toMatch(/ridge|Nahusha|bhagya|moral/i)
    expect(NAVAMSHA_DASHA_NOTE[9]).toMatch(/principles|fall|mute|punya/i)
    for (let h = 1; h <= 12; h++) expect(sag.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Capricorn navamsha lecture across planets, sources and houses', () => {
    const cap = NAVAMSHA_SIGNS[10]
    expect(cap.title).toMatch(/Prison|Karma/i)
    expect(cap.essence).toMatch(/bonded|pressure|Jupiter debilitated|opposite Cancer/i)
    expect(cap.shadow).toMatch(/victim|isolation|bonded/i)
    expect(cap.planets.Su).toMatch(/mukhiya|father|authority|territory/i)
    expect(cap.planets.Mo).toMatch(/mother|practical|khichdi|temple/i)
    expect(cap.planets.Ma).toMatch(/exalted|scar|land|Narasimha|accident/i)
    expect(cap.planets.Me).toMatch(/paisa|sibling|critic|history/i)
    expect(cap.planets.Ju).toMatch(/[Dd]ebilitated|happiness|career or health/i)
    expect(cap.planets.Ve).toMatch(/slave|partner|perfume|orthodox/i)
    expect(cap.planets.Sa).toMatch(/own sign|work|IT|core/i)
    expect(cap.planets.Ra).toMatch(/trap|amplif|scam|third-party/i)
    expect(cap.planets.Ke).toMatch(/nishkama|research|middlemen|buttermilk|resign/i)
    expect(cap.fromSign?.[1]).toMatch(/does not/i)
    expect(cap.fromSign?.[5]).toMatch(/does not/i)
    expect(cap.fromSign?.[9]).toMatch(/does not/i)
    expect(cap.fromSign?.[2]).toMatch(/money|slave|family/i)
    expect(cap.fromSign?.[10]).toMatch(/vargottama|Work is God/i)
    expect(cap.fromElement?.fire).toMatch(/does not/i)
    expect(ATMAKARAKA_IN_NAVAMSHA[10]).toMatch(/bonded|Jupiter debilitated|bhakti|victim/i)
    expect(NAVAMSHA_DASHA_NOTE[10]).toMatch(/pressure|bonded|Cancer|victim/i)
    for (let h = 1; h <= 12; h++) expect(cap.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Aquarius navamsha lecture across planets, sources and houses', () => {
    const aq = NAVAMSHA_SIGNS[11]
    expect(aq.title).toMatch(/Merit Bank/i)
    expect(aq.essence).toMatch(/punya|VIP|opposite Leo|artificial/i)
    expect(aq.shadow).toMatch(/obsession|EMI|duplicity|Capricorn|Durga/i)
    expect(aq.planets.Su).toMatch(/[Dd]uplicitous|golden trap|double-engine|I\/me/i)
    expect(aq.planets.Mo).toMatch(/food|Alexa|home|comfort/i)
    expect(aq.planets.Ma).toMatch(/[Tt]har|property|athletic|land/i)
    expect(aq.planets.Me).toMatch(/hype|course|paperwork|connection/i)
    expect(aq.planets.Ju).toMatch(/connection|rich client|social.media|cheat/i)
    expect(aq.planets.Ve).toMatch(/[Ll]ive-in|brand|perfume|luxury/i)
    expect(aq.planets.Sa).toMatch(/struggle|blank|chowkidar|night/i)
    expect(aq.planets.Ra).toMatch(/rumour|DJ|AI|Bitcoin|automat/i)
    expect(aq.planets.Ke).toMatch(/occult|secret|chip|limited edition|anxiety|cortisol/i)
    expect(aq.fromSign?.[1]).toMatch(/does not/i)
    expect(aq.fromSign?.[5]).toMatch(/does not/i)
    expect(aq.fromSign?.[9]).toMatch(/does not/i)
    expect(aq.fromSign?.[2]).toMatch(/resource|desire|10th/i)
    expect(aq.fromSign?.[11]).toMatch(/vargottama/i)
    expect(aq.fromElement?.fire).toMatch(/does not/i)
    expect(ATMAKARAKA_IN_NAVAMSHA[11]).toMatch(/punya|bypass|Leo|merit/i)
    expect(NAVAMSHA_DASHA_NOTE[11]).toMatch(/punya|chunk|back-door|Durga|Varaha|Chaitanya/i)
    for (let h = 1; h <= 12; h++) expect(aq.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('holds the Pisces navamsha lecture across planets, sources and houses', () => {
    const pi = NAVAMSHA_SIGNS[12]
    expect(pi.title).toMatch(/Release/i)
    expect(pi.essence).toMatch(/liberat|Eighth from Leo|Venus is exalted|Mercury is debilitated|dan/i)
    expect(pi.shadow).toMatch(/isolation|betrayal|past|Rahu|Mercury/i)
    expect(pi.planets.Su).toMatch(/feet|Surya|father|isolation|Ramanandi|ego/i)
    expect(pi.planets.Mo).toMatch(/old age|Shiva|Krishna|lullaby|insomnia|mother/i)
    expect(pi.planets.Ma).toMatch(/Aerospace|Hanuman|Bajrangbali|bed|BSF|blood/i)
    expect(pi.planets.Me).toMatch(/irritat|passport|international|historian|fiction|orphan/i)
    expect(pi.planets.Ju).toMatch(/compassionate|bedroom|temple|yajna|guru|feet/i)
    expect(pi.planets.Ve).toMatch(/[Ee]xalted|devotion|chandan|tyaga|quality/i)
    expect(pi.planets.Sa).toMatch(/sannyasi|Shiva|night|guilt|Food for Life|full-stack|teak/i)
    expect(pi.planets.Ra).toMatch(/pitri|investor|Starlink|package|open-source|dating/i)
    expect(pi.planets.Ke).toMatch(/Giriraj|insomnia|chandan|bedroom|Brahma-bhuta|feet/i)
    expect(pi.fromSign?.[1]).toMatch(/does not/i)
    expect(pi.fromSign?.[5]).toMatch(/does not/i)
    expect(pi.fromSign?.[9]).toMatch(/does not/i)
    expect(pi.fromSign?.[2]).toMatch(/Sati|Nandi|give/i)
    expect(pi.fromSign?.[7]).toMatch(/divorce/i)
    expect(pi.fromSign?.[12]).toMatch(/vargottama|Revati|Baitarani/i)
    expect(pi.fromElement?.fire).toMatch(/does not/i)
    expect(ATMAKARAKA_IN_NAVAMSHA[12]).toMatch(/alone|God|Mercury is debilitated|Venus is exalted|Fire/i)
    expect(NAVAMSHA_DASHA_NOTE[12]).toMatch(/liberation|feet|Mercury|Venus|Libra|dan|Eighth-from-Leo/i)
    for (let h = 1; h <= 12; h++) expect(pi.inHouse?.[h], `D9 house ${h}`).toBeTruthy()
  })

  it('covers all 12 signs with every planet reading', () => {
    for (let s = 1; s <= 12; s++) {
      const p = NAVAMSHA_SIGNS[s as Rashi]
      expect(p.sign).toBe(s)
      expect(p.essence.length).toBeGreaterThan(40)
      expect(p.remedy.length).toBeGreaterThan(10)
      for (const g of ALL) expect(p.planets[g], `${s}/${g}`).toBeTruthy()
      expect(ATMAKARAKA_IN_NAVAMSHA[s as Rashi]).toBeTruthy()
      expect(SOURCE_SIGN_GENERIC[s as Rashi]).toBeTruthy()
    }
  })
})

describe('buildNavamshaPredictions', () => {
  // D1 Aries lagna, D9 Aries lagna
  const specs: Spec[] = [
    { id: 'Su', d1: 7, d9: 1, d1Dig: 'debilitated', d9Dig: 'exalted' }, // neecha → ucha
    { id: 'Mo', d1: 2, d9: 2 }, // vargottama Taurus
    { id: 'Ma', d1: 6, d9: 1 }, // from 6th house + Virgo into Aries
    { id: 'Me', d1: 3, d9: 10 },
    { id: 'Ju', d1: 9, d9: 4 },
    { id: 'Ve', d1: 12, d9: 10 },
    { id: 'Sa', d1: 10, d9: 7 }, // Saturn in D9 7th
    { id: 'Ra', d1: 5, d9: 1 }, // Mars–Rahu in Aries navamsha
    { id: 'Ke', d1: 11, d9: 9 }, // 9th from AK (Sun in Aries)
  ]
  const report = buildNavamshaPredictions(stubAnalysis(1, 1, specs, 'Su', ['Ma', 'Ve']), 1)

  it('reads every planet with sign, source and house text', () => {
    expect(report.planets).toHaveLength(9)
    const su = report.planets.find((p) => p.id === 'Su')!
    expect(su.navamshaTitle).toBe('The Battlefield')
    expect(su.signReading).toContain('Exalted Sun')
    expect(su.isAtmakaraka).toBe(true)
    expect(su.lordOf).toEqual([5])
    const mo = report.planets.find((p) => p.id === 'Mo')!
    expect(mo.isVargottama).toBe(true)
    expect(mo.sourceReading).toContain('Vargottama')
  })

  it('flags dasha-active planets', () => {
    expect(report.activeNow.map((p) => p.id).sort()).toEqual(['Ma', 'Ve'])
  })

  it('reads the atmakaraka navamsha with exalted/debilitated qualities', () => {
    expect(report.atmakaraka?.d9Rashi).toBe(1)
    expect(report.atmakaraka?.present?.planet).toBe('Su')
    expect(report.atmakaraka?.missing?.planet).toBe('Sa')
  })

  it('triggers lecture rules', () => {
    const ids = report.rules.map((r) => r.id)
    expect(ids).toContain('combo-Ma-Ra')
    expect(report.rules.find((r) => r.id === 'combo-Ma-Ra')!.title).toContain('Aries')
    expect(ids).toContain('health-aries-Ma')
    expect(ids).toContain('health-virgo-Ma')
    expect(ids).toContain('dig-rise-Su')
    expect(ids).toContain('lagna-Sa-1-7')
    expect(ids).toContain('karaka-ke-9-ak')
    expect(ids).toContain('karaka-ak-ra')
  })

  it('builds 12 sign cards and age markers', () => {
    expect(report.signCards).toHaveLength(12)
    expect(report.signCards[0]!.occupants.sort()).toEqual(['Ma', 'Ra', 'Su'])
    expect(report.ageMarkers.some((m) => m.age === 33 && m.planets.includes('Ve'))).toBe(true)
    expect(report.ageMarkers.map((m) => m.age)).toEqual([...report.ageMarkers.map((m) => m.age)].sort((a, b) => a - b))
  })
})

describe('buildNavamshaPredictions — extended lecture rules', () => {
  // D1 Aries lagna, D9 Cancer lagna
  const specs: Spec[] = [
    { id: 'Su', d1: 1, d9: 5, d1Dig: 'exalted' },
    { id: 'Mo', d1: 4, d9: 4, deg: 0.5 }, // Moon in D1 4th at 0°
    { id: 'Ma', d1: 3, d9: 6 }, // lagna lord with Rahu in Virgo
    { id: 'Me', d1: 6, d9: 7 }, // 3rd/6th lord in Libra with Saturn
    { id: 'Ju', d1: 9, d9: 12 }, // AK in Pisces with Ketu
    { id: 'Ve', d1: 2, d9: 2, d9Dig: 'own' },
    { id: 'Sa', d1: 10, d9: 7 },
    { id: 'Ra', d1: 5, d9: 6 },
    { id: 'Ke', d1: 11, d9: 12 },
  ]
  const report = buildNavamshaPredictions(stubAnalysis(1, 4, specs, 'Ju'), 1, {
    induLagnaLon: 30, // Krittika → Sun, exalted in D1
    strongestGraha: 'Su',
  })
  const ids = report.rules.map((r) => r.id)

  it('adds Mercury fame, Libra and Virgo rules', () => {
    expect(ids).toContain('fame-Me-Sa')
    expect(ids).toContain('combo-Me-Sa')
    expect(report.rules.find((r) => r.id === 'combo-Me-Sa')!.title).toContain('Libra')
    expect(ids).toContain('lord-3-7')
    expect(ids).toEqual(expect.arrayContaining(['virgo-pierce-Ma', 'virgo-pierce-Ra', 'virgo-stitch-Ra', 'lagna-lord-nodes']))
  })

  it('adds house-suppression and node rules', () => {
    expect(ids).toContain('eighth-from-8')
    expect(report.rules.find((r) => r.id === 'node-ke-12th')!.title).toContain('house 8')
    expect(ids).toContain('node-ra-2nd')
  })

  it('adds Taurus/Cancer/Libra guidance', () => {
    expect(ids).toEqual(expect.arrayContaining(['zero-deg-Mo', 'moon-4th-donate', 'venus-clean', 'naming-strongest', 'indu-wealth']))
  })

  it('reads the atmakaraka departure indication', () => {
    const dep = report.rules.find((r) => r.id === 'departure-ak')
    expect(dep?.text).toContain('Ketu')
    expect(dep?.tone).toBe('supportive')
  })

  it('gives each planet a dasha reading from its navamsha', () => {
    for (const p of report.planets) expect(p.dashaReading).toBe(NAVAMSHA_DASHA_NOTE[p.d9Rashi])
  })
})
