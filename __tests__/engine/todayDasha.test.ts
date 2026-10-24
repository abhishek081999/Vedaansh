// ─────────────────────────────────────────────────────────────
//  __tests__/engine/todayDasha.test.ts
//  Running dasha zoomed to today: levels, Prana turnover, next changes
//  and dasha-lord transits. Uses the real Vimshottari builder (pure).
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calcVimshottari } from '@/lib/engine/dasha/vimshottari'
import { buildTodayDasha, formatSpan } from '@/lib/engine/todayDasha'
import type { DashaDay, GocharRow } from '@/lib/engine/todayReading'

const NOW = new Date('2026-10-24T08:00:00Z')
const BIRTH = new Date('1999-08-19T04:30:00Z')
const DAY = 24 * 3_600_000

// Depth 4 mirrors the free-plan chart: Prana / Deha must be built on demand.
const tree = calcVimshottari(10, BIRTH, 4)
const natal = { dashas: { vimshottari: tree } }

function gochar(planet: GocharRow['planet'], status: GocharRow['status']): GocharRow {
  return { planet, planetName: planet, rashiName: 'Aries', fromMoon: 3, fromLagna: 1, status, isRetro: false, note: 'n', delta: 0 }
}

function run(over: Partial<Parameters<typeof buildTodayDasha>[0]> = {}) {
  return buildTodayDasha({
    natal, reading: { dasha: [], gochar: [] }, now: NOW,
    windowStart: new Date('2026-10-24T00:30:00Z'),
    windowEnd: new Date(Date.parse('2026-10-24T00:30:00Z') + DAY),
    ...over,
  })
}

describe('buildTodayDasha', () => {
  it('returns null when the chart carries no dasha', () => {
    expect(buildTodayDasha({ natal: {}, reading: { dasha: [], gochar: [] }, now: NOW })).toBeNull()
  })

  it('walks all six levels, building the deeper ones on demand', () => {
    const d = run()!
    expect(d.levels.map(l => l.level)).toEqual([1, 2, 3, 4, 5, 6])
    expect(d.levels.map(l => l.levelLabel)).toEqual(['Mahadasha', 'Antardasha', 'Pratyantar', 'Sookshma', 'Prana', 'Deha'])
  })

  it('nests each level inside its parent and brackets now', () => {
    const d = run()!
    d.levels.forEach((l, i) => {
      expect(Date.parse(l.startIso)).toBeLessThanOrEqual(NOW.getTime())
      expect(Date.parse(l.endIso)).toBeGreaterThan(NOW.getTime())
      expect(l.progress).toBeGreaterThanOrEqual(0)
      expect(l.progress).toBeLessThanOrEqual(1)
      if (i > 0) {
        expect(Date.parse(l.startIso)).toBeGreaterThanOrEqual(Date.parse(d.levels[i - 1].startIso))
        expect(Date.parse(l.endIso)).toBeLessThanOrEqual(Date.parse(d.levels[i - 1].endIso) + 1)
      }
    })
  })

  it('accepts chart JSON where dates are ISO strings', () => {
    const json = JSON.parse(JSON.stringify(tree)) as typeof tree
    const d = run({ natal: { dashas: { vimshottari: json } } })!
    expect(d.levels).toHaveLength(6)
  })

  it('lists exactly one running Prana and it overlaps the window', () => {
    const d = run()!
    expect(d.prana.length).toBeGreaterThan(0)
    expect(d.prana.filter(p => p.current)).toHaveLength(1)
    for (const p of d.prana) {
      expect(Date.parse(p.endIso)).toBeGreaterThan(Date.parse('2026-10-24T00:30:00Z'))
      expect(Date.parse(p.startIso)).toBeLessThan(Date.parse('2026-10-24T00:30:00Z') + DAY)
    }
  })

  it('shows previous, running and next Sookshma with one running', () => {
    const d = run()!
    expect(d.sookshma.length).toBeGreaterThanOrEqual(2)
    expect(d.sookshma.filter(s => s.current)).toHaveLength(1)
  })

  it('orders upcoming changes soonest first and ends each at the period boundary', () => {
    const d = run()!
    expect(d.changes).toHaveLength(4)
    const times = d.changes.map(c => c.atIso)
    expect([...times].sort()).toEqual(times)
    const maha = d.changes.find(c => c.level === 1)!
    expect(maha.atIso).toBe(d.levels[0].endIso)
    expect(maha.toLordName).not.toBe(maha.fromLordName)
  })

  it('flags a change that lands inside the window', () => {
    const d = run()!
    const sook = d.levels[3]
    const win = new Date(Date.parse(sook.endIso) - 3_600_000)
    const d2 = run({ windowStart: win, windowEnd: new Date(win.getTime() + DAY) })!
    expect(d2.changes.find(c => c.level === 4)!.today).toBe(true)
    expect(d2.summary).toContain('Prana')
  })

  it('attaches the reading tone and note to levels 1-4 only', () => {
    const reading: DashaDay[] = [1, 2, 3, 4].map(level => ({
      level, levelLabel: 'x', lord: 'Ju', lordName: 'Jupiter', tone: 'supportive', note: `note ${level}`,
    }))
    const d = run({ reading: { dasha: reading, gochar: [] } })!
    expect(d.levels[0].tone).toBe('supportive')
    expect(d.levels[3].note).toBe('note 4')
    expect(d.levels[4].tone).toBeUndefined()
    expect(d.summary).toContain('is well placed')
  })

  it('merges roles when one planet rules several levels and skips lords without a gochar row', () => {
    const lord = (n: number) => run()!.levels[n].lord as GocharRow['planet']
    const a = lord(0)
    const rows = [...new Set([lord(0), lord(1), lord(2)])].filter(p => p !== 'Mo').map(p => gochar(p, 'favourable'))
    const d = run({ reading: { dasha: [], gochar: rows } })!
    expect(d.lords.find(l => l.lord === a)!.roles).toContain('Mahadasha')
    const roleCount = d.lords.reduce((n, l) => n + l.roles.length, 0)
    expect(roleCount).toBeLessThanOrEqual(3)
  })
})

describe('dasha lord transits', () => {
  it('reads a Moon dasha lord through Chandra Bala since gochar has no Moon row', () => {
    // Walk forward until the Moon rules one of the first three levels.
    let now = NOW
    for (let i = 0; i < 400; i++) {
      const levels = buildTodayDasha({ natal, reading: { dasha: [], gochar: [] }, now })!.levels.slice(0, 3)
      if (levels.some(l => l.lord === 'Mo')) break
      now = new Date(now.getTime() + 30 * DAY)
    }
    const moon = {
      rashi: 2, rashiName: 'Taurus', nakshatraName: 'Rohini', pada: 1, chandraPosition: 5,
      chandraQuality: 'bad', chandraNote: 'testing', lagnaHouse: 2, lagnaTheme: '', overNatal: [], signChange: null,
    } as const
    const d = run({ now, windowStart: now, windowEnd: new Date(now.getTime() + DAY), reading: { dasha: [], gochar: [], moon: { ...moon, overNatal: [] } } })!
    const row = d.lords.find(l => l.lord === 'Mo')!
    expect(row.status).toBe('unfavourable')
    expect(row.fromMoon).toBe(5)
    expect(row.roles.length).toBeGreaterThan(0)
  })
})

describe('formatSpan', () => {
  it('scales from years down to minutes', () => {
    expect(formatSpan(0)).toBe('now')
    expect(formatSpan(4.5 * 365.25 * DAY)).toMatch(/^4y \d+m$/)
    expect(formatSpan(100 * DAY)).toMatch(/^3m \d+d$/)
    expect(formatSpan(2 * DAY + 5 * 3_600_000)).toBe('2d 5h')
    expect(formatSpan(7 * 3_600_000 + 20 * 60_000)).toBe('7h 20m')
    expect(formatSpan(5 * 60_000)).toBe('5m')
  })
})
