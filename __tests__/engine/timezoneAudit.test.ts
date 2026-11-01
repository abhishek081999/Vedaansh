import { describe, expect, it } from 'vitest'
import {
  addToTimezoneAudit,
  checkChartTimezone,
  createTimezoneAuditReport,
  formatTimezoneAudit,
} from '@/lib/geo/timezoneAudit'

const LUCKNOW = { latitude: 26.85, longitude: 80.95 }
const DHAKA = { latitude: 23.81, longitude: 90.41 }
const LAHORE = { latitude: 31.55, longitude: 74.34 }
const BIRTH = { birthDate: '1990-06-15', birthTime: '14:30:00' }

describe('checkChartTimezone', () => {
  it('matches the same zone and an alias of it', () => {
    expect(checkChartTimezone({ ...BIRTH, ...LUCKNOW, timezone: 'Asia/Kolkata' }).status).toBe('match')
    expect(checkChartTimezone({ ...BIRTH, ...LUCKNOW, timezone: 'Asia/Calcutta' }).status).toBe('match')
  })

  it('flags a wrong zone with the size of the shift', () => {
    expect(checkChartTimezone({ ...BIRTH, ...LUCKNOW, timezone: 'Asia/Kathmandu' })).toEqual({
      status: 'mismatch',
      stored: 'Asia/Kathmandu',
      expected: 'Asia/Kolkata',
      shiftMinutes: -15,
    })
    expect(checkChartTimezone({ ...BIRTH, ...DHAKA, timezone: 'Asia/Kolkata' })).toMatchObject({
      status: 'mismatch',
      expected: 'Asia/Dhaka',
      shiftMinutes: 30,
    })
  })

  it('compares offsets at the birth date, not today', () => {
    // Pakistan is UTC+5 now but used UTC+5:30 with India until 1951
    const lahore1945 = { birthDate: '1945-11-01', birthTime: '12:00:00', ...LAHORE, timezone: 'Asia/Kolkata' }
    expect(checkChartTimezone(lahore1945).status).toBe('match')
    expect(checkChartTimezone({ ...lahore1945, birthDate: '1990-06-15' }).status).toBe('mismatch')
  })

  it('accepts times without seconds, as the calculate route does', () => {
    expect(checkChartTimezone({ ...BIRTH, birthTime: '14:30', ...LUCKNOW, timezone: 'Asia/Kolkata' }).status).toBe('match')
  })

  it('reports unusable fields instead of guessing', () => {
    const valid = { ...BIRTH, ...LUCKNOW, timezone: 'Asia/Kolkata' }
    const invalid = (reason: string) => ({ status: 'invalid', reason })
    expect(checkChartTimezone({ ...valid, latitude: 95 })).toEqual(invalid('coordinates'))
    expect(checkChartTimezone({ ...valid, longitude: undefined })).toEqual(invalid('coordinates'))
    expect(checkChartTimezone({ ...valid, birthDate: 'soon' })).toEqual(invalid('birth-datetime'))
    expect(checkChartTimezone({ ...valid, birthDate: '1990-13-45' })).toEqual(invalid('birth-datetime'))
    expect(checkChartTimezone({ ...valid, timezone: 'Not/AZone' })).toEqual(invalid('stored-zone'))
    expect(checkChartTimezone({ ...valid, timezone: '' })).toEqual(invalid('stored-zone'))
  })
})

describe('timezone audit report', () => {
  it('groups by stored and expected zone and prints ids but no birth data', () => {
    const report = createTimezoneAuditReport()
    addToTimezoneAudit(report, 'id-match', { ...BIRTH, ...LUCKNOW, timezone: 'Asia/Calcutta' })
    addToTimezoneAudit(report, 'id-dhaka-1', { ...BIRTH, ...DHAKA, timezone: 'Asia/Kolkata' })
    addToTimezoneAudit(report, 'id-dhaka-2', { ...BIRTH, ...DHAKA, timezone: 'Asia/Kolkata' })
    addToTimezoneAudit(report, 'id-lucknow', { ...BIRTH, ...LUCKNOW, timezone: 'Asia/Kathmandu' })
    addToTimezoneAudit(report, 'id-bad', { ...BIRTH, ...LUCKNOW, timezone: 'Not/AZone' })

    const output = formatTimezoneAudit(report)

    expect(output).toContain('Charts checked: 5')
    expect(output).toContain('Matching:       1')
    expect(output).toContain('Mismatched:     3')
    expect(output).toContain('Not comparable: 1')
    expect(output).toContain('2\tAsia/Kolkata -> Asia/Dhaka\tshift 30 to 30')
    expect(output).toContain('1\tAsia/Kathmandu -> Asia/Kolkata\tshift -15 to -15')
    for (const id of ['id-dhaka-1', 'id-dhaka-2', 'id-lucknow', 'id-bad']) expect(output).toContain(id)
    expect(output).not.toContain('id-match')
    expect(output).not.toContain(BIRTH.birthDate)
    expect(output).not.toContain(BIRTH.birthTime)
    expect(output).not.toContain(String(DHAKA.latitude))
  })
})
