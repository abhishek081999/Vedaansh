import { beforeAll, describe, expect, it } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { generateVastuHTML } from '@/lib/pdf/vastuHtml'

let chart: ChartOutput
const NOW = new Date('2026-11-24T00:00:00Z')

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Aarav <script>', birthDate: '1990-05-15', birthTime: '10:30', utcDate: '1990-05-15', utcTime: '05:00:00',
    birthPlace: 'New Delhi', latitude: 28.61, longitude: 77.21, timezone: 'Asia/Kolkata', gender: 'male',
  })
}, 60_000)

describe('generateVastuHTML', () => {
  it('renders the chart-only sections and escapes the name', () => {
    const html = generateVastuHTML(chart, { now: NOW })
    for (const h of ['Directional zones', 'Main entrance', 'Your Vastu focus by dasha', 'Dig Bala', 'Vastu doshas']) {
      expect(html).toContain(h)
    }
    expect(html).toContain('Aarav &lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('Your home layout')
    expect(html).not.toContain('Ayadi')
  })

  it('includes the home details when given', () => {
    const html = generateVastuHTML(chart, {
      now: NOW,
      home: { facing: 'SW', rooms: { toilet: ['NE'], kitchen: ['SE'] }, ayadi: { length: 30, breadth: 40, unit: 'ft' } },
    })
    expect(html).toContain('Your main door')
    expect(html).toContain('Your home layout')
    expect(html).toContain('Found in your home')     // toilet in NE, door in SW
    expect(html).toContain('Not recommended')
    expect(html).toContain('Ayadi — building size')
    expect(html).toContain('area 1200')
  })

  it('renders Hindi without English section titles', () => {
    const html = generateVastuHTML(chart, { now: NOW, lang: 'hi', home: { rooms: { kitchen: ['SE'] } } })
    expect(html).toContain('ज्योतिष-वास्तु प्रतिवेदन')
    expect(html).toContain('आपके घर का विन्यास')
    for (const en of ['Directional zones', 'Main entrance', 'Vastu doshas', 'Kitchen', 'North-East']) expect(html).not.toContain(en)
  })
})
