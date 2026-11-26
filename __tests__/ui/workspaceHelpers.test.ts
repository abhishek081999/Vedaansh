import { describe, expect, it } from 'vitest'
import { CHART_TAB_ORDER, isChartTabId } from '@/lib/ui/chartTabRegistry'
import { nextTab } from '@/components/home/useWorkspaceShortcuts'
import { stepInstant } from '@/components/home/useWorkspacePin'

describe('isChartTabId', () => {
  it('accepts chart tabs and rejects other sidenav ids', () => {
    expect(isChartTabId('navamsha')).toBe(true)
    expect(isChartTabId('jaimini')).toBe(false)
    expect(isChartTabId(null)).toBe(false)
  })

  it('lists every tab once', () => {
    expect(new Set(CHART_TAB_ORDER).size).toBe(CHART_TAB_ORDER.length)
  })
})

describe('nextTab', () => {
  it('wraps in both directions', () => {
    expect(nextTab('dashboard', -1)).toBe(CHART_TAB_ORDER[CHART_TAB_ORDER.length - 1])
    expect(nextTab(CHART_TAB_ORDER[CHART_TAB_ORDER.length - 1], 1)).toBe('dashboard')
    expect(nextTab('dashboard', 1)).toBe(CHART_TAB_ORDER[1])
  })

  it('starts at the first tab from an unknown id', () => {
    expect(nextTab('jaimini', 1)).toBe('dashboard')
  })
})

describe('stepInstant', () => {
  const at = new Date('2026-01-31T10:00:00.000Z')
  it('steps hours and days by exact durations', () => {
    expect(stepInstant(at, 'hour', 1).toISOString()).toBe('2026-01-31T11:00:00.000Z')
    expect(stepInstant(at, 'day', -1).toISOString()).toBe('2026-01-30T10:00:00.000Z')
  })

  it('steps months and years on the calendar', () => {
    expect(stepInstant(at, 'month', -1).toISOString()).toBe('2025-12-31T10:00:00.000Z')
    expect(stepInstant(at, 'year', 1).toISOString()).toBe('2027-01-31T10:00:00.000Z')
  })

  it('does not mutate the input', () => {
    stepInstant(at, 'month', 1)
    expect(at.toISOString()).toBe('2026-01-31T10:00:00.000Z')
  })
})
