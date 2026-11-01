import { describe, expect, it } from 'vitest'
import { resolveTimezone } from '@/lib/geo/timezone'

describe('resolveTimezone', () => {
  it.each([
    ['Delhi', 28.61, 77.21, 'Asia/Kolkata'],
    ['Lucknow', 26.85, 80.95, 'Asia/Kolkata'],
    ['Kanpur', 26.45, 80.33, 'Asia/Kolkata'],
    ['Gorakhpur', 26.76, 83.37, 'Asia/Kolkata'],
    ['Siliguri', 26.72, 88.43, 'Asia/Kolkata'],
    ['Kathmandu', 27.72, 85.32, 'Asia/Kathmandu'],
    ['Lahore', 31.55, 74.34, 'Asia/Karachi'],
    ['Dhaka', 23.81, 90.41, 'Asia/Dhaka'],
    ['Kabul', 34.53, 69.17, 'Asia/Kabul'],
    ['Yangon', 16.84, 96.17, 'Asia/Yangon'],
    ['Lhasa', 29.65, 91.14, 'Asia/Shanghai'],
    ['Colombo', 6.93, 79.85, 'Asia/Colombo'],
    ['New York', 40.71, -74.01, 'America/New_York'],
  ])('%s', (_name, lat, lng, expected) => {
    expect(resolveTimezone(lat, lng)).toBe(expected)
  })

  it('returns UTC for invalid coordinates instead of throwing', () => {
    expect(resolveTimezone(NaN, 10)).toBe('UTC')
    expect(resolveTimezone(95, 10)).toBe('UTC')
  })
})
