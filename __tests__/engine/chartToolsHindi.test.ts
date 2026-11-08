// __tests__/engine/chartToolsHindi.test.ts
// Hindi output for the chart tools (Interpretation hub, Tattva, Naamkaran,
// Tajika): every English entry has Hindi, ids/numbers match, text is Devanagari.

import { describe, it, expect, beforeAll } from 'vitest'
import { calculateChart } from '@/lib/engine/calculator'
import { buildInterpretationHub } from '@/lib/engine/interpretationHub'
import { analyzeTattvaPrediction, analyzeTattvaDashaOverlay, composeHouseRemedy, dashaEnergyLabel } from '@/lib/engine/tattvaPrediction'
import {
  AKSHAR_CHAKRA,
  ISHTA_BY_RASHI,
  PLANET_VARGA,
  analyzeNaamkaran,
  localizeNaamkaran,
  naamSoundDe,
  naamkaranMotionLabel,
} from '@/lib/engine/naamkaran'
import { tajikaYogaText } from '@/lib/engine/tajika'
import { AKSHAR_CHAKRA_DE, ISHTA_TEXT_HI, VARGA_HI } from '@/lib/engine/locale/naamkaran.hi'
import { HUB_RASHI_HI, HUB_SATURN_FROM_MOON_HI, HUB_SECTION_HI } from '@/lib/engine/locale/interpretationHub.hi'
import {
  AGNI_COPY_HI,
  HOUSE_KARAKA_THEMES_HI,
  KARAKA_PRACTICE_HI,
  MONEY_COPY_HI,
  RASHI_FIRST_REMEDY_HI,
  TRI_DEF_HI,
} from '@/lib/engine/locale/tattvaPrediction.hi'
import type { ChartOutput } from '@/types/astrology'
import type { TransitPosition } from '@/lib/engine/transits'

const DEVANAGARI = /[ऀ-ॿ]/

let chart: ChartOutput
const NOW = Date.UTC(2026, 10, 7)

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Test',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    utcDate: '1990-05-15',
    utcTime: '05:00:00',
    birthPlace: 'New Delhi',
    latitude: 28.61,
    longitude: 77.21,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
})

const positions: TransitPosition[] = [
  { planetId: 'Su', sign: 7, house: 1, nakshatra: 'Swati', pada: 2, isRetro: false },
  { planetId: 'Mo', sign: 3, house: 9, nakshatra: 'Ardra', pada: 1, isRetro: false },
  { planetId: 'Ma', sign: 8, house: 2, nakshatra: 'Anuradha', pada: 3, isRetro: false },
  { planetId: 'Me', sign: 8, house: 2, nakshatra: 'Vishakha', pada: 4, isRetro: true },
  { planetId: 'Ju', sign: 4, house: 10, nakshatra: 'Pushya', pada: 1, isRetro: true },
  { planetId: 'Ve', sign: 7, house: 1, nakshatra: 'Chitra', pada: 3, isRetro: false },
  { planetId: 'Sa', sign: 12, house: 6, nakshatra: 'Purva Bhadrapada', pada: 4, isRetro: true },
  { planetId: 'Ra', sign: 11, house: 5, nakshatra: 'Purva Bhadrapada', pada: 1, isRetro: true },
  { planetId: 'Ke', sign: 5, house: 11, nakshatra: 'Purva Phalguni', pada: 3, isRetro: true },
]

describe('Hindi tables cover every English entry', () => {
  it('tattva tables', () => {
    expect(Object.keys(TRI_DEF_HI).sort()).toEqual(['artha', 'dharma', 'kama', 'moksha'])
    expect(Object.keys(AGNI_COPY_HI).sort()).toEqual(['purpose', 'survival', 'sustenance'])
    expect(Object.keys(MONEY_COPY_HI).sort()).toEqual(['grind', 'lineage', 'peak_karma'])
    expect(Object.keys(KARAKA_PRACTICE_HI).sort()).toEqual(['Ju', 'Ke', 'Ma', 'Me', 'Mo', 'Ra', 'Sa', 'Su', 'Ve'])
    for (let h = 1; h <= 12; h++) {
      expect(HOUSE_KARAKA_THEMES_HI[h]).toMatch(DEVANAGARI)
      expect(RASHI_FIRST_REMEDY_HI[h as 1]).toMatch(DEVANAGARI)
      expect(HUB_RASHI_HI[h as 1].core).toMatch(DEVANAGARI)
      expect(HUB_RASHI_HI[h as 1].lord).toMatch(DEVANAGARI)
    }
  })

  it('hub tables', () => {
    expect(Object.keys(HUB_SECTION_HI).sort()).toEqual(['dasha', 'houses', 'overview', 'planets', 'rashis', 'strength', 'transit'])
    expect(Object.keys(HUB_SATURN_FROM_MOON_HI).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 4, 8, 12])
  })

  it('naamkaran tables', () => {
    expect(AKSHAR_CHAKRA_DE.length).toBe(AKSHAR_CHAKRA.length)
    for (const row of AKSHAR_CHAKRA_DE) expect(row.length).toBe(4)
    for (const v of Object.values(PLANET_VARGA)) expect(VARGA_HI[v.varga]).toMatch(DEVANAGARI)
    for (const v of Object.values(ISHTA_BY_RASHI)) {
      expect(ISHTA_TEXT_HI[v.ishta]).toMatch(DEVANAGARI)
      expect(ISHTA_TEXT_HI[v.sahasranama]).toMatch(DEVANAGARI)
    }
    for (let i = 0; i < 27; i++) for (let p = 1; p <= 4; p++) expect(naamSoundDe(AKSHAR_CHAKRA[i]![p - 1]!, i, p)).toMatch(DEVANAGARI)
    for (const m of ['char', 'sthir', 'dwiswabhav'] as const) expect(naamkaranMotionLabel(m, 'hi')).toMatch(DEVANAGARI)
  })
})

describe('Shared corpora tables', () => {
  it('cover every English source string', async () => {
    const { RASHI_PROFILES, rashiProfileText } = await import('@/lib/engine/rashiInterpretations')
    for (const r of Object.values(RASHI_PROFILES)) {
      for (const t of [...r.coreNature, ...r.lordNotes, ...Object.values(r.inHouse), ...r.remedies, ...r.specialRules]) {
        expect(rashiProfileText(t, 'hi'), t).toMatch(DEVANAGARI)
      }
    }
    const { SIGN_INTERPRETATIONS } = await import('@/lib/engine/interpretations')
    const { SIGN_TEXT_HI } = await import('@/lib/engine/locale/signInterpretations.hi')
    for (const row of Object.values(SIGN_INTERPRETATIONS)) for (const t of Object.values(row)) expect(SIGN_TEXT_HI[t], t).toMatch(DEVANAGARI)
    const ci = await import('@/lib/engine/classicalInterpretations')
    for (const g of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']) {
      for (let n = 1; n <= 12; n++) {
        for (const note of [...ci.getPlanetInHouseClassical(g, n), ...ci.getPlanetInSignClassical(g, n), ...ci.getHouseClassical(n), ...ci.getRashiClassical(n)]) {
          expect(ci.classicalTextHi(note.text), note.text).toMatch(DEVANAGARI)
        }
        for (const span of [3, 4, 5, 7, 8, 9, 10]) {
          const a = ci.getAspectClassicalNote(g, n, ((n + span - 2) % 12) + 1, span)
          if (a) expect(ci.classicalTextHi(a.text), a.text).toMatch(DEVANAGARI)
        }
      }
    }
    const { SAHASRANAMA_NAME_DE } = await import('@/lib/engine/locale/naamkaran.hi')
    const { naamDisplayName } = await import('@/lib/engine/naamkaran')
    for (const n of Object.keys(SAHASRANAMA_NAME_DE)) expect(naamDisplayName(n, 'hi')).toMatch(DEVANAGARI)
  })
})

describe('Interpretation hub in Hindi', () => {
  it('keeps ids, tones and counts; translates labels and titles', () => {
    const en = buildInterpretationHub(chart, positions, NOW)
    const hi = buildInterpretationHub(chart, positions, NOW, 'hi')
    expect(buildInterpretationHub(chart, positions, NOW, 'en')).toEqual(en)
    expect(hi.map((s) => s.id)).toEqual(en.map((s) => s.id))
    for (const [i, s] of hi.entries()) {
      const e = en[i]!
      expect(s.label).toMatch(DEVANAGARI)
      expect(s.intro).toMatch(DEVANAGARI)
      expect(s.items.map((x) => x.id)).toEqual(e.items.map((x) => x.id))
      expect(s.items.map((x) => x.tone)).toEqual(e.items.map((x) => x.tone))
      for (const [j, item] of s.items.entries()) {
        // Planet mix layers swap in one Hindi paragraph where English lists several.
        if (s.id !== 'planets') expect(item.points.length, item.id).toBe(e.items[j]!.points.length)
        expect(item.title, item.id).toMatch(DEVANAGARI)
        for (const p of item.points) if (p.label) expect(p.label, `${item.id} label`).toMatch(DEVANAGARI)
      }
    }
    // Every point and summary is Devanagari now that the shared corpora have Hindi.
    const english: string[] = []
    for (const s of hi) for (const item of s.items) {
      if (item.summary && !DEVANAGARI.test(item.summary)) english.push(`${item.id} summary: ${item.summary}`)
      for (const p of item.points) if (/[A-Za-z]{3,}/.test(p.text) && !DEVANAGARI.test(p.text)) english.push(`${item.id}: ${p.text}`)
    }
    expect(english).toEqual([])
    const planets = hi.find((s) => s.id === 'planets')!
    for (const item of planets.items) expect(item.summary).toMatch(DEVANAGARI)
  })
})

describe('Tattva prediction in Hindi', () => {
  it('matches English structure and is Devanagari', () => {
    const base = { grahas: chart.grahas, ascRashi: chart.lagnas.ascRashi, dashaNodes: chart.dashas?.vimshottari, d10Grahas: chart.vargas?.D10, d10Asc: chart.vargaLagnas?.D10, now: new Date(NOW) }
    const en = analyzeTattvaPrediction(base)!
    const hi = analyzeTattvaPrediction({ ...base, lang: 'hi' })!
    expect(analyzeTattvaPrediction({ ...base, lang: 'en' })).toEqual(en)
    expect(hi.dominantTrikona).toBe(en.dominantTrikona)
    expect(hi.trikonas.map((t) => [t.id, t.planetCount])).toEqual(en.trikonas.map((t) => [t.id, t.planetCount]))
    expect(hi.money.map((m) => [m.mode, m.planetCount, m.dominant])).toEqual(en.money.map((m) => [m.mode, m.planetCount, m.dominant]))
    expect(hi.houseRemedies.map((h) => [h.house, h.rashi, h.tone])).toEqual(en.houseRemedies.map((h) => [h.house, h.rashi, h.tone]))
    expect(hi.remedies.map((r) => r.id)).toEqual(en.remedies.map((r) => r.id))
    expect(hi.headlines.length).toBe(en.headlines.length)
    const texts = [
      hi.educationalNote, hi.agni.label, hi.agni.detail, hi.network.headline, hi.network.detail, hi.moksha.headline,
      hi.moksha.detail, hi.predictModeNote, hi.lifeStability.headline, hi.lifeStability.d1.note, hi.dashaFlavor.spiceNote,
      ...hi.headlines, ...hi.trikonas.flatMap((t) => [t.label, t.sanskrit, t.headline, t.detail]),
      ...hi.money.flatMap((m) => [m.label, m.detail]), ...hi.remedies.flatMap((r) => [r.title, r.text]),
      ...hi.dashaFlavor.levels.flatMap((l) => [l.note, l.lordName]),
      ...hi.houseRemedies.flatMap((h) => [h.priorityReason, h.synthesis, h.strands.house, h.strands.karaka, h.strands.rashi, h.rashiName, h.houseThemes]),
    ]
    for (const t of texts) expect(t).toMatch(DEVANAGARI)
    for (let h = 1; h <= 12; h++) {
      const pack = composeHouseRemedy({ house: h, grahas: chart.grahas, ascRashi: chart.lagnas.ascRashi, lang: 'hi' })!
      expect(pack.synthesis).toMatch(DEVANAGARI)
      if (pack.tenthCareerNote) expect(pack.tenthCareerNote).toMatch(DEVANAGARI)
    }
    const overlay = analyzeTattvaDashaOverlay(chart.grahas, chart.dashas?.vimshottari, new Date(NOW), 'hi')!
    expect(overlay.predictModeNote).toMatch(DEVANAGARI)
    expect(dashaEnergyLabel('active', 'hi')).toMatch(DEVANAGARI)
    expect(dashaEnergyLabel('active')).toBe('Active')
  })
})

describe('Naamkaran in Hindi', () => {
  it('keeps sounds and counts; summaries are Devanagari', () => {
    const en = analyzeNaamkaran(chart)!
    expect(localizeNaamkaran(en, 'en')).toBe(en)
    const hi = localizeNaamkaran(en, 'hi')
    expect(hi.classical?.sound).toBe(en.classical?.sound)
    expect(hi.classical?.syllableCount).toBe(en.classical?.syllableCount)
    expect(hi.candidates.map((c) => [c.sound, c.nakshatraIndex, c.pada, c.house])).toEqual(en.candidates.map((c) => [c.sound, c.nakshatraIndex, c.pada, c.house]))
    expect(hi.suggestions.map((s) => s.name)).toEqual(en.suggestions.map((s) => s.name))
    const texts = [
      hi.methodNote, hi.validation.summary, hi.classical!.summary, hi.classical!.moonRashiName, hi.classical!.letter.nakshatraName,
      hi.strongest.name, hi.rashiNaam!.summary, hi.rashiNaam!.methodNote, hi.twoName!.methodNote,
      hi.twoName!.janma!.title, hi.twoName!.janma!.basis, hi.twoName!.vyavahara!.summary,
      hi.session!.summary, hi.session!.methodNote, ...hi.relevantPlanets.map((p) => p.role), ...hi.vargaLetters.map((v) => v.varga),
      ...(hi.katapayadi ? [hi.katapayadi.summary] : []), ...(hi.ishta ? [hi.ishta.ishta, hi.ishta.sahasranama] : []),
      ...(hi.navtara ? hi.navtara.hardNakshatras : []),
    ]
    for (const t of texts) expect(t).toMatch(DEVANAGARI)
  })
})

describe('Tajika in Hindi', () => {
  it('rebuilds yoga text from ids', () => {
    const y = { name: 'Ithasala', graha1: 'Mo' as const, graha2: 'Sa' as const, type: 'auspicious' as const, description: 'Mo (fast) is applying to Sa (slow) — results indicated shortly.' }
    expect(tajikaYogaText(y)).toEqual({ name: 'Ithasala', typeLabel: 'AUSPICIOUS', aspecting: 'Mo aspecting Sa.', description: y.description })
    const hi = tajikaYogaText(y, 'hi')
    for (const v of Object.values(hi)) expect(v).toMatch(DEVANAGARI)
  })
})
