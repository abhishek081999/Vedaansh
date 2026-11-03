// __tests__/engine/numerologyTier2.test.ts
// Couple numerology, business scoring, yearly calendar + ICS,
// sunrise tithi and CRM snapshot helpers.
import { describe, it, expect } from 'vitest'
import { buildCoupleNumerology } from '@/lib/engine/numerology/couple'
import { alphanumericTotal, scoreBusiness, suggestLaunchDates } from '@/lib/engine/numerology/business'
import { buildNumerologyIcs, buildNumerologyYear, isRiktaTithi, tithiLabel } from '@/lib/engine/numerology/calendar'
import { tithiAtSunrise, tithiFromLongitudes } from '@/lib/engine/numerology/tithiAtSunrise'
import { buildClientNumerologyNote, pickClientRemedies } from '@/lib/engine/numerology/clientSummary'
import { buildNumerologyReport } from '@/lib/engine/numerology/report'
import { parseBirthDate } from '@/lib/engine/numerology/calc'
import { reduceToCore } from '@/lib/engine/numerology/core'

describe('couple numerology', () => {
  it('scores the pair and shows what each partner fills', () => {
    const c = buildCoupleNumerology(
      { birthDate: '1990-11-29', name: 'Arjun Sharma', label: 'Arjun' },
      { birthDate: '1993-04-16', name: 'Priya Patel', label: 'Priya' },
    )!
    expect(c.a.moolank).toBe(2)
    expect(c.b.moolank).toBe(7)
    expect(c.pairs).toHaveLength(5) // includes Namank pair
    expect(c.percent).toBeGreaterThanOrEqual(0)
    expect(c.percent).toBeLessThanOrEqual(100)
    for (const n of c.filledForA) {
      expect(c.a.missing).toContain(n)
      expect(c.combinedCounts[n]).toBeGreaterThan(0)
    }
    for (const n of c.stillMissing) expect(c.combinedCounts[n]).toBe(0)
    expect(c.relationshipNumber.value).toBe(reduceToCore(c.a.bhagyank + c.b.bhagyank))
  })

  it('omits the Namank pair without names and rejects bad dates', () => {
    expect(buildCoupleNumerology({ birthDate: '1990-11-29' }, { birthDate: '1993-04-16' })!.pairs).toHaveLength(4)
    expect(buildCoupleNumerology({ birthDate: 'x' }, { birthDate: '1993-04-16' })).toBeNull()
  })

  it('identical people match on like pairs and fill nothing for each other', () => {
    const c = buildCoupleNumerology({ birthDate: '1990-11-29' }, { birthDate: '1990-11-29' })!
    expect(c.pairs[0]!.harmony).toBe('excellent')
    expect(c.pairs[1]!.harmony).toBe('excellent')
    expect(c.filledForA).toEqual([])
    expect(c.filledForB).toEqual([])
    expect(c.sharedPlanes).toEqual([])
    expect(c.stillMissing).toEqual(c.a.missing)
  })
})

describe('business numerology', () => {
  const owner = { moolank: 2 as const, bhagyank: 5 as const }

  it('mixes Chaldean letters and digits for registrations', () => {
    expect(alphanumericTotal('AB12')).toBe(1 + 2 + 1 + 2)
    expect(alphanumericTotal('27-AAP')).toBe(2 + 7 + 1 + 1 + 8)
  })

  it('scores name, initial, date and registration', () => {
    const r = scoreBusiness({ name: 'Shree Ganesh Traders', launchDate: '2026-11-14', registration: '27AAPFU0939F1ZV', owner })!
    expect(r.parts.map(p => p.id)).toEqual(['name', 'initial', 'launch', 'registration'])
    expect(r.parts[1]!.value).toBe('S')
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
    for (const p of r.parts) expect(p.root).toBe(reduceToCore(p.compound))
  })

  it('asks for a launch date when missing', () => {
    const r = scoreBusiness({ name: 'Vedaansh', owner })!
    expect(r.parts.find(p => p.id === 'launch')).toBeUndefined()
    expect(r.tips.some(t => t.includes('launch'))).toBe(true)
    expect(scoreBusiness({ name: '123', owner })).toBeNull()
  })

  it('suggests launch dates in the month, best first, never clashing with the name', () => {
    const s = suggestLaunchDates({ year: 2026, month: 12, owner, nameRoot: 1 })
    expect(s.length).toBeGreaterThan(0)
    expect(s.length).toBeLessThanOrEqual(8)
    for (let i = 1; i < s.length; i++) expect(s[i - 1]!.score).toBeGreaterThanOrEqual(s[i]!.score)
    for (const d of s) expect(d.date.startsWith('2026-12-')).toBe(true)
  })
})

describe('yearly calendar', () => {
  const birth = parseBirthDate('1990-11-29')!

  it('covers every day of the year', () => {
    expect(buildNumerologyYear({ year: 2026, birth, moolank: 2, bhagyank: 5 })).toHaveLength(365)
    expect(buildNumerologyYear({ year: 2028, birth, moolank: 2, bhagyank: 5 })).toHaveLength(366)
  })

  it('Rikta tithi demotes a best day', () => {
    const plain = buildNumerologyYear({ year: 2026, birth, moolank: 2, bhagyank: 5 })
    const rikta = buildNumerologyYear({ year: 2026, birth, moolank: 2, bhagyank: 5, tithiFor: () => 4 })
    expect(plain.some(d => d.label === 'best')).toBe(true)
    expect(rikta.some(d => d.label === 'best')).toBe(false)
    expect(rikta[0]!.tithiName).toBe('Shukla Chaturthi')
  })

  it('labels tithis', () => {
    expect(tithiLabel(1)).toBe('Shukla Pratipada')
    expect(tithiLabel(15)).toBe('Shukla Purnima')
    expect(tithiLabel(19)).toBe('Krishna Chaturthi')
    expect(tithiLabel(30)).toBe('Krishna Amavasya')
    expect([4, 9, 14, 19, 24, 29].every(isRiktaTithi)).toBe(true)
    expect(isRiktaTithi(15)).toBe(false)
  })

  it('writes a valid all-day ICS with folded lines', () => {
    const days = buildNumerologyYear({ year: 2026, birth, moolank: 2, bhagyank: 5, tithiFor: () => 11 })
    const all = buildNumerologyIcs(days, { calName: 'Test', include: 'all', uidKey: '19901129', stamp: new Date('2026-01-01T00:00:00Z') })
    const hi = buildNumerologyIcs(days, { calName: 'Test', include: 'highlights', uidKey: '19901129' })
    expect(all.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(all.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(all.match(/BEGIN:VEVENT/g)).toHaveLength(365)
    expect((hi.match(/BEGIN:VEVENT/g) ?? []).length).toBeLessThan(365)
    expect(all).toContain('DTSTART;VALUE=DATE:20260101')
    expect(all).toContain('DTEND;VALUE=DATE:20260102')
    expect(all).toContain('DTEND;VALUE=DATE:20270101') // 31 Dec rolls into next year
    expect(all).toContain('UID:numerology-19901129-20260101@vedaansh')
    for (const line of all.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })
})

describe('tithi at sunrise', () => {
  it('derives tithi from elongation', () => {
    expect(tithiFromLongitudes(0, 0)).toBe(1)
    expect(tithiFromLongitudes(10, 190)).toBe(16)
    expect(tithiFromLongitudes(350, 349.9)).toBe(30)
  })

  it('matches known festival dates (Delhi)', () => {
    // Chaitra Purnima (Hanuman Jayanti) 23 Apr 2024; Diwali Amavasya 1 Nov 2024
    expect(tithiAtSunrise('2024-04-23', 28.6139, 77.209, 'Asia/Kolkata')).toBe(15)
    expect(tithiAtSunrise('2024-11-01', 28.6139, 77.209, 'Asia/Kolkata')).toBe(30)
  })
})

describe('CRM snapshot', () => {
  const report = buildNumerologyReport({ birthDate: '1990-11-29', name: 'Arjun Sharma', gender: 'male', today: new Date(2026, 9, 12) })!

  it('summarises the core numbers in a note', () => {
    const note = buildClientNumerologyNote(report, 'Arjun Sharma')
    expect(note).toContain('Moolank 2')
    expect(note).toContain('Bhagyank')
    expect(note).toContain('Namank')
    expect(note).toContain('2026-10-12')
  })

  it('picks non-supportive remedies and skips ones the client has', () => {
    const picked = pickClientRemedies(report, [])
    expect(picked.length).toBeLessThanOrEqual(5)
    expect(picked.every(r => r.priority !== 'supportive')).toBe(true)
    if (picked[0]) {
      const again = pickClientRemedies(report, [picked[0].title.toUpperCase()])
      expect(again.map(r => r.title)).not.toContain(picked[0].title)
    }
  })
})
