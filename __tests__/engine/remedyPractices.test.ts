// Remedy practice catalogue and tracker calendar rules (pure).
import { describe, expect, it } from 'vitest'
import {
  describePractice,
  getRemedyPractice,
  practiceTrackerState,
  remedyPracticesFor,
  weeklyTrackerState,
} from '@/lib/engine/remedyPractices'
import { REMEDY_GRAHAS } from '@/lib/engine/planetaryRemedies'

const tz = 'Asia/Kolkata'
const at = (ymd: string, hh = '10:00') => new Date(`${ymd}T${hh}:00+05:30`)

describe('catalogue', () => {
  it('offers a mantra for every planet and a weekday fast for the seven visible grahas', () => {
    for (const g of REMEDY_GRAHAS) {
      const list = remedyPracticesFor(g)
      expect(list.some((p) => p.kind === 'mantra' && p.mantra && p.count === 108)).toBe(true)
      expect(list.some((p) => p.kind === 'fast')).toBe(g !== 'Ra' && g !== 'Ke')
    }
    expect(getRemedyPractice('Sa.fast')?.weekday).toBe(6)
    expect(getRemedyPractice('Mo.fast')?.defaultLength).toBe(16)
    expect(getRemedyPractice('Ra.fast')).toBeNull()
  })

  it('defaults are always allowed lengths', () => {
    for (const g of REMEDY_GRAHAS) for (const p of remedyPracticesFor(g)) expect(p.lengths).toContain(p.defaultLength)
  })

  it('has Hindi titles and instructions without English', () => {
    for (const g of REMEDY_GRAHAS) {
      for (const p of remedyPracticesFor(g, 'hi')) {
        expect(p.title).not.toMatch(/[A-Za-z]/)
        expect(p.how).not.toMatch(/[A-Za-z]/)
      }
    }
    expect(describePractice(getRemedyPractice('Ju.fast')!, 'en').title).toBe('Thursday fast for Jupiter')
  })
})

describe('weekly tracker', () => {
  // 2026-11-22 is a Sunday; Saturday fasts start on 2026-11-28.
  const started = at('2026-11-22')
  const days = [false, false, false]

  it('waits for the first practice day', () => {
    const s = weeklyTrackerState(days, started, at('2026-11-25'), tz, 6)
    expect(s).toMatchObject({ practiceDay: false, todayIndex: 0, missed: false, canTick: false, nextDate: '2026-11-28' })
  })

  it('lets the practice day be ticked', () => {
    const s = weeklyTrackerState(days, started, at('2026-11-28'), tz, 6)
    expect(s).toMatchObject({ practiceDay: true, todayIndex: 0, canTick: true })
  })

  it('breaks the run when a practice day passes unticked', () => {
    const s = weeklyTrackerState(days, started, at('2026-11-30'), tz, 6)
    expect(s.missed).toBe(true)
    expect(s.nextDate).toBeNull()
  })

  it('moves to the next week once ticked', () => {
    const s = weeklyTrackerState([true, false, false], started, at('2026-12-02'), tz, 6)
    expect(s).toMatchObject({ missed: false, practiceDay: false, todayIndex: 1, nextDate: '2026-12-05' })
    expect(weeklyTrackerState([true, false, false], started, at('2026-12-05'), tz, 6).canTick).toBe(true)
  })

  it('counts a start on the practice weekday as week one', () => {
    const s = weeklyTrackerState(days, at('2026-11-28', '06:00'), at('2026-11-28', '21:00'), tz, 6)
    expect(s).toMatchObject({ practiceDay: true, todayIndex: 0, canTick: true })
  })

  it('is over after the last week', () => {
    const s = weeklyTrackerState([true, true, true], started, at('2026-12-20'), tz, 6)
    expect(s.over).toBe(true)
    expect(s.missed).toBe(false)
  })
})

describe('daily tracker', () => {
  it('follows the Lal Kitab day rules and gives the next date', () => {
    const s = practiceTrackerState({ cadence: 'daily' }, [true, false, false], at('2026-11-22'), at('2026-11-23'), tz)
    expect(s).toMatchObject({ todayIndex: 1, practiceDay: true, canTick: true, nextDate: '2026-11-23' })
    expect(practiceTrackerState({ cadence: 'daily' }, [false, false], at('2026-11-22'), at('2026-11-23'), tz).missed).toBe(true)
  })
})
