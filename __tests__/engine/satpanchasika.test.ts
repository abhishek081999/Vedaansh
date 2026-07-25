// __tests__/engine/satpanchasika.test.ts
// ─────────────────────────────────────────────────────────────
//  Shatpanchasika (Satpanchasika) horary engine tests
//  Source: "Indian Horary Astrology" (V.A.K. Ayer) — Prithuyasas
//
//  RUN: npm run test:engine
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  runSatpanchasikaPrashna,
  TOPIC_LABELS,
  type SatpanchasikaInput,
  type SatpanchasikaTopic,
} from '@/lib/engine/satpanchasika'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'

// Minimal GrahaData factory — engine reads id/name/rashi/dignity/flags/totalDegree
function g(id: GrahaId, rashi: Rashi, opts: Partial<GrahaData> = {}): GrahaData {
  const totalDegree = (rashi - 1) * 30 + (opts.degree ?? 15)
  return {
    id,
    name: id,
    rashi,
    degree: opts.degree ?? 15,
    totalDegree,
    dignity: opts.dignity ?? 'neutral',
    isRetro: opts.isRetro ?? false,
    isCombust: opts.isCombust ?? false,
    lonSidereal: totalDegree,
    lonTropical: totalDegree,
  } as GrahaData
}

// A baseline set of nine grahas spread across signs
function baseGrahas(): GrahaData[] {
  return [
    g('Su', 5), g('Mo', 3), g('Ma', 8), g('Me', 6), g('Ju', 4),
    g('Ve', 7), g('Sa', 10), g('Ra', 11), g('Ke', 5),
  ]
}

function baseInput(topic: SatpanchasikaTopic, over: Partial<SatpanchasikaInput> = {}): SatpanchasikaInput {
  const grahas = over.grahas ?? baseGrahas()
  const sun = grahas.find(x => x.id === 'Su')!
  const moon = grahas.find(x => x.id === 'Mo')!
  return {
    lagnaRashi: 1,
    lagnaSignDegree: 12,
    sunRashi: sun.rashi,
    sunDegreeFull: sun.totalDegree,
    moonRashi: moon.rashi,
    moonDegreeFull: moon.totalDegree,
    moonDignity: moon.dignity,
    moonIsCombust: moon.isCombust,
    grahas,
    navamsaLagnaRashi: 4,
    navamsaGrahas: grahas,
    drekkanaLagnaRashi: 1,
    tithiNumber: 12,
    tithiPaksha: 'shukla',
    topic,
    ...over,
  }
}

describe('Shatpanchasika — framework', () => {
  it('runs every topic without throwing and returns a valid verdict', () => {
    const topics = Object.keys(TOPIC_LABELS) as SatpanchasikaTopic[]
    for (const t of topics) {
      const r = runSatpanchasikaPrashna(baseInput(t))
      expect(['YES', 'NO', 'DELAYED', 'MIXED', 'UNCERTAIN']).toContain(r.verdict)
      expect(r.confidence).toBeGreaterThanOrEqual(0)
      expect(r.confidence).toBeLessThanOrEqual(100)
      expect(r.topicLabel).toBe(TOPIC_LABELS[t])
      // The four pillars are always computed
      expect(r.chyuti.house).toBe(1)
      expect(r.vriddhi.house).toBe(4)
      expect(r.pravasa.house).toBe(10)
      expect(r.nivritti.house).toBe(7)
      expect(r.rules.length).toBeGreaterThan(0)
    }
  })

  it('classifies the four pillars by whole-sign house from Aries lagna', () => {
    const r = runSatpanchasikaPrashna(baseInput('general'))
    expect(r.chyuti.signName).toBe('Aries')    // 1st
    expect(r.vriddhi.signName).toBe('Cancer')  // 4th
    expect(r.pravasa.signName).toBe('Capricorn') // 10th
    expect(r.nivritti.signName).toBe('Libra')  // 7th
  })
})

describe('Shatpanchasika — Ch1 V4 rising-sign classification', () => {
  it('marks Gemini (Seershodaya) as good', () => {
    const r = runSatpanchasikaPrashna(baseInput('general', { lagnaRashi: 3 }))
    expect(r.ascendant.rising).toBe('seershodaya')
    expect(r.ascendant.risingVerdict).toBe('good')
  })
  it('marks Aries (Prishtodaya) as bad', () => {
    const r = runSatpanchasikaPrashna(baseInput('general', { lagnaRashi: 1 }))
    expect(r.ascendant.rising).toBe('prishtodaya')
    expect(r.ascendant.risingVerdict).toBe('bad')
  })
  it('marks Pisces (Ubhayodaya) as mixed', () => {
    const r = runSatpanchasikaPrashna(baseInput('general', { lagnaRashi: 12 }))
    expect(r.ascendant.rising).toBe('ubhayodaya')
    expect(r.ascendant.risingVerdict).toBe('mixed')
  })
})

describe('Shatpanchasika — Ch1 V5 Moon brightness', () => {
  it('treats Moon ~130° from Sun as bright', () => {
    // Sun at 0° Aries, Moon at 130° (well within 108–240 window)
    const grahas = baseGrahas().map(x =>
      x.id === 'Su' ? g('Su', 1, { degree: 0 })
        : x.id === 'Mo' ? g('Mo', 5, { degree: 10 })  // 130°
          : x)
    const r = runSatpanchasikaPrashna(baseInput('general', { grahas, sunRashi: 1, sunDegreeFull: 0, moonRashi: 5, moonDegreeFull: 130 }))
    expect(r.ascendant.moonBright).toBe(true)
  })
  it('treats a near-new Moon as not bright', () => {
    const grahas = baseGrahas().map(x =>
      x.id === 'Su' ? g('Su', 1, { degree: 0 })
        : x.id === 'Mo' ? g('Mo', 1, { degree: 20 })  // 20° elongation
          : x)
    const r = runSatpanchasikaPrashna(baseInput('general', { grahas, sunRashi: 1, sunDegreeFull: 0, moonRashi: 1, moonDegreeFull: 20 }))
    expect(r.ascendant.moonBright).toBe(false)
  })
})

describe('Shatpanchasika — Ch1 V6-7 object classification', () => {
  it('odd sign, 1st navamsa → Dhatu', () => {
    // Aries (odd), degree 1 → navamsa #1 → group 1 → Dhatu
    const r = runSatpanchasikaPrashna(baseInput('object_nature', { lagnaRashi: 1, lagnaSignDegree: 1 }))
    const sec = r.sections.find(s => s.id === 'object_nature')!
    expect(sec.rows.find(row => row.label === 'Category')?.value).toBe('Dhatu')
  })
  it('even sign, 1st navamsa → Jeeva (reverse order)', () => {
    // Taurus (even), degree 1 → navamsa #1 → group 1 → Jeeva
    const r = runSatpanchasikaPrashna(baseInput('object_nature', { lagnaRashi: 2, lagnaSignDegree: 1 }))
    const sec = r.sections.find(s => s.id === 'object_nature')!
    expect(sec.rows.find(row => row.label === 'Category')?.value).toBe('Jeeva')
  })
})

describe('Shatpanchasika — Ch7 V1 child gender (Saturn parity)', () => {
  it('Saturn in odd house from lagna → male indication', () => {
    // Aries lagna, Saturn in Gemini (3rd, odd)
    const grahas = baseGrahas().map(x => x.id === 'Sa' ? g('Sa', 3) : x)
    const r = runSatpanchasikaPrashna(baseInput('child_gender', { lagnaRashi: 1, grahas }))
    const sec = r.sections.find(s => s.id === 'child')!
    expect(sec.rows.find(row => row.label === 'Saturn parity rule')?.value).toContain('Male')
  })
  it('Saturn in even house from lagna → female indication', () => {
    // Aries lagna, Saturn in Taurus (2nd, even)
    const grahas = baseGrahas().map(x => x.id === 'Sa' ? g('Sa', 2) : x)
    const r = runSatpanchasikaPrashna(baseInput('child_gender', { lagnaRashi: 1, grahas }))
    const sec = r.sections.find(s => s.id === 'child')!
    expect(sec.rows.find(row => row.label === 'Saturn parity rule')?.value).toContain('Female')
  })
})

describe('Shatpanchasika — Ch6 lost object', () => {
  it('fixed rising sign → taken by a relative, hidden on premises', () => {
    // Taurus (fixed) lagna
    const r = runSatpanchasikaPrashna(baseInput('lost_object', { lagnaRashi: 2 }))
    const sec = r.sections.find(s => s.id === 'lost_object')!
    expect(sec.rows.find(row => row.label === 'Taken by')?.value).toContain('Relative')
  })
  it('drekkhana of rising cusp maps to a hiding location', () => {
    // degree 5 → 1st drekkhana → threshold
    const r = runSatpanchasikaPrashna(baseInput('lost_object', { lagnaRashi: 1, lagnaSignDegree: 5 }))
    const sec = r.sections.find(s => s.id === 'lost_object')!
    expect(sec.rows.find(row => row.label === 'Hidden at')?.value).toContain('Threshold')
  })
  it('reports direction and distance (Ch6 V4)', () => {
    const r = runSatpanchasikaPrashna(baseInput('lost_object', { lagnaRashi: 1, lagnaSignDegree: 5 }))
    const sec = r.sections.find(s => s.id === 'lost_object')!
    expect(sec.rows.find(row => row.label === 'Direction taken')).toBeTruthy()
    const dist = sec.rows.find(row => row.label === 'Distance')
    expect(dist).toBeTruthy()
    expect(dist?.value).toMatch(/yojana.*km/)   // both classical & modern units
  })
  it('reports a likely colour for the article', () => {
    const r = runSatpanchasikaPrashna(baseInput('lost_object', { lagnaRashi: 1, lagnaSignDegree: 5 }))
    const sec = r.sections.find(s => s.id === 'lost_object')!
    expect(sec.rows.find(row => row.label === 'Likely colour')?.value).toContain('hue')
  })
})

describe('Shatpanchasika — Ch3 V2 Pauras/Yayis', () => {
  it('victory section reports Pauras (self) and Yayis (opponent) scores', () => {
    const r = runSatpanchasikaPrashna(baseInput('victory_defeat'))
    const sec = r.sections.find(s => s.id === 'victory')!
    expect(sec.rows.find(row => row.label === 'Pauras (self) score')).toBeTruthy()
    expect(sec.rows.find(row => row.label === 'Yayis (opponent) score')).toBeTruthy()
  })
})

describe('Shatpanchasika — Ch7 V6/V10 character', () => {
  it('runs the character topic and reports proclivity from the 7th house', () => {
    // Aries lagna; only Jupiter (exalted, strongest) in Libra (7th) → faithful to own spouse
    const grahas = baseGrahas()
      .filter(x => x.id !== 'Ve')  // clear the default Venus from the 7th
      .map(x => x.id === 'Ju' ? g('Ju', 7, { dignity: 'exalted' }) : x)
    const r = runSatpanchasikaPrashna(baseInput('character', { lagnaRashi: 1, grahas }))
    const sec = r.sections.find(s => s.id === 'character')!
    expect(sec.rows.find(row => row.label === 'Moral / sexual proclivity')?.value).toContain('own spouse')
  })
  it('Saturn in 7th → low-status partner', () => {
    // Aries lagna; only Saturn in the 7th (Venus relocated)
    const grahas = baseGrahas()
      .map(x => x.id === 'Ve' ? g('Ve', 3) : x.id === 'Sa' ? g('Sa', 7) : x)
    const r = runSatpanchasikaPrashna(baseInput('character', { lagnaRashi: 1, grahas }))
    const sec = r.sections.find(s => s.id === 'character')!
    expect(sec.rows.find(row => row.label === 'Moral / sexual proclivity')?.value).toContain('low-status')
  })
})

describe('Shatpanchasika — Ch1 V4 success of action', () => {
  it('general topic reports a success-of-action row', () => {
    const r = runSatpanchasikaPrashna(baseInput('general'))
    const sec = r.sections.find(s => s.id === 'general')!
    expect(sec.rows.find(row => row.label === 'Success of action')).toBeTruthy()
  })
})

describe('Shatpanchasika — per-topic significator & strength', () => {
  it('every topic resolves a significator with a valid strength grade', () => {
    const topics = Object.keys(TOPIC_LABELS) as SatpanchasikaTopic[]
    for (const t of topics) {
      const r = runSatpanchasikaPrashna(baseInput(t))
      expect(r.significator).toBeTruthy()
      expect(['Strong', 'Moderate', 'Weak']).toContain(r.significator!.strength)
      expect(r.significator!.topicHouse).toBeGreaterThanOrEqual(1)
      expect(r.significator!.topicHouse).toBeLessThanOrEqual(12)
    }
  })
  it('marriage significator uses the 7th house with Venus karaka', () => {
    const r = runSatpanchasikaPrashna(baseInput('marriage', { lagnaRashi: 1 }))
    expect(r.significator!.topicHouse).toBe(7)
    expect(r.significator!.karakaName).toBe('Venus')
  })
  it('a weak significator produces a propitiation remedy', () => {
    // Force the 7th lord (Venus for Aries lagna) into debilitation & combustion → Weak
    const grahas = baseGrahas().map(x => x.id === 'Ve' ? g('Ve', 6, { dignity: 'debilitated', isCombust: true }) : x)
    const r = runSatpanchasikaPrashna(baseInput('marriage', { lagnaRashi: 1, grahas }))
    if (r.significator!.strength === 'Weak') {
      expect(r.remedies.some(rem => /Venus|significator/i.test(rem))).toBe(true)
    }
  })
})

describe('Shatpanchasika — universal timing', () => {
  it('every topic returns a timing block with a method & significator', () => {
    const topics = Object.keys(TOPIC_LABELS) as SatpanchasikaTopic[]
    for (const t of topics) {
      const r = runSatpanchasikaPrashna(baseInput(t))
      expect(r.timing).toBeTruthy()
      expect(r.timing!.method.length).toBeGreaterThan(0)
      expect(r.timing!.significator.length).toBeGreaterThan(0)
    }
  })
  it('lost/theft topics use the first-occupied-house day method', () => {
    for (const t of ['lost_object', 'theft', 'object_nature'] as SatpanchasikaTopic[]) {
      const r = runSatpanchasikaPrashna(baseInput(t))
      expect(r.timing!.method).toMatch(/First occupied/i)
      expect(r.timing!.days).not.toBeUndefined()
    }
  })
  it('return_person uses the strongest-planet month method', () => {
    const r = runSatpanchasikaPrashna(baseInput('return_person'))
    expect(r.timing!.method).toMatch(/Strongest planet/i)
    expect(r.timing!.months).not.toBeUndefined()
  })
})

describe('Shatpanchasika — theft colour & modern distance', () => {
  it('theft section shows article colour and yojana≈km distance', () => {
    const r = runSatpanchasikaPrashna(baseInput('theft', { lagnaRashi: 1, lagnaSignDegree: 12 }))
    const sec = r.sections.find(s => s.id === 'theft')!
    expect(sec.rows.find(row => row.label === 'Article colour')?.value).toContain('hue')
    expect(sec.rows.find(row => row.label === 'Distance')?.value).toMatch(/yojana.*km/)
  })
})
